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
 * The app's real stylesheet is embedded verbatim (the ../styles/ parts via
 * Vite's `?raw` + import.meta.glob, loaded lazily so it isn't duplicated
 * into the main bundle — see loadIndexCss below) rather than re-deriving styles by hand,
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

import { KATEX_FONT_URLS } from './katexFontUrls'

// index.css is now only @import lines; the rules live in ../styles/, whose
// numeric prefixes are the cascade order — so sorting by path reproduces it.
// 00-tailwind.css holds raw @tailwind directives, meaningless outside the
// build, so it's left out (it was embedded as dead text before the split).
const STYLE_PARTS = import.meta.glob<string>(['../styles/*.css', '!../styles/00-tailwind.css'], { query: '?raw', import: 'default' })

async function loadIndexCss(): Promise<string> {
    const paths = Object.keys(STYLE_PARTS).sort()
    const parts = await Promise.all(paths.map(path => STYLE_PARTS[path]()))
    return parts.join('\n')
}

async function loadKatexCss(): Promise<string> {
    const mod = await import('katex/dist/katex.min.css?raw')
    // Its own url(fonts/...) paths don't exist next to the exported file;
    // the fonts actually used are inlined separately (inlineKatexFonts).
    return mod.default.replace(/@font-face\s*{[^}]*}/g, '')
}

// The theme tokens a host may override at runtime (the VS Code webview maps
// them onto its own --vscode-* colors). index.css alone only knows the stock
// palettes, so bake in the values the user is actually looking at.
const THEME_TOKENS = [
    '--bg-primary', '--bg-secondary', '--bg-tertiary', '--bg-code',
    '--text-primary', '--text-secondary', '--text-tertiary',
    '--accent', '--accent-light', '--accent-hover',
    '--border-light', '--border-medium', '--border-dark',
]

function resolvedThemeCss(): string {
    const style = getComputedStyle(document.documentElement)
    const declarations = THEME_TOKENS
        .map(name => [name, style.getPropertyValue(name).trim()] as const)
        .filter(([, value]) => value)
        .map(([name, value]) => `${name}: ${value} !important;`)
    return declarations.length ? `:root { ${declarations.join(' ')} }` : ''
}

const isBold = (weight: string) => weight === 'bold' || Number(weight) >= 600

/** @font-face rules with data: URIs for the KaTeX faces this page actually
 * loaded, so exported math keeps its typography offline without embedding
 * all ~20 files. Reads document.fonts rather than Resource Timing, whose
 * 250-entry buffer can be full on a long-lived preview. */
async function inlineKatexFonts(): Promise<string> {
    const faces = Array.from(document.fonts).filter(face => face.status === 'loaded' && face.family.replace(/["']/g, '').startsWith('KaTeX_'))
    const rules = await Promise.all(faces.map(async face => {
        const family = face.family.replace(/["']/g, '')
        const bold = isBold(face.weight)
        const italic = face.style === 'italic'
        const variant = bold && italic ? 'BoldItalic' : bold ? 'Bold' : italic ? 'Italic' : 'Regular'
        const url = KATEX_FONT_URLS[`${family}-${variant}.woff2`]
        const dataUri = url ? await toBase64DataUri(url) : null
        if (!dataUri) return ''
        return `@font-face { font-family: ${family}; font-weight: ${bold ? 'bold' : 'normal'}; font-style: ${italic ? 'italic' : 'normal'}; src: url(${dataUri}) format("woff2"); }`
    }))
    return [...new Set(rules.filter(Boolean))].join('\n')
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
    const hasMath = root.querySelector('.katex') !== null
    const [indexCss, katexCss, katexFonts, clone] = await Promise.all([
        loadIndexCss(),
        hasMath ? loadKatexCss() : Promise.resolve(''),
        hasMath ? inlineKatexFonts() : Promise.resolve(''),
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
<html lang="en" data-theme="${escapeHtml(theme)}"${skin ? ` data-skin="${escapeHtml(skin)}"` : ''}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>${indexCss}</style>
${katexCss ? `<style>${katexFonts}\n${katexCss}</style>` : ''}
<style>${resolvedThemeCss()}</style>
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
