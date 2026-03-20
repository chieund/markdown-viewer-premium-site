import { useState, useRef } from 'react'
import MarkdownContent from './MarkdownContent'
import TableOfContents from './TableOfContents'
import BackToTop from './BackToTop'
import ScrollProgress from './ScrollProgress'
import { SkeletonLoader } from './SkeletonLoader'
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp'
import { ToastContainer } from './ToastContainer'
import { useToast } from '../hooks/useToast'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

interface MarkdownViewerProps {
    content: string
    isLoading: boolean
    currentUrl?: string
    isEmbedded?: boolean
}

export default function MarkdownViewer({ content, isLoading, currentUrl, isEmbedded = false }: MarkdownViewerProps) {
    const [isRaw, setIsRaw] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(!isEmbedded) // Hide sidebar by default in embedded mode
    const [showShortcuts, setShowShortcuts] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const { toasts, hideToast, success } = useToast()

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
            <ToastContainer toasts={toasts} onClose={hideToast} />
            <KeyboardShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

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
                <div className="flex-1 overflow-auto h-full scroll-smooth relative" ref={scrollContainerRef}>
                    <div className="viewer-layout">
                        <div className="main-content">
                            <MarkdownContent content={content} currentUrl={currentUrl} />
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

            {/* Sidebar - responsive */}
            <div className={`
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        ${isEmbedded ? 'absolute' : 'fixed md:sticky'} top-0 right-0 h-full w-full md:w-[300px]
        border-l border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]
        overflow-hidden shrink-0 z-[90]
        transition-transform duration-300 ease-in-out
        md:translate-x-0
      `}>
                <div className="h-full flex flex-col">
                    <TableOfContents
                        content={content}
                        isRaw={isRaw}
                        onToggleRaw={() => setIsRaw(!isRaw)}
                        containerRef={scrollContainerRef}
                        onShowShortcuts={() => setShowShortcuts(true)}
                    />
                </div>
            </div>

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
