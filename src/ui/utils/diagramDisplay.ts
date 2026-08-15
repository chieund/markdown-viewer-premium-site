/**
 * Single source of truth for which engine renders a Mermaid chart.
 * Mirrors MermaidBlock routing: try flowchart RF → sequence RF → classic SVG.
 */

import {
    computeLayout,
    tryParseFlowchart,
    type FlowData,
} from './mermaidToReactFlow'
import {
    computeSequenceLayout,
    tryParseSequence,
    type ParsedSequence,
} from './mermaidSequenceToReactFlow'
import { tryParseStateDiagram } from './mermaidStateToReactFlow'
import { tryParseClassDiagram } from './mermaidClassToReactFlow'
import { tryParseErDiagram } from './mermaidErToReactFlow'
import type { Node, Edge } from '@xyflow/react'

export type DisplayEngine = 'react-flow-flowchart' | 'react-flow-sequence' | 'react-flow-state' | 'react-flow-class' | 'react-flow-er' | 'classic'

export type DisplayPlan =
    | {
        engine: 'react-flow-flowchart' | 'react-flow-state' | 'react-flow-class' | 'react-flow-er'
        data: FlowData
        layout: { nodes: Node[]; edges: Edge[] }
    }
    | {
        engine: 'react-flow-sequence'
        data: ParsedSequence
        layout: { nodes: Node[]; edges: Edge[] }
    }
    | {
        engine: 'classic'
        data: null
        layout: null
    }

/** Same decision MermaidBlock uses to pick Flow vs Classic. */
export function resolveDisplayPlan(chart: string, isDark = false): DisplayPlan {
    const flow = tryParseFlowchart(chart)
    if (flow) {
        return {
            engine: 'react-flow-flowchart',
            data: flow,
            layout: computeLayout(flow, isDark),
        }
    }

    const seq = tryParseSequence(chart)
    if (seq) {
        return {
            engine: 'react-flow-sequence',
            data: seq,
            layout: computeSequenceLayout(seq, isDark),
        }
    }

    const state = tryParseStateDiagram(chart)
    if (state) {
        return {
            engine: 'react-flow-state',
            data: state,
            layout: computeLayout(state, isDark),
        }
    }

    const klass = tryParseClassDiagram(chart)
    if (klass) {
        return {
            engine: 'react-flow-class',
            data: klass,
            layout: computeLayout(klass, isDark),
        }
    }

    const er = tryParseErDiagram(chart)
    if (er) {
        return {
            engine: 'react-flow-er',
            data: er,
            layout: computeLayout(er, isDark),
        }
    }

    return { engine: 'classic', data: null, layout: null }
}

export function resolveDisplayEngine(chart: string): DisplayEngine {
    return resolveDisplayPlan(chart).engine
}
