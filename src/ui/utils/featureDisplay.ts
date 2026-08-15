/**
 * Pure routing helpers that mirror what MarkdownContent / feature blocks render.
 * Unit tests assert these so marketing claims stay honest:
 * - Mermaid diagrams (flow / sequence / classic families)
 * - Math / LaTeX (KaTeX)
 * - Syntax highlighting (Prism languages + copy)
 */

import katex from 'katex'
import { resolveDisplayEngine, resolveDisplayPlan, type DisplayEngine } from './diagramDisplay'

export type CodeFenceKind = 'mermaid' | 'plantuml' | 'dot' | 'vega' | 'math' | 'code' | 'inline'

/** Fence language tags that route to the PlantUML renderer. */
export const PLANTUML_LANGUAGE_TAGS = ['plantuml', 'puml', 'uml'] as const

/** Fence language tags that route to the Graphviz DOT renderer. */
export const DOT_LANGUAGE_TAGS = ['dot', 'graphviz', 'gv'] as const

/** Fence language tags that route to the Vega/Vega-Lite renderer. */
export const VEGA_LANGUAGE_TAGS = ['vega', 'vega-lite', 'vegalite', 'vl'] as const

export interface CodeFencePlan {
    kind: CodeFenceKind
    /** Prism / fence language tag (code only) */
    language?: string
    /** Mermaid engine when kind === mermaid */
    mermaidEngine?: DisplayEngine
}

/** Same decision tree as MarkdownContent `code` component. */
export function resolveCodeFence(language: string | undefined, raw: string): CodeFencePlan {
    const value = raw.replace(/\n$/, '')
    const lang = (language || '').toLowerCase()

    if (lang === 'mermaid') {
        return {
            kind: 'mermaid',
            mermaidEngine: resolveDisplayEngine(value),
        }
    }

    if ((PLANTUML_LANGUAGE_TAGS as readonly string[]).includes(lang)) {
        return { kind: 'plantuml' }
    }

    if ((DOT_LANGUAGE_TAGS as readonly string[]).includes(lang)) {
        return { kind: 'dot' }
    }

    if ((VEGA_LANGUAGE_TAGS as readonly string[]).includes(lang)) {
        return { kind: 'vega', language: lang === 'vl' || lang === 'vegalite' || lang === 'vega-lite' ? 'vega-lite' : 'vega' }
    }

    if (lang === 'math') {
        return { kind: 'math' }
    }

    if (lang) {
        return { kind: 'code', language: lang }
    }

    const hasNewline = value.includes('\n')
    if (!hasNewline) {
        return { kind: 'inline' }
    }

    return { kind: 'code', language: 'text' }
}

export type MathMode = 'inline' | 'block'

export interface MathRenderResult {
    ok: boolean
    html?: string
    error?: string
}

/** Validate + render LaTeX the same engine KaTeX uses in the app. */
export function renderLatex(formula: string, mode: MathMode = 'block'): MathRenderResult {
    const trimmed = formula.trim()
    if (!trimmed) {
        return { ok: false, error: 'Empty formula' }
    }
    try {
        const html = katex.renderToString(trimmed, {
            throwOnError: true,
            displayMode: mode === 'block',
            strict: 'ignore',
            trust: false,
        })
        if (!html.includes('katex')) {
            return { ok: false, error: 'KaTeX produced no katex markup' }
        }
        return { ok: true, html }
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid LaTeX'
        return { ok: false, error: message }
    }
}

/** Languages we smoke-test for Prism (marketing: 100+; we lock a representative set). */
export const HIGHLIGHT_SMOKE_LANGUAGES = [
    'javascript',
    'typescript',
    'tsx',
    'jsx',
    'python',
    'java',
    'go',
    'rust',
    'c',
    'cpp',
    'csharp',
    'php',
    'ruby',
    'swift',
    'kotlin',
    'scala',
    'sql',
    'bash',
    'shell',
    'json',
    'yaml',
    'markdown',
    'html',
    'css',
    'scss',
    'xml',
    'graphql',
    'dockerfile',
    'diff',
    'plaintext',
    'text',
] as const

export interface HighlightSample {
    language: string
    code: string
    /** Substrings that should appear in highlighted HTML (tokenized or raw) */
    mustInclude: string[]
}

export const HIGHLIGHT_SAMPLES: HighlightSample[] = [
    {
        language: 'javascript',
        code: 'const answer = 42;\nfunction hi() { return answer; }',
        mustInclude: ['const', 'answer', '42', 'function'],
    },
    {
        language: 'typescript',
        code: 'type User = { id: number };\nconst u: User = { id: 1 };',
        mustInclude: ['type', 'User', 'number'],
    },
    {
        language: 'python',
        code: 'def greet(name: str) -> str:\n    return f"hi {name}"',
        mustInclude: ['def', 'greet', 'return'],
    },
    {
        language: 'java',
        code: 'public class Main {\n  public static void main(String[] args) {}\n}',
        mustInclude: ['public', 'class', 'Main'],
    },
    {
        language: 'go',
        code: 'package main\nfunc main() { println("ok") }',
        mustInclude: ['package', 'func', 'main'],
    },
    {
        language: 'rust',
        code: 'fn main() {\n    let x = 1;\n    println!("{x}");\n}',
        mustInclude: ['fn', 'main', 'let'],
    },
    {
        language: 'sql',
        code: 'SELECT id, name FROM users WHERE active = 1;',
        mustInclude: ['SELECT', 'FROM', 'users'],
    },
    {
        language: 'bash',
        code: '#!/usr/bin/env bash\necho "hello"\nexport PATH="$PATH:/usr/local/bin"',
        mustInclude: ['echo', 'export', 'PATH'],
    },
    {
        language: 'json',
        code: '{\n  "name": "mdp",\n  "version": 1\n}',
        mustInclude: ['name', 'mdp', 'version'],
    },
    {
        language: 'yaml',
        code: 'name: mdp\nversion: 1\nfeatures:\n  - mermaid\n  - math',
        mustInclude: ['name', 'mermaid', 'math'],
    },
    {
        language: 'html',
        code: '<div class="box">Hello</div>',
        mustInclude: ['div', 'class', 'Hello'],
    },
    {
        language: 'css',
        code: '.box { color: #fff; display: flex; }',
        mustInclude: ['color', 'display', 'flex'],
    },
    {
        language: 'markdown',
        code: '# Title\n\n- item\n\n`code`',
        mustInclude: ['Title', 'item'],
    },
    {
        language: 'diff',
        code: '--- a/file\n+++ b/file\n-old\n+new',
        mustInclude: ['old', 'new'],
    },
]

export interface MermaidFeatureSample {
    id: string
    claim: string
    chart: string
    engine: DisplayEngine
}

/** Feature samples tied to product copy: flowcharts, sequence, gantt (+ other classics). */
export const MERMAID_FEATURE_SAMPLES: MermaidFeatureSample[] = [
    {
        id: 'flowchart',
        claim: 'flowcharts',
        engine: 'react-flow-flowchart',
        chart: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[Retry]`,
    },
    {
        id: 'sequence',
        claim: 'sequence diagrams',
        engine: 'react-flow-sequence',
        chart: `sequenceDiagram
    participant U as User
    participant API
    U->>API: GET /health
    API-->>U: 200 OK`,
    },
    {
        id: 'gantt',
        claim: 'gantt charts',
        engine: 'classic',
        chart: `gantt
    title Sprint
    dateFormat YYYY-MM-DD
    section Dev
    Feature A :a1, 2024-01-01, 5d
    Feature B :after a1, 3d`,
    },
    {
        id: 'class',
        claim: 'class diagrams',
        engine: 'react-flow-class',
        chart: `classDiagram
    class Animal {
        +name: string
    }
    Animal <|-- Dog`,
    },
    {
        id: 'state',
        claim: 'state diagrams',
        engine: 'react-flow-state',
        chart: `stateDiagram-v2
    [*] --> Idle
    Idle --> Running
    Running --> [*]`,
    },
    {
        id: 'pie',
        claim: 'pie charts',
        engine: 'classic',
        chart: `pie title Share
    "A" : 50
    "B" : 50`,
    },
    {
        id: 'er',
        claim: 'ER diagrams',
        engine: 'react-flow-er',
        chart: `erDiagram
    USER ||--o{ ORDER : places`,
    },
    {
        id: 'mindmap',
        claim: 'mindmaps',
        engine: 'classic',
        chart: `mindmap
  root((App))
    UI
    API`,
    },
    {
        id: 'gitGraph',
        claim: 'git graphs',
        engine: 'classic',
        chart: `gitGraph
    commit id: "init"
    branch feature
    checkout feature
    commit id: "wip"`,
    },
    {
        id: 'timeline',
        claim: 'timelines',
        engine: 'classic',
        chart: `timeline
    title Roadmap
    2024 : Alpha
    2025 : GA`,
    },
]

export function assertMermaidDisplayable(chart: string, expectedEngine: DisplayEngine): {
    engine: DisplayEngine
    ok: boolean
    detail: string
} {
    const plan = resolveDisplayPlan(chart)
    if (plan.engine !== expectedEngine) {
        return {
            engine: plan.engine,
            ok: false,
            detail: `expected engine ${expectedEngine}, got ${plan.engine}`,
        }
    }
    if (plan.engine === 'classic') {
        return { engine: plan.engine, ok: true, detail: 'classic SVG path' }
    }
    if (!plan.layout || plan.layout.nodes.length === 0) {
        return { engine: plan.engine, ok: false, detail: 'RF layout empty' }
    }
    if (plan.engine === 'react-flow-flowchart') {
        const nodes = plan.layout.nodes.filter(n => n.type === 'mermaidNode')
        if (nodes.length === 0) return { engine: plan.engine, ok: false, detail: 'no mermaid nodes' }
    }
    if (plan.engine === 'react-flow-sequence') {
        const actors = plan.layout.nodes.filter(n => n.type === 'sequenceActor')
        if (actors.length === 0) return { engine: plan.engine, ok: false, detail: 'no actors' }
        if (plan.layout.edges.length === 0) return { engine: plan.engine, ok: false, detail: 'no messages' }
    }
    return { engine: plan.engine, ok: true, detail: `RF nodes=${plan.layout.nodes.length} edges=${plan.layout.edges.length}` }
}
