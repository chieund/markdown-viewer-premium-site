import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../ui/context/ThemeContext';
import { ExamplePageLayout } from '../site/ExamplePageLayout';
import { TABLES_PRESETS } from '../site/demoData';
import '../ui/index.css';

const RELATED_PAGES = [
  { href: '/mermaid/', label: 'Mermaid' },
  { href: '/plantuml/', label: 'PlantUML' },
  { href: '/graphviz/', label: 'Graphviz' },
  { href: '/vega/', label: 'Vega-Lite' },
];

const HIGHLIGHTS = [
  { title: '100+ languages highlighted', desc: 'TypeScript, Python, Go, Rust, and everything in between, with proper syntax coloring per theme.' },
  { title: 'Full GitHub Flavored Markdown', desc: 'Tables with column alignment, task lists, nested lists, and footnotes all render exactly like GitHub.' },
  { title: 'All 5 GitHub alert types', desc: 'NOTE, TIP, IMPORTANT, WARNING, and CAUTION callouts render with their own icon and color.' },
  { title: 'Export-ready', desc: 'Everything on this page — tables, code, task lists — exports cleanly to PDF, Word, or standalone HTML.' },
];

export function TablesPage() {
  return (
    <ExamplePageLayout
      eyebrow="Tables, Code & GFM"
      title={<>Tables, Code & GFM <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600">in Markdown</span></>}
      description="Syntax-highlighted code, aligned tables, task lists, footnotes, and all 5 GitHub alert types — full GitHub Flavored Markdown, rendered beautifully."
      highlights={HIGHLIGHTS}
      presets={TABLES_PRESETS}
      relatedPages={RELATED_PAGES}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TablesPage />
    </ThemeProvider>
  </StrictMode>,
);
