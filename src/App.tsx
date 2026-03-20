import { useState } from 'react';
import MarkdownContent from './ui/components/MarkdownContent';
import { ThemeProvider } from './ui/context/ThemeContext';
import './ui/index.css';

const DEMO_CONTENT = `# MD Viewer Premium 💎

### Unleash Your Creativity
Take your writing experience to the next level with the most powerful rendering toolkit available.

> [!TIP]
> You can edit the content on the left side right now!

\`\`\`mermaid
graph LR
    IDE[VS Code] --> Plug[Plugin]
    Web[Browser] --> Extension[Extension]
    OS[Desktop] --> App[Native App]
    Plug & Extension & App --> Render[View Premium]
\`\`\`

- [x] Math Support: $f(x) = \\int_{-\\infty}^{\\infty} e^{-x^2} dx$
- [x] Mermaid Diagrams
- [x] GitHub Alerts
`;

function App() {
  const [content, setContent] = useState(DEMO_CONTENT);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="bg-[#0f172a] text-white min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">

        {/* Navbar */}
        <nav className="fixed top-0 w-full h-20 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl z-[100] flex items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Markdown Viewer Premium" className="w-10 h-10 rounded-xl" />
            <span className="font-extrabold text-2xl tracking-tighter">Markdown Viewer <span className="text-cyan-400">Premium</span></span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#demo" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Try It</a>
            <a href="#download" className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-full font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95">
              Get It Free
            </a>
          </div>
          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-400 hover:text-white" aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed top-20 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5 z-[99] md:hidden p-6 flex flex-col gap-4">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-300 hover:text-white">Features</a>
            <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-300 hover:text-white">Try It</a>
            <a href="#download" onClick={() => setMobileMenuOpen(false)} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold text-sm text-center">
              Get It Free
            </a>
          </div>
        )}

        {/* Hero Section */}
        <header className="relative pt-48 pb-24 px-6 overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full" />

          <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Available for Desktop, Chrome & VS Code
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1]">
              The Markdown Viewer <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600">
                Beautiful & Powerful.
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Unleash the power of your documents with Mermaid diagrams, LaTeX math, and stunning visuals.
              One consistent experience across every platform you work on.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <a href="#demo" className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-white/10 transition-all hover:-translate-y-1">
                Try Live Demo
              </a>
              <a href="#download" className="px-10 py-5 bg-slate-800/50 border border-white/10 backdrop-blur-md rounded-2xl font-black text-lg hover:bg-slate-800 transition-all hover:-translate-y-1">
                Download
              </a>
            </div>
          </div>
        </header>

        {/* Features Grid */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-500">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-8 transform group-hover:rotate-12 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Incredibly Powerful</h3>
              <p className="text-slate-400 leading-relaxed">Full support for Mermaid Diagrams, LaTeX Math, and GitHub Alerts right in the viewer.</p>
            </div>

            <div className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-500">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 transform group-hover:-rotate-12 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Stunning Design</h3>
              <p className="text-slate-400 leading-relaxed">Glassmorphism design philosophy delivers a premium feel with maximum focus on your content.</p>
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
          </div>
        </section>

        {/* Live Demo Section */}
        <section id="demo" className="py-24 px-6 bg-[#020617] border-y border-white/5">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black">Try It Live</h2>
              <p className="text-slate-500 text-lg">Type Markdown on the left and see the rendered output instantly on the right.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 h-[650px] bg-[#0f172a] rounded-[2.5rem] overflow-hidden border border-white/10">
              {/* Left Side: Editor */}
              <div className="flex flex-col border-r border-white/10 h-full">
                <div className="px-6 py-4 bg-black/20 flex items-center justify-between border-b border-white/5">
                  <span className="font-mono text-[11px] text-slate-500 uppercase tracking-widest font-bold">input.markdown</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-[10px] text-cyan-500 font-mono font-bold">LIVE</span>
                  </div>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full bg-transparent p-8 outline-none resize-none font-mono text-sm leading-relaxed text-slate-300"
                  spellCheck={false}
                />
              </div>

              {/* Right Side: Preview */}
              <div className="flex flex-col bg-[#0f172a] h-full overflow-hidden">
                <div className="px-6 py-4 bg-black/20 flex items-center justify-between border-b border-white/5">
                  <span className="font-mono text-[11px] text-slate-500 uppercase tracking-widest font-bold">preview.html</span>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/10 border border-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/10 border border-yellow-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/10 border border-green-500/20" />
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  <MarkdownContent content={content} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section id="download" className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl font-black">Get It Free</h2>
              <p className="text-slate-500 text-lg">Choose your platform and start viewing Markdown beautifully.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a href="https://chromewebstore.google.com/detail/markdown-viewer-premium/abnpdibfmmdcjhdakgjeiepimokkhjjo" target="_blank" rel="noopener noreferrer"
                className="group p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1">
                <svg className="w-10 h-10 mx-auto mb-4 text-cyan-400" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M21.17 8H12" stroke="currentColor" strokeWidth="1.5"/><path d="M7.5 20.5L12 12" stroke="currentColor" strokeWidth="1.5"/><path d="M7.5 3.5L12 12" stroke="currentColor" strokeWidth="1.5"/></svg>
                <h3 className="text-lg font-bold mb-2">Chrome Extension</h3>
                <p className="text-slate-500 text-sm">Chrome, Edge & Brave</p>
              </a>

              <a href="https://marketplace.visualstudio.com/items?itemName=bumkom.markdown-viewer-premium" target="_blank" rel="noopener noreferrer"
                className="group p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1">
                <svg className="w-10 h-10 mx-auto mb-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/></svg>
                <h3 className="text-lg font-bold mb-2">VS Code Extension</h3>
                <p className="text-slate-500 text-sm">VS Code Marketplace</p>
              </a>

              <a href="https://github.com/chieund/markdown-viewer-premium-site/releases" target="_blank" rel="noopener noreferrer"
                className="group p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1">
                <svg className="w-10 h-10 mx-auto mb-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                <h3 className="text-lg font-bold mb-2">Desktop App</h3>
                <p className="text-slate-500 text-sm">Windows, macOS & Linux</p>
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 text-center border-t border-white/5 bg-[#020617]">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex flex-col items-center gap-3">
              <img src="/logo.png" alt="Markdown Viewer Premium" className="w-10 h-10 rounded-xl" />
              <span className="text-slate-600 text-sm">Markdown Viewer Premium</span>
            </div>
            <p className="text-slate-600 text-sm">
              Crafted with passion by <a href="https://github.com/chieund" target="_blank" rel="noopener noreferrer" className="text-slate-400 underline decoration-cyan-500/40 hover:text-cyan-400 transition-colors">Bumkom</a>
            </p>
          </div>
        </footer>

      </div>
    </ThemeProvider>
  );
}

export default App;
