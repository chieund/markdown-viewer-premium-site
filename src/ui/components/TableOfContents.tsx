import { useEffect, useState, useMemo, useRef, type RefObject } from 'react'
import GithubSlugger from 'github-slugger'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
import { ToolbarMenu } from './ToolbarMenu'
import { useToast } from '../hooks/useToast'
import { exportMarkdownToHtml } from '../utils/exportHtml'
import { exportMarkdownToPdf } from '../utils/exportPdf'
import { saveBlobAsFile } from '../utils/saveBlobAsFile'
import { toGfm } from '../utils/toGfm'
import { convertGfmToJira, convertGfmToBacklog } from '../utils/gfmToWiki'
import { useI18n } from '../i18n/useI18n'

interface OutlineItem {
    id: string
    text: string
    level: number
    slug: string
    children: OutlineItem[]
}

interface OutlineProps {
    content: string
    /** Decides the source dialect for "Copy as Jira/Backlog" (see toGfm). */
    currentUrl?: string
    isRaw: boolean
    onToggleRaw: () => void
    containerRef?: RefObject<HTMLDivElement | null>
    onShowShortcuts?: () => void
}

/** Tiny file-type label used as the icon in the Export menu. */
function FileBadge({ text }: { text: string }) {
    return <span className="file-badge" aria-hidden="true">{text}</span>
}

function TreeNode({ item, searchTerm, onHeadingClick, activeId }: { item: OutlineItem, searchTerm: string, onHeadingClick: (slug: string) => void, activeId: string }) {
    const hasChildren = item.children.length > 0
    const isActive = activeId === item.slug

    const renderHighlightedText = (text: string, term: string) => {
        if (!term) return text
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        const parts = text.split(regex)

        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === term.toLowerCase()
                        ? <mark key={i} className="outline-highlight">{part}</mark>
                        : part
                )}
            </>
        )
    }

    return (
        <div className="outline-node">
            <div
                id={`toc-item-${item.slug}`}
                className={`outline-item ${isActive ? 'active' : ''}`}
                style={{ paddingLeft: `${(item.level - 1) * 14 + 10}px` }}
                data-level={item.level}
                onClick={() => onHeadingClick(item.slug)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onHeadingClick(item.slug)
                    }
                }}
                role="button"
                tabIndex={0}
                aria-current={isActive ? 'location' : undefined}
            >
                <span className="outline-item-text">
                    {renderHighlightedText(item.text, searchTerm)}
                </span>
            </div>
            {hasChildren && (
                <div className="outline-children">
                    {item.children.map(child => (
                        <TreeNode
                            key={child.id}
                            item={child}
                            searchTerm={searchTerm}
                            onHeadingClick={onHeadingClick}
                            activeId={activeId}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function TableOfContents({ content, currentUrl, isRaw, onToggleRaw, containerRef, onShowShortcuts }: OutlineProps) {
    const { t } = useI18n()
    const [searchTerm, setSearchTerm] = useState('')
    const [activeId, setActiveId] = useState<string>('')
    const { success, error } = useToast()

    const outlineTree = useMemo(() => {
        const lines = content.split(/\r?\n/)
        const stack: OutlineItem[] = []
        const slugger = new GithubSlugger()

        let inCodeBlock = false
        let nodeCounter = 0

        lines.forEach((line) => {
            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock
                return
            }
            if (inCodeBlock) return

            const match = line.match(/^(#{1,6})\s+(.+)$/)
            if (match) {
                const level = match[1].length
                const rawText = match[2]
                const displayText = rawText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
                const slug = slugger.slug(displayText)

                const newNode: OutlineItem = {
                    id: `outline-${nodeCounter++}`,
                    text: displayText,
                    level,
                    slug,
                    children: []
                }

                while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                    stack.pop()
                }

                if (stack.length === 0) {
                    stack.push(newNode)
                } else {
                    stack[stack.length - 1].children.push(newNode)
                }
            }
        })

        return stack
    }, [content])

    const filteredOutline = useMemo(() => {
        if (!searchTerm) return outlineTree

        const filterNodes = (nodes: OutlineItem[]): OutlineItem[] => {
            return nodes.reduce<OutlineItem[]>((acc, node) => {
                const matchesSearch = node.text.toLowerCase().includes(searchTerm.toLowerCase())
                const filteredChildren = filterNodes(node.children)

                if (matchesSearch || filteredChildren.length > 0) {
                    acc.push({
                        ...node,
                        children: filteredChildren.length > 0 ? filteredChildren : []
                    })
                }
                return acc
            }, [])
        }

        return filterNodes(outlineTree)
    }, [outlineTree, searchTerm])

    const tocScrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll TOC to active item
    useEffect(() => {
        if (!activeId || !tocScrollRef.current) return

        const activeElement = document.getElementById(`toc-item-${activeId}`)
        if (activeElement) {
            // Check if element is fully visible in container
            const container = tocScrollRef.current
            const elemRect = activeElement.getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()

            const isVisible = (
                elemRect.top >= containerRect.top &&
                elemRect.bottom <= containerRect.bottom
            )

            if (!isVisible) {
                activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            }
        }
    }, [activeId])

    useEffect(() => {
        const container = containerRef?.current
        if (!container) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id)
                    }
                })
            },
            {
                root: container,
                rootMargin: '0px 0px -40% 0px',
                threshold: 0.5
            }
        )

        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
        headings.forEach((heading) => {
            observer.observe(heading)
        })

        return () => observer.disconnect()
    }, [containerRef])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                const searchInput = document.getElementById('outline-search-input')
                searchInput?.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const scrollToHeading = (slug: string) => {
        setActiveId(slug)
        const el = document.getElementById(slug)
        const container = containerRef?.current

        if (el && container) {
            const containerRect = container.getBoundingClientRect()
            const elementRect = el.getBoundingClientRect()
            const scrollTop = container.scrollTop
            const offset = elementRect.top - containerRect.top + scrollTop - 20

            container.scrollTo({ top: offset, behavior: 'smooth' })
        }
    }


    // Export Logic
    const handlePrint = async () => {
        // Inside a real VS Code webview, window.print() is silently ignored:
        // the webview's outer iframe is sandboxed without `allow-modals`, a
        // platform restriction the extension has no way to lift from its own
        // HTML. Chrome extension / desktop app / plain browser contexts
        // don't have this restriction and get the nicer native print dialog
        // (which also respects the existing @media print stylesheet), so
        // only VS Code needs the client-generated-PDF fallback.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isVSCodeWebview = typeof (window as any).acquireVsCodeApi === 'function'
        if (!isVSCodeWebview) {
            window.print()
            success(t('openingPrint'))
            return
        }

        try {
            const contentEl = document.querySelector<HTMLElement>('.markdown-glass')
            if (!contentEl) {
                error(t('contentNotFound'))
                return
            }
            const blob = await exportMarkdownToPdf(contentEl)
            const saved = await saveBlobAsFile(blob, { filename: 'document.pdf', tauriFilter: { name: 'PDF Document', extensions: ['pdf'] } })
            if (saved) success(t('pdfExported'))
        } catch {
            error(t('pdfExportFailed'))
        }
    }

    const handleExportDOC = async () => {
        try {
            const contentEl = document.querySelector<HTMLElement>('.markdown-glass')
            if (!contentEl) {
                error(t('contentNotFound'))
                return
            }

            // Real OOXML .docx (not an HTML file wearing a .doc extension) —
            // walks the already-rendered DOM; see exportDocx.ts for scope.
            // Lazy: the docx library is only needed when someone exports.
            const { exportMarkdownToDocx } = await import('../utils/exportDocx')
            const blob = await exportMarkdownToDocx(contentEl)
            const saved = await saveBlobAsFile(blob, { filename: 'document.docx', tauriFilter: { name: 'Word Document', extensions: ['docx'] } })
            if (saved) success(t('docxExported'))
        } catch {
            error(t('docxExportFailed'))
        }
    }

    const handleExportHtml = async () => {
        try {
            const contentEl = document.querySelector<HTMLElement>('.markdown-glass')
            if (!contentEl) {
                error(t('contentNotFound'))
                return
            }

            // Self-contained standalone .html — see exportHtml.ts for scope
            // (same styling/theme as the live preview, images/diagrams inlined).
            const blob = await exportMarkdownToHtml(contentEl)
            const saved = await saveBlobAsFile(blob, { filename: 'document.html', tauriFilter: { name: 'HTML Document', extensions: ['html'] } })
            if (saved) success(t('htmlExported'))
        } catch {
            error(t('htmlExportFailed'))
        }
    }

    const handleCopyAs = async (dialect: 'jira' | 'backlog') => {
        const gfm = toGfm(content, currentUrl)
        const markup = dialect === 'jira' ? convertGfmToJira(gfm) : convertGfmToBacklog(gfm)
        try {
            await navigator.clipboard.writeText(markup)
            success(t(dialect === 'jira' ? 'copiedAsJira' : 'copiedAsBacklog'))
        } catch {
            error(t('copyFailed'))
        }
    }

    // Ctrl+P (MarkdownViewer's shortcut) asks for the same export as the
    // toolbar item. Ref so the listener always calls the latest handler.
    const handlePrintRef = useRef(handlePrint)
    useEffect(() => {
        handlePrintRef.current = handlePrint
    })
    useEffect(() => {
        const onExportPdf = () => { void handlePrintRef.current() }
        window.addEventListener('export-pdf', onExportPdf)
        return () => window.removeEventListener('export-pdf', onExportPdf)
    }, [])

    if (!content) return null

    return (
        <div className="flex flex-col h-full bg-[var(--sidebar-bg)]">
            {/* Header: title + toolbar, then the heading filter. The three
                export formats share one menu so the toolbar fits the
                sidebar's minimum width (220px) without clipping. */}
            <div className="toc-header flex-shrink-0">
                <div className="toc-header-row">
                    <h3 className="toc-header-title">{t('outline')}</h3>

                    <div className="toc-toolbar">
                        <ThemeToggle />
                        <LanguageToggle />

                        <div className="toc-toolbar-divider" aria-hidden="true" />

                        <button onClick={onToggleRaw} className={`icon-btn ${isRaw ? 'is-open' : ''}`} title={isRaw ? t('preview') : t('rawSource')} aria-label={isRaw ? t('preview') : t('rawSource')} aria-pressed={isRaw}>
                            {/* Same "</>" glyph MermaidBlock uses for "View source" —
                                one icon language for "raw/source text" across the app. */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                        </button>

                        <ToolbarMenu
                            label={t('export')}
                            trigger={
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
                            }
                            items={[
                                { key: 'pdf', label: 'PDF', title: t('exportPdf'), icon: <FileBadge text="PDF" />, onSelect: handlePrint },
                                { key: 'docx', label: 'Word', title: t('exportWord'), icon: <FileBadge text="DOC" />, onSelect: handleExportDOC },
                                { key: 'html', label: 'HTML', title: t('exportHtml'), icon: <FileBadge text="HTML" />, onSelect: handleExportHtml },
                                { key: 'jira', label: t('copyAsJira'), title: t('copyAsJira'), icon: <FileBadge text="JIRA" />, onSelect: () => handleCopyAs('jira'), separatorBefore: true },
                                { key: 'backlog', label: t('copyAsBacklog'), title: t('copyAsBacklog'), icon: <FileBadge text="BL" />, onSelect: () => handleCopyAs('backlog') },
                            ]}
                        />

                        {onShowShortcuts && (
                            <button onClick={onShowShortcuts} className="icon-btn" title={t('keyboardShortcuts')} aria-label={t('keyboardShortcuts')}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="toc-filter">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="toc-filter-icon" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        id="outline-search-input"
                        type="text"
                        placeholder={t('filterPlaceholder')}
                        aria-label={t('filterPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="toc-filter-input"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="toc-filter-clear"
                            aria-label={t('clearFilter')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
            </div>

            <div
                ref={tocScrollRef}
                className="toc-tree flex-1 overflow-y-auto scroll-smooth"
            >
                {filteredOutline.length === 0 ? (
                    <div className="toc-empty">
                        {t('noSectionsFound')}
                    </div>
                ) : (
                    <div className="pb-10">
                        {filteredOutline.map(node => (
                            <TreeNode
                                key={node.id}
                                item={node}
                                searchTerm={searchTerm}
                                onHeadingClick={scrollToHeading}
                                activeId={activeId}
                            />
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}