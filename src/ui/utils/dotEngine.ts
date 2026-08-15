/**
 * Graphviz DOT rendering engine.
 *
 * @plantuml/core bundles Viz.js (Graphviz compiled to WebAssembly) as
 * `viz-global.js`, which exposes its own standalone public API for
 * rendering raw DOT source directly — `Viz.instance().then(viz =>
 * viz.renderSVGElement(dotSource))` — completely independent of PlantUML's
 * own diagram-description language. An earlier version of this file instead
 * wrapped raw DOT source in PlantUML's `@startdot`/`@enddot` directive and
 * routed it through `renderPlantUml()`, assuming PlantUML's Java/upstream
 * support for embedding DOT carried over — it doesn't: this TeaVM build
 * rejects `@startdot` outright ("directive is not recognized"), so every
 * DOT diagram failed. Calling Viz.js directly sidesteps PlantUML's grammar
 * entirely and is also the officially documented way to use Viz.js on its
 * own.
 */
import { loadVizGlobal } from './plantumlEngine'

interface VizInstance {
    renderSVGElement: (source: string, options?: { engine?: string }) => SVGElement
}

interface VizGlobal {
    instance: () => Promise<VizInstance>
}

declare global {
    interface Window {
        Viz?: VizGlobal
    }
}

let vizInstanceReady: Promise<VizInstance> | null = null

function loadVizInstance(): Promise<VizInstance> {
    if (!vizInstanceReady) {
        vizInstanceReady = loadVizGlobal()
            .then(() => {
                if (!window.Viz) throw new Error('Viz.js did not attach to window.Viz')
                return window.Viz.instance()
            })
            .catch(err => {
                vizInstanceReady = null
                throw err instanceof Error ? err : new Error('Failed to load the Graphviz layout engine')
            })
    }
    return vizInstanceReady
}

/**
 * Renders Graphviz DOT source to an SVG string.
 * Rejects on syntax error or engine load failure.
 */
export async function renderDot(source: string): Promise<string> {
    const viz = await loadVizInstance()
    try {
        const svgEl = viz.renderSVGElement(source)
        return svgEl.outerHTML
    } catch (err) {
        throw err instanceof Error ? err : new Error('DOT render failed')
    }
}
