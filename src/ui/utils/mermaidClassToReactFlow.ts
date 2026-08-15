/**
 * Mermaid classDiagram syntax parser → the same FlowData shape
 * mermaidToReactFlow.ts uses, reusing its layout/render engine (classes
 * behave like flowchart nodes, relationships like edges).
 *
 * Supports: `class Name { members }` blocks, bare `class Name`, colon member
 * syntax (`Name : +method()`), stereotypes (`<<interface>>`/`<<abstract>>`),
 * relationships (inheritance/composition/aggregation/association/
 * dependency/realization/link), `: label` on relationships, `direction`.
 * Skipped: cardinality annotations (`"1"`/`"many"`) are parsed but dropped
 * (not shown), generics (`~T~`) are kept as literal text in member lines.
 */

import type { FlowData, ParsedNode, ParsedEdge, Direction } from './mermaidToReactFlow'

export function isSupportedClassDiagram(chart: string): boolean {
    return /^\s*classDiagram(-v2)?\b/i.test(chart.trim())
}

/** Returns parsed data only when React Flow can render something useful. */
export function tryParseClassDiagram(chart: string): FlowData | null {
    if (!isSupportedClassDiagram(chart)) return null
    try {
        const data = parseMermaidClassDiagram(chart)
        if (data.nodes.length === 0) return null
        return data
    } catch {
        return null
    }
}

const CLASS_OPEN_RE = /^class\s+([A-Za-z0-9_.]+)\s*\{$/i
const CLASS_BARE_RE = /^class\s+([A-Za-z0-9_.]+)$/i
const CLASS_MEMBER_RE = /^([A-Za-z0-9_.]+)\s*:\s*(.+)$/
const STEREOTYPE_RE = /^<<\s*([A-Za-z]+)\s*>>$/
const SKIP_RE = /^(classDef|style|click)\b/i

// Longer/more specific tokens must come before their shorter substrings
// (e.g. `--|>` before bare `--`) since regex alternation is first-match, not
// longest-match.
const REL_ARROW = '<\\|--|--\\|>|\\*--|--\\*|o--|--o|<\\|\\.\\.|\\.\\.\\|>|<\\.\\.|\\.\\.>|--|\\.\\.'
const REL_RE = new RegExp(
    `^([A-Za-z0-9_.]+)\\s*(?:"[^"]*"\\s*)?(${REL_ARROW})\\s*(?:"[^"]*"\\s*)?([A-Za-z0-9_.]+)\\s*(?::\\s*(.*))?$`
)

function relationLabel(arrow: string): string {
    if (arrow === '<|--' || arrow === '--|>') return 'inherits'
    if (arrow === '*--' || arrow === '--*') return 'composition'
    if (arrow === 'o--' || arrow === '--o') return 'aggregation'
    if (arrow === '<|..' || arrow === '..|>') return 'realizes'
    if (arrow === '<..' || arrow === '..>') return 'depends'
    if (arrow === '..') return 'depends'
    return ''
}

export function parseMermaidClassDiagram(chart: string): FlowData {
    const lines = chart.split('\n')

    let direction: Direction = 'TB'
    const nodesMap = new Map<string, ParsedNode>()
    const memberLines = new Map<string, string[]>()
    const edges: ParsedEdge[] = []

    const ensureClass = (id: string) => {
        if (!nodesMap.has(id)) {
            nodesMap.set(id, { id, label: id, shape: 'classBox' })
            memberLines.set(id, [])
        }
    }

    const addMember = (id: string, text: string) => {
        ensureClass(id)
        memberLines.get(id)!.push(text.trim())
    }

    const rebuildLabel = (id: string) => {
        const members = memberLines.get(id) || []
        // MermaidNode only splits on <br> and renders each segment as plain
        // text (no HTML interpretation), so there's no bold/divider markup
        // here — just the class name followed by one member per line.
        const label = members.length ? `${id}<br/>${members.join('<br/>')}` : id
        const existing = nodesMap.get(id)!
        nodesMap.set(id, { ...existing, label })
    }

    let currentClass: string | null = null

    for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim()
        if (!line || line.startsWith('%%')) continue
        line = line.replace(/%%.*$/, '').trim()
        if (!line) continue

        if (currentClass) {
            if (line === '}') {
                rebuildLabel(currentClass)
                currentClass = null
                continue
            }
            const stereo = line.match(STEREOTYPE_RE)
            if (stereo) {
                addMember(currentClass, `«${stereo[1]}»`)
            } else {
                addMember(currentClass, line)
            }
            continue
        }

        if (SKIP_RE.test(line)) continue

        const dirMatch = line.match(/^direction\s+(TD|LR|BT|RL|TB|UD)\b/i)
        if (dirMatch) {
            const d = dirMatch[1].toUpperCase()
            direction = (d === 'UD' ? 'TB' : d) as Direction
            continue
        }

        const openMatch = line.match(CLASS_OPEN_RE)
        if (openMatch) {
            ensureClass(openMatch[1])
            currentClass = openMatch[1]
            continue
        }

        const bareMatch = line.match(CLASS_BARE_RE)
        if (bareMatch) {
            ensureClass(bareMatch[1])
            continue
        }

        const memberMatch = line.match(CLASS_MEMBER_RE)
        // Only treat as a member line when it isn't a relationship (those also
        // contain ":" for their label suffix, but have a relation arrow first).
        if (memberMatch && !new RegExp(REL_ARROW).test(line)) {
            addMember(memberMatch[1], memberMatch[2])
            rebuildLabel(memberMatch[1])
            continue
        }

        const relMatch = line.match(REL_RE)
        if (relMatch) {
            const [, fromId, arrow, toId, label] = relMatch
            ensureClass(fromId)
            ensureClass(toId)
            edges.push({
                from: fromId,
                to: toId,
                label: label?.trim() || relationLabel(arrow) || undefined,
                style: arrow.includes('..') ? 'dashed' : 'default',
                animated: true,
            })
            continue
        }
    }

    // Members added via colon-syntax rebuild their label immediately; classes
    // that only ever got a `{ ... }` block already rebuilt on `}`. Anything
    // left with the bare id label (no members) is already correct as-is.
    return { direction, nodes: Array.from(nodesMap.values()), edges, subgraphs: [] }
}
