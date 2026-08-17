import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../ui/context/ThemeContext';
import { ExamplePageLayout } from '../site/ExamplePageLayout';
import { MERMAID_PRESETS } from '../site/demoData';
import '../ui/index.css';

const RELATED_PAGES = [
  { href: '/plantuml/', label: 'PlantUML' },
  { href: '/graphviz/', label: 'Graphviz' },
  { href: '/vega/', label: 'Vega-Lite' },
  { href: '/tables/', label: 'Tables & Code' },
];

const HIGHLIGHTS = [
  { title: '7 diagram types', desc: 'Flowcharts, sequence diagrams, state machines, class diagrams, ER diagrams, Gantt charts, and pie charts — all in the same fence syntax.' },
  { title: 'Interactive React Flow view', desc: 'Flowcharts and sequence diagrams can toggle into a zoomable, pannable interactive view alongside the classic static SVG.' },
  { title: 'Entirely offline', desc: 'No network round-trip, no external image service — Mermaid renders client-side, in the extension, desktop app, or right here in your browser.' },
  { title: 'Copy as image, view source', desc: 'Every rendered diagram has a toolbar to copy it as a PNG or inspect the raw Mermaid source, in the extension and desktop app.' },
];

export function MermaidPage() {
  return (
    <ExamplePageLayout
      eyebrow="Mermaid Diagrams"
      title={<>Mermaid Diagrams <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600">in Markdown</span></>}
      description="Write flowcharts, sequence diagrams, state machines, class diagrams, ER diagrams, Gantt charts and pie charts directly in a Markdown fence — rendered instantly, entirely offline."
      highlights={HIGHLIGHTS}
      presets={MERMAID_PRESETS}
      relatedPages={RELATED_PAGES}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <MermaidPage />
    </ThemeProvider>
  </StrictMode>,
);
