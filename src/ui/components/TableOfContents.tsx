import { useEffect, useState, useMemo, useRef, type RefObject } from 'react'
import GithubSlugger from 'github-slugger'
import { ThemeToggle } from './ThemeToggle'
import { useToast } from '../hooks/useToast'

interface OutlineItem {
    id: string
    text: string
    level: number
    slug: string
    children: OutlineItem[]
}

interface OutlineProps {
    content: string
    isRaw: boolean
    onToggleRaw: () => void
    containerRef?: RefObject<HTMLDivElement | null>
    onShowShortcuts?: () => void
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
                style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
                onClick={() => onHeadingClick(item.slug)}
            >
                <span className="outline-item-text">
                    {renderHighlightedText(item.text, searchTerm)}
                </span>
                {isActive && <span className="outline-indicator" />}
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

export default function TableOfContents({ content, isRaw, onToggleRaw, containerRef, onShowShortcuts }: OutlineProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [activeId, setActiveId] = useState<string>('')
    const { success, error } = useToast()

    const outlineTree = useMemo(() => {
        const lines = content.split('\n')
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


    if (!content) return null

    // Export Logic
    const handlePrint = () => {
        window.print()
        success('Opening print dialog...')
    }

    const handleExportDOC = () => {
        try {
            const contentEl = document.querySelector('.markdown-glass')
            if (!contentEl) {
                error('Content not found')
                return
            }
            const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset="utf-8"><title>Export Document</title><style>body { font-family: 'Times New Roman', serif; font-size: 11pt; } table { border-collapse: collapse; width: 100%; } td, th { border: 1px solid #999; padding: 5px; } img { max-width: 100%; }</style></head><body>`
            const postHtml = `</body></html>`
            const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(preHtml + contentEl.innerHTML + postHtml)
            const a = document.createElement('a')
            a.href = url
            a.download = 'document.doc'
            a.click()
            success('Document exported successfully!')
        } catch {
            error('Failed to export document')
        }
    }

    return (
        <div className="flex flex-col h-full bg-[var(--sidebar-bg)]">
            {/* Sticky Header with Combined Controls */}
            <div className="sticky top-0 z-10 bg-[var(--sidebar-bg)] border-b border-[var(--sidebar-border)] shadow-sm flex-shrink-0">
                <div className="p-4 space-y-4">
                    {/* Top Row: Title + Actions */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-text-secondary)]">Outline</h3>

                        <div className="flex items-center gap-1">
                            <ThemeToggle />

                            <div className="w-px h-4 bg-[var(--border-light)] mx-1" />

                            <button onClick={onToggleRaw} className="icon-btn" title={isRaw ? "Preview" : "Raw Source"}>
                                {isRaw ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                )}
                            </button>
                            <button onClick={handlePrint} className="icon-btn" title="Print / PDF">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
                            </button>
                            <button onClick={handleExportDOC} className="icon-btn" title="Export Word">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                            </button>

                            {onShowShortcuts && (
                                <button onClick={onShowShortcuts} className="icon-btn" title="Keyboard Shortcuts">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-2.5 text-[var(--sidebar-text-secondary)] group-focus-within:text-[var(--accent)] transition-colors">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            id="outline-search-input"
                            type="text"
                            placeholder="Filter..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-sm bg-[var(--sidebar-bg-secondary)] border border-[var(--sidebar-border)] rounded-md focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none transition-all placeholder-[var(--sidebar-text-secondary)] text-[var(--sidebar-text-primary)]"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-2 text-[var(--sidebar-text-secondary)] hover:text-[var(--sidebar-text-primary)]"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div
                ref={tocScrollRef}
                className="flex-1 overflow-y-auto px-2 py-4 scroll-smooth"
            >
                {filteredOutline.length === 0 ? (
                    <div className="text-sm text-[var(--text-tertiary)] italic py-4 text-center">
                        No sections found
                    </div>
                ) : (
                    <div className="pb-10 space-y-0.5">
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

            {/* Footer removed - controls moved to top */}
        </div>
    )
}