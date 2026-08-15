import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'

export default function CodeBlock({ language, value }: { language: string, value: string }) {
    const [copied, setCopied] = useState(false)
    const { resolvedTheme } = useTheme()
    const { success, error } = useToast()
    const isDark = resolvedTheme === 'dark'

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            success('Code copied to clipboard!')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            error('Failed to copy code')
        }
    }

    return (
        <div className="code-block-wrapper">
            <div className="code-header">
                <span className="lang-tag">{language}</span>
                <button className="copy-btn" onClick={handleCopy}>
                    {copied ? (
                        <span className="flex-center">✓</span>
                    ) : (
                        'Copy'
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                style={isDark ? vscDarkPlus : oneLight}
                language={language}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    backgroundColor: isDark ? '#1e1e1e' : '#fafafa',
                    fontSize: '0.9rem',
                    lineHeight: '1.3', // Tighter line height for ASCII art
                    fontFamily: 'JetBrains Mono, Fira Code, monospace', // Better fonts for box drawing
                    padding: '1.2rem 1.25rem'
                }}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    )
}
