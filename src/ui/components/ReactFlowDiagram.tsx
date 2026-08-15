import { useCallback, useEffect, useMemo } from 'react'
import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    Position,
    useNodesState,
    useEdgesState,
    addEdge,
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type NodeProps,
    type EdgeProps,
    type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { tryParseFlowchart, computeLayout, type FlowData, type NodeShape, type Direction } from '../utils/mermaidToReactFlow'

interface MermaidNodeData {
    label: string
    shape: NodeShape
    direction: Direction
    [key: string]: unknown
}

const HANDLE_POSITIONS: Record<Direction, { target: Position; source: Position }> = {
    TB: { target: Position.Top, source: Position.Bottom },
    BT: { target: Position.Bottom, source: Position.Top },
    LR: { target: Position.Left, source: Position.Right },
    RL: { target: Position.Right, source: Position.Left },
}

function MermaidNode({ data, selected }: NodeProps) {
    const d = data as MermaidNodeData
    const { label, shape, direction } = d
    const handles = HANDLE_POSITIONS[direction] || HANDLE_POSITIONS.TB

    const baseClass = [
        'mermaid-rf-node',
        `mermaid-rf-node--${shape}`,
        selected ? 'mermaid-rf-node--selected' : '',
    ].filter(Boolean).join(' ')

    const lines = label.split(/<br\s*\/?>/i)

    // Class boxes get a UML-style header (class name, underlined) above a
    // left-aligned member list, instead of one centered blob of text.
    const text = shape === 'classBox' && lines.length > 1 ? (
        <span className="mermaid-rf-classbox">
            <span className="mermaid-rf-classbox-header">{lines[0]}</span>
            {lines.slice(1).map((line, i) => (
                <span key={i} className="mermaid-rf-classbox-member">{line}</span>
            ))}
        </span>
    ) : (
        <span>
            {lines.map((line, i) => (
                <span key={i}>
                    {i > 0 && <br />}
                    {line}
                </span>
            ))}
        </span>
    )

    return (
        <div className={baseClass}>
            <Handle type="target" position={handles.target} />
            {shape === 'diamond' && (
                <svg className="mermaid-rf-diamond-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon points="50,2 98,50 50,98 2,50" vectorEffect="non-scaling-stroke" />
                </svg>
            )}
            {text}
            <Handle type="source" position={handles.source} />
        </div>
    )
}

function SubgraphGroupNode({ data }: NodeProps) {
    const { label } = data as { label: string }
    return (
        <div className="mermaid-rf-subgraph">
            <div className="mermaid-rf-subgraph-title">{String(label)}</div>
        </div>
    )
}

function AnimatedEdge({
    id,
    sourceX, sourceY,
    targetX, targetY,
    sourcePosition, targetPosition,
    label,
    data,
    markerEnd,
}: EdgeProps) {
    const edgeData = (data || {}) as { style?: string; color?: string }
    const isDashed = edgeData.style === 'dashed' || edgeData.style === 'dotted'
    const isThick = edgeData.style === 'thick'
    const isDotted = edgeData.style === 'dotted'

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
    })

    const length = Math.hypot(targetX - sourceX, targetY - sourceY)
    const duration = Math.min(4, Math.max(0.6, length / 150))

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                className={[
                    'mermaid-rf-edge',
                    isDashed ? 'mermaid-rf-edge--dashed' : 'mermaid-rf-edge--solid',
                    isThick ? 'mermaid-rf-edge--thick' : '',
                    isDotted ? 'mermaid-rf-edge--dotted' : '',
                ].filter(Boolean).join(' ')}
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
                        style={{
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        }}
                    >
                        {String(label)}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    )
}

interface ReactFlowDiagramProps {
    chart: string
    isDark: boolean
    id: string
    onFallback?: () => void
    /** Which Mermaid family to parse — defaults to flowchart/graph. Any parser
     * that returns the shared FlowData shape (nodes/edges/subgraphs) can plug
     * in here, e.g. stateDiagram, since it lays out and renders identically. */
    parse?: (chart: string) => FlowData | null
}

const nodeTypes = { mermaidNode: MermaidNode, subgraphGroup: SubgraphGroupNode }
const edgeTypes = { animatedEdge: AnimatedEdge }

export default function ReactFlowDiagram({ chart, isDark, id, onFallback, parse = tryParseFlowchart }: ReactFlowDiagramProps) {
    const { initialNodes, initialEdges, failed } = useMemo(() => {
        const parsed = parse(chart)
        if (!parsed) {
            return { initialNodes: [], initialEdges: [], failed: true }
        }
        try {
            const layout = computeLayout(parsed, isDark)
            if (layout.nodes.filter(n => n.type === 'mermaidNode').length === 0) {
                return { initialNodes: [], initialEdges: [], failed: true }
            }
            return { initialNodes: layout.nodes, initialEdges: layout.edges, failed: false }
        } catch {
            return { initialNodes: [], initialEdges: [], failed: true }
        }
    }, [chart, isDark, parse])

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

    useEffect(() => {
        setNodes(initialNodes)
        setEdges(initialEdges)
    }, [initialNodes, initialEdges, setNodes, setEdges])

    useEffect(() => {
        if (failed) onFallback?.()
    }, [failed, onFallback])

    const onConnect = useCallback(
        (params: Connection) => setEdges(eds => addEdge(params, eds)),
        [setEdges]
    )

    if (failed) {
        return (
            <div className="mermaid-rf-fallback-hint">
                Flow view unavailable — switching to Classic…
            </div>
        )
    }

    const nodeCount = nodes.filter(n => n.type === 'mermaidNode').length
    const height = Math.max(320, Math.min(nodeCount * 90 + 80 + (nodes.length > nodeCount ? 80 : 0), 600))

    return (
        <div
            className="mermaid-rf-wrapper"
            style={{ height, width: '100%' }}
            data-theme={isDark ? 'dark' : 'light'}
        >
            <ReactFlow
                id={id}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
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
