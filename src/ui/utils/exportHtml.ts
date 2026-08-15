/**
 * Builds a self-contained standalone .html file from the already-rendered
 * `.markdown-glass` DOM — the same WYSIWYG content the user is looking at,
 * already past every converter/GFM/math pipeline step.
 *
 * Much simpler than the .docx exporter (exportDocx.ts): since the source
 * really is HTML already, this is a clone + two enrichments, not a
 * from-scratch document-model rebuild:
 *  - Mermaid/PlantUML/DOT/Vega diagrams are already inline `<svg>` elements
 *    in the DOM — they come along for free via cloneNode, no rasterizing.
 *  - `<img>` elements are inlined as base64 data URIs (same "download once,
 *    embed forever" approach as the .docx exporter) so the file has zero
 *    external dependencies — safe to email, drop in a wiki, or open on a
 *    machine with no network access.
 *
 * The real `index.css` is embedded verbatim (via Vite's `?raw` import, in
 * its own dynamically-imported module so it isn't duplicated into the main
 * bundle — see loadIndexCss below) rather than re-deriving styles by hand,
 * so the export always matches the live app's look, including whichever
 * theme (light/dark/sepia/solarized) is currently active — copied onto the
 * exported document's own `<html data-theme>` attribute the same way the
 * live app itself is themed.
 *
 * Scope: the main content area only (typography, code blocks, diagrams,
 * tables, alerts) — not a rebuilt copy of the interactive sidebar/TOC. A
 * static export is for reading/sharing/printing; a JS-driven filterable
 * outline doesn't really carry over to "just open this file" use.
 */

async function loadIndexCss(): Promise<string> {
    const mod = await import('../index.css?raw')
    return mod.default
}

async function toBase64DataUri(src: string): Promise<string | null> {
    try {
        const res = await fetch(src)
        const blob = await res.blob()
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
        })
    } catch {
        return null
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

/** Builds a standalone .html Blob from the rendered markdown DOM. `root`
 * should be the `.markdown-glass` element. */
export async function exportMarkdownToHtml(root: HTMLElement, options: { title?: string } = {}): Promise<Blob> {
    const [indexCss, clone] = await Promise.all([
        loadIndexCss(),
        (async () => {
            const clone = root.cloneNode(true) as HTMLElement

            // `data-line` is scroll-sync plumbing (rehypeLineNumbers), meaningless
            // outside the live app — strip it so the exported markup doesn't carry
            // internal implementation noise.
            clone.querySelectorAll('[data-line]').forEach(el => el.removeAttribute('data-line'))

            const images = Array.from(clone.querySelectorAll('img'))
            await Promise.all(images.map(async img => {
                const src = img.getAttribute('src')
                if (!src || src.startsWith('data:')) return
                const dataUri = await toBase64DataUri(src)
                if (dataUri) img.setAttribute('src', dataUri)
                // Leave broken/unreachable images as their original src —
                // degrades to a broken-image icon, same as the live preview,
                // rather than silently dropping the <img> entirely.
            }))
            return clone
        })(),
    ])

    const theme = document.documentElement.getAttribute('data-theme') || 'light'
    const skin = document.documentElement.getAttribute('data-skin')
    const title = options.title?.trim() || document.title || 'Markdown Export'

    const html = `<!DOCTYPE html>
<html lang="en" data-theme="${theme}"${skin ? ` data-skin="${escapeHtml(skin)}"` : ''}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>${indexCss}</style>
<style>
  body { margin: 0; padding: 40px 60px; background: var(--bg-primary); }
  .markdown-glass { max-width: 900px; margin: 0 auto; }
  @media (max-width: 640px) { body { padding: 24px 20px; } }
</style>
</head>
<body>
${clone.outerHTML}
</body>
</html>
`

    return new Blob([html], { type: 'text/html' })
}
