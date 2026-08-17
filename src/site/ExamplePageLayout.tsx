import type { ReactNode } from 'react';
import { Nav } from './Nav';
import { Footer } from './Footer';
import { DownloadSection } from './DownloadSection';
import { DemoPlayground, type DemoPreset } from './DemoPlayground';

export interface Highlight {
  title: string;
  desc: string;
}

export interface RelatedPage {
  href: string;
  label: string;
}

interface ExamplePageLayoutProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
  highlights: Highlight[];
  presets: DemoPreset[];
  relatedPages: RelatedPage[];
  children?: ReactNode;
}

/** Shared layout for each per-diagram-type example page
 * (src/pages/{mermaid,plantuml,graphviz,vega,tables}.tsx) — a real,
 * separately-built HTML document (see vite.config.ts), not a client route,
 * so it can carry its own <title>/meta description for search engines and
 * link previews instead of everything sharing the home page's. */
export function ExamplePageLayout({ eyebrow, title, description, highlights, presets, relatedPages, children }: ExamplePageLayoutProps) {
  return (
    <div className="bg-[#0f172a] text-white min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
      <Nav demoHref="#demo" />

      {/* Deliberately compact — this header's only job is to say what the
          page is about in one glance before the live demo (the actual
          proof) appears. A tall hero here was pushing the demo below the
          fold on every dedicated example page, which defeated the point of
          giving each diagram type its own page with more room to show it. */}
      <header className="relative pt-24 pb-6 px-6 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="max-w-3xl mx-auto text-center space-y-3 relative z-10">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Markdown Viewer Premium
            </a>
            <span className="text-slate-700">/</span>
            <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
              {eyebrow}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{title}</h1>
          <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">{description}</p>
        </div>
      </header>

      <DemoPlayground presets={presets} title="Try It Live" subtitle="Fully offline, no account, no upload — edit the Markdown on the left." tall />

      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {highlights.map((h) => (
            <div key={h.title} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
              <h3 className="font-bold text-lg mb-2">{h.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {children}

      <section className="py-16 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-6">More Examples</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {relatedPages.map((p) => (
            <a key={p.href} href={p.href} className="px-5 py-2.5 rounded-full text-sm font-bold bg-white/[0.03] border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all">
              {p.label}
            </a>
          ))}
        </div>
      </section>

      <DownloadSection />
      <Footer />
    </div>
  );
}
