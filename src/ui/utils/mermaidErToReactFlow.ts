/**
 * Mermaid erDiagram syntax parser → the same FlowData shape
 * mermaidToReactFlow.ts uses, reusing its layout/render engine (entities
 * behave like flowchart nodes, relationships like edges).
 *
 * Supports: `Entity { type attr ... }` attribute blocks, bare entity
 * mentions, crow's-foot relationship cardinalities (`||--o{`, `}|..|{`, ...),
 * `: label` on relationships. Cardinality symbols are dropped from the
 * rendered edge (shown as solid vs dashed only) — see relationCardinality().
 */

import type { FlowData, ParsedNode, ParsedEdge } from './mermaidToReactFlow'

export function isSupportedErDiagram(chart: string): boolean {
    return /^\s*erDiagram\b/i.test(chart.trim())
}

/** Returns parsed data only when React Flow can render something useful. */
export function tryParseErDiagram(chart: string): FlowData | null {
    if (!isSupportedErDiagram(chart)) return null
    try {
        const data = parseMermaidErDiagram(chart)
        if (data.nodes.length === 0) return null
        return data
    } catch {
        return null
    }
}

const ENTITY_TOKEN = '[A-Za-z0-9_-]+|"[^"]*"'
const CARD_LEFT = '\\|o|\\|\\||\\}o|\\}\\|'
const CARD_RIGHT = 'o\\||\\|\\||o\\{|\\|\\{'
const REL_ARROW = `(?:${CARD_LEFT})(?:--|\\.\\.)(?:${CARD_RIGHT})`

const ENTITY_OPEN_RE = new RegExp(`^(${ENTITY_TOKEN})\\s*\\{$`)
const REL_RE = new RegExp(`^(${ENTITY_TOKEN})\\s*(${REL_ARROW})\\s*(${ENTITY_TOKEN})\\s*(?::\\s*(.*))?$`)
const SKIP_RE = /^(classDef|style|click)\b/i

function stripQuotes(s: string): string {
    const t = s.trim()
    return t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t
}

export function parseMermaidErDiagram(chart: string): FlowData {
    const lines = chart.split('\n')

    const nodesMap = new Map<string, ParsedNode>()
    const attrLines = new Map<string, string[]>()
    const edges: ParsedEdge[] = []
    let currentEntity: string | null = null

    const ensureEntity = (raw: string): string => {
        const id = stripQuotes(raw)
        if (!nodesMap.has(id)) {
            nodesMap.set(id, { id, label: id, shape: 'classBox' })
            attrLines.set(id, [])
        }
        return id
    }

    const rebuildLabel = (id: string) => {
        const attrs = attrLines.get(id) || []
        const label = attrs.length ? `${id}<br/>${attrs.join('<br/>')}` : id
        const existing = nodesMap.get(id)!
        nodesMap.set(id, { ...existing, label })
    }

    for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim()
        if (!line || line.startsWith('%%')) continue
        line = line.replace(/%%.*$/, '').trim()
        if (!line) continue

        if (currentEntity) {
            if (line === '}') {
                rebuildLabel(currentEntity)
                currentEntity = null
                continue
            }
            attrLines.get(currentEntity)!.push(line)
            continue
        }

        if (SKIP_RE.test(line)) continue

        const openMatch = line.match(ENTITY_OPEN_RE)
        if (openMatch) {
            currentEntity = ensureEntity(openMatch[1])
            continue
        }

        const relMatch = line.match(REL_RE)
        if (relMatch) {
            const [, fromRaw, arrow, toRaw, label] = relMatch
            const fromId = ensureEntity(fromRaw)
            const toId = ensureEntity(toRaw)
            edges.push({
                from: fromId,
                to: toId,
                label: label?.trim() || undefined,
                style: arrow.includes('..') ? 'dashed' : 'default',
                animated: true,
            })
            continue
        }

        // Bare entity mention on its own line (rare, but mirrors flowchart/state).
        if (/^(?:[A-Za-z0-9_-]+|"[^"]*")$/.test(line)) {
            ensureEntity(line)
        }
    }

    return { direction: 'TB', nodes: Array.from(nodesMap.values()), edges, subgraphs: [] }
}
