import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'
import MarkdownContent from './MarkdownContent'
import TableOfContents from './TableOfContents'
import BackToTop from './BackToTop'
import ScrollProgress from './ScrollProgress'
import { SkeletonLoader } from './SkeletonLoader'
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp'
import { ToastContainer } from './ToastContainer'
import { SearchPanel } from './SearchPanel'
import { useToast } from '../hooks/useToast'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { I18nProvider } from '../i18n/I18nContext'
import type { Locale } from '../i18n/locales'

interface MarkdownViewerProps {
    content: string
    isLoading: boolean
    currentUrl?: string
    isEmbedded?: boolean
    defaultSidebarOpen?: boolean
    onMermaidRenderProgress?: (completed: number, total: number) => void
    /** Editor → Preview: source line to scroll to (e.g. as the user moves
     * the cursor/viewport in a VS Code editor). Bump this on every request,
     * even to the same line — see the effect below for why. */
    scrollToLine?: number
    /** Preview → Editor: fires with the source line currently at the top of
     * the preview viewport as the user scrolls the rendered content. */
    onScrollLine?: (line: number) => void
    /** Host-provided UI language (e.g. VS Code's `markdownViewerPremium.locale`
     * setting). Chrome/Desktop omit this and get browser-locale detection —
     * see I18nProvider. */
    hostLocale?: Locale
}

/** Wraps the actual viewer in I18nProvider so every platform (Chrome,
 * Desktop, VS Code) gets translated chrome for free, without each of their
 * three separate entry points needing to set up i18n themselves. */
export default function MarkdownViewer(props: MarkdownViewerProps) {
    return (
        <I18nProvider hostLocale={props.hostLocale}>
            <MarkdownViewerInner {...props} />
        </I18nProvider>
    )
}

const SIDEBAR_OPEN_KEY = 'mdp-sidebar-open'
const SIDEBAR_WIDTH_KEY = 'mdp-sidebar-width'
const DEFAULT_SIDEBAR_WIDTH = 300
const MIN_SIDEBAR_WIDTH = 220
const MAX_SIDEBAR_WIDTH = 420

function MarkdownViewerInner({ content, isLoading, currentUrl, isEmbedded = false, defaultSidebarOpen, onMermaidRenderProgress, scrollToLine, onScrollLine }: MarkdownViewerProps) {
    const [isRaw, setIsRaw] = useState(false)
    // Remembers the user's own choice across sessions (localStorage) —
    // `defaultSidebarOpen` is a deliberate host override (e.g. an embedding
    // page forcing it closed) and takes priority over that memory, same as
    // it already took priority over the `!isEmbedded` fallback.
    const [sidebarOpen, setSidebarOpenState] = useState(() => {
        if (defaultSidebarOpen !== undefined) return defaultSidebarOpen
        if (typeof window !== 'undefined') {
            const saved = window.localStorage.getItem(SIDEBAR_OPEN_KEY)
            if (saved !== null) return saved === 'true'
        }
        return !isEmbedded
    })
    const setSidebarOpen = (open: boolean) => {
        setSidebarOpenState(open)
        if (typeof window !== 'undefined') window.localStorage.setItem(SIDEBAR_OPEN_KEY, String(open))
    }
    const [sidebarWidth, setSidebarWidthState] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY))
            if (Number.isFinite(saved) && saved >= MIN_SIDEBAR_WIDTH && saved <= MAX_SIDEBAR_WIDTH) return saved
        }
        return DEFAULT_SIDEBAR_WIDTH
    })
    const setSidebarWidth = (width: number) => {
        setSidebarWidthState(width)
        if (typeof window !== 'undefined') window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width))
    }
    const sidebarWidthRef = useRef(sidebarWidth)
    useEffect(() => {
        sidebarWidthRef.current = sidebarWidth
    }, [sidebarWidth])
    const [isResizingSidebar, setIsResizingSidebar] = useState(false)
    const handleResizeStart = (e: ReactMouseEvent) => {
        e.preventDefault()
        setIsResizingSidebar(true)
        const onMouseMove = (moveEvent: MouseEvent) => {
            // Sidebar is docked to the right edge, so dragging the handle
            // left (smaller clientX) should widen it.
            const next = Math.round(window.innerWidth - moveEvent.clientX)
            setSidebarWidthState(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, next)))
        }
        const onMouseUp = () => {
            setIsResizingSidebar(false)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            // Persist only the final width, not on every drag frame.
            setSidebarWidth(sidebarWidthRef.current)
        }
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const { toasts, hideToast, success } = useToast()

    // Scroll sync (Editor ↔ Preview). Both directions key off `data-line`
    // attributes that rehypeLineNumbers stamps onto rendered block elements
    // — see that plugin's header for why this needs no separate source map.
    const suppressScrollReportRef = useRef(false)

    useEffect(() => {
        if (typeof scrollToLine !== 'number') return
        const container = scrollContainerRef.current
        if (!container) return

        const lined = Array.from(container.querySelectorAll<HTMLElement>('[data-line]'))
        if (lined.length === 0) return

        // Closest block starting at-or-before the target line; falls back to
        // the very first tagged block if the target is above everything.
        let target = lined[0]
        for (const el of lined) {
            const line = Number(el.dataset.line)
            if (line <= scrollToLine) target = el
            else break
        }

        const containerRect = container.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()
        const offset = targetRect.top - containerRect.top + container.scrollTop

        suppressScrollReportRef.current = true
        // The container has `scroll-smooth` (CSS scroll-behavior: smooth),
        // so a plain `scrollTop =` assignment glides there over many frames
        // — far longer than the one-rAF suppress window below, so most of
        // the animation would leak through as bogus "user scrolled" reports.
        // Force an instant jump by overriding scroll-behavior inline for
        // just this assignment, then hand control back to the CSS class.
        const previousScrollBehavior = container.style.scrollBehavior
        container.style.scrollBehavior = 'auto'
        container.scrollTop = Math.max(0, offset - 24)
        container.style.scrollBehavior = previousScrollBehavior
        requestAnimationFrame(() => {
            suppressScrollReportRef.current = false
        })
        // Re-run on every scrollToLine bump, isRaw excluded (line targeting
        // only applies to the rendered view, but shouldn't re-fire just
        // because the user toggled raw mode and back).
    }, [scrollToLine])

    useEffect(() => {
        if (!onScrollLine) return
        const container = scrollContainerRef.current
        if (!container) return

        // Debounced to fire once ~120ms after the user stops scrolling,
        // rather than every rAF tick during the scroll gesture itself.
        // Reporting on every frame flooded the host with REVEAL_LINE
        // messages during a continuous scroll — each one calls
        // `editor.revealRange()`, and with enough of them in flight the
        // `isRevealingFromPreview` guard (extension.ts) could lose track of
        // which editor-side visible-range change belonged to which reveal,
        // occasionally letting a stale SCROLL_TO_LINE echo back and yank the
        // preview to a line behind where the user had already scrolled to —
        // felt as a stutter/snap-back mid-scroll. Settling on scroll-stop
        // (same UX VS Code's own built-in Markdown preview uses) avoids the
        // flood entirely instead of trying to win the race.
        let debounceTimer: ReturnType<typeof setTimeout> | undefined
        const handleScroll = () => {
            if (suppressScrollReportRef.current) return
            if (debounceTimer) clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => {
                const lined = Array.from(container.querySelectorAll<HTMLElement>('[data-line]'))
                if (lined.length === 0) return

                const containerTop = container.getBoundingClientRect().top
                // Last block whose top has scrolled up past the container's
                // top edge — i.e. the block currently leading the viewport.
                let current = lined[0]
                for (const el of lined) {
                    if (el.getBoundingClientRect().top - containerTop <= 0) current = el
                    else break
                }

                const line = Number(current.dataset.line)
                if (Number.isFinite(line)) onScrollLine(line)
            }, 120)
        }

        container.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            container.removeEventListener('scroll', handleScroll)
            if (debounceTimer) clearTimeout(debounceTimer)
        }
    }, [onScrollLine])

    // Keyboard shortcuts
    useKeyboardShortcuts([
        {
            key: 'k',
            ctrlKey: true,
            callback: () => {
                setSidebarOpen(!sidebarOpen)
                success('Table of Contents toggled')
            },
            description: 'Toggle Table of Contents'
        },
        {
            key: 'd',
            ctrlKey: true,
            callback: () => {
                // Theme toggle is handled in ViewerControls
                const event = new CustomEvent('toggle-theme')
                window.dispatchEvent(event)
            },
            description: 'Toggle Theme'
        },
        {
            key: 'p',
            ctrlKey: true,
            callback: () => {
                window.print()
                success('Opening print dialog...')
            },
            description: 'Print / Export PDF'
        },
        {
            key: '/',
            ctrlKey: true,
            callback: () => {
                setShowShortcuts(!showShortcuts)
            },
            description: 'Show Keyboard Shortcuts'
        },
        {
            key: 'f',
            ctrlKey: true,
            callback: () => {
                setShowSearch(true)
            },
            description: 'Find in Document'
        },
        {
            key: 'Home',
            callback: () => {
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            },
            description: 'Scroll to Top'
        },
        {
            key: 'End',
            callback: () => {
                const container = scrollContainerRef.current
                if (container) {
                    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
                }
            },
            description: 'Scroll to Bottom'
        }
    ])

    return (
        <div className={`${isEmbedded ? 'relative' : 'fixed inset-0'} w-full h-full font-sans scroll-container flex bg-[var(--bg-primary)]`}>
            <ScrollProgress containerRef={scrollContainerRef} />
            <ToastContainer toasts={toasts} onClose={hideToast} sidebarOpen={sidebarOpen} />
            <KeyboardShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
            <SearchPanel isOpen={showSearch} onClose={() => setShowSearch(false)} containerRef={scrollContainerRef} sidebarOpen={sidebarOpen} />

            {/* Loading State with Skeleton */}
            {isLoading && (
                <div className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 z-[200] flex items-center justify-center bg-[var(--bg-primary)]`}>
                    <SkeletonLoader />
                </div>
            )}

            {isRaw ? (
                <div className="flex-1 overflow-auto h-full p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm">
                    <pre className="whitespace-pre-wrap">{content}</pre>
                </div>
            ) : (
                <div className="scroll-content flex-1 overflow-auto h-full scroll-smooth relative" ref={scrollContainerRef}>
                    <div className="viewer-layout">
                        <div className="main-content">
                            <MarkdownContent content={content} currentUrl={currentUrl} onMermaidRenderProgress={onMermaidRenderProgress} />
                        </div>
                    </div>
                    <BackToTop containerRef={scrollContainerRef} sidebarOpen={sidebarOpen} />
                </div>
            )}

            {/* Mobile sidebar toggle button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`${isEmbedded ? 'absolute' : 'fixed'} top-4 right-4 z-[100] md:hidden p-2 rounded-lg bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] shadow-lg`}
                aria-label="Toggle sidebar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {sidebarOpen ? (
                        <path d="M18 6L6 18M6 6l12 12" />
                    ) : (
                        <path d="M3 12h18M3 6h18M3 18h18" />
                    )}
                </svg>
            </button>

            {/* Sidebar - responsive. Mobile slides fully off-screen via
                translate (it's `fixed`, so translate doesn't reflow anything);
                desktop collapses its width to 0 instead so main-content
                reclaims the space, since it's `sticky` and part of the flex row.
                Width is user-resizable and remembered across sessions (see
                sidebarWidth/sidebarOpen state) via CSS custom properties —
                `--sidebar-w` is open-aware (0 when collapsed) for the outer
                box, `--sidebar-content-w` stays at the real width even while
                collapsed so the TOC content doesn't reflow/wrap as the outer
                box shrinks, just gets clipped by its overflow-hidden. */}
            <div
                className={`sidebar-panel
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0
        ${isEmbedded ? 'absolute md:relative' : 'fixed md:sticky'} top-0 right-0 h-full w-full
        md:w-[var(--sidebar-w)] ${sidebarOpen ? 'md:border-l' : 'md:border-l-0'}
        border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]
        overflow-hidden shrink-0 z-[90]
        ${isResizingSidebar ? '' : 'transition-all duration-300 ease-in-out'}
      `}
                style={{
                    '--sidebar-w': sidebarOpen ? `${sidebarWidth}px` : '0px',
                    '--sidebar-content-w': `${sidebarWidth}px`,
                } as CSSProperties}
            >
                {/* Drag handle to resize — desktop only, only when open. */}
                {sidebarOpen && (
                    <div
                        onMouseDown={handleResizeStart}
                        className="hidden md:block absolute left-0 top-0 h-full w-1.5 -ml-px cursor-col-resize z-[10] hover:bg-[var(--accent)] hover:opacity-40"
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize sidebar"
                    />
                )}
                <div className="h-full w-full md:w-[var(--sidebar-content-w)] flex flex-col">
                    <TableOfContents
                        content={content}
                        isRaw={isRaw}
                        onToggleRaw={() => setIsRaw(!isRaw)}
                        containerRef={scrollContainerRef}
                        onShowShortcuts={() => setShowShortcuts(true)}
                    />
                </div>
            </div>

            {/* Desktop collapse/expand handle — docked to the sidebar's left
                edge, follows it as it collapses/expands. */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`hidden md:flex ${isEmbedded ? 'absolute' : 'fixed'} top-1/2 -translate-y-1/2 z-[95] w-5 h-12 items-center justify-center rounded-l-md border border-r-0 border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-[var(--sidebar-text-secondary)] hover:text-[var(--sidebar-text-primary)] shadow-md ${isResizingSidebar ? '' : 'transition-all duration-300 ease-in-out'}`}
                style={{ right: sidebarOpen ? `${sidebarWidth}px` : '0px' }}
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {sidebarOpen ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
                </svg>
            </button>

            {/* Overlay for mobile when sidebar is open */}
            {sidebarOpen && (
                <div
                    className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 bg-black/50 z-[80] md:hidden`}
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    )
}
