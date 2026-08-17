export function DownloadSection() {
  return (
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

          <a href="https://github.com/chieund/markdown-viewer-premium-site/releases/tag/v1.0.2" target="_blank" rel="noopener noreferrer"
            className="group p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1">
            <svg className="w-10 h-10 mx-auto mb-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
            <h3 className="text-lg font-bold mb-2">Desktop App</h3>
            <p className="text-slate-500 text-sm">Windows, macOS & Linux</p>
          </a>
        </div>
      </div>
    </section>
  );
}
