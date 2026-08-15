/**
 * rehype plugin: stamps every element with a `data-line` attribute holding
 * its source markdown line number (1-based), taken from the position info
 * remark/rehype already attach to each node.
 *
 * This is what makes editor↔preview scroll sync possible: given a source
 * line, the DOM element whose data-line is the closest one at-or-before it
 * is "the rendered block for that line" — no separate source map needed.
 *
 * Must run before rehypeRaw in the plugin list: rehypeRaw re-parses raw
 * HTML chunks into brand-new nodes with no position info, so anything it
 * creates simply won't get a data-line (acceptable — those chunks are rare
 * and scroll sync degrades gracefully to the nearest still-tagged ancestor).
 */
import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

export default function rehypeLineNumbers() {
    return (tree: Root) => {
        visit(tree, 'element', (node: Element) => {
            const line = node.position?.start?.line
            if (typeof line !== 'number') return
            node.properties = { ...node.properties, 'data-line': line }
        })
    }
}
