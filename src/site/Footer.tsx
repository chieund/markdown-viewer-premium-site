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
      </div>
    </footer>
  );
}
