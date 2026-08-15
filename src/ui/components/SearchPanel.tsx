import { useEffect, useRef, useState, type RefObject } from 'react'
import { useI18n } from '../i18n/useI18n'

interface SearchPanelProps {
    isOpen: boolean
    onClose: () => void
    /** The scrollable container that wraps the rendered `.markdown-glass` content. */
    containerRef: RefObject<HTMLDivElement | null>
    sidebarOpen?: boolean
}

interface Match {
    node: Text
    start: number
    end: number
}

const HIGHLIGHT_CLASS = 'search-highlight'
const CURRENT_CLASS = 'search-highlight-current'

function clearHighlights(root: HTMLElement) {
    root.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`).forEach(mark => {
        const parent = mark.parentNode
        if (!parent) return
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark)
        parent.normalize()
    })
}

function findMatches(root: HTMLElement, query: string, caseSensitive: boolean, wholeWord: boolean, useRegex: boolean): Match[] {
    if (!query) return []

    let pattern: string
    if (useRegex) {
        pattern = query
    } else {
        pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
    if (wholeWord) pattern = `\\b${pattern}\\b`

    let regex: RegExp
    try {
        regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi')
    } catch {
        return []
    }

    const matches: Match[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
        const parent = (node as Text).parentElement
        if (parent?.closest('code, pre, script, style, [data-search-ignore]')) continue
        const text = node.textContent
        if (!text) continue

        regex.lastIndex = 0
        let m: RegExpExecArray | null
        while ((m = regex.exec(text))) {
            if (m[0].length === 0) { regex.lastIndex++; continue }
            matches.push({ node: node as Text, start: m.index, end: m.index + m[0].length })
        }
    }
    return matches
}

function applyHighlights(matches: Match[], currentIndex: number) {
    // Group by node so a single node with multiple matches is split once.
    const byNode = new Map<Text, Match[]>()
    for (const m of matches) {
        if (!byNode.has(m.node)) byNode.set(m.node, [])
        byNode.get(m.node)!.push(m)
    }

    const marks: HTMLElement[] = []
    for (const [node, nodeMatches] of byNode) {
        const text = node.textContent || ''
        const parent = node.parentNode
        if (!parent) continue

        nodeMatches.sort((a, b) => a.start - b.start)
        const fragment = document.createDocumentFragment()
        let lastEnd = 0
        for (const m of nodeMatches) {
            if (m.start > lastEnd) fragment.appendChild(document.createTextNode(text.slice(lastEnd, m.start)))
            const mark = document.createElement('mark')
            mark.className = HIGHLIGHT_CLASS
            mark.textContent = text.slice(m.start, m.end)
            fragment.appendChild(mark)
            marks.push(mark)
            lastEnd = m.end
        }
        if (lastEnd < text.length) fragment.appendChild(document.createTextNode(text.slice(lastEnd)))
        parent.replaceChild(fragment, node)
    }

    marks.forEach((mark, i) => {
        if (i === currentIndex) mark.classList.add(CURRENT_CLASS)
    })
    return marks
}

export function SearchPanel({ isOpen, onClose, containerRef, sidebarOpen }: SearchPanelProps) {
    const { t } = useI18n()
    const [query, setQuery] = useState('')
    const [caseSensitive, setCaseSensitive] = useState(false)
    const [wholeWord, setWholeWord] = useState(false)
    const [useRegex, setUseRegex] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [matchCount, setMatchCount] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const marksRef = useRef<HTMLElement[]>([])

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => inputRef.current?.focus())
        }
    }, [isOpen])

    // Re-run the search whenever the query/options change, or the panel
    // (re)opens. Highlights are cleared on close/unmount below.
    useEffect(() => {
        const root = containerRef.current?.querySelector<HTMLElement>('.markdown-glass')
        if (!root) return

        clearHighlights(root)
        marksRef.current = []

        if (!isOpen || !query) {
            setMatchCount(0)
            setCurrentIndex(0)
            return
        }

        const matches = findMatches(root, query, caseSensitive, wholeWord, useRegex)
        setMatchCount(matches.length)
        const safeIndex = matches.length > 0 ? Math.min(currentIndex, matches.length - 1) : 0
        setCurrentIndex(safeIndex)
        marksRef.current = applyHighlights(matches, safeIndex)
        marksRef.current[safeIndex]?.scrollIntoView({ block: 'center' })
        // currentIndex intentionally excluded — changing it (via next/prev) is
        // handled separately below without re-running the whole search.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, query, caseSensitive, wholeWord, useRegex, containerRef])

    useEffect(() => {
        const container = containerRef.current
        return () => {
            const root = container?.querySelector<HTMLElement>('.markdown-glass')
            if (root) clearHighlights(root)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const goTo = (index: number) => {
        const marks = marksRef.current
        if (marks.length === 0) return
        const next = ((index % marks.length) + marks.length) % marks.length
        marks[currentIndex]?.classList.remove(CURRENT_CLASS)
        marks[next]?.classList.add(CURRENT_CLASS)
        marks[next]?.scrollIntoView({ block: 'center' })
        setCurrentIndex(next)
    }

    if (!isOpen) return null

    return (
        <div
            className="search-panel"
            style={{ right: sidebarOpen ? '340px' : '20px' }}
            onKeyDown={e => {
                if (e.key === 'Escape') { e.preventDefault(); onClose() }
                if (e.key === 'Enter') { e.preventDefault(); goTo(e.shiftKey ? currentIndex - 1 : currentIndex + 1) }
            }}
        >
            <div className="search-panel-row">
                <input
                    ref={inputRef}
                    type="text"
                    className="search-panel-input"
                    placeholder={t('searchPlaceholder')}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
                <span className="search-panel-count">{matchCount > 0 ? `${currentIndex + 1}/${matchCount}` : '0/0'}</span>
                <button className="search-panel-btn" title={t('searchPrevMatch')} onClick={() => goTo(currentIndex - 1)}>˄</button>
                <button className="search-panel-btn" title={t('searchNextMatch')} onClick={() => goTo(currentIndex + 1)}>˅</button>
                <button className="search-panel-btn search-panel-close" title={t('searchClose')} onClick={onClose}>✕</button>
            </div>
            <div className="search-panel-options">
                <label title={t('searchCaseSensitive')}>
                    <input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} /> Aa
                </label>
                <label title={t('searchWholeWord')}>
                    <input type="checkbox" checked={wholeWord} onChange={e => setWholeWord(e.target.checked)} /> Ab
                </label>
                <label title={t('searchRegex')}>
                    <input type="checkbox" checked={useRegex} onChange={e => setUseRegex(e.target.checked)} /> .*
                </label>
            </div>
        </div>
    )
}
