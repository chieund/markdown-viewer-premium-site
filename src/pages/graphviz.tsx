import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../ui/context/ThemeContext';
import { ExamplePageLayout } from '../site/ExamplePageLayout';
import { GRAPHVIZ_PRESETS } from '../site/demoData';
import '../ui/index.css';

const RELATED_PAGES = [
  { href: '/mermaid/', label: 'Mermaid' },
  { href: '/plantuml/', label: 'PlantUML' },
  { href: '/vega/', label: 'Vega-Lite' },
  { href: '/tables/', label: 'Tables & Code' },
];

const HIGHLIGHTS = [
  { title: 'Directed & undirected graphs', desc: 'digraph and graph, both fully supported — arrows for one, plain edges for the other.' },
  { title: 'Clusters & styling', desc: 'Subgraphs, fill colors, node shapes, and layout engines (dot, neato, and more) render exactly as specified.' },
  { title: '.dot, .gv, .graphviz files', desc: 'Standalone DOT files render automatically too, not just fenced code blocks inside Markdown.' },
  { title: 'Entirely offline', desc: 'Powered by the same Graphviz/Viz.js engine bundled for PlantUML — no external image service.' },
];

export function GraphvizPage() {
  return (
    <ExamplePageLayout
      eyebrow="Graphviz / DOT Diagrams"
      title={<>Graphviz <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600">in Markdown</span></>}
      description="Directed graphs, undirected graphs, clustered subgraphs, and tree layouts — written in the DOT language, rendered entirely offline."
      highlights={HIGHLIGHTS}
      presets={GRAPHVIZ_PRESETS}
      relatedPages={RELATED_PAGES}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <GraphvizPage />
    </ThemeProvider>
  </StrictMode>,
);
