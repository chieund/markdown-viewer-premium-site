import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../ui/context/ThemeContext';
import { ExamplePageLayout } from '../site/ExamplePageLayout';
import { PLANTUML_PRESETS } from '../site/demoData';
import '../ui/index.css';

const RELATED_PAGES = [
  { href: '/mermaid/', label: 'Mermaid' },
  { href: '/graphviz/', label: 'Graphviz' },
  { href: '/vega/', label: 'Vega-Lite' },
  { href: '/tables/', label: 'Tables & Code' },
];

const HIGHLIGHTS = [
  { title: '5 diagram types', desc: 'Sequence, class, use case, activity, and component diagrams — the classic UML toolkit, all in one fence.' },
  { title: 'No PlantUML server needed', desc: 'Most PlantUML integrations round-trip through plantuml.com or a self-hosted server. This renders entirely client-side.' },
  { title: 'Real UML semantics', desc: 'Activation bars, alt/else branches, notes, inheritance arrows, and component ports all render correctly, not approximated.' },
  { title: 'Copy as image, view source', desc: 'Every rendered diagram has a toolbar to copy it as a PNG or inspect the raw PlantUML source, in the extension and desktop app.' },
];

export function PlantUmlPage() {
  return (
    <ExamplePageLayout
      eyebrow="PlantUML Diagrams"
      title={<>PlantUML <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600">in Markdown</span></>}
      description="Sequence, class, use case, activity, and component diagrams — the full UML toolkit, rendered entirely offline with no PlantUML server round-trip."
      highlights={HIGHLIGHTS}
      presets={PLANTUML_PRESETS}
      relatedPages={RELATED_PAGES}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PlantUmlPage />
    </ThemeProvider>
  </StrictMode>,
);
