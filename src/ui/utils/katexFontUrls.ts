// Bundler URLs for KaTeX's woff2 files, keyed by file name — the same
// assets katex.css already makes the bundle emit, so this adds no files.
// Imported by package name (not a node_modules path glob) so it resolves the
// same way in every consumer, including the website's copy of this folder.
import f0 from 'katex/dist/fonts/KaTeX_AMS-Regular.woff2?url'
import f1 from 'katex/dist/fonts/KaTeX_Caligraphic-Bold.woff2?url'
import f2 from 'katex/dist/fonts/KaTeX_Caligraphic-Regular.woff2?url'
import f3 from 'katex/dist/fonts/KaTeX_Fraktur-Bold.woff2?url'
import f4 from 'katex/dist/fonts/KaTeX_Fraktur-Regular.woff2?url'
import f5 from 'katex/dist/fonts/KaTeX_Main-Bold.woff2?url'
import f6 from 'katex/dist/fonts/KaTeX_Main-BoldItalic.woff2?url'
import f7 from 'katex/dist/fonts/KaTeX_Main-Italic.woff2?url'
import f8 from 'katex/dist/fonts/KaTeX_Main-Regular.woff2?url'
import f9 from 'katex/dist/fonts/KaTeX_Math-BoldItalic.woff2?url'
import f10 from 'katex/dist/fonts/KaTeX_Math-Italic.woff2?url'
import f11 from 'katex/dist/fonts/KaTeX_SansSerif-Bold.woff2?url'
import f12 from 'katex/dist/fonts/KaTeX_SansSerif-Italic.woff2?url'
import f13 from 'katex/dist/fonts/KaTeX_SansSerif-Regular.woff2?url'
import f14 from 'katex/dist/fonts/KaTeX_Script-Regular.woff2?url'
import f15 from 'katex/dist/fonts/KaTeX_Size1-Regular.woff2?url'
import f16 from 'katex/dist/fonts/KaTeX_Size2-Regular.woff2?url'
import f17 from 'katex/dist/fonts/KaTeX_Size3-Regular.woff2?url'
import f18 from 'katex/dist/fonts/KaTeX_Size4-Regular.woff2?url'
import f19 from 'katex/dist/fonts/KaTeX_Typewriter-Regular.woff2?url'

export const KATEX_FONT_URLS: Record<string, string> = {
    'KaTeX_AMS-Regular.woff2': f0,
    'KaTeX_Caligraphic-Bold.woff2': f1,
    'KaTeX_Caligraphic-Regular.woff2': f2,
    'KaTeX_Fraktur-Bold.woff2': f3,
    'KaTeX_Fraktur-Regular.woff2': f4,
    'KaTeX_Main-Bold.woff2': f5,
    'KaTeX_Main-BoldItalic.woff2': f6,
    'KaTeX_Main-Italic.woff2': f7,
    'KaTeX_Main-Regular.woff2': f8,
    'KaTeX_Math-BoldItalic.woff2': f9,
    'KaTeX_Math-Italic.woff2': f10,
    'KaTeX_SansSerif-Bold.woff2': f11,
    'KaTeX_SansSerif-Italic.woff2': f12,
    'KaTeX_SansSerif-Regular.woff2': f13,
    'KaTeX_Script-Regular.woff2': f14,
    'KaTeX_Size1-Regular.woff2': f15,
    'KaTeX_Size2-Regular.woff2': f16,
    'KaTeX_Size3-Regular.woff2': f17,
    'KaTeX_Size4-Regular.woff2': f18,
    'KaTeX_Typewriter-Regular.woff2': f19,
}
