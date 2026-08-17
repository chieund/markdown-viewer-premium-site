import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../ui/context/ThemeContext';
import { ExamplePageLayout } from '../site/ExamplePageLayout';
import { VEGA_PRESETS } from '../site/demoData';
import '../ui/index.css';

const RELATED_PAGES = [
  { href: '/mermaid/', label: 'Mermaid' },
  { href: '/plantuml/', label: 'PlantUML' },
  { href: '/graphviz/', label: 'Graphviz' },
  { href: '/tables/', label: 'Tables & Code' },
];

const HIGHLIGHTS = [
  { title: 'Real data visualization', desc: 'Not just diagrams — actual charts driven by a JSON data array: line, bar, scatter, area, and more.' },
  { title: 'Vega & Vega-Lite', desc: 'Both the high-level Vega-Lite grammar and the lower-level Vega grammar are supported, in the same fence.' },
  { title: 'Full encoding control', desc: 'Color, size, and shape encodings, sorting, and axis titles all work exactly as the Vega-Lite spec defines.' },
  { title: '.vg, .vl files', desc: 'Standalone Vega/Vega-Lite spec files render automatically too, not just fenced code blocks inside Markdown.' },
];

export function VegaPage() {
  return (
    <ExamplePageLayout
      eyebrow="Vega / Vega-Lite Charts"
      title={<>Vega-Lite Charts <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600">in Markdown</span></>}
      description="Line charts, bar charts, scatter plots, and area charts — driven by real JSON data, rendered client-side with full encoding control."
      highlights={HIGHLIGHTS}
      presets={VEGA_PRESETS}
      relatedPages={RELATED_PAGES}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <VegaPage />
    </ThemeProvider>
  </StrictMode>,
);
