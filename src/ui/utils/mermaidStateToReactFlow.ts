/**
 * Mermaid stateDiagram/stateDiagram-v2 syntax parser → the same FlowData
 * shape mermaidToReactFlow.ts uses, so it can be laid out and rendered by
 * the exact same React Flow engine (states behave like flowchart nodes,
 * transitions like edges, composite states like subgraphs).
 *
 * Supports: simple transitions (+ label), [*] start/end pseudostates,
 * composite/nested states (`state X { ... }`), `state "Label" as id`
 * aliases, `direction`. Skipped: choice/fork/join pseudostates render as a
 * plain state node (no branching diamond semantics), notes are dropped.
 */

import type { FlowData, ParsedNode, ParsedEdge, ParsedSubgraph, Direction, NodeShape } from './mermaidToReactFlow'

export function isSupportedStateDiagram(chart: string): boolean {
    return /^\s*stateDiagram(-v2)?\b/i.test(chart.trim())
}

/** Returns parsed data only when React Flow can render something useful. */
export function tryParseStateDiagram(chart: string): FlowData | null {
    if (!isSupportedStateDiagram(chart)) return null
    try {
        const data = parseMermaidStateDiagram(chart)
        if (data.nodes.length === 0) return null
        return data
    } catch {
        return null
    }
}

const START_ID = '__state_start__'
const END_ID = '__state_end__'

const TRANSITION_RE = /^(\[\*\]|"[^"]*"|[A-Za-z0-9_.]+)\s*-->\s*(\[\*\]|"[^"]*"|[A-Za-z0-9_.]+)\s*(?::\s*(.*))?$/
const ALIAS_RE = /^state\s+"([^"]*)"\s+as\s+([A-Za-z0-9_.]+)$/i
const COMPOSITE_OPEN_RE = /^state\s+(?:"([^"]*)"\s+as\s+)?([A-Za-z0-9_.]+)\s*\{$/i
const PSEUDOSTATE_RE = /^state\s+([A-Za-z0-9_.]+)\s*<<(choice|fork|join)>>$/i
const NOTE_BLOCK_OPEN_RE = /^note\s+(left of|right of)\s+([A-Za-z0-9_.]+)$/i
const NOTE_LINE_RE = /^note\s+(left of|right of)\s+[A-Za-z0-9_.]+\s*:/i
const STATE_DESC_RE = /^([A-Za-z0-9_.]+)\s*:\s*(.*)$/
const SKIP_RE = /^(classDef|class|style|click)\b/i

function stripQuotes(s: string): string {
    const t = s.trim()
    return t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t
}

export function parseMermaidStateDiagram(chart: string): FlowData {
    const lines = chart.split('\n')

    let direction: Direction = 'TB'
    const nodesMap = new Map<string, ParsedNode>()
    const edges: ParsedEdge[] = []
    const subgraphs: ParsedSubgraph[] = []
    const subgraphStack: string[] = []
    const aliasLabels = new Map<string, string>()
    let inNoteBlock = false

    const currentParent = () => subgraphStack[subgraphStack.length - 1]

    const ensureNode = (id: string, label?: string, shape: NodeShape = 'rounded') => {
        const parentId = currentParent()
        const existing = nodesMap.get(id)
        if (!existing) {
            nodesMap.set(id, { id, label: label ?? aliasLabels.get(id) ?? id, shape, parentId })
        } else if (label !== undefined) {
            nodesMap.set(id, { ...existing, label, shape })
        } else if (!existing.parentId && parentId) {
            nodesMap.set(id, { ...existing, parentId })
        }
    }

    const resolvePseudo = (raw: string, isSource: boolean): string => {
        if (raw === '[*]') {
            const id = isSource ? START_ID : END_ID
            ensureNode(id, '', isSource ? 'stateStart' : 'stateEnd')
            return id
        }
        const id = stripQuotes(raw)
        ensureNode(id)
        return id
    }

    for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim()
        if (!line || line.startsWith('%%')) continue
        line = line.replace(/%%.*$/, '').trim()
        if (!line) continue

        if (inNoteBlock) {
            if (/^end note\b/i.test(line)) inNoteBlock = false
            continue
        }

        if (SKIP_RE.test(line)) continue

        const dirMatch = line.match(/^direction\s+(TD|LR|BT|RL|TB|UD)\b/i)
        if (dirMatch) {
            const d = dirMatch[1].toUpperCase()
            direction = (d === 'UD' ? 'TB' : d) as Direction
            continue
        }

        if (/^end\b/i.test(line)) {
            subgraphStack.pop()
            continue
        }

        const compositeMatch = line.match(COMPOSITE_OPEN_RE)
        if (compositeMatch) {
            const [, aliasLabel, id] = compositeMatch
            subgraphs.push({ id, label: aliasLabel || id, parentId: currentParent() })
            subgraphStack.push(id)
            continue
        }

        const aliasMatch = line.match(ALIAS_RE)
        if (aliasMatch) {
            const [, label, id] = aliasMatch
            aliasLabels.set(id, label)
            ensureNode(id, label)
            continue
        }

        if (NOTE_BLOCK_OPEN_RE.test(line)) { inNoteBlock = true; continue }
        if (NOTE_LINE_RE.test(line)) continue

        const pseudoMatch = line.match(PSEUDOSTATE_RE)
        if (pseudoMatch) {
            ensureNode(pseudoMatch[1], pseudoMatch[1], 'diamond')
            continue
        }

        const tMatch = line.match(TRANSITION_RE)
        if (tMatch) {
            const [, fromRaw, toRaw, label] = tMatch
            const fromId = resolvePseudo(fromRaw, true)
            const toId = resolvePseudo(toRaw, false)
            edges.push({ from: fromId, to: toId, label: label?.trim() || undefined, style: 'default', animated: true })
            continue
        }

        const descMatch = line.match(STATE_DESC_RE)
        if (descMatch) {
            const id = descMatch[1]
            ensureNode(id)
            const existing = nodesMap.get(id)!
            const desc = descMatch[2].trim()
            nodesMap.set(id, { ...existing, label: existing.label === id ? `${id}<br/>${desc}` : existing.label })
            continue
        }

        // Bare state declaration on its own line: `StateName` or `"Quoted Name"`
        if (/^"[^"]*"$|^[A-Za-z0-9_.]+$/.test(line)) {
            ensureNode(stripQuotes(line))
        }
    }

    return { direction, nodes: Array.from(nodesMap.values()), edges, subgraphs }
}
