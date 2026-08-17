// @plantuml/core (TeaVM-compiled PlantUML + Graphviz) is ~8.6MB uncompressed,
// so it's loaded lazily here — only the first time a ```plantuml block is
// actually rendered, never as part of the main bundle.
import vizGlobalUrlRaw from '@plantuml/core/viz-global.js?url'

// `viz-global.js` (Viz.js — Graphviz compiled to WebAssembly) must execute
// as a genuine classic <script> before `plantuml.js`'s render() can be
// called. This isn't just "it's not an ES module" — Viz.js's WASM loader
// locates its own .wasm binary via `document.currentScript.src`, and
// `document.currentScript` is only ever populated for a real classic
// <script> executing at the top level. Loading it via `import()` (an
// earlier version of this file did, thinking a plain UMD script with no
// import/export would behave identically either way) leaves
// `document.currentScript` null, so Viz.js's base-path computation goes
// wrong and it fails deep inside the TeaVM/WASM runtime — not with a clean
// "failed to load" error, but a confusing "Cannot read properties of
// undefined (reading '$jsException')" thrown from PlantUML's own
// exception-wrapping code once it tries to actually use the (silently
// broken) layout engine. Playwright's plain HTTP test server never caught
// this: relative URL resolution there happens to still land on a working
// path by coincidence of directory layout, so the bug is specific to a
// real VS Code webview's `vscode-webview://` origin.
//
// The other half of the original bug remains real too: a plain
// `<script src>` built directly from this `?url` import is a *root-relative*
// path ("/assets/viz-global-HASH.js"), which resolves to nothing under
// `vscode-webview://` (only `asWebviewUri()`-derived absolute URLs and
// `import.meta.url`-relative resolution reach real resources there). Fixed
// by resolving just the filename against *this module's own* resolved URL
// — the same mechanism the working `import('@plantuml/core')` dynamic
// import below already relies on — which correctly lands in the same
// `assets/` directory this module itself was loaded from.
//
// That filename-only trick is itself VS-Code-webview-specific, though: it
// assumes this module and viz-global.js always land in the same flat
// `assets/` directory, which is only true for a production Vite build.
// Under `vite dev` (e.g. the marketing site's `pnpm dev`), this module's
// `import.meta.url` is its original unbundled source path
// (`/src/utils/plantumlEngine.ts`) while `vizGlobalUrlRaw` points at Vite's
// dev-server-served copy in a completely different directory — discarding
// that directory and reusing just the filename produced a 404 for
// `/src/utils/viz-global.js`, a path that was never valid in dev mode.
// `vizGlobalUrlRaw` (the raw `?url` import) is already the *correct* path
// for whatever mode Vite is currently running in, dev or prod alike — so
// only apply the filename-only rewrite where it's actually needed.
const isVSCodeWebview = typeof (window as unknown as { acquireVsCodeApi?: unknown }).acquireVsCodeApi === 'function'
const vizGlobalUrl = isVSCodeWebview
    ? new URL(vizGlobalUrlRaw.split('/').pop()!, import.meta.url).href
    : new URL(vizGlobalUrlRaw, import.meta.url).href

type PlantUmlEngine = { render: (lines: string[], targetId: string, options?: { dark?: boolean }) => void }

let vizGlobalReady: Promise<void> | null = null
let engineReady: Promise<PlantUmlEngine> | null = null

/** Exported so `dotEngine.ts` can reuse the same viz-global.js load (and its
 * hard-won correct-URL/classic-<script> handling — see the comment above)
 * instead of duplicating it to call Viz.js's own standalone DOT API. */
export function loadVizGlobal(): Promise<void> {
    if (!vizGlobalReady) {
        vizGlobalReady = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-plantuml-viz]')
            if (existing) {
                resolve()
                return
            }
            const script = document.createElement('script')
            script.src = vizGlobalUrl
            // Dynamically created scripts default to async=true, which some
            // browsers exempt from `document.currentScript` tracking —
            // Viz.js's WASM loader depends on that being set correctly (see
            // the comment above), so force classic synchronous-script
            // semantics explicitly rather than relying on the default.
            script.async = false
            script.dataset.plantumlViz = 'true'
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load the PlantUML layout engine (viz-global.js)'))
            document.head.appendChild(script)
        })
    }
    return vizGlobalReady
}

function loadEngine(): Promise<PlantUmlEngine> {
    if (!engineReady) {
        engineReady = loadVizGlobal()
            // @ts-expect-error -- @plantuml/core ships no declaration file
            .then(() => import('@plantuml/core'))
            .catch(err => {
                engineReady = null
                throw err instanceof Error ? err : new Error('Failed to load the PlantUML engine')
            })
    }
    return engineReady
}

let plantumlCounter = 0
// The engine keeps shared internal render state and silently corrupts
// concurrent renders (documented in @plantuml/core's GITHUB_INTEGRATION.md),
// so every render() call across every PlantUmlBlock on the page must be
// serialized through this single chain rather than firing in parallel.
let renderChain: Promise<void> = Promise.resolve()

const RENDER_TIMEOUT_MS = 20000

/** Renders PlantUML `source` to an SVG string (as HTML markup). Rejects on
 * syntax error or timeout. Safe to call concurrently — internally queued. */
export function renderPlantUml(source: string, dark: boolean): Promise<string> {
    const result = renderChain.then(() => renderOne(source, dark))
    // Keep the queue alive regardless of this render's outcome so one failed
    // diagram doesn't block every later one on the page.
    renderChain = result.then(() => undefined, () => undefined)
    return result
}

function renderOne(source: string, dark: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        loadEngine()
            .then(({ render }) => {
                const targetId = `plantuml-render-target-${plantumlCounter++}`
                const target = document.createElement('div')
                target.id = targetId
                target.style.cssText = 'position:absolute; left:-99999px; top:0; visibility:hidden; pointer-events:none;'
                document.body.appendChild(target)

                let settled = false
                const finish = (fn: () => void) => {
                    if (settled) return
                    settled = true
                    clearTimeout(timeoutId)
                    observer.disconnect()
                    window.removeEventListener('error', onGlobalError)
                    window.removeEventListener('unhandledrejection', onUnhandledRejection)
                    target.remove()
                    fn()
                }

                const observer = new MutationObserver(() => {
                    if (target.querySelector('svg')) {
                        finish(() => resolve(target.innerHTML))
                    }
                })
                observer.observe(target, { childList: true, subtree: true })

                // render() returns immediately and writes the SVG in later,
                // async, internal work (see @plantuml/core's own docs) — an
                // exception during that later work (e.g. an unsupported
                // diagram type/stdlib the engine doesn't recognize, like
                // `archimate` without its sprite library, which isn't
                // bundled — see @plantuml/core's README) never reaches the
                // synchronous try/catch below, so without these listeners
                // the only way to notice failure is the full 20s timeout —
                // a needlessly long, unclear wait for something that's
                // already unrecoverably broken.
                const onGlobalError = (e: ErrorEvent) => {
                    finish(() => reject(e.error instanceof Error ? e.error : new Error(e.message || 'PlantUML render failed')))
                }
                const onUnhandledRejection = (e: PromiseRejectionEvent) => {
                    const reason = e.reason
                    finish(() => reject(reason instanceof Error ? reason : new Error('PlantUML render failed')))
                }
                window.addEventListener('error', onGlobalError)
                window.addEventListener('unhandledrejection', onUnhandledRejection)

                const timeoutId = setTimeout(() => {
                    finish(() => reject(new Error('PlantUML render timed out')))
                }, RENDER_TIMEOUT_MS)

                try {
                    const lines = source.split(/\r\n|\r|\n/)
                    render(lines, targetId, { dark })
                } catch (err) {
                    finish(() => reject(err instanceof Error ? err : new Error('PlantUML render failed')))
                }
            })
            .catch(reject)
    })
}
