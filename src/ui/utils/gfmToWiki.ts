/**
 * GitHub Flavored Markdown → Jira wiki markup / Nulab Backlog notation.
 *
 * The reverse of jiraConverter.ts / backlogConverter.ts: write in Markdown,
 * preview it here, then paste the result straight into a Jira or Backlog
 * ticket. Works on the Markdown syntax tree (remark) rather than regexes, so
 * nesting (a link inside bold inside a list item) comes out right.
 *
 * Diagrams have no equivalent in either target, so diagram fences are kept
 * as plain code blocks — the source stays readable and re-renderable.
 */
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import type { Root, RootContent, PhrasingContent, ListItem, List, Table } from 'mdast'
import { visit } from 'unist-util-visit'

interface InlineMath { type: 'inlineMath'; value: string }
interface BlockMath { type: 'math'; value: string }
type Node = RootContent | PhrasingContent | InlineMath | BlockMath

interface Dialect {
    heading: (depth: number, text: string) => string
    strong: (text: string) => string
    emphasis: (text: string) => string
    del: (text: string) => string
    inlineCode: (text: string) => string
    link: (text: string, url: string) => string
    image: (url: string) => string
    code: (lang: string | null | undefined, value: string) => string
    quote: (body: string) => string
    /** `markers` is the ordered/bullet kind of each enclosing list, outermost first. */
    listItem: (markers: boolean[], text: string) => string
    table: (rows: string[][]) => string
    rule: string
    hardBreak: string
    /** Joins further paragraphs of one list item without ending the item. */
    itemBreak: string
    inlineMath: (value: string) => string
    blockMath: (value: string) => string
    escape: (text: string) => string
}

// Languages Jira's {code} macro highlights; anything else falls back to a
// plain {code} block instead of Jira's "unable to find formatter" error.
const JIRA_LANGUAGES: Record<string, string> = {
    actionscript: 'actionscript', bash: 'bash', sh: 'bash', shell: 'bash', zsh: 'bash',
    c: 'c', cpp: 'cpp', 'c++': 'cpp', csharp: 'c#', cs: 'c#', 'c#': 'c#', css: 'css',
    go: 'go', groovy: 'groovy', haskell: 'haskell', html: 'html', java: 'java',
    javascript: 'javascript', js: 'javascript', jsx: 'javascript', ts: 'javascript',
    typescript: 'javascript', tsx: 'javascript', json: 'json', lua: 'lua',
    objc: 'objc', perl: 'perl', php: 'php', python: 'python', py: 'python', r: 'r',
    ruby: 'ruby', rb: 'ruby', scala: 'scala', sql: 'sql', swift: 'swift',
    vb: 'visualbasic', xml: 'xml', yaml: 'yaml', yml: 'yaml',
}

const jira: Dialect = {
    heading: (depth, text) => `h${depth}. ${text}`,
    strong: text => `*${text}*`,
    emphasis: text => `_${text}_`,
    del: text => `-${text}-`,
    inlineCode: text => `{{${text}}}`,
    link: (text, url) => (text === url ? `[${url}]` : `[${text}|${url}]`),
    image: url => `!${url}!`,
    code: (lang, value) => {
        const mapped = lang ? JIRA_LANGUAGES[lang.toLowerCase()] : undefined
        return `${mapped ? `{code:${mapped}}` : '{code}'}\n${value}\n{code}`
    },
    quote: body => `{quote}\n${body}\n{quote}`,
    listItem: (markers, text) => `${markers.map(ordered => (ordered ? '#' : '*')).join('')} ${text}`,
    table: rows => rows
        .map((cells, i) => (i === 0 ? `||${cells.join('||')}||` : `|${cells.join('|')}|`))
        .join('\n'),
    rule: '----',
    hardBreak: '\\\\\n',
    itemBreak: '\\\\ ',
    inlineMath: value => `{{${value}}}`,
    blockMath: value => `{noformat}\n${value}\n{noformat}`,
    escape: text => text.replace(/([*_{}[\]])/g, '\\$1'),
}

const backlog: Dialect = {
    heading: (depth, text) => `${'*'.repeat(depth)} ${text}`,
    strong: text => `''${text}''`,
    emphasis: text => `'''${text}'''`,
    del: text => `%%${text}%%`,
    // Backlog notation has no inline code markup.
    inlineCode: text => text,
    link: (text, url) => (text === url ? url : `[[${text}>${url}]]`),
    image: url => `#image(${url})`,
    // Backlog's {code} block takes no language.
    code: (_lang, value) => `{code}\n${value}\n{/code}`,
    quote: body => `{quote}\n${body}\n{/quote}`,
    // Backlog nests by repeating the marker; a list's own kind decides it.
    listItem: (markers, text) => `${(markers[markers.length - 1] ? '+' : '-').repeat(markers.length)} ${text}`,
    table: rows => rows
        .map((cells, i) => `|${cells.join('|')}|${i === 0 ? 'h' : ''}`)
        .join('\n'),
    // No horizontal-rule markup in Backlog notation; a blank gap is closest.
    rule: '',
    hardBreak: '&br;\n',
    itemBreak: '&br;',
    inlineMath: value => value,
    blockMath: value => `{code}\n${value}\n{/code}`,
    escape: text => text,
}

interface Ctx {
    d: Dialect
    /** Link reference definitions (`[id]: url`), keyed by mdast identifier. */
    defs: Map<string, string>
    /** Inside a table cell, where a bare `|` would end the cell. */
    inTable?: boolean
}

const escapePipes = (text: string) => text.replace(/\|/g, '\\|')

function inline(nodes: Node[], ctx: Ctx): string {
    return nodes.map(node => inlineNode(node, ctx)).join('')
}

/** Raw HTML has no meaning in a ticket: comments vanish, <br> becomes a
 * line break, any other tag is reduced to its text. */
function htmlNode(value: string, d: Dialect): string {
    if (/^\s*<!--[\s\S]*-->\s*$/.test(value)) return ''
    if (/^\s*<br\s*\/?>\s*$/i.test(value)) return d.hardBreak
    return value.replace(/<[^>]*>/g, '')
}

function linkTo(text: string, plain: string, url: string, ctx: Ctx): string {
    if (ctx.d === jira) {
        // `|` separates text from URL and `]` closes the link in Jira syntax.
        text = escapePipes(text)
        url = url.replace(/\|/g, '%7C').replace(/]/g, '%5D')
    }
    // An autolink's text is its URL; compare unescaped.
    return ctx.d.link(plain === url ? url : text, url)
}

function inlineNode(node: Node, ctx: Ctx): string {
    const { d } = ctx
    switch (node.type) {
        case 'text': return ctx.inTable ? escapePipes(d.escape(node.value)) : d.escape(node.value)
        case 'strong': return d.strong(inline(node.children, ctx))
        case 'emphasis': return d.emphasis(inline(node.children, ctx))
        case 'delete': return d.del(inline(node.children, ctx))
        case 'inlineCode': return d.inlineCode(ctx.inTable ? escapePipes(node.value) : node.value)
        case 'inlineMath': return d.inlineMath(node.value)
        case 'break': return d.hardBreak
        case 'link': {
            const plain = node.children.length === 1 && node.children[0].type === 'text' ? node.children[0].value : ''
            return linkTo(inline(node.children, { ...ctx, inTable: false }), plain, node.url, ctx)
        }
        case 'linkReference': {
            const url = ctx.defs.get(node.identifier)
            const text = inline(node.children, ctx)
            if (!url) return `${d.escape('[')}${text}${d.escape(']')}`
            const plain = node.children.length === 1 && node.children[0].type === 'text' ? node.children[0].value : ''
            return linkTo(text, plain, url, ctx)
        }
        case 'image': return d.image(node.url)
        case 'imageReference': {
            const url = ctx.defs.get(node.identifier)
            return url ? d.image(url) : d.escape(node.alt ?? '')
        }
        case 'html': return htmlNode(node.value, d)
        case 'footnoteReference': return `[${node.identifier}]`
        default: return 'children' in node ? inline(node.children as Node[], ctx) : ''
    }
}

// A list item is one line in both targets: soft wraps become spaces and
// further paragraphs are joined with the dialect's in-item break. Nested
// lists keep their own lines; other blocks (code, quotes) follow the item
// and end the list there — neither target can nest them. Ordered lists
// always restart at 1: neither syntax has a start number.
function listLines(list: List, markers: boolean[], ctx: Ctx): string[] {
    const { d } = ctx
    const lines: string[] = []
    for (const item of list.children as ListItem[]) {
        const path = [...markers, Boolean(list.ordered)]
        const paragraphs: string[] = []
        const after: string[] = []
        for (const child of item.children) {
            if (child.type === 'paragraph' && after.length === 0) paragraphs.push(inline(child.children, ctx).replace(/\n/g, ' '))
            else if (child.type === 'list') after.push(...listLines(child, path, ctx))
            else after.push(block(child, ctx))
        }
        let text = paragraphs.join(d.itemBreak)
        if (item.checked === true) text = `☑ ${text}`
        else if (item.checked === false) text = `☐ ${text}`
        lines.push(d.listItem(path, text), ...after.filter(Boolean))
    }
    return lines
}

function tableRows(table: Table, ctx: Ctx): string[][] {
    const cellCtx = { ...ctx, inTable: true }
    return table.children.map(row => row.children.map(cell => inline(cell.children, cellCtx).trim()))
}

function block(node: Node, ctx: Ctx): string {
    const { d } = ctx
    switch (node.type) {
        case 'heading': return d.heading(node.depth, inline(node.children, ctx))
        case 'paragraph': return inline(node.children, ctx)
        case 'code': return d.code(node.lang, node.value)
        case 'math': return d.blockMath(node.value)
        case 'blockquote': return d.quote(blocks(node.children, ctx))
        case 'list': return listLines(node, [], ctx).join('\n')
        case 'table': return d.table(tableRows(node, ctx))
        case 'thematicBreak': return d.rule
        case 'html': return htmlNode(node.value, d)
        case 'definition': return ''
        case 'footnoteDefinition': return `[${node.identifier}] ${node.children.map(child => block(child, ctx)).join(' ')}`
        default: return 'children' in node ? inline(node.children as Node[], ctx) : ''
    }
}

function blocks(nodes: Node[], ctx: Ctx): string {
    return nodes.map(node => block(node, ctx)).filter(Boolean).join('\n\n')
}

function convert(markdown: string, d: Dialect): string {
    const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(markdown) as Root
    const defs = new Map<string, string>()
    visit(tree, 'definition', node => { defs.set(node.identifier, node.url) })
    return blocks(tree.children, { d, defs }).trim()
}

export function convertGfmToJira(markdown: string): string {
    return convert(markdown, jira)
}

export function convertGfmToBacklog(markdown: string): string {
    return convert(markdown, backlog)
}
