import { useEffect, useMemo } from 'react'
import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    Position,
    BaseEdge,
    EdgeLabelRenderer,
    getStraightPath,
    type NodeProps,
    type EdgeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { tryParseSequence, computeSequenceLayout } from '../utils/mermaidSequenceToReactFlow'

function ActorNode({ data }: NodeProps) {
    const { label } = data as { label: string }
    return <div className="mermaid-seq-actor">{String(label)}</div>
}

function LifelineNode({ data }: NodeProps) {
    const { height } = data as { height: number }
    return <div className="mermaid-seq-lifeline" style={{ height }} />
}

function AnchorNode() {
    return (
        <div className="mermaid-seq-anchor">
            <Handle type="target" position={Position.Left} id="target-left" />
            <Handle type="target" position={Position.Right} id="target-right" />
            <Handle type="source" position={Position.Left} id="source-left" />
            <Handle type="source" position={Position.Right} id="source-right" />
        </div>
    )
}

function NoteNode({ data }: NodeProps) {
    const { text, width } = data as { text: string; width: number }
    return <div className="mermaid-seq-note" style={{ width }}>{String(text)}</div>
}

function ActivationNode({ data }: NodeProps) {
    const { height } = data as { height: number }
    return <div className="mermaid-seq-activation" style={{ height }} />
}

function SequenceMessageEdge({
    id, sourceX, sourceY, targetX, targetY, label, data, markerEnd,
}: EdgeProps) {
    const edgeData = (data || {}) as { arrow?: string; color?: string }
    const isDashed = edgeData.arrow === 'dashed'

    const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })
    const length = Math.hypot(targetX - sourceX, targetY - sourceY)
    const duration = Math.min(4, Math.max(0.6, length / 150))

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                className={['mermaid-rf-edge', isDashed ? 'mermaid-rf-edge--dashed' : 'mermaid-rf-edge--solid'].join(' ')}
            />
            <circle
                r="3"
                className="mermaid-flow-dot"
                fill={edgeData.color || '#3b82f6'}
                ref={el => {
                    if (!el) return
                    el.style.setProperty('offset-path', `path("${edgePath}")`)
                    el.style.setProperty('animation-duration', `${duration}s`)
                }}
            />
            {label && (
                <EdgeLabelRenderer>
                    <div
                        className="mermaid-rf-edge-label nodrag nopan"
                        style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
                    >
                        {String(label)}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    )
}

interface SequenceFlowDiagramProps {
    chart: string
    isDark: boolean
    id: string
    onFallback?: () => void
}

const nodeTypes = {
    sequenceActor: ActorNode,
    sequenceLifeline: LifelineNode,
    sequenceAnchor: AnchorNode,
    sequenceNote: NoteNode,
    sequenceActivation: ActivationNode,
}
const edgeTypes = { sequenceEdge: SequenceMessageEdge }

export default function SequenceFlowDiagram({ chart, isDark, id, onFallback }: SequenceFlowDiagramProps) {
    const { nodes, edges, height, failed } = useMemo(() => {
        const parsed = tryParseSequence(chart)
        if (!parsed) {
            return { nodes: [], edges: [], height: 280, failed: true }
        }
        try {
            const layout = computeSequenceLayout(parsed, isDark)
            const rowCount = Math.max(1, parsed.events.filter(e => e.kind !== 'activation').length)
            return {
                nodes: layout.nodes,
                edges: layout.edges,
                height: Math.min(700, Math.max(280, rowCount * 60 + 120)),
                failed: false,
            }
        } catch {
            return { nodes: [], edges: [], height: 280, failed: true }
        }
    }, [chart, isDark])

    useEffect(() => {
        if (failed) onFallback?.()
    }, [failed, onFallback])

    if (failed) {
        return (
            <div className="mermaid-rf-fallback-hint">
                Flow view unavailable — switching to Classic…
            </div>
        )
    }

    return (
        <div className="mermaid-rf-wrapper" style={{ height, width: '100%' }} data-theme={isDark ? 'dark' : 'light'}>
            <ReactFlow
                id={id}
                nodes={nodes}
                edges={edges}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                attributionPosition="bottom-right"
                proOptions={{ hideAttribution: true }}
                colorMode={isDark ? 'dark' : 'light'}
            >
                <Background color={isDark ? '#475569' : '#94a3b8'} gap={20} size={1} />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    )
}
