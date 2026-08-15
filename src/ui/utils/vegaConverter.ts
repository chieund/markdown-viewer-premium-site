/**
 * Wraps a raw `.vg`/`.vl` file's content in a ```vega/```vega-lite fence so
 * it renders through the VegaBlock pipeline as an inline fence in a regular
 * Markdown document. Vega/Vega-Lite source is a single JSON spec — the
 * whole file is one chart.
 */
export function convertVegaToGfm(content: string, isLite: boolean): string {
    if (!content) return content;

    if (/^```(vega|vega-lite|vegalite|vl)\b/m.test(content)) {
        return content;
    }

    const tag = isLite ? 'vega-lite' : 'vega';
    return '```' + tag + '\n' + content.trimEnd() + '\n```\n';
}
