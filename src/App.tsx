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

  return (
    <ThemeProvider>
      <div className="bg-[#0f172a] text-white min-h-screen selection:bg-blue-500/30 selection:text-blue-200">

        {/* Navbar */}
        <nav className="fixed top-0 w-full h-20 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl z-[100] flex items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
              M
            </div>
            <span className="font-extrabold text-2xl tracking-tighter">Markdown <span className="text-blue-500">Viewer</span></span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#demo" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Try It</a>
            <a href="https://chromewebstore.google.com/detail/markdown-viewer-premium/abnpdibfmmdcjhdakgjeiepimokkhjjo" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full font-bold text-sm shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
              Download App
            </a>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="relative pt-48 pb-24 px-6 overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full" />

          <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold animate-bounce-slow">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Available for Desktop, Chrome & VS Code
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1]">
              The Markdown Viewer <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
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
              <button className="px-10 py-5 bg-slate-800/50 border border-white/10 backdrop-blur-md rounded-2xl font-black text-lg hover:bg-slate-800 transition-all hover:-translate-y-1">
                View on GitHub
              </button>
            </div>
          </div>
        </header>

        {/* Features Grid */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-blue-500/20 transition-all duration-500">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 transform group-hover:rotate-12 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Incredibly Powerful</h3>
              <p className="text-slate-400 leading-relaxed italic">Full support for Mermaid Diagrams, LaTeX Math, and GitHub Alerts right in the viewer.</p>
            </div>

            <div className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-indigo-500/20 transition-all duration-500">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-8 transform group-hover:-rotate-12 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Stunning Design</h3>
              <p className="text-slate-400 leading-relaxed italic">Glassmorphism design philosophy delivers a premium feel with maximum focus on your content.</p>
            </div>

            <div className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-purple-500/20 transition-all duration-500">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-8 transform group-hover:rotate-12 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Unified Ecosystem</h3>
              <p className="text-slate-400 leading-relaxed italic">Seamless experience across VS Code Extension, Chrome Extension, and Desktop App.</p>
            </div>
          </div>
        </section>

        {/* Live Demo Section */}
        <section id="demo" className="py-24 px-6 bg-[#020617] border-y border-white/5">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black">Real-Time Playground</h2>
              <p className="text-slate-500 text-lg">Type Markdown on the left and see the rendered output instantly on the right.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 h-[650px] bg-[#0f172a] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-3xl">
              {/* Left Side: Editor */}
              <div className="flex flex-col border-r border-white/10 h-full">
                <div className="px-6 py-4 bg-black/20 flex items-center justify-between border-b border-white/5">
                  <span className="font-mono text-[11px] text-slate-500 uppercase tracking-widest font-bold">input.markdown</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] text-blue-500 font-mono font-bold">SYNCING</span>
                  </div>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full bg-transparent p-8 outline-none resize-none font-mono text-sm leading-relaxed text-indigo-200/90"
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

        {/* Footer */}
        <footer className="py-24 text-center border-t border-white/5 bg-[#020617]">
          <div className="max-w-xl mx-auto space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 font-black text-2xl">
                M
              </div>
              <h3 className="font-bold text-xl uppercase tracking-widest italic opacity-50">Markdown Viewer Premium</h3>
            </div>
            <p className="text-slate-500 leading-relaxed italic px-6">
              Crafted with passion by <span className="text-slate-300 font-black underline decoration-blue-500/40">chieund</span>. <br />
              Designed for those who love beauty and efficiency.
            </p>
            <div className="pt-10 flex justify-center gap-8 text-slate-600 text-sm font-bold">
              <a href="https://marketplace.visualstudio.com/items?itemName=bumkom.markdown-viewer-premium" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/></svg>
                VS CODE
              </a>
              <a href="https://chromewebstore.google.com/detail/markdown-viewer-premium/abnpdibfmmdcjhdakgjeiepimokkhjjo" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M21.17 8H12" stroke="currentColor" strokeWidth="2"/><path d="M7.5 20.5L12 12" stroke="currentColor" strokeWidth="2"/><path d="M7.5 3.5L12 12" stroke="currentColor" strokeWidth="2"/></svg>
                CHROME
              </a>
              <a href="#" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                DESKTOP APP
              </a>
            </div>
          </div>
        </footer>

      </div>
    </ThemeProvider>
  );
}

export default App;
