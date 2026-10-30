import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import CodeBlock from './CodeBlock'
import { copyDiagramImageToClipboard } from '../utils/copyDiagramImage'
import { renderPlantUml } from '../utils/plantumlEngine'
import { sanitizeDiagramSvg, escapeHtml } from '../utils/sanitizeSvg'
import { useT } from '../i18n/useT'

interface PlantUmlBlockProps {
    source: string
}

export default function PlantUmlBlock({ source }: PlantUmlBlockProps) {
    const t = useT()
    const containerRef = useRef<HTMLDivElement>(null)
    const modalContainerRef = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState('')
    const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
    const [isDark, setIsDark] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [showSource, setShowSource] = useState(false)
    const [copyImageState, setCopyImageState] = useState<'idle' | 'copying' | 'done' | 'error'>('idle')

    // Same "follow data-theme" pattern as MermaidBlock.
    useEffect(() => {
        const checkTheme = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
        checkTheme()
        const observer = new MutationObserver(checkTheme)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        let cancelled = false
        setStatus('loading')
        renderPlantUml(source, isDark)
            .then(html => {
                if (cancelled) return
                setSvg(sanitizeDiagramSvg(html))
                setStatus('ok')
            })
            .catch(err => {
                if (cancelled) return
                const message = err instanceof Error ? err.message : 'Unknown error'
                // A raw internal engine error (not a real syntax-error message from
                // PlantUML itself) usually means the diagram uses a stdlib/sprite
                // set this offline engine doesn't bundle — e.g. `archimate`, AWS,
                // IBM, or material icons all require `!include`-ing a sprite
                // library that @plantuml/core deliberately ships without (its own
                // README: "Heavy optional sprite libraries ... are not bundled
                // here to keep the package small").
                const looksLikeInternalError = /\$jsException|TeaVM|undefined is not|Cannot read propert/i.test(message)
                const hint = looksLikeInternalError
                    ? `<div class="text-xs mt-2 opacity-80">${escapeHtml(t('plantumlSpriteHint'))}</div>`
                    : ''
                setSvg(`
                    <div data-diagram-error class="text-red-400 p-4 border border-red-500 rounded bg-red-50 dark:bg-red-900/20">
                        <div class="font-semibold mb-2">${escapeHtml(t('renderError', { name: 'PlantUML' }))}</div>
                        <div class="text-sm">${escapeHtml(message)}</div>
                        ${hint}
                    </div>
                `)
                setStatus('error')
            })
        return () => { cancelled = true }
    }, [source, isDark, t])

    useEffect(() => {
        if (isExpanded || showSource) {
            document.body.style.overflow = 'hidden'
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

    const handleCopyImage = async () => {
        const container = containerRef.current
        if (!container) return
        setCopyImageState('copying')
        try {
            await copyDiagramImageToClipboard(container, { backgroundColor: isDark ? '#1e1e1e' : '#f8fafc' })
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
            <div className="mermaid-modal-content-zoom" onClick={e => e.stopPropagation()}>
                <TransformWrapper
                    initialScale={1}
                    minScale={0.2}
                    maxScale={8}
                    centerOnInit={true}
                    centerZoomedOut={true}
                    limitToBounds={false}
                    wheel={{ step: 0.15 }}
                    doubleClick={{ mode: 'reset' }}
                >
                    {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                        <>
                            <div className="mermaid-controls">
                                <button onClick={() => zoomIn()} title={t('zoomInScroll')}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                                </button>
                                <button onClick={() => zoomOut()} title={t('zoomOutScroll')}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                                </button>
                                <button onClick={() => resetTransform()} title={t('fitToScreen')}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5M2 2v5M2 2l5 5M14 14h-5M14 14v-5M14 14l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                                </button>
                                <button onClick={() => centerView(1)} title={t('centerReset')}>⟲</button>
                                <div className="divider"></div>
                                <button onClick={() => setIsExpanded(false)} title={t('closeEsc')} className="close-btn">✕</button>
                            </div>
                            <TransformComponent wrapperClass="mermaid-transform-wrapper" contentClass="mermaid-transform-content">
                                <div className="mermaid-svg-wrapper" ref={modalContainerRef} dangerouslySetInnerHTML={{ __html: svg }} />
                            </TransformComponent>
                        </>
                    )}
                </TransformWrapper>
            </div>
        </div>
    )

    const SourceModal = () => (
        <div className="mermaid-modal-overlay animate-fade-in" onClick={() => setShowSource(false)}>
            <div className="mermaid-source-modal" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowSource(false)} title={t('closeEsc')} className="mermaid-source-close">✕</button>
                <div className="mermaid-source-scroll">
                    <CodeBlock language="plantuml" value={source.trim()} />
                </div>
            </div>
        </div>
    )

    return (
        <>
            <div className="code-block-wrapper">
                <div className="code-header">
                    <span className="lang-tag">plantuml</span>
                    <div className="flex items-center gap-2">
                        {status === 'loading' && (
                            <span className="text-[11px] text-[var(--text-secondary)]">{t('rendering')}</span>
                        )}
                        {/* Copy diagram as image */}
                        <button
                            onClick={handleCopyImage}
                            disabled={status !== 'ok'}
                            className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-40 disabled:pointer-events-none"
                            title={copyImageState === 'error' ? t('diagramCopyFailed') : t('copyDiagramImage')}
                        >
                            {copyImageState === 'done' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="14" height="14" rx="2" ry="2" /><path d="M7 21h10a2 2 0 0 0 2-2V9" /></svg>
                            )}
                        </button>
                        {/* View PlantUML source */}
                        <button
                            onClick={() => setShowSource(true)}
                            className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                            title={t('viewSource', { name: 'PlantUML' })}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                        </button>
                        {/* Expand Button */}
                        <button
                            onClick={() => setIsExpanded(true)}
                            disabled={status !== 'ok'}
                            className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-40 disabled:pointer-events-none"
                            title={t('expandDiagram')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                        </button>
                    </div>
                </div>

                <div
                    className="flex justify-center p-4 rounded-b-lg border border-t-0 border-[var(--border-light)] bg-[var(--bg-tertiary)]"
                    style={{ backgroundColor: isDark ? '#1e1e1e' : '#f8fafc' }}
                >
                    {status === 'loading' ? (
                        <div className="py-8 text-sm text-[var(--text-secondary)]">{t('renderingDiagram', { name: 'PlantUML' })}</div>
                    ) : (
                        <div
                            className="plantuml-render-area overflow-x-auto w-full flex justify-center"
                            ref={containerRef}
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    )}
                </div>
            </div>

            {isExpanded && createPortal(<Modal />, document.body)}
            {showSource && createPortal(<SourceModal />, document.body)}
        </>
    )
}
