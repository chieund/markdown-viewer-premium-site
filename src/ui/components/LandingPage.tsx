import { ThemeToggle } from './ThemeToggle'

export default function LandingPage() {
    // Check if we are in an extension environment (optional for future use)
    // const isExtension = window.chrome && window.chrome.runtime && window.chrome.runtime.getManifest

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors duration-300">
            {/* Minimal Header */}
            <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        M
                    </div>
                    <span className="font-bold text-lg tracking-tight">Markdown Viewer Premium</span>
                </div>
                <div className="flex items-center gap-4">
                    {/* Theme Toggle in Header */}
                    <span title="Toggle Theme">
                        <ThemeToggle />
                    </span>
                </div>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-6 pt-32 pb-16 flex flex-col items-center text-center relative max-w-5xl">
                {/* Background Blobs */}
                <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] z-0 animate-pulse" />
                <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] z-0 animate-pulse delay-1000" />

                <div className="relative z-10 glass-panel p-12 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-secondary)]/50 backdrop-blur-xl shadow-2xl mb-16">
                    <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold border border-blue-500/20">
                        ✨ fast, beautiful, and open source
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                        The Markdown Viewer <br /> You've Always Wanted.
                    </h1>

                    <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
                        Say goodbye to ugly raw files. Experience your documentation with professional typography,
                        interactive diagrams, and a stunning glassmorphism UI.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <a
                            href="https://chromewebstore.google.com/detail/markdown-viewer-premium/abnpdibfmmdcjhdakgjeiepimokkhjjo"
                            target="_blank"
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-600/30 flex items-center gap-2 transform hover:-translate-y-1"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c-6.627 0-12-5.373-12-12zm-4.325 15.344l-2.075-8.688 7.375 4.313-5.3 4.375zm1.5-12.719h5.65l2.844 11.25H6.33l2.844-11.25zm6.5 2.156l2.375 7.969-6.844-3.5 4.469-4.469z" transform="scale(0.8) translate(5,5)" />
                            </svg>
                            Add to Chrome
                        </a>
                        <a
                            href="?url=README.md"
                            className="px-8 py-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-xl font-semibold transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Live Demo
                        </a>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    <FeatureCard
                        icon="🎨"
                        title="Glassmorphism UI"
                        desc="A modern, distraction-free reading experience utilizing the latest CSS blur and transparency effects."
                    />
                    <FeatureCard
                        icon="mermaid"
                        title="Mermaid & Math"
                        desc="Native support for flowcharts, sequence diagrams, and KaTeX mathematical equations."
                        isMermaid
                    />
                    <FeatureCard
                        icon="🐙"
                        title="GitHub Integration"
                        desc="Browse raw GitHub files directly in the viewer with zero setup. Just paste the URL."
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--border-light)] py-12 bg-[var(--bg-secondary)] text-center text-[var(--text-secondary)]">
                <p>
                    Built with <span className="text-red-500">❤️</span> by <a href="https://github.com/chieund" className="underline hover:text-[var(--text-primary)]">chieund</a>.
                    Open Source on <a href="https://github.com/chieund/markdown-previewer" className="underline hover:text-[var(--text-primary)]">GitHub</a>.
                </p>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, desc, isMermaid }: { icon: string, title: string, desc: string, isMermaid?: boolean }) {
    return (
        <div className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-light)] hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all group text-left">
            <div className="w-12 h-12 mb-6 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {isMermaid ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
                ) : icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">{title}</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
                {desc}
            </p>
        </div>
    )
}
