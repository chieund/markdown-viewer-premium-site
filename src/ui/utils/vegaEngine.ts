// Lazy-loaded Vega/Vega-Lite renderer
let vegaEmbedModule: typeof import('vega-embed') | null = null

async function loadVegaEmbed() {
    if (!vegaEmbedModule) {
        vegaEmbedModule = await import(/* @vite-ignore */ 'vega-embed')
    }
    return vegaEmbedModule
}

export type VegaMode = 'vega' | 'vega-lite'

export async function renderVega(spec: string, mode: VegaMode): Promise<string> {
    const { default: embed } = await loadVegaEmbed()

    let parsedSpec: object
    try {
        parsedSpec = JSON.parse(spec)
    } catch (e) {
        throw new Error(`Invalid JSON in ${mode} specification: ${(e as Error).message}`, { cause: e })
    }

    // Create temporary container
    const container = document.createElement('div')
    container.style.cssText = 'position:absolute;left:-99999px;top:0;'
    document.body.appendChild(container)

    try {
        const result = await embed(container, parsedSpec as Parameters<typeof embed>[1], {
            mode,
            actions: false,
            renderer: 'svg',
        })

        // Extract SVG
        const svgEl = container.querySelector('svg')
        if (!svgEl) throw new Error('Vega render produced no SVG')
        const svgString = new XMLSerializer().serializeToString(svgEl)

        result.finalize()
        return svgString
    } finally {
        container.remove()
    }
}
