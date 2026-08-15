/**
 * Mermaid sequenceDiagram syntax parser → React Flow nodes + edges.
 * Supports: participant/actor, messages (solid/dashed, arrowheads),
 * Note over/left/right, activate/deactivate (+/- shorthand).
 * Skipped: loop/alt/opt/par/critical/break blocks (content still parsed).
 */

import { MarkerType, type Node, type Edge } from '@xyflow/react'

export function isSupportedSequence(chart: string): boolean {
    return /^sequenceDiagram\b/i.test(chart.trim())
}

export interface SequenceActor {
    id: string
    label: string
}

export type SequenceArrow = 'solid' | 'dashed'
export type SequenceArrowHead = 'closed' | 'open' | 'cross' | 'none'

export interface SequenceMessage {
    kind: 'message'
    from: string
    to: string
    text: string
    arrow: SequenceArrow
    head: SequenceArrowHead
    activateTarget?: boolean
    deactivateTarget?: boolean
}

export interface SequenceNote {
    kind: 'note'
    actors: string[]
    placement: 'over' | 'left' | 'right'
    text: string
}

export interface SequenceActivation {
    kind: 'activation'
    actor: string
    active: boolean
}

export type SequenceEvent = SequenceMessage | SequenceNote | SequenceActivation

export interface ParsedSequence {
    actors: SequenceActor[]
    events: SequenceEvent[]
}

/** Returns parsed data only when React Flow can render something useful. */
export function tryParseSequence(chart: string): ParsedSequence | null {
    if (!isSupportedSequence(chart)) return null
    try {
        const data = parseMermaidSequence(chart)
        const hasContent =
            data.actors.length > 0 &&
            data.events.some(e => e.kind === 'message' || e.kind === 'note')
        if (!hasContent) return null
        return data
    } catch {
        return null
    }
}

const PARTICIPANT_RE = /^(?:participant|actor)\s+([A-Za-z0-9_]+)(?:\s+as\s+(.+))?$/i
const NOTE_RE = /^Note\s+(over|left of|right of)\s+([A-Za-z0-9_]+(?:\s*,\s*[A-Za-z0-9_]+)?)\s*:\s*(.*)$/i
// A->>B / A-->>B / A->B / A-xB / A--)B with optional +/- activation on target
const MESSAGE_RE = /^([A-Za-z0-9_]+)\s*(-{1,2}(?:>>|>|x|\)))([+-])?\s*([A-Za-z0-9_]+)([+-])?\s*:\s*(.*)$/
const ACTIVATE_RE = /^activate\s+([A-Za-z0-9_]+)$/i
const DEACTIVATE_RE = /^deactivate\s+([A-Za-z0-9_]+)$/i
const BLOCK_OPEN_RE = /^(loop|alt|else|opt|par|and|critical|break|option)\b/i
const SKIP_RE = /^(autonumber|title|box|rect)\b/i

function classifyArrow(token: string): { arrow: SequenceArrow; head: SequenceArrowHead } {
    const dashed = token.startsWith('--')
    if (token.endsWith('>>')) return { arrow: dashed ? 'dashed' : 'solid', head: 'closed' }
    if (token.endsWith('x')) return { arrow: dashed ? 'dashed' : 'solid', head: 'cross' }
    if (token.endsWith(')')) return { arrow: dashed ? 'dashed' : 'solid', head: 'open' }
    return { arrow: dashed ? 'dashed' : 'solid', head: 'none' }
}

export function parseMermaidSequence(chart: string): ParsedSequence {
    const lines = chart.split('\n')
    const actorOrder: string[] = []
    const actorLabels = new Map<string, string>()
    const events: SequenceEvent[] = []

    const ensureActor = (id: string) => {
        if (!actorLabels.has(id)) {
            actorLabels.set(id, id)
            actorOrder.push(id)
        }
    }

    for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim()
        if (!line || line.startsWith('%%')) continue
        line = line.replace(/%%.*$/, '').trim()
        if (!line) continue

        if (/^end\b/i.test(line)) continue
        if (SKIP_RE.test(line) || BLOCK_OPEN_RE.test(line)) continue

        const actMatch = line.match(ACTIVATE_RE)
        if (actMatch) {
            ensureActor(actMatch[1])
            events.push({ kind: 'activation', actor: actMatch[1], active: true })
            continue
        }

        const deactMatch = line.match(DEACTIVATE_RE)
        if (deactMatch) {
            ensureActor(deactMatch[1])
            events.push({ kind: 'activation', actor: deactMatch[1], active: false })
            continue
        }

        const pMatch = line.match(PARTICIPANT_RE)
        if (pMatch) {
            const [, id, alias] = pMatch
            ensureActor(id)
            if (alias) actorLabels.set(id, alias.trim())
            continue
        }

        const nMatch = line.match(NOTE_RE)
        if (nMatch) {
            const [, placementRaw, actorsRaw, text] = nMatch
            const actors = actorsRaw.split(',').map(a => a.trim()).filter(Boolean)
            actors.forEach(ensureActor)
            const placement = placementRaw.toLowerCase().startsWith('left')
                ? 'left'
                : placementRaw.toLowerCase().startsWith('right') ? 'right' : 'over'
            events.push({ kind: 'note', actors, placement, text: text.trim() })
            continue
        }

        const mMatch = line.match(MESSAGE_RE)
        if (mMatch) {
            const [, from, arrowToken, plusMinusBefore, to, plusMinusAfter, text] = mMatch
            ensureActor(from)
            ensureActor(to)
            const { arrow, head } = classifyArrow(arrowToken)
            const flag = plusMinusBefore || plusMinusAfter
            events.push({
                kind: 'message',
                from,
                to,
                text: text.trim(),
                arrow,
                head,
                activateTarget: flag === '+',
                deactivateTarget: flag === '-',
            })
            continue
        }
    }

    const actors: SequenceActor[] = actorOrder.map(id => ({ id, label: actorLabels.get(id) || id }))
    return { actors, events }
}

const ACTOR_GAP_X = 160
const ACTOR_BOX_WIDTH = 120
const HEADER_Y = 50
const ROW_GAP_Y = 60
const ACTIVATION_WIDTH = 14

export function computeSequenceLayout(parsed: ParsedSequence, isDark = false): { nodes: Node[]; edges: Edge[] } {
    const { actors, events } = parsed
    const actorCenterX = new Map<string, number>()
    actors.forEach((a, i) => actorCenterX.set(a.id, i * ACTOR_GAP_X))

    // Count visual rows (activation-only events don't take a row but affect bars)
    const visualEvents = events.filter(e => e.kind !== 'activation')
    const totalHeight = HEADER_Y + Math.max(1, visualEvents.length) * ROW_GAP_Y + 40

    const nodes: Node[] = []
    const edges: Edge[] = []

    actors.forEach(a => {
        const cx = actorCenterX.get(a.id) ?? 0
        nodes.push({
            id: `actor-${a.id}`,
            type: 'sequenceActor',
            position: { x: cx - ACTOR_BOX_WIDTH / 2, y: 0 },
            data: { label: a.label },
            draggable: false,
            selectable: false,
        })
        nodes.push({
            id: `lifeline-${a.id}`,
            type: 'sequenceLifeline',
            position: { x: cx, y: HEADER_Y },
            data: { height: totalHeight - HEADER_Y },
            draggable: false,
            selectable: false,
        })
    })

    // Activation depth per actor over visual timeline
    const depth = new Map<string, number>()
    actors.forEach(a => depth.set(a.id, 0))
    // open segments: actor -> start visual index
    const openSeg = new Map<string, number>()
    type ActBar = { actor: string; fromRow: number; toRow: number }
    const bars: ActBar[] = []

    const bump = (actor: string, delta: number, row: number) => {
        const prev = depth.get(actor) || 0
        if (delta > 0) {
            if (prev === 0) openSeg.set(actor, row)
            depth.set(actor, prev + delta)
        } else if (prev > 0) {
            const next = prev + delta
            depth.set(actor, Math.max(0, next))
            if (next <= 0 && openSeg.has(actor)) {
                bars.push({ actor, fromRow: openSeg.get(actor)!, toRow: row })
                openSeg.delete(actor)
            }
        }
    }

    let visualRow = 0
    events.forEach(ev => {
        if (ev.kind === 'activation') {
            bump(ev.actor, ev.active ? 1 : -1, visualRow)
            return
        }

        if (ev.kind === 'message') {
            if (ev.activateTarget) bump(ev.to, 1, visualRow)
            if (ev.deactivateTarget) bump(ev.to, -1, visualRow + 1)
        }

        visualRow++
    })
    // close remaining
    openSeg.forEach((fromRow, actor) => {
        bars.push({ actor, fromRow, toRow: Math.max(fromRow + 1, visualRow) })
    })

    bars.forEach((bar, i) => {
        const cx = actorCenterX.get(bar.actor) ?? 0
        const y1 = HEADER_Y + bar.fromRow * ROW_GAP_Y + 8
        const y2 = HEADER_Y + bar.toRow * ROW_GAP_Y - 8
        const h = Math.max(20, y2 - y1)
        nodes.push({
            id: `actbar-${i}`,
            type: 'sequenceActivation',
            position: { x: cx - ACTIVATION_WIDTH / 2, y: y1 },
            data: { height: h },
            draggable: false,
            selectable: false,
        })
    })

    visualRow = 0
    events.forEach((ev, i) => {
        if (ev.kind === 'activation') return

        const y = HEADER_Y + visualRow * ROW_GAP_Y + ROW_GAP_Y / 2

        if (ev.kind === 'note') {
            const xs = ev.actors.map(id => actorCenterX.get(id) ?? 0)
            const minX = Math.min(...xs)
            const maxX = Math.max(...xs)
            const width = Math.max(160, maxX - minX + 40)
            const x = ev.placement === 'left' ? minX - width - 20
                : ev.placement === 'right' ? maxX + 20
                    : minX - 20
            nodes.push({
                id: `note-${i}`,
                type: 'sequenceNote',
                position: { x, y: y - 15 },
                data: { text: ev.text, width },
                draggable: false,
                selectable: false,
            })
            visualRow++
            return
        }

        const fromX = actorCenterX.get(ev.from) ?? 0
        const toX = actorCenterX.get(ev.to) ?? 0
        const isSelf = ev.from === ev.to

        nodes.push({
            id: `anchor-from-${i}`,
            type: 'sequenceAnchor',
            position: { x: fromX, y },
            data: {},
            draggable: false,
            selectable: false,
        })
        nodes.push({
            id: `anchor-to-${i}`,
            type: 'sequenceAnchor',
            position: { x: isSelf ? toX + 50 : toX, y: isSelf ? y + 24 : y },
            data: {},
            draggable: false,
            selectable: false,
        })

        const goingRight = isSelf ? true : fromX <= toX
        const color = ev.arrow === 'dashed' ? (isDark ? '#a78bfa' : '#8b5cf6') : (isDark ? '#60a5fa' : '#3b82f6')
        edges.push({
            id: `msg-${i}`,
            source: `anchor-from-${i}`,
            sourceHandle: goingRight ? 'source-right' : 'source-left',
            target: `anchor-to-${i}`,
            targetHandle: goingRight ? 'target-left' : 'target-right',
            type: 'sequenceEdge',
            label: ev.text,
            data: { arrow: ev.arrow, head: ev.head, color },
            markerEnd: ev.head === 'none' ? undefined : {
                type: ev.head === 'open' ? MarkerType.Arrow : MarkerType.ArrowClosed,
                width: 14,
                height: 14,
                color,
            },
        })
        visualRow++
    })

    return { nodes, edges }
}
