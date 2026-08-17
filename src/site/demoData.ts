import type { DemoPreset } from './DemoPlayground';

// The home page shows one quick example per type (a teaser); the full
// breadth for each type lives on its own dedicated page (src/pages/*.tsx) —
// splitting it out both gives each type more room to breathe and gives each
// example its own indexable, non-duplicate-content URL for SEO.
export const HOME_PRESETS: DemoPreset[] = [
  {
    // Mermaid leads — it's the most recognizable, most-searched-for feature,
    // so it's what a first-time visitor sees rendered by default rather
    // than a generic Markdown sample.
    id: 'mermaid',
    label: 'Mermaid',
    content: `# Mermaid Diagrams

\`\`\`mermaid
flowchart TD
    A[Write Markdown] --> B{Contains a diagram fence?}
    B -->|mermaid| C[Mermaid engine]
    B -->|plantuml| D[PlantUML engine]
    B -->|dot / graphviz| E[Graphviz engine]
    B -->|vega / vega-lite| F[Vega engine]
    C & D & E & F --> H[Beautiful Preview]
\`\`\`

[See all 7 Mermaid diagram types →](/mermaid/)
`,
  },
  {
    id: 'basics',
    label: 'Markdown',
    content: `# MD Viewer Premium 💎

### Unleash Your Creativity
Take your writing experience to the next level with the most powerful rendering toolkit available.

> [!TIP]
> You can edit the content on the left side right now! Click "Examples" in the menu above for a full page per diagram type.

- [x] Math Support: $f(x) = \\int_{-\\infty}^{\\infty} e^{-x^2} dx$
- [x] Mermaid, PlantUML, Graphviz & Vega diagrams
- [x] GitHub Alerts

| Platform | Status |
|---|---|
| Chrome | ✅ |
| VS Code | ✅ |
| Desktop | ✅ |
`,
  },
  {
    id: 'plantuml',
    label: 'PlantUML',
    content: `# PlantUML

\`\`\`plantuml
@startuml
actor User
User -> Extension: Open Markdown file
Extension -> Renderer: Parse + render
Renderer --> Extension: SVG diagram
Extension --> User: Beautiful preview
note right of User: Works fully offline
@enduml
\`\`\`

[See 5 more PlantUML diagram types →](/plantuml/)
`,
  },
  {
    id: 'graphviz',
    label: 'Graphviz',
    content: `# Graphviz (DOT)

\`\`\`dot
digraph G {
    rankdir=LR;
    node [shape=box, style="filled,rounded", fontcolor=white];
    Markdown [fillcolor="#38bdf8"];
    Parser [fillcolor="#a78bfa"];
    HTML [fillcolor="#34d399"];
    Markdown -> Parser -> HTML;
}
\`\`\`

[See clustered, undirected & tree layouts →](/graphviz/)
`,
  },
  {
    id: 'vega',
    label: 'Vega-Lite',
    content: `# Vega-Lite Charts

\`\`\`vega-lite
{
  "data": { "values": [
    {"platform": "Chrome", "users": 42},
    {"platform": "VS Code", "users": 68},
    {"platform": "Desktop", "users": 25}
  ]},
  "mark": "bar",
  "encoding": {
    "x": {"field": "platform", "type": "nominal"},
    "y": {"field": "users", "type": "quantitative"}
  }
}
\`\`\`

[See line, scatter & area charts →](/vega/)
`,
  },
  {
    id: 'tables',
    label: 'Tables & Code',
    content: `# Tables, Code & GitHub Flavored Markdown

\`\`\`ts
function greet(name: string): string {
    return \`Hello, \${name}!\`
}
\`\`\`

| Feature | PDF | Word | HTML |
|---|:---:|:---:|:---:|
| Diagrams as images | ✅ | ✅ | — |
| Diagrams as live SVG | — | — | ✅ |

[See task lists, footnotes & more →](/tables/)
`,
  },
];

export const MERMAID_PRESETS: DemoPreset[] = [
  {
    id: 'flowchart',
    label: 'Flowchart',
    content: `\`\`\`mermaid
flowchart TD
    A[Write Markdown] --> B{Contains a diagram fence?}
    B -->|mermaid| C[Mermaid engine]
    B -->|plantuml| D[PlantUML engine]
    B -->|dot / graphviz| E[Graphviz engine]
    B -->|vega / vega-lite| F[Vega engine]
    B -->|No| G[Render as text]
    C & D & E & F --> H[Beautiful Preview]
\`\`\`
`,
  },
  {
    id: 'sequence',
    label: 'Sequence',
    content: `\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant Ext as Extension
    participant R as Renderer
    U->>Ext: Open .md file
    activate Ext
    Ext->>R: Parse + render content
    activate R
    R-->>Ext: Rendered HTML + SVG
    deactivate R
    Ext-->>U: Show live preview
    deactivate Ext
\`\`\`
`,
  },
  {
    id: 'state',
    label: 'State',
    content: `\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Rendering: file opened
    Rendering --> Preview: success
    Rendering --> Error: syntax error
    Error --> Rendering: retry
    Preview --> [*]
\`\`\`
`,
  },
  {
    id: 'class',
    label: 'Class',
    content: `\`\`\`mermaid
classDiagram
    class RenderEngine {
        <<abstract>>
        +render(source) SVG
    }
    class MermaidEngine
    class PlantUmlEngine
    class GraphvizEngine
    RenderEngine <|-- MermaidEngine
    RenderEngine <|-- PlantUmlEngine
    RenderEngine <|-- GraphvizEngine
    class MarkdownContent {
        -engines: RenderEngine[]
        +dispatch(fence) SVG
    }
    MarkdownContent o-- RenderEngine
\`\`\`
`,
  },
  {
    id: 'er',
    label: 'ER Diagram',
    content: `\`\`\`mermaid
erDiagram
    DOCUMENT ||--o{ DIAGRAM : contains
    DIAGRAM ||--|| RENDER_ENGINE : "rendered by"
    DOCUMENT {
        string title
        string content
    }
    DIAGRAM {
        string type
        string source
    }
    RENDER_ENGINE {
        string name
        boolean offline
    }
\`\`\`
`,
  },
  {
    id: 'gantt',
    label: 'Gantt',
    content: `\`\`\`mermaid
gantt
    title Feature Roadmap
    dateFormat YYYY-MM-DD
    section Core
    Mermaid support       :done, a1, 2026-01-01, 30d
    PlantUML support      :done, a2, after a1, 20d
    Graphviz support      :done, a3, after a2, 15d
    Vega support          :done, a4, after a3, 15d
    section Exports
    PDF export            :done, a5, 2026-06-01, 15d
    Word export           :done, a6, after a5, 10d
    HTML export           :done, a7, after a6, 5d
\`\`\`
`,
  },
  {
    id: 'pie',
    label: 'Pie Chart',
    content: `\`\`\`mermaid
pie title Render Engine Usage
    "Mermaid" : 42
    "PlantUML" : 23
    "Graphviz" : 15
    "Vega" : 20
\`\`\`
`,
  },
];

export const PLANTUML_PRESETS: DemoPreset[] = [
  {
    id: 'sequence',
    label: 'Sequence',
    content: `\`\`\`plantuml
@startuml
actor User
participant "Extension" as Ext
participant "Renderer" as Ren
database "Cache" as Cache

User -> Ext: Open Markdown file
activate Ext
Ext -> Cache: Check cached render
alt cache hit
    Cache --> Ext: Cached SVG
else cache miss
    Ext -> Ren: Parse + render
    activate Ren
    Ren --> Ext: SVG diagram
    deactivate Ren
    Ext -> Cache: Store result
end
Ext --> User: Show preview
deactivate Ext
note right of User: Works fully offline
@enduml
\`\`\`
`,
  },
  {
    id: 'class',
    label: 'Class',
    content: `\`\`\`plantuml
@startuml
abstract class RenderEngine {
    +render(source: string): SVG
}
class MermaidEngine
class PlantUmlEngine
class GraphvizEngine
class VegaEngine

RenderEngine <|-- MermaidEngine
RenderEngine <|-- PlantUmlEngine
RenderEngine <|-- GraphvizEngine
RenderEngine <|-- VegaEngine

class MarkdownContent {
    -engines: RenderEngine[]
    +dispatch(fence: CodeFence): SVG
}
MarkdownContent o-- RenderEngine
@enduml
\`\`\`
`,
  },
  {
    id: 'usecase',
    label: 'Use Case',
    content: `\`\`\`plantuml
@startuml
left to right direction
actor "Developer" as dev
actor "Reader" as reader
rectangle "Markdown Viewer Premium" {
  usecase "Write Markdown" as UC1
  usecase "Preview Diagrams" as UC2
  usecase "Export to PDF/Word/HTML" as UC3
  usecase "Read Documentation" as UC4
}
dev --> UC1
dev --> UC2
dev --> UC3
reader --> UC4
@enduml
\`\`\`
`,
  },
  {
    id: 'activity',
    label: 'Activity',
    content: `\`\`\`plantuml
@startuml
start
:Open Markdown file;
if (Contains diagram fence?) then (yes)
  :Detect engine\\n(Mermaid/PlantUML/DOT/Vega);
  :Render diagram;
else (no)
  :Render as plain text;
endif
:Show live preview;
stop
@enduml
\`\`\`
`,
  },
  {
    id: 'component',
    label: 'Component',
    content: `\`\`\`plantuml
@startuml
package "Markdown Viewer Premium" {
  [MarkdownContent] --> [Mermaid Engine]
  [MarkdownContent] --> [PlantUML Engine]
  [MarkdownContent] --> [Graphviz Engine]
  [MarkdownContent] --> [Vega Engine]
}
[Mermaid Engine] --> [SVG Output]
[PlantUML Engine] --> [SVG Output]
[Graphviz Engine] --> [SVG Output]
[Vega Engine] --> [SVG Output]
@enduml
\`\`\`
`,
  },
];

export const GRAPHVIZ_PRESETS: DemoPreset[] = [
  {
    id: 'cluster',
    label: 'Clustered',
    content: `\`\`\`dot
digraph Architecture {
    rankdir=LR;
    fontname="Helvetica";
    node [shape=box, style="filled,rounded", fontname="Helvetica", fontcolor="white"];
    edge [color="#64748b"];

    subgraph cluster_input {
        label="Input";
        style=dashed;
        color="#94a3b8";
        Markdown [fillcolor="#38bdf8"];
    }

    subgraph cluster_engines {
        label="Render Engines";
        style=dashed;
        color="#94a3b8";
        Mermaid [fillcolor="#a78bfa"];
        PlantUML [fillcolor="#a78bfa"];
        Graphviz [fillcolor="#a78bfa"];
        Vega [fillcolor="#a78bfa"];
    }

    Preview [shape=ellipse, fillcolor="#34d399"];

    Markdown -> Mermaid;
    Markdown -> PlantUML;
    Markdown -> Graphviz;
    Markdown -> Vega;
    Mermaid -> Preview;
    PlantUML -> Preview;
    Graphviz -> Preview;
    Vega -> Preview;
}
\`\`\`
`,
  },
  {
    id: 'directed',
    label: 'Directed',
    content: `\`\`\`dot
digraph Simple {
    node [shape=box, style=filled, fillcolor="#38bdf8", fontcolor=white];
    A [label="Source"];
    B [label="Parser"];
    C [label="Renderer"];
    D [label="Diagrams"];
    A -> B -> C;
    B -> D -> C;
}
\`\`\`
`,
  },
  {
    id: 'undirected',
    label: 'Undirected',
    content: `\`\`\`dot
graph Network {
    layout=neato;
    node [shape=circle, style=filled, fillcolor="#a78bfa", fontcolor=white];
    A -- B;
    B -- C;
    C -- A;
    A -- D;
    D -- E;
}
\`\`\`
`,
  },
  {
    id: 'tree',
    label: 'Tree',
    content: `\`\`\`dot
digraph FileTree {
    node [shape=note, style=filled, fillcolor="#f1f5f9", fontcolor="#0f172a"];
    root [label="project/", fillcolor="#38bdf8", fontcolor=white];
    src [label="src/"];
    dist [label="dist/"];
    root -> src;
    root -> dist;
    src -> "App.tsx";
    src -> "index.css";
    dist -> "index.html";
}
\`\`\`
`,
  },
];

export const VEGA_PRESETS: DemoPreset[] = [
  {
    id: 'line',
    label: 'Line Chart',
    content: `\`\`\`vega-lite
{
  "data": { "values": [
    {"platform": "Chrome", "month": "Jan", "users": 32},
    {"platform": "Chrome", "month": "Feb", "users": 42},
    {"platform": "Chrome", "month": "Mar", "users": 51},
    {"platform": "VS Code", "month": "Jan", "users": 58},
    {"platform": "VS Code", "month": "Feb", "users": 63},
    {"platform": "VS Code", "month": "Mar", "users": 71},
    {"platform": "Desktop", "month": "Jan", "users": 15},
    {"platform": "Desktop", "month": "Feb", "users": 19},
    {"platform": "Desktop", "month": "Mar", "users": 25}
  ]},
  "mark": {"type": "line", "point": true},
  "encoding": {
    "x": {"field": "month", "type": "ordinal", "sort": ["Jan", "Feb", "Mar"]},
    "y": {"field": "users", "type": "quantitative", "title": "Active Users"},
    "color": {"field": "platform", "type": "nominal"}
  }
}
\`\`\`
`,
  },
  {
    id: 'bar',
    label: 'Bar Chart',
    content: `\`\`\`vega-lite
{
  "data": { "values": [
    {"feature": "Mermaid", "diagrams": 12},
    {"feature": "PlantUML", "diagrams": 8},
    {"feature": "Graphviz", "diagrams": 5},
    {"feature": "Vega", "diagrams": 6}
  ]},
  "mark": "bar",
  "encoding": {
    "x": {"field": "feature", "type": "nominal"},
    "y": {"field": "diagrams", "type": "quantitative"},
    "color": {"field": "feature", "type": "nominal", "legend": null}
  }
}
\`\`\`
`,
  },
  {
    id: 'scatter',
    label: 'Scatter Plot',
    content: `\`\`\`vega-lite
{
  "data": { "values": [
    {"x": 1, "y": 5, "category": "A"},
    {"x": 2, "y": 8, "category": "A"},
    {"x": 3, "y": 3, "category": "B"},
    {"x": 4, "y": 9, "category": "B"},
    {"x": 5, "y": 6, "category": "A"},
    {"x": 6, "y": 2, "category": "B"}
  ]},
  "mark": "point",
  "encoding": {
    "x": {"field": "x", "type": "quantitative"},
    "y": {"field": "y", "type": "quantitative"},
    "color": {"field": "category", "type": "nominal"},
    "size": {"value": 120}
  }
}
\`\`\`
`,
  },
  {
    id: 'area',
    label: 'Area Chart',
    content: `\`\`\`vega-lite
{
  "data": { "values": [
    {"month": "Jan", "downloads": 120},
    {"month": "Feb", "downloads": 180},
    {"month": "Mar", "downloads": 260},
    {"month": "Apr", "downloads": 310}
  ]},
  "mark": {"type": "area", "line": true, "point": true},
  "encoding": {
    "x": {"field": "month", "type": "ordinal", "sort": ["Jan", "Feb", "Mar", "Apr"]},
    "y": {"field": "downloads", "type": "quantitative"}
  }
}
\`\`\`
`,
  },
];

export const TABLES_PRESETS: DemoPreset[] = [
  {
    id: 'code',
    label: 'Syntax Highlighting',
    content: `# Syntax Highlighting for 100+ Languages

\`\`\`ts
interface Theme {
    name: 'light' | 'dark' | 'sepia' | 'solarized' | 'system'
}

function applyTheme(theme: Theme): void {
    document.documentElement.dataset.theme = theme.name
}
\`\`\`

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"
\`\`\`

\`\`\`go
func main() {
    fmt.Println("Rendered offline, no server round-trip")
}
\`\`\`
`,
  },
  {
    id: 'tables',
    label: 'Tables',
    content: `# Tables with Alignment

| Feature | PDF | Word | HTML |
|:--|:-:|:-:|:-:|
| Diagrams as images | ✅ | ✅ | — |
| Diagrams as live SVG | — | — | ✅ |
| Theme-matched styling | ✅ | — | ✅ |
| Offline generation | ✅ | ✅ | ✅ |

| Platform | Install size | Offline |
|--|--:|:-:|
| Chrome Extension | ~7 MB | ✅ |
| VS Code Extension | ~5 MB | ✅ |
| Desktop App | ~40 MB | ✅ |
`,
  },
  {
    id: 'lists',
    label: 'Lists & Tasks',
    content: `# Lists, Task Lists & Nesting

1. Open a Markdown file
2. Pick a theme
   - Light
   - Dark
   - Sepia
   - Solarized
3. Export when you're done
   1. PDF
   2. Word (.docx)
   3. Standalone HTML

- [x] GitHub Flavored Markdown
- [x] Task lists
- [x] Nested lists
- [ ] ...and yes, this checkbox really renders unchecked
`,
  },
  {
    id: 'alerts',
    label: 'Alerts & Footnotes',
    content: `# GitHub Alerts & Footnotes

> [!NOTE]
> The real app has one-click export to PDF, Word (.docx), and standalone HTML.

> [!TIP]
> Footnotes work too[^1].

> [!IMPORTANT]
> All 5 diagram engines render entirely client-side — nothing is uploaded anywhere.

> [!WARNING]
> Very large PlantUML/Graphviz diagrams can take a moment to lay out — this is the engine, not a network request.

> [!CAUTION]
> The live demo on this page doesn't persist between visits — download the extension for your real notes.

[^1]: Like this one, rendered at the bottom of the document.
`,
  },
];
