import { ThemeProvider } from './ui/context/ThemeContext';
import { Nav } from './site/Nav';
import { Footer } from './site/Footer';
import { DownloadSection } from './site/DownloadSection';
import { DemoPlayground } from './site/DemoPlayground';
import { HOME_PRESETS } from './site/demoData';
import './ui/index.css';

function App() {
  return (
    <ThemeProvider>
      <div className="bg-[#0f172a] text-white min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
        <Nav />

        {/* Hero Section — deliberately compact (was pt-48 pb-24 with an
            8xl headline): that pushed the live demo, the actual proof of
            every claim below, well past the first screenful. Trimmed down
            so "Try It Live" is visible immediately, not after a scroll. */}
        <header className="relative pt-28 pb-8 px-6 overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-cyan-500/10 blur-[120px] rounded-full" />

          <div className="max-w-5xl mx-auto text-center space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Available for Desktop, Chrome & VS Code
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
              The Markdown Viewer{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600">
                Beautiful & Powerful.
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Unleash the power of your documents with Mermaid, PlantUML, Graphviz and Vega diagrams, LaTeX math, and stunning visuals.
            </p>

            {/* Just "Download" here — "Try Live Demo" would have scrolled
                to a section that's now immediately below anyway. */}
            <div className="pt-2">
              <a href="#download" className="inline-block px-8 py-3.5 bg-white text-slate-900 rounded-2xl font-black hover:shadow-2xl hover:shadow-white/10 transition-all hover:-translate-y-1">
                Download Free
              </a>
            </div>
          </div>
        </header>

        {/* Live Demo Section — moved right after the hero (was buried below
            the Features Grid, so first-time visitors never scrolled far
            enough to see the one thing that proves the product's claims),
            and made `tall` for more visual weight — this is the thing that's
            supposed to hook a first-time visitor, not an afterthought.
            Mermaid leads the tab order: it's the most recognizable/dominant
            feature (the thing most people already searched for), so it's
            the first thing rendered rather than a generic Markdown sample.
            Each tab here is a one-example teaser; the full breadth for that
            diagram type lives on its own dedicated page (linked from the
            "Examples" menu and from each teaser's own content) — both for
            more screen space and for per-type SEO-indexable pages. */}
        <DemoPlayground
          presets={HOME_PRESETS}
          subtitle="Pick an example below, or type your own Markdown on the left."
          tall
        />

        {/* Features Grid */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-500">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-8 transform group-hover:rotate-12 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Diagrams & Charts</h3>
              <p className="text-slate-400 leading-relaxed">Mermaid (with an interactive zoom/pan view), PlantUML, Graphviz, and Vega/Vega-Lite charts — all rendered entirely offline. <a href="/mermaid/" className="text-cyan-400 hover:underline">See examples →</a></p>
            </div>

            <div className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-500">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 transform group-hover:-rotate-12 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Stunning Design</h3>
              <p className="text-slate-400 leading-relaxed">Glassmorphism UI with 5 themes — Light, Dark, System, Sepia, and Solarized — plus English & Vietnamese.</p>
            </div>

            <div className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-500">
              <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 mb-8 transform group-hover:rotate-12 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Unified Ecosystem</h3>
              <p className="text-slate-400 leading-relaxed">Seamless experience across VS Code Extension, Chrome Extension, and Desktop App.</p>
            </div>

            <div className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-500">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-8 transform group-hover:rotate-12 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H8a2 2 0 01-2-2V5a2 2 0 012-2h6l6 6v11a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Export Anywhere</h3>
              <p className="text-slate-400 leading-relaxed">One click to export your document as PDF, Word (.docx), or a self-contained standalone HTML file.</p>
            </div>

            <div className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-500">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mb-8 transform group-hover:-rotate-12 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Built for Real Docs</h3>
              <p className="text-slate-400 leading-relaxed">Find-in-preview, a resizable outline sidebar that remembers its state, and full keyboard shortcuts.</p>
            </div>

            <div className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-500">
              <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 mb-8 transform group-hover:rotate-12 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Math & Code</h3>
              <p className="text-slate-400 leading-relaxed">LaTeX math via KaTeX, GitHub-style alerts, and syntax highlighting for 100+ languages. <a href="/tables/" className="text-cyan-400 hover:underline">See examples →</a></p>
            </div>
          </div>
        </section>

        <DownloadSection />
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
