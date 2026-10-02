import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeSlug from 'rehype-slug'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import type { PluggableList } from 'unified'
import type { Options as ReactMarkdownOptions } from 'react-markdown'
import type { Root, Element } from 'hast'
import { visit } from 'unist-util-visit'
import rehypeLineNumbers from './rehypeLineNumbers'
import { markdownSanitizeSchema } from './markdownSanitizeSchema'

export const REMARK_PLUGINS: PluggableList = [remarkGfm, remarkMath]

/** The sanitizer adds the "user-content-" prefix to every id (see
 * markdownSanitizeSchema), so remark-rehype must not add its own to
 * footnotes as well — that produced "user-content-user-content-fn-1". */
export const REMARK_REHYPE_OPTIONS: ReactMarkdownOptions['remarkRehypeOptions'] = { clobberPrefix: '' }

/** After sanitizing, ids are prefixed but in-page links still say `#fn-1`.
 * Point each `#x` at `user-content-x` when that is the only match, so
 * footnote links and links to raw-HTML anchors keep working. Heading ids
 * come later (rehype-slug) and are untouched. */
function rehypePrefixedAnchors() {
    return (tree: Root) => {
        const ids = new Set<string>()
        visit(tree, 'element', (node: Element) => {
            if (typeof node.properties?.id === 'string') ids.add(node.properties.id)
        })
        visit(tree, 'element', (node: Element) => {
            const href = node.properties?.href
            if (node.tagName !== 'a' || typeof href !== 'string' || !href.startsWith('#')) return
            const target = `user-content-${decodeURIComponent(href.slice(1))}`
            if (ids.has(target)) node.properties.href = `#${target}`
        })
    }
}

/** Order matters: line numbers first (rehypeRaw's re-parsed nodes lose
 * position info), sanitize right after raw HTML is parsed, then our own
 * trusted markup (heading ids, KaTeX) last so it never needs allow-listing. */
export const REHYPE_PLUGINS: PluggableList = [
    rehypeLineNumbers,
    rehypeRaw,
    [rehypeSanitize, markdownSanitizeSchema],
    rehypePrefixedAnchors,
    rehypeSlug,
    rehypeKatex,
]
