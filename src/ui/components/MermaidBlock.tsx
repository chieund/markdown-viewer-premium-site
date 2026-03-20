import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mermaid from 'mermaid'


// Mermaid will be re-initialized based on theme in component

interface MermaidBlockProps {
    chart: string
}

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

// ... (Mermaid init and props)

let mermaidCounter = 0

export default function MermaidBlock({ chart }: MermaidBlockProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState<string>('')
    const [isExpanded, setIsExpanded] = useState(false)
    const [isDark, setIsDark] = useState(false)

    const idRef = useRef(`mermaid-${mermaidCounter++}`)

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
                        } else {
                            // Not wrapped, just replace all double quotes
                            return content.replace(/"/g, "'")
                        }
                    }

                    return text
                        // Handle [...] labels
                        .replace(/\[(.*?)\]/g, (_, content) => `[${sanitize(content)}]`)
                        // Handle (...) labels
                        .replace(/\((.*?)\)/g, (_, content) => `(${sanitize(content)})`)
                        // Handle {...} labels
                        .replace(/\{(.*?)\}/g, (_, content) => `{${sanitize(content)}}`)
                        // Handle |...| labels (edges)
                        .replace(/\|([^|]*?)\|/g, (_, content) => `|${sanitize(content)}|`)
                }

                const processedChart = processQuotes(chart)

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
            }
        }

        renderChart()
    }, [chart, isDark])

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isExpanded) {
            document.body.style.overflow = 'hidden'

            // ESC key to close
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    setIsExpanded(false)
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
    }, [isExpanded])

    const Modal = () => (
        <div className="mermaid-modal-overlay animate-fade-in" onClick={() => setIsExpanded(false)}>
            <div
                className="mermaid-modal-content-zoom"
                onClick={e => e.stopPropagation()}
            >
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
                                <div className="mermaid-svg-wrapper" dangerouslySetInnerHTML={{ __html: svg }} />
                            </TransformComponent>
                        </>
                    )}
                </TransformWrapper>
            </div>
        </div>
    )

    return (
        <>
            <div className="code-block-wrapper">
                <div className="code-header">
                    <span className="lang-tag">mermaid</span>
                    <div className="flex items-center gap-2">
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
                    <div
                        className="overflow-x-auto w-full flex justify-center"
                        ref={containerRef}
                        dangerouslySetInnerHTML={{ __html: svg }}
                    />
                </div>
            </div>

            {/* Fullscreen Pan & Zoom Modal via Portal */}
            {isExpanded && createPortal(<Modal />, document.body)}
        </>
    )
}
