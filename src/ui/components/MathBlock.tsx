import { BlockMath, InlineMath } from 'react-katex'
import { useState } from 'react'

interface MathBlockProps {
    formula: string
    inline?: boolean
}

export default function MathBlock({ formula, inline = false }: MathBlockProps) {
    const [error, setError] = useState<string | null>(null)

    const handleError = () => {
        setError('Invalid LaTeX syntax')
        return (
            <div className="math-error inline-block px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm font-mono">
                Invalid LaTeX syntax
            </div>
        )
    }

    if (error) {
        return (
            <div className="math-error inline-block px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm font-mono">
                {error}
            </div>
        )
    }

    if (inline) {
        return <InlineMath math={formula} errorColor="#f87171" renderError={handleError} />
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(formula)
        // Could add toast notification here
    }

    return (
        <div className="code-block-wrapper my-4">
            <div className="code-header">
                <span className="lang-tag">tex</span>
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                    title="Copy LaTeX"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
            </div>
            <div className="p-4 bg-white dark:bg-[#1e1e1e] overflow-x-auto flex justify-center">
                <BlockMath math={formula} errorColor="#f87171" renderError={handleError} />
            </div>
        </div>
    )
}