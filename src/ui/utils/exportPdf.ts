/**
 * Builds a real PDF (not a rasterized screenshot of the whole page) from the
 * already-rendered `.markdown-glass` DOM, using pdfmake — entirely
 * client-side, no browser print dialog involved.
 *
 * This exists because `window.print()` (the old "Export PDF" behavior)
 * silently does nothing inside a real VS Code webview: the webview's outer
 * iframe is sandboxed without `allow-modals`, which the extension has no way
 * to grant from its own HTML — a platform restriction, not a CSP/script
 * issue we can work around. Generating the PDF ourselves sidesteps the
 * browser's print pipeline entirely, the same reasoning that already applies
 * to the .docx exporter (exportDocx.ts).
 *
 * Font handling: pdfmake needs every font it uses explicitly registered —
 * even the 14 built-in PDF standard fonts (Helvetica, Courier, ...) require
 * their AFM metrics merged into pdfmake's virtual filesystem before use, or
 * `provideFont` throws. No embedding/licensing concerns since these are the
 * PDF spec's own always-available standard fonts, not custom TTFs.
 */
import { toPng } from 'html-to-image'

const MAX_IMAGE_WIDTH_PT = 480
const MAX_IMAGE_HEIGHT_PT = 680

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfContent = any

let pdfMakeInstance: Promise<PdfContent> | null = null

async function loadPdfMake(): Promise<PdfContent> {
    if (!pdfMakeInstance) {
        pdfMakeInstance = (async () => {
            const [pdfMakeMod, helveticaMod, courierMod] = await Promise.all([
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                import('pdfmake/build/pdfmake.js') as Promise<any>,
                // @ts-expect-error -- pdfmake ships no declaration file for this subpath (only the package root resolves via @types/pdfmake)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                import('pdfmake/build/standard-fonts/Helvetica.js') as Promise<any>,
                // @ts-expect-error -- pdfmake ships no declaration file for this subpath (only the package root resolves via @types/pdfmake)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                import('pdfmake/build/standard-fonts/Courier.js') as Promise<any>,
            ])
            const pdfMake = pdfMakeMod.default ?? pdfMakeMod
            const helvetica = helveticaMod.default ?? helveticaMod
            const courier = courierMod.default ?? courierMod
            // Use the documented public API (addFontContainer merges into
            // pdfmake's internal virtual filesystem singleton) — a plain
            // `pdfMake.vfs = {...}` assignment looks like it works but is
            // actually a no-op dead property; pdfmake never reads it back.
            pdfMake.addFontContainer(helvetica)
            pdfMake.addFontContainer(courier)
            return pdfMake
        })()
    }
    return pdfMakeInstance
}

async function toDataUri(src: string): Promise<string | null> {
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

async function rasterizeElement(el: HTMLElement): Promise<string | null> {
    try {
        return await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff' })
    } catch {
        return null
    }
}

interface InlineMarks {
    bold?: boolean
    italics?: boolean
    decoration?: 'lineThrough'
    code?: boolean
}

function inlineRuns(node: Node, marks: InlineMarks = {}): PdfContent[] {
    const runs: PdfContent[] = []

    node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent
            if (text) {
                // pdfmake merges style keys by presence, not truthiness — an
                // explicit `font: undefined` on a run can clobber the
                // inherited default font with a literal "undefined" font
                // name and throw deep inside its internal stream pipeline
                // (silently: getBuffer() never listens for a stream 'error'
                // event, so the whole export just hangs forever with no
                // console output). Only set keys that are actually true/set.
                const run: PdfContent = { text }
                if (marks.bold) run.bold = true
                if (marks.italics) run.italics = true
                if (marks.decoration) run.decoration = marks.decoration
                if (marks.code) run.font = 'Courier'
                runs.push(run)
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
                runs.push(...inlineRuns(el, { ...marks, decoration: 'lineThrough' }))
                break
            case 'code':
                runs.push(...inlineRuns(el, { ...marks, code: true }))
                break
            case 'br':
                runs.push({ text: '\n' })
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

async function imageContent(source: HTMLElement | HTMLImageElement): Promise<PdfContent | null> {
    if (source.tagName === 'IMG') {
        const img = source as HTMLImageElement
        const dataUri = await toDataUri(img.currentSrc || img.src)
        if (!dataUri) return null
        return { image: dataUri, fit: [MAX_IMAGE_WIDTH_PT, MAX_IMAGE_HEIGHT_PT], margin: [0, 6, 0, 6] }
    }

    const dataUri = await rasterizeElement(source)
    if (!dataUri) return { text: '[diagram could not be exported]', italics: true, margin: [0, 6, 0, 6] }
    return { image: dataUri, fit: [MAX_IMAGE_WIDTH_PT, MAX_IMAGE_HEIGHT_PT], margin: [0, 6, 0, 6] }
}

const HEADING_SIZES = [20, 17, 15, 13, 11, 10]

async function blockFromElement(el: HTMLElement): Promise<PdfContent[]> {
    const tag = el.tagName.toLowerCase()
    const headingMatch = tag.match(/^h([1-6])$/)

    if (headingMatch) {
        return [{
            text: inlineRuns(el),
            fontSize: HEADING_SIZES[Number(headingMatch[1]) - 1],
            bold: true,
            margin: [0, 12, 0, 6],
        }]
    }

    if (tag === 'p') {
        const onlyImg = el.children.length === 1 && el.firstElementChild?.tagName === 'IMG'
            ? (el.firstElementChild as HTMLImageElement)
            : el.querySelector<HTMLImageElement>(':scope > img')
        if (onlyImg) {
            const content = await imageContent(onlyImg)
            return content ? [content] : []
        }

        return [{ text: inlineRuns(el), margin: [0, 4, 0, 4] }]
    }

    if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(el.children)
            .filter(c => c.tagName.toLowerCase() === 'li')
            .map(li => ({ text: inlineRuns(li) }))
        return [{ [tag === 'ol' ? 'ol' : 'ul']: items, margin: [0, 4, 0, 4] }]
    }

    if (tag === 'blockquote') {
        const paragraphs = el.children.length ? Array.from(el.children) : [el]
        return paragraphs.map(p => ({
            text: inlineRuns(p, { italics: true }),
            margin: [12, 2, 0, 2],
            color: '#64748b',
        }))
    }

    if (tag === 'div' && el.classList.contains('github-alert')) {
        const content = el.querySelector('.alert-content') || el
        return [{ text: inlineRuns(content), margin: [12, 6, 0, 6], color: '#334155' }]
    }

    if (tag === 'hr') {
        return [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#cbd5e1' }], margin: [0, 8, 0, 8] }]
    }

    if (tag === 'table') {
        const rowEls = Array.from(el.querySelectorAll('tr'))
        const body = rowEls.map(tr => Array.from(tr.children).map(cell => ({ text: inlineRuns(cell) })))
        if (body.length === 0) return []
        const colCount = body[0].length
        return [{
            table: {
                headerRows: el.querySelector('thead') ? 1 : 0,
                widths: Array(colCount).fill('*'),
                body,
            },
            layout: { fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f1f5f9' : null) },
            margin: [0, 6, 0, 6],
        }]
    }

    if (tag === 'pre') {
        const wrapper = el.querySelector(':scope > div.code-block-wrapper')
        if (wrapper && isDiagramOrMathWrapper(wrapper)) {
            const target = (wrapper.querySelector(':scope > div:last-child') as HTMLElement) || (wrapper as HTMLElement)
            const content = await imageContent(target)
            return content ? [content] : []
        }

        const codeEl = el.querySelector('code') || el
        const text = (codeEl.textContent || '').replace(/\n$/, '')
        return [{
            text,
            font: 'Courier',
            fontSize: 9,
            preserveLeadingSpaces: true,
            margin: [8, 4, 8, 4],
            fillColor: '#f1f5f9',
        }]
    }

    if (tag === 'div' || tag === 'section') {
        const out: PdfContent[] = []
        for (const child of Array.from(el.children)) {
            out.push(...await blockFromElement(child as HTMLElement))
        }
        return out
    }

    const runs = inlineRuns(el)
    return runs.length ? [{ text: runs, margin: [0, 4, 0, 4] }] : []
}

/** Builds a .pdf Blob from the rendered markdown DOM. `root` should be the
 * `.markdown-glass` element (or any container whose direct children are the
 * top-level rendered blocks). */
export async function exportMarkdownToPdf(root: HTMLElement): Promise<Blob> {
    const [pdfMake, content] = await Promise.all([
        loadPdfMake(),
        (async () => {
            const content: PdfContent[] = []
            for (const el of Array.from(root.children)) {
                content.push(...await blockFromElement(el as HTMLElement))
            }
            return content
        })(),
    ])

    const doc = pdfMake.createPdf({
        content: content.length ? content : [{ text: '' }],
        defaultStyle: { font: 'Helvetica', fontSize: 10 },
        pageMargins: [40, 40, 40, 40],
    })

    return doc.getBlob()
}
