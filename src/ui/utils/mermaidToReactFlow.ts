/**
 * Mermaid flowchart/graph syntax parser → React Flow nodes + edges
 * Supports: flowchart TD/LR/BT/RL, graph, basic subgraph nesting
 */

import { MarkerType, type Node, type Edge } from '@xyflow/react'

export type NodeShape = 'rectangle' | 'rounded' | 'diamond' | 'circle' | 'asymmetric' | 'stadium' | 'stateStart' | 'stateEnd' | 'classBox'
export type EdgeStyle = 'default' | 'thick' | 'dashed' | 'dotted'
export type Direction = 'TB' | 'LR' | 'BT' | 'RL'

export interface ParsedNode {
    id: string
    label: string
    shape: NodeShape
    parentId?: string
}

export interface ParsedSubgraph {
    id: string
    label: string
    parentId?: string
}

export interface ParsedEdge {
    from: string
    to: string
    label?: string
    style: EdgeStyle
    animated: boolean
}

export interface FlowData {
    direction: Direction
    nodes: ParsedNode[]
    edges: ParsedEdge[]
    subgraphs: ParsedSubgraph[]
}

export function isSupportedFlowchart(chart: string): boolean {
    const trimmed = chart.trim()
    return /^(flowchart|graph)\s+(TD|LR|BT|RL|TB|UD)\b/i.test(trimmed)
}

/** Returns parsed data only when React Flow can render something useful. */
export function tryParseFlowchart(chart: string): FlowData | null {
    if (!isSupportedFlowchart(chart)) return null
    try {
        const data = parseMermaidFlowchart(chart)
        if (data.nodes.length === 0) return null
        return data
    } catch {
        return null
    }
}

function stripQuotes(s: string): string {
    const t = s.trim()
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        return t.slice(1, -1).trim()
    }
    return t
}

function parseNodeShape(raw: string): { label: string; shape: NodeShape } {
    const s = raw.trim()

    if (s.startsWith('((') && s.endsWith('))')) {
        return { label: stripQuotes(s.slice(2, -2)), shape: 'circle' }
    }
    if (s.startsWith('([') && s.endsWith('])')) {
        return { label: stripQuotes(s.slice(2, -2)), shape: 'stadium' }
    }
    if (s.startsWith('(') && s.endsWith(')')) {
        return { label: stripQuotes(s.slice(1, -1)), shape: 'rounded' }
    }
    if (s.startsWith('{') && s.endsWith('}')) {
        return { label: stripQuotes(s.slice(1, -1)), shape: 'diamond' }
    }
    if (s.startsWith('>') && s.endsWith(']')) {
        return { label: stripQuotes(s.slice(1, -1)), shape: 'asymmetric' }
    }
    if (s.startsWith('[') && s.endsWith(']')) {
        return { label: stripQuotes(s.slice(1, -1)), shape: 'rectangle' }
    }
    return { label: stripQuotes(s), shape: 'rectangle' }
}

function getEdgeStyle(arrowStr: string): { style: EdgeStyle; animated: boolean } {
    if (arrowStr.includes('==>') || arrowStr.includes('===')) return { style: 'thick', animated: true }
    if (arrowStr.includes('-.-') || arrowStr.includes('-.->')) return { style: 'dashed', animated: true }
    if (arrowStr.includes('...')) return { style: 'dotted', animated: true }
    return { style: 'default', animated: true }
}

// Non-capturing: when embedded in edgePattern, extra captures would shift group indexes.
const NODE_SHAPE_RE = /(?:\[[\s\S]*?\]|\([\s\S]*?\)|\{[\s\S]*?\}|>[\s\S]*?\]|\(\([\s\S]*?\)\)|\(\[[\s\S]*?\]\))?/

function parseNodeDef(token: string): ParsedNode | null {
    // Capture the shape suffix separately (NODE_SHAPE_RE itself is non-capturing for edgePattern).
    const match = token.trim().match(new RegExp(`^([A-Za-z0-9_-]+)(${NODE_SHAPE_RE.source})$`))
    if (!match) return null

    const id = match[1]
    const shapePart = match[2] || ''

    if (shapePart) {
        const { label, shape } = parseNodeShape(shapePart)
        return { id, label: label || id, shape }
    }

    return { id, label: id, shape: 'rectangle' }
}

const SUBGRAPH_RE = /^subgraph\s+(?:([A-Za-z0-9_-]+)\s*)?(?:\[([^\]]*)\]|"([^"]*)"|'([^']*)'|(.+))?$/i
const STYLE_SKIP_RE = /^(classDef|class|linkStyle|style|click|direction)\b/i

export function parseMermaidFlowchart(chart: string): FlowData {
    const lines = chart.split('\n')

    let direction: Direction = 'TB'
    const firstLine = lines[0]?.trim() ?? ''
    const dirMatch = firstLine.match(/(?:flowchart|graph)\s+(TD|LR|BT|RL|TB|UD)/i)
    if (dirMatch) {
        const dir = dirMatch[1].toUpperCase()
        direction = (dir === 'UD' ? 'TB' : dir) as Direction
    }

    const nodesMap = new Map<string, ParsedNode>()
    const edges: ParsedEdge[] = []
    const subgraphs: ParsedSubgraph[] = []
    const subgraphStack: string[] = []
    let subgraphCounter = 0

    // Splits a line on arrow tokens, keeping the arrow itself as a capture (odd indices).
    const ARROW_SPLIT_RE = /((?:--\s+.+?\s*-->?)|(?:(?:==+>?|--+>?|\.\.\.>?|-\.-+>?)(?:\|[^|]*\|)?))/

    const currentParent = () => subgraphStack[subgraphStack.length - 1]

    // Splits "A & B" into ["A", "B"] without breaking on "&" inside a shape/label.
    const splitFanTokens = (segment: string): string[] => {
        const parts: string[] = []
        let depth = 0
        let current = ''
        for (const ch of segment) {
            if (ch === '[' || ch === '(' || ch === '{') depth++
            else if (ch === ']' || ch === ')' || ch === '}') depth = Math.max(0, depth - 1)
            if (ch === '&' && depth === 0) {
                parts.push(current)
                current = ''
            } else {
                current += ch
            }
        }
        parts.push(current)
        return parts.map(p => p.trim()).filter(Boolean)
    }

    const addNode = (token: string) => {
        const parsed = parseNodeDef(token.trim())
        if (!parsed) {
            return token.trim().split(/[[({>]/)[0]
        }

        const parentId = currentParent()
        if (parentId) parsed.parentId = parentId

        if (!nodesMap.has(parsed.id)) {
            nodesMap.set(parsed.id, parsed)
        } else {
            const existing = nodesMap.get(parsed.id)!
            const next: ParsedNode = {
                ...existing,
                parentId: existing.parentId || parsed.parentId,
            }
            if (parsed.label !== parsed.id || existing.label === existing.id) {
                next.label = parsed.label
                next.shape = parsed.shape
            }
            nodesMap.set(parsed.id, next)
        }
        return parsed.id
    }

    for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim()
        if (!line || line.startsWith('%%')) continue

        line = line.replace(/%%.*$/, '').trim()
        if (!line) continue

        if (STYLE_SKIP_RE.test(line)) continue

        if (/^end\b/i.test(line)) {
            subgraphStack.pop()
            continue
        }

        const sgMatch = line.match(SUBGRAPH_RE)
        if (sgMatch) {
            const idPart = sgMatch[1]
            const labelPart = (sgMatch[2] ?? sgMatch[3] ?? sgMatch[4] ?? sgMatch[5] ?? idPart ?? `Group ${++subgraphCounter}`).trim()
            const id = idPart || `sg_${++subgraphCounter}`
            const parentId = currentParent()
            subgraphs.push({ id, label: stripQuotes(labelPart) || id, parentId })
            subgraphStack.push(id)
            continue
        }

        // direction inside subgraph
        const innerDir = line.match(/^direction\s+(TD|LR|BT|RL|TB|UD)\b/i)
        if (innerDir) continue

        // Split on every arrow in the line so chains (A --> B --> C) and fan
        // out/in (A --> B & C, A & B --> C) don't get silently dropped.
        const arrowParts = line.split(ARROW_SPLIT_RE)
        if (arrowParts.length > 1) {
            let leftTokens = splitFanTokens(arrowParts[0])
            if (leftTokens.length === 0) leftTokens = [arrowParts[0].trim()]
            let leftIds = leftTokens.map(addNode)

            for (let seg = 1; seg < arrowParts.length; seg += 2) {
                const arrowStr = arrowParts[seg]
                const rightRaw = arrowParts[seg + 1] ?? ''
                const rightTokens = splitFanTokens(rightRaw)
                if (rightTokens.length === 0) break
                const rightIds = rightTokens.map(addNode)

                let label: string | undefined
                const labelMatch = arrowStr.match(/\|([^|]*)\|/)
                if (labelMatch) {
                    label = stripQuotes(labelMatch[1])
                } else {
                    const labelBetween = arrowStr.match(/^--\s+(.+?)\s*-->?$/)
                    if (labelBetween) label = stripQuotes(labelBetween[1])
                }

                const { style, animated } = getEdgeStyle(arrowStr)
                for (const fromId of leftIds) {
                    for (const toId of rightIds) {
                        edges.push({ from: fromId, to: toId, label, style, animated })
                    }
                }
                leftIds = rightIds
            }
        } else {
            addNode(line)
        }
    }

    return {
        direction,
        nodes: Array.from(nodesMap.values()),
        edges,
        subgraphs,
    }
}

function markerColor(style: EdgeStyle, isDark: boolean): string {
    if (style === 'thick') return isDark ? '#34d399' : '#10b981'
    if (style === 'dashed') return isDark ? '#a78bfa' : '#8b5cf6'
    if (style === 'dotted') return isDark ? '#fbbf24' : '#d97706'
    return isDark ? '#60a5fa' : '#3b82f6'
}

export function computeLayout(data: FlowData, isDark = false): { nodes: Node[]; edges: Edge[] } {
    const { nodes, edges, direction, subgraphs } = data
    const isHorizontal = direction === 'LR' || direction === 'RL'

    const inDegree = new Map<string, number>()
    const adj = new Map<string, string[]>()

    for (const n of nodes) {
        inDegree.set(n.id, 0)
        adj.set(n.id, [])
    }
    for (const e of edges) {
        if (!inDegree.has(e.from)) inDegree.set(e.from, 0)
        if (!inDegree.has(e.to)) inDegree.set(e.to, 0)
        if (!adj.has(e.from)) adj.set(e.from, [])
        adj.get(e.from)!.push(e.to)
        inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1)
    }

    const level = new Map<string, number>()
    const queue: string[] = []
    for (const [id, deg] of inDegree) {
        if (deg === 0) {
            queue.push(id)
            level.set(id, 0)
        }
    }

    // Break cycles: nodes never enqueued keep level 0
    const visited = new Set<string>()
    while (queue.length) {
        const id = queue.shift()!
        if (visited.has(id)) continue
        visited.add(id)
        const currentLevel = level.get(id) || 0
        for (const neighbor of (adj.get(id) || [])) {
            level.set(neighbor, Math.max(level.get(neighbor) || 0, currentLevel + 1))
            const next = (inDegree.get(neighbor) || 1) - 1
            inDegree.set(neighbor, next)
            if (next === 0) queue.push(neighbor)
        }
    }
    for (const n of nodes) {
        if (!level.has(n.id)) level.set(n.id, 0)
    }

    // Layout per subgraph (and root) separately so groups stay compact
    const gapX = isHorizontal ? 180 : 220
    const gapY = isHorizontal ? 90 : 100
    const pad = 40
    const headerH = 36

    const childrenOf = (parentId: string | undefined) =>
        nodes.filter(n => (n.parentId || undefined) === parentId)

    const positions = new Map<string, { x: number; y: number }>()
    const groupSize = new Map<string, { width: number; height: number }>()

    const layoutGroup = (parentId: string | undefined): { width: number; height: number } => {
        const members = childrenOf(parentId)
        const childSubgraphs = subgraphs.filter(s => (s.parentId || undefined) === parentId)

        // Nested subgraphs first
        for (const sg of childSubgraphs) {
            layoutGroup(sg.id)
        }

        const levelGroups = new Map<number, string[]>()
        for (const n of members) {
            const l = level.get(n.id) || 0
            if (!levelGroups.has(l)) levelGroups.set(l, [])
            levelGroups.get(l)!.push(n.id)
        }

        const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b)
        let maxCross = 1
        for (const l of sortedLevels) {
            const group = levelGroups.get(l)!
            maxCross = Math.max(maxCross, group.length)
            for (let i = 0; i < group.length; i++) {
                const total = group.length
                const offset = (i - (total - 1) / 2)
                if (isHorizontal) {
                    positions.set(group[i], { x: l * gapX + pad, y: offset * gapY + pad + headerH })
                } else {
                    positions.set(group[i], { x: offset * gapX + pad, y: l * gapY + pad + headerH })
                }
            }
        }

        // Place nested subgraph boxes after their children have relative coords
        let sgOffset = 0
        for (const sg of childSubgraphs) {
            const size = groupSize.get(sg.id) || { width: 200, height: 120 }
            const baseX = pad + sgOffset
            const baseY = pad + headerH + (sortedLevels.length > 0
                ? (isHorizontal ? maxCross * gapY : sortedLevels.length * gapY) + 20
                : 0)
            // Nested group absolute-within-parent position stored on the group node later
            positions.set(sg.id, { x: baseX, y: baseY })
            sgOffset += size.width + 24
        }

        const allIds = [
            ...members.map(m => m.id),
            ...childSubgraphs.map(s => s.id),
        ]
        if (allIds.length === 0) {
            const empty = { width: 160, height: 80 }
            if (parentId) groupSize.set(parentId, empty)
            return empty
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const id of allIds) {
            const p = positions.get(id) || { x: 0, y: 0 }
            const size = groupSize.get(id) || { width: 140, height: 48 }
            minX = Math.min(minX, p.x)
            minY = Math.min(minY, p.y)
            maxX = Math.max(maxX, p.x + size.width)
            maxY = Math.max(maxY, p.y + size.height)
        }

        const width = Math.max(160, maxX - minX + pad)
        const height = Math.max(80, maxY - minY + pad)

        // Normalize so content starts near pad (root only)
        if (!parentId) {
            for (const id of allIds) {
                const p = positions.get(id)!
                positions.set(id, { x: p.x - minX + (subgraphs.length ? 0 : 0), y: p.y - minY })
            }
        }

        if (parentId) groupSize.set(parentId, { width, height })
        return { width, height }
    }

    layoutGroup(undefined)

    // Estimate node box sizes for root bounding (already used defaults above)
    for (const n of nodes) {
        if (!groupSize.has(n.id)) groupSize.set(n.id, { width: 140, height: 48 })
    }

    const rfNodes: Node[] = []

    // Subgraph group nodes (parents first for React Flow)
    const sortedSubgraphs = [...subgraphs].sort((a, b) => {
        const depth = (s: ParsedSubgraph) => {
            let d = 0
            let p = s.parentId
            while (p) {
                d++
                p = subgraphs.find(x => x.id === p)?.parentId
            }
            return d
        }
        return depth(a) - depth(b)
    })

    for (const sg of sortedSubgraphs) {
        const size = groupSize.get(sg.id) || { width: 200, height: 120 }
        const pos = positions.get(sg.id) || { x: 0, y: 0 }
        rfNodes.push({
            id: sg.id,
            type: 'subgraphGroup',
            position: pos,
            data: { label: sg.label, direction },
            style: { width: size.width, height: size.height },
            ...(sg.parentId ? { parentId: sg.parentId, extent: 'parent' as const } : {}),
        })
    }

    for (const n of nodes) {
        rfNodes.push({
            id: n.id,
            type: 'mermaidNode',
            position: positions.get(n.id) || { x: 0, y: 0 },
            data: { label: n.label, shape: n.shape, direction },
            ...(n.parentId ? { parentId: n.parentId, extent: 'parent' as const } : {}),
        })
    }

    const rfEdges: Edge[] = edges.map((e, i) => ({
        id: `e${i}-${e.from}-${e.to}`,
        source: e.from,
        target: e.to,
        label: e.label,
        type: 'animatedEdge',
        animated: false,
        data: { style: e.style, color: markerColor(e.style, isDark) },
        style: {
            strokeWidth: e.style === 'thick' ? 3 : 1.5,
            ...(e.style === 'dotted' ? { strokeDasharray: '2 4' } : {}),
        },
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
            color: markerColor(e.style, isDark),
        },
    }))

    return { nodes: rfNodes, edges: rfEdges }
}
