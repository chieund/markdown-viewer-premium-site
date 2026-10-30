import DOMPurify from 'dompurify'

/**
 * Sanitizes diagram SVG (Mermaid, PlantUML, Graphviz, Vega) before it is
 * injected with dangerouslySetInnerHTML.
 *
 * The SVG is generated from document text, and the Chrome extension renders
 * arbitrary Markdown from the web — so a crafted diagram (e.g. a Mermaid
 * label carrying `<img onerror>`) must not be able to run script in the
 * extension's page.
 *
 * An earlier version skipped DOMPurify for Mermaid because it emptied
 * `<foreignObject>` (where Mermaid's HTML labels live). DOMPurify 3 handles
 * that once `foreignObject` is declared an HTML integration point, so the
 * labels survive while their HTML is still filtered.
 */
export function sanitizeDiagramSvg(svg: string): string {
    return DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true, html: true },
        ADD_TAGS: ['foreignObject', 'style'],
        HTML_INTEGRATION_POINTS: { foreignobject: true },
        // Mermaid scopes its embedded <style> rules by the SVG's id, and
        // markers/gradients are referenced by id from url(#...).
        SANITIZE_NAMED_PROPS: false,
    })
}

/** Escapes text for interpolation into an HTML string. Engine error messages
 * often quote the offending diagram source back, so they are user text. */
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}
