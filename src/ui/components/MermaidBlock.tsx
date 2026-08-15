import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mermaid from 'mermaid'
import zenumlDiagram from '@mermaid-js/mermaid-zenuml'
import ReactFlowDiagram from './ReactFlowDiagram'
import SequenceFlowDiagram from './SequenceFlowDiagram'
import CodeBlock from './CodeBlock'
import { copyDiagramImageToClipboard } from '../utils/copyDiagramImage'
import { resolveDisplayPlan } from '../utils/diagramDisplay'
import { tryParseStateDiagram } from '../utils/mermaidStateToReactFlow'
import { tryParseClassDiagram } from '../utils/mermaidClassToReactFlow'
import { tryParseErDiagram } from '../utils/mermaidErToReactFlow'


// Mermaid will be re-initialized based on theme in component

// zenuml ships as an external diagram (not bundled into mermaid core) — must
// register once before mermaid can parse/render a `zenuml` chart.
const externalDiagramsReady = mermaid.registerExternalDiagrams([zenumlDiagram])

interface MermaidBlockProps {
    chart: string
    /** Fires once this block's first render pass settles (success or fallback). */
    onRendered?: () => void
}

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

// ... (Mermaid init and props)

let mermaidCounter = 0

// Moves a small dot along each edge's own path via CSS motion path
// (offset-path/offset-distance), which the browser composites like a
// transform — unlike animating stroke-dashoffset, it doesn't repaint every
// path every frame, so it stays smooth regardless of how many edges there are.
function injectFlowDots(svgEl: SVGSVGElement | null) {
    if (!svgEl) return

    svgEl.querySelectorAll('.mermaid-flow-dot').forEach(el => el.remove())

    // Mermaid draws flowchart/class-diagram/state-diagram/er-diagram edges as
    // <path> (with a `d`), but sequence-diagram messages between two
    // different actors as a plain <line> (x1/y1/x2/y2, no `d`) — only
    // self-messages use <path>.
    const edges = svgEl.querySelectorAll<SVGPathElement | SVGLineElement>(
        '.flowchart-link, .messageLine0, .messageLine1, .relation, .transition, .relationshipLine'
    )

    edges.forEach(edge => {
        const isLine = edge.tagName.toLowerCase() === 'line'
        const d = isLine
            ? `M ${edge.getAttribute('x1')},${edge.getAttribute('y1')} L ${edge.getAttribute('x2')},${edge.getAttribute('y2')}`
            : edge.getAttribute('d')
        if (!d) return

        let length = 60
        try {
            length = isLine
                ? Math.hypot(
                    Number(edge.getAttribute('x2')) - Number(edge.getAttribute('x1')),
                    Number(edge.getAttribute('y2')) - Number(edge.getAttribute('y1'))
                )
                : (edge as SVGPathElement).getTotalLength()
        } catch {
            // Some path shapes (or older browsers) don't support getTotalLength; fall back to a default speed.
        }

        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        dot.setAttribute('r', '3')
        dot.setAttribute('class', 'mermaid-flow-dot')
        dot.setAttribute('fill', getComputedStyle(edge).stroke || '#3b82f6')
        dot.style.setProperty('offset-path', `path("${d}")`)
        // Constant apparent speed across edges of different lengths.
        dot.style.setProperty('animation-duration', `${Math.min(4, Math.max(0.6, length / 150))}s`)

        edge.parentNode?.appendChild(dot)
    })
}

export default function MermaidBlock({ chart, onRendered }: MermaidBlockProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const modalContainerRef = useRef<HTMLDivElement>(null)
    // Ref so the render effect (keyed on [chart, isDark]) can call the latest
    // onRendered without retriggering itself when a new callback identity
    // arrives from a parent re-render.
    const onRenderedRef = useRef(onRendered)
    onRenderedRef.current = onRendered
    const [svg, setSvg] = useState<string>('')
    const [isExpanded, setIsExpanded] = useState(false)
    const [isDark, setIsDark] = useState(false)
    const [showReactFlow, setShowReactFlow] = useState(false)
    const [showSource, setShowSource] = useState(false)
    const [copyImageState, setCopyImageState] = useState<'idle' | 'copying' | 'done' | 'error'>('idle')

    const idRef = useRef(`mermaid-${mermaidCounter++}`)
    const displayPlan = resolveDisplayPlan(chart)
    const isFlowchart = displayPlan.engine === 'react-flow-flowchart'
    const isSequence = displayPlan.engine === 'react-flow-sequence'
    const isStateDiagram = displayPlan.engine === 'react-flow-state'
    const isClassDiagram = displayPlan.engine === 'react-flow-class'
    const isErDiagram = displayPlan.engine === 'react-flow-er'
    const hasFlowView = isFlowchart || isSequence || isStateDiagram || isClassDiagram || isErDiagram
    const useReactFlowView = hasFlowView && showReactFlow
    // ReactFlowDiagram defaults to the flowchart parser; only override it for
    // the other node-graph-shaped families that reuse its layout/render engine.
    const genericParse = isStateDiagram ? tryParseStateDiagram
        : isClassDiagram ? tryParseClassDiagram
            : isErDiagram ? tryParseErDiagram
                : undefined

    const handleFlowFallback = useCallback(() => {
        setShowReactFlow(false)
    }, [])

    // Detect theme changes
    useEffect(() => {
        const checkTheme = () => {
            const theme = document.documentElement.getAttribute('data-theme')
            setIsDark(theme === 'dark')
        }

        checkTheme()

        const observer = new MutationObserver(checkTheme)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        })

        return () => observer.disconnect()
    }, [])



    useEffect(() => {
        const renderChart = async () => {
            try {
                await externalDiagramsReady

                // Pre-process chart to safely handle quotes in labels
                // We replace double quotes with single quotes inside node labels [] and edge labels ||
                // This prevents Mermaid syntax errors while preserving readability
                const processQuotes = (text: string) => {
                    // Helper to sanitize content while preserving outer quotes
                    const sanitize = (content: string) => {
                        // Check for quotes ignoring whitespace
                        const trimmed = content.trim()
                        const hasOuterQuotes = trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1

                        if (hasOuterQuotes) {
                            // It looks like a wrapped string, but we just need to be careful
                            // Extract the content inside the quotes
                            const innerRaw = trimmed.slice(1, -1)

                            // Replace any inner double quotes with single quotes
                            const sanitizedInner = innerRaw.replace(/"/g, "'")

                            // Reconstruct preserving the original whitespace
                            const leadingSpace = content.match(/^\s*/)?.[0] || ''
                            const trailingSpace = content.match(/\s*$/)?.[0] || ''

                            return `${leadingSpace}"${sanitizedInner}"${trailingSpace}`
                        }

                        // Content that's itself a complete bracketed span — e.g. the
                        // `["text"]` inside a stadium shape `id(["text"])`, already
                        // sanitized by the `[...]` pass below before this `(...)`
                        // pass ever sees it — was already handled; re-processing it
                        // here as flat text would corrupt its own nested quotes.
                        const isNestedBracketSpan = /^[[({].*[\])}]$/.test(trimmed) && trimmed.length > 1
                        if (isNestedBracketSpan) return content

                        // Not wrapped, just replace all double quotes
                        return content.replace(/"/g, "'")
                    }

                    // Replaces every top-level `openChar...closeChar` span with its
                    // content run through `sanitize`. Unlike a naive `/\(.*?\)/`
                    // regex, this balances nested same-type brackets and treats
                    // anything between a pair of double quotes as opaque — needed
                    // for labels like `id(["fn(a, b)"])`, where the label text
                    // itself contains literal parens that must not be mistaken for
                    // the shape's own delimiters (a real bug: the old regex found
                    // the `)` inside "fn(a, b)" instead of the shape's real closer,
                    // corrupting one of the label's quote characters and breaking
                    // the whole diagram's parse).
                    const replaceBalanced = (input: string, openChar: string, closeChar: string): string => {
                        let result = ''
                        let i = 0
                        while (i < input.length) {
                            if (input[i] !== openChar) {
                                result += input[i]
                                i++
                                continue
                            }
                            let depth = 1
                            let inQuotes = false
                            let j = i + 1
                            while (j < input.length && depth > 0) {
                                const c = input[j]
                                if (c === '"') inQuotes = !inQuotes
                                else if (!inQuotes) {
                                    if (c === openChar) depth++
                                    else if (c === closeChar) depth--
                                }
                                j++
                            }
                            if (depth !== 0) {
                                // No matching close found — leave the remainder as-is.
                                result += input.slice(i)
                                break
                            }
                            const content = input.slice(i + 1, j - 1)
                            result += openChar + sanitize(content) + closeChar
                            i = j
                        }
                        return result
                    }

                    const replaceEdgeLabels = (input: string): string => {
                        let result = ''
                        let i = 0
                        while (i < input.length) {
                            if (input[i] !== '|') {
                                result += input[i]
                                i++
                                continue
                            }
                            const closeIndex = input.indexOf('|', i + 1)
                            if (closeIndex === -1) {
                                result += input.slice(i)
                                break
                            }
                            result += '|' + sanitize(input.slice(i + 1, closeIndex)) + '|'
                            i = closeIndex + 1
                        }
                        return result
                    }

                    let out = text
                    out = replaceBalanced(out, '[', ']')
                    out = replaceBalanced(out, '(', ')')
                    out = replaceBalanced(out, '{', '}')
                    out = replaceEdgeLabels(out)
                    return out
                }

                // Only flowchart/graph actually use []/()/{}/|| as label
                // delimiters the way processQuotes assumes. Other diagram
                // families (C4, requirementDiagram, block, ...) use those
                // same brackets for their own grammar — e.g. C4's
                // `Rel(u, s, "uses")` requires the double quotes verbatim —
                // so blindly rewriting them there breaks valid syntax.
                const isFlowchartFamily = /^\s*(flowchart|graph)\s+/i.test(chart)
                const processedChart = isFlowchartFamily ? processQuotes(chart) : chart

                // Re-initialize mermaid with theme-appropriate colors
                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDark ? 'dark' : 'neutral',
                    securityLevel: 'loose',
                    fontFamily: 'Inter, "Noto Sans JP", sans-serif',
                    htmlLabels: true, // Enable HTML labels for better formatting support (e.g. <br>)
                    themeVariables: isDark ? {
                        fontSize: '16px',
                        fontFamily: 'Inter, "Noto Sans JP", sans-serif',
                        primaryColor: '#475569', // Slate 600 - Lighter for contrast
                        primaryBorderColor: '#94a3b8', // Slate 400 - Brighter border
                        primaryTextColor: '#f8fafc',
                        lineColor: '#cbd5e1', // Slate 300 - High contrast lines
                        secondaryColor: '#334155', // Slate 700
                        tertiaryColor: '#1e293b' // Slate 800
                    } : {
                        fontSize: '16px',
                        fontFamily: 'Inter, "Noto Sans JP", sans-serif',
                        primaryColor: '#f1f5f9', // Slate 100 - Visible against white
                        primaryBorderColor: '#64748b', // Slate 500 - Strong border
                        primaryTextColor: '#0f172a',
                        lineColor: '#64748b', // Slate 500 - Darker lines
                        secondaryColor: '#e2e8f0', // Slate 200
                        tertiaryColor: '#ffffff'
                    }
                })

                const result = await mermaid.render(idRef.current + '-' + (isDark ? 'dark' : 'light'), processedChart)

                // Handle different mermaid versions
                const svgContent = typeof result === 'string' ? result : result.svg

                // Sanitize SVG before setting state
                // We bypass DOMPurify for Mermaid SVG content because it aggressively strips 
                // content from foreignObject (needed for HTML labels), even with relaxed config.
                // Since Mermaid generates this SVG from safe text input, risk is managed.
                setSvg(svgContent)
            } catch (err) {
                console.error('Mermaid render error:', err)
                // Show more helpful error message
                const errorMsg = err instanceof Error ? err.message : 'Unknown error'
                setSvg(`
                    <div class="text-red-400 p-4 border border-red-500 rounded bg-red-50 dark:bg-red-900/20">
                        <div class="font-semibold mb-2">Mermaid Syntax Error</div>
                        <div class="text-sm mb-2">${errorMsg}</div>
                        <div class="text-xs text-gray-600 dark:text-gray-400">
                            Tip: Try wrapping text with special characters in quotes
                        </div>
                    </div>
                `)
            } finally {
                onRenderedRef.current?.()
            }
        }

        renderChart()
    }, [chart, isDark])

    // Add the flow dots once the inline SVG has committed to the DOM.
    useEffect(() => {
        if (useReactFlowView) return
        injectFlowDots(containerRef.current?.querySelector('svg') ?? null)
    }, [svg, useReactFlowView])

    // Same, but for the modal's separate SVG instance (only exists while expanded).
    useEffect(() => {
        if (useReactFlowView || !isExpanded) return
        injectFlowDots(modalContainerRef.current?.querySelector('svg') ?? null)
    }, [svg, isExpanded, useReactFlowView])

    // Prevent background scrolling when a modal is open (expand or source view)
    useEffect(() => {
        if (isExpanded || showSource) {
            document.body.style.overflow = 'hidden'

            // ESC key to close
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    setIsExpanded(false)
                    setShowSource(false)
                }
            }

            window.addEventListener('keydown', handleEscape)
            return () => {
                document.body.style.overflow = ''
                window.removeEventListener('keydown', handleEscape)
            }
        } else {
            document.body.style.overflow = ''
        }
    }, [isExpanded, showSource])

    // Rasterizes whichever diagram (Flow or Classic) is currently visible and
    // writes it to the clipboard. html-to-image handles both plain SVG
    // (Classic) and React Flow's mixed HTML/SVG DOM the same way.
    const handleCopyImage = async () => {
        const container = containerRef.current
        if (!container) return

        setCopyImageState('copying')
        try {
            // The container itself is usually much bigger than the diagram (a
            // flex-centered SVG wrapper, or React Flow's fixed-height canvas
            // after fitView) — crop to the tight bounding box of the actual
            // rendered shapes instead of capturing that whole empty area too.
            const targets = useReactFlowView
                ? Array.from(container.querySelectorAll<HTMLElement>('.react-flow__node, .react-flow__edge'))
                : Array.from(container.querySelectorAll<SVGSVGElement>('svg'))
            await copyDiagramImageToClipboard(container, { targets, backgroundColor: isDark ? '#1e1e1e' : '#f8fafc' })
            setCopyImageState('done')
        } catch (err) {
            console.error('Copy diagram image failed:', err)
            setCopyImageState('error')
        } finally {
            setTimeout(() => setCopyImageState('idle'), 2000)
        }
    }

    const Modal = () => (
        <div className="mermaid-modal-overlay animate-fade-in" onClick={() => setIsExpanded(false)}>
            <div
                className="mermaid-modal-content-zoom"
                onClick={e => e.stopPropagation()}
            >
                {useReactFlowView ? (
                    // React Flow already ships its own pan/zoom/fitView (<Controls/> inside
                    // ReactFlowDiagram/SequenceFlowDiagram) — nesting react-zoom-pan-pinch's
                    // TransformWrapper/TransformComponent around it too caused edges to stop
                    // painting entirely (two independently-transformed absolute/SVG layers;
                    // Chromium computed the inner one's paint bounds as empty). So RF renders
                    // directly here, full-size, with just a close button of its own.
                    <div className="mermaid-rf-modal-wrapper">
                        <button onClick={() => setIsExpanded(false)} title="Close (ESC)" className="mermaid-rf-modal-close">✕</button>
                        {isSequence
                            ? <SequenceFlowDiagram chart={chart} isDark={isDark} id={`${idRef.current}-rf-modal`} onFallback={handleFlowFallback} />
                            : <ReactFlowDiagram chart={chart} isDark={isDark} id={`${idRef.current}-rf-modal`} onFallback={handleFlowFallback} parse={genericParse} />}
                    </div>
                ) : (
                    <TransformWrapper
                        initialScale={1}
                        minScale={0.2}
                        maxScale={8}
                        centerOnInit={true}
                        centerZoomedOut={true}
                        limitToBounds={false}
                        wheel={{
                            step: 0.15
                        }}
                        doubleClick={{
                            mode: "reset"
                        }}
                    >
                        {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                            <>
                                <div className="mermaid-controls">
                                    <button onClick={() => zoomIn()} title="Zoom In (Scroll Up)">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                    <button onClick={() => zoomOut()} title="Zoom Out (Scroll Down)">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                    <button onClick={() => resetTransform()} title="Fit to Screen (Double Click)">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M2 2h5M2 2v5M2 2l5 5M14 14h-5M14 14v-5M14 14l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                    <button onClick={() => centerView(1)} title="Center & Reset">⟲</button>
                                    <div className="divider"></div>
                                    <button onClick={() => setIsExpanded(false)} title="Close (ESC)" className="close-btn">✕</button>
                                </div>
                                <TransformComponent wrapperClass="mermaid-transform-wrapper" contentClass="mermaid-transform-content">
                                    <div className="mermaid-svg-wrapper" ref={modalContainerRef} dangerouslySetInnerHTML={{ __html: svg }} />
                                </TransformComponent>
                            </>
                        )}
                    </TransformWrapper>
                )}
            </div>
        </div>
    )

    const SourceModal = () => {
        return (
            <div className="mermaid-modal-overlay animate-fade-in" onClick={() => setShowSource(false)}>
                <div className="mermaid-source-modal" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowSource(false)} title="Close (ESC)" className="mermaid-source-close">✕</button>
                    <div className="mermaid-source-scroll">
                        <CodeBlock language="mermaid" value={chart.trim()} />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="code-block-wrapper">
                <div className="code-header">
                    <span className="lang-tag">mermaid</span>
                    <div className="flex items-center gap-2">
                        {/* Toggle: React Flow (interactive) vs Classic (animated native SVG) */}
                        {hasFlowView && (
                            <button
                                onClick={() => setShowReactFlow(v => !v)}
                                className="px-2 py-1 rounded-md hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-[11px] font-medium"
                                title={showReactFlow ? 'Switch to animated SVG view' : 'Switch to interactive Flow view'}
                            >
                                {/* Label names the mode a click switches TO (matches the tooltip),
                                    not the mode currently showing — otherwise "Flow" reads like a
                                    static badge for the view you're already looking at. */}
                                {showReactFlow ? 'Classic' : 'Flow'}
                            </button>
                        )}
                        {/* Copy diagram as image */}
                        <button
                            onClick={handleCopyImage}
                            className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                            title={copyImageState === 'error' ? 'Copy failed' : 'Copy diagram as image'}
                        >
                            {copyImageState === 'done' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="14" height="14" rx="2" ry="2" /><path d="M7 21h10a2 2 0 0 0 2-2V9" /></svg>
                            )}
                        </button>
                        {/* View Mermaid source */}
                        <button
                            onClick={() => setShowSource(true)}
                            className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                            title="View Mermaid source"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                        </button>
                        {/* Expand Button */}
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                            title="Expand Diagram"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                        </button>
                    </div>
                </div>

                <div
                    className="flex justify-center p-4 rounded-b-lg border border-t-0 border-[var(--border-light)] bg-[var(--bg-tertiary)] dark:bg-[#1e1e1e]"
                    style={{ backgroundColor: isDark ? '#1e1e1e' : '#f8fafc' }}
                >
                    {useReactFlowView ? (
                        <div className="w-full" ref={containerRef}>
                            {isSequence
                                ? <SequenceFlowDiagram chart={chart} isDark={isDark} id={`${idRef.current}-rf`} onFallback={handleFlowFallback} />
                                : <ReactFlowDiagram chart={chart} isDark={isDark} id={`${idRef.current}-rf`} onFallback={handleFlowFallback} parse={genericParse} />}
                        </div>
                    ) : (
                        <div
                            className="overflow-x-auto w-full flex justify-center"
                            ref={containerRef}
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    )}
                </div>
            </div>

            {/* Fullscreen Pan & Zoom Modal via Portal */}
            {isExpanded && createPortal(<Modal />, document.body)}
            {showSource && createPortal(<SourceModal />, document.body)}
        </>
    )
}
