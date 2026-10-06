export function Footer() {
  return (
    <footer className="py-16 text-center border-t border-white/5 bg-[#020617]">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex flex-col items-center gap-3">
          <a href="/">
            <img src="/logo.png" alt="Markdown Viewer Premium" className="w-10 h-10 rounded-xl" />
          </a>
          <span className="text-slate-600 text-sm">Markdown Viewer Premium</span>
        </div>
        <p className="text-slate-600 text-sm">
          Crafted with passion by <a href="https://github.com/chieund" target="_blank" rel="noopener noreferrer" className="text-slate-400 underline decoration-cyan-500/40 hover:text-cyan-400 transition-colors">Bumkom</a>
        </p>
        <a href="https://buymeacoffee.com/bumkom" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-amber-300 border border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10 hover:border-amber-400/40 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><path d="M6 2v2M10 2v2M14 2v2" /></svg>
          Buy me a coffee
        </a>
      </div>
    </footer>
  );
}
