import { useState } from 'react';

const EXAMPLE_PAGES = [
  { href: '/mermaid/', label: 'Mermaid' },
  { href: '/plantuml/', label: 'PlantUML' },
  { href: '/graphviz/', label: 'Graphviz' },
  { href: '/vega/', label: 'Vega-Lite' },
  { href: '/tables/', label: 'Tables & Code' },
];

// Shared across the home page and every per-diagram-type example page —
// each example page is its own real HTML document (see vite.config.ts's
// multi-page build), not a client-side route, so every link here is a full
// href rather than a router <Link>. `/#features` etc. still resolve to an
// in-page scroll when already on `/`, same as any plain anchor link.
interface NavProps {
  /** Where "Try It" points — `/#demo` (default, navigates home) on the home
   * page itself, or `#demo` (same-page anchor) on a dedicated example page,
   * which already has its own richer demo further down this same document. */
  demoHref?: string;
}

export function Nav({ demoHref = '/#demo' }: NavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full h-20 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl z-[100] flex items-center justify-between px-6 lg:px-12">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Markdown Viewer Premium" className="w-10 h-10 rounded-xl" />
          <span className="font-extrabold text-2xl tracking-tighter">Markdown Viewer <span className="text-cyan-400">Premium</span></span>
        </a>
        <div className="hidden md:flex items-center gap-10">
          <a href="/#features" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Features</a>

          <div
            className="relative"
            onMouseEnter={() => setExamplesOpen(true)}
            onMouseLeave={() => setExamplesOpen(false)}
          >
            <button className="flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              Examples
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {examplesOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-56">
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-2">
                  {EXAMPLE_PAGES.map((p) => (
                    <a
                      key={p.href}
                      href={p.href}
                      className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {p.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <a href={demoHref} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Try It</a>
          <a href="/#download" className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-full font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95">
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
        <div className="fixed top-20 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5 z-[99] md:hidden p-6 flex flex-col gap-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <a href="/#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-300 hover:text-white">Features</a>

          <div className="pt-2">
            <span className="text-xs uppercase tracking-widest font-bold text-slate-600">Examples</span>
            <div className="flex flex-col gap-3 mt-3 pl-2">
              {EXAMPLE_PAGES.map((p) => (
                <a key={p.href} href={p.href} onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-300 hover:text-white">
                  {p.label}
                </a>
              ))}
            </div>
          </div>

          <a href={demoHref} onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-300 hover:text-white pt-2">Try It</a>
          <a href="/#download" onClick={() => setMobileMenuOpen(false)} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold text-sm text-center">
            Get It Free
          </a>
        </div>
      )}
    </>
  );
}
