/**
 * Walks the already-rendered `.markdown-glass` DOM (same WYSIWYG content the
 * user is looking at — already past every converter/GFM/math/mermaid
 * pipeline step) and builds a real OOXML .docx via the `docx` package.
 *
 * Scope (deliberately not full parity with a real Word round-trip):
 *  - text, headings, paragraphs, lists, blockquotes, tables, plain code
 *    blocks → real docx text/table elements.
 *  - Mermaid diagrams and block LaTeX → rasterized to PNG (html-to-image)
 *    and embedded as images, not editable OOXML/OMML.
 *  - No real numbered-list restart tracking (each item is just prefixed
 *    with a plain "N." string) and no nested block content inside list
 *    items — both fine for "basic" markdown, not for deeply nested docs.
 */
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    ImageRun,
    HeadingLevel,
    WidthType,
    BorderStyle,
    AlignmentType,
} from 'docx'
import { toPng } from 'html-to-image'

const HEADING_LEVELS = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
]

const MAX_IMAGE_WIDTH_PX = 600

async function rasterizeElement(el: HTMLElement): Promise<{ data: ArrayBuffer; width: number; height: number } | null> {
    try {
        const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff' })
        const data = await (await fetch(dataUrl)).arrayBuffer()
        const rect = el.getBoundingClientRect()
        const width = rect.width || 400
        const height = rect.height || 200
        const scale = width > MAX_IMAGE_WIDTH_PX ? MAX_IMAGE_WIDTH_PX / width : 1
        return { data, width: Math.round(width * scale), height: Math.round(height * scale) }
    } catch {
        return null
    }
}

async function fetchImageAsPng(src: string): Promise<ArrayBuffer | null> {
    try {
        const res = await fetch(src)
        return await res.arrayBuffer()
    } catch {
        return null
    }
}

interface InlineMarks {
    bold?: boolean
    italics?: boolean
    strike?: boolean
    code?: boolean
}

function inlineRuns(node: Node, marks: InlineMarks = {}): TextRun[] {
    const runs: TextRun[] = []

    node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent
            if (text) {
                runs.push(new TextRun({
                    text,
                    bold: marks.bold,
                    italics: marks.italics,
                    strike: marks.strike,
                    font: marks.code ? 'Courier New' : undefined,
                }))
            }
            return
        }
        if (child.nodeType !== Node.ELEMENT_NODE) return

        const el = child as HTMLElement
        switch (el.tagName.toLowerCase()) {
            case 'strong':
            case 'b':
                runs.push(...inlineRuns(el, { ...marks, bold: true }))
                break
            case 'em':
            case 'i':
                runs.push(...inlineRuns(el, { ...marks, italics: true }))
                break
            case 'del':
            case 's':
                runs.push(...inlineRuns(el, { ...marks, strike: true }))
                break
            case 'code':
                runs.push(...inlineRuns(el, { ...marks, code: true }))
                break
            case 'br':
                runs.push(new TextRun({ text: '', break: 1 }))
                break
            default:
                // a, span, katex internals, etc. — keep the text, drop the wrapper.
                runs.push(...inlineRuns(el, marks))
        }
    })

    return runs
}

const RASTERIZED_LANGS = new Set(['mermaid', 'tex', 'plantuml', 'dot', 'vega', 'vega-lite'])

function isDiagramOrMathWrapper(wrapper: Element | null): boolean {
    const lang = wrapper?.querySelector('.lang-tag')?.textContent?.trim()
    return !!lang && RASTERIZED_LANGS.has(lang)
}

async function blockFromElement(el: HTMLElement): Promise<(Paragraph | Table)[]> {
    const tag = el.tagName.toLowerCase()
    const headingMatch = tag.match(/^h([1-6])$/)

    if (headingMatch) {
        return [new Paragraph({ heading: HEADING_LEVELS[Number(headingMatch[1]) - 1], children: inlineRuns(el) })]
    }

    if (tag === 'p') {
        // A lone block-level <img> (our ImageLightbox wrapper renders one
        // <img> per <p>, same as plain markdown) — embed it, not its alt text.
        const onlyImg = el.children.length === 1 && el.firstElementChild?.tagName === 'IMG'
            ? (el.firstElementChild as HTMLImageElement)
            : el.querySelector<HTMLImageElement>(':scope > img')
        if (onlyImg) return await imageBlock(onlyImg)

        return [new Paragraph({ children: inlineRuns(el) })]
    }

    if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(el.children).filter(c => c.tagName.toLowerCase() === 'li')
        return items.map((li, i) => new Paragraph({
            indent: { left: 360 },
            children: [
                new TextRun({ text: tag === 'ol' ? `${i + 1}. ` : '•  ' }),
                ...inlineRuns(li),
            ],
        }))
    }

    if (tag === 'blockquote') {
        const paragraphs = el.children.length ? Array.from(el.children) : [el]
        return paragraphs.map(p => new Paragraph({
            indent: { left: 360 },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'CBD5E1' } },
            children: inlineRuns(p, { italics: true }),
        }))
    }

    if (tag === 'div' && el.classList.contains('github-alert')) {
        const content = el.querySelector('.alert-content') || el
        return [new Paragraph({
            indent: { left: 360 },
            border: { left: { style: BorderStyle.SINGLE, size: 24, color: '38BDF8' } },
            children: inlineRuns(content),
        })]
    }

    if (tag === 'hr') {
        return [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' } } })]
    }

    if (tag === 'table') {
        const rows = Array.from(el.querySelectorAll('tr')).map(tr => {
            const cellEls = Array.from(tr.children)
            return new TableRow({
                children: cellEls.map(cell => new TableCell({
                    width: { size: Math.round(100 / Math.max(1, cellEls.length)), type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: inlineRuns(cell) })],
                })),
            })
        })
        if (rows.length === 0) return []
        return [new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })]
    }

    if (tag === 'pre') {
        const wrapper = el.querySelector(':scope > div.code-block-wrapper')
        if (wrapper && isDiagramOrMathWrapper(wrapper)) {
            // Rasterize just the diagram/formula area, not the toolbar (the
            // wrapper is always [code-header, content] — see MermaidBlock/
            // MathBlock — so the content area is simply the last child).
            const target = (wrapper.querySelector(':scope > div:last-child') as HTMLElement) || (wrapper as HTMLElement)
            return await imageBlock(target)
        }

        const codeEl = el.querySelector('code') || el
        const text = (codeEl.textContent || '').replace(/\n$/, '')
        return text.split('\n').map(line => new Paragraph({
            children: [new TextRun({ text: line.length ? line : ' ', font: 'Courier New', size: 20 })],
        }))
    }

    // Unrecognized wrapper (e.g. a raw-HTML div from rehypeRaw) — recurse
    // into its children rather than dropping the content silently.
    if (tag === 'div' || tag === 'section') {
        const out: (Paragraph | Table)[] = []
        for (const child of Array.from(el.children)) {
            out.push(...await blockFromElement(child as HTMLElement))
        }
        return out
    }

    const runs = inlineRuns(el)
    return runs.length ? [new Paragraph({ children: runs })] : []
}

async function imageBlock(source: HTMLElement | HTMLImageElement): Promise<Paragraph[]> {
    if (source.tagName === 'IMG') {
        const img = source as HTMLImageElement
        const data = await fetchImageAsPng(img.currentSrc || img.src)
        if (!data) return []
        const naturalWidth = img.naturalWidth || 400
        const naturalHeight = img.naturalHeight || 300
        const scale = naturalWidth > MAX_IMAGE_WIDTH_PX ? MAX_IMAGE_WIDTH_PX / naturalWidth : 1
        return [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({
                type: 'png',
                data,
                transformation: { width: Math.round(naturalWidth * scale), height: Math.round(naturalHeight * scale) },
            })],
        })]
    }

    const rendered = await rasterizeElement(source)
    if (!rendered) return [new Paragraph({ text: '[diagram could not be exported]' })]
    return [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({
            type: 'png',
            data: rendered.data,
            transformation: { width: rendered.width, height: rendered.height },
        })],
    })]
}

/** Builds a .docx Blob from the rendered markdown DOM. `root` should be the
 * `.markdown-glass` element (or any container whose direct children are the
 * top-level rendered blocks). */
export async function exportMarkdownToDocx(root: HTMLElement): Promise<Blob> {
    const children: (Paragraph | Table)[] = []
    for (const el of Array.from(root.children)) {
        children.push(...await blockFromElement(el as HTMLElement))
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: children.length ? children : [new Paragraph('')],
        }],
    })

    return Packer.toBlob(doc)
}
