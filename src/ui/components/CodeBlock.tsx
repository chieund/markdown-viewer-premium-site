import { useState } from 'react'
// Async *light* build: only the grammar for each block's own language is
// fetched, on demand. The full Prism build put every language (~600 KB) in
// the entry bundle; the plain async build still loaded them all at once.
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'
import { useT } from '../i18n/useT'

// The async-light build only loads grammars by their canonical name, so
// common fence shorthands (```ts, ```py, ...) must be mapped first — without
// this they rendered unhighlighted unless the full grammar happened to have
// been loaded by an earlier block.
const LANGUAGE_ALIASES: Record<string, string> = {
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', ts: 'typescript', mts: 'typescript',
    py: 'python', rb: 'ruby', sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash',
    yml: 'yaml', cs: 'csharp', 'c#': 'csharp', 'c++': 'cpp', md: 'markdown', kt: 'kotlin',
    rs: 'rust', golang: 'go', ps1: 'powershell', ps: 'powershell', dockerfile: 'docker',
    html: 'markup', xml: 'markup', svg: 'markup', vue: 'markup', mathml: 'markup', rss: 'markup',
    atom: 'markup', objc: 'objectivec', tf: 'hcl', kts: 'kotlin', hs: 'haskell', tex: 'latex',
    vb: 'vbnet', dotnet: 'csharp', gitignore: 'ignore', webmanifest: 'json',
}

/** Fence name → the async loader's key: aliases first, then kebab-case to
 * camelCase, which is how hyphenated grammars (visual-basic, shell-session,
 * excel-formula, go-module) are registered. */
function resolveLanguage(language: string | undefined): string | undefined {
    if (!language) return language
    const name = LANGUAGE_ALIASES[language.toLowerCase()] ?? language.toLowerCase()
    return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

export default function CodeBlock({ language, value }: { language: string, value: string }) {
    const t = useT()
    const [copied, setCopied] = useState(false)
    const { resolvedTheme } = useTheme()
    const { success, error } = useToast()
    const isDark = resolvedTheme === 'dark'

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            success(t('codeCopied'))
            setTimeout(() => setCopied(false), 2000)
        } catch {
            error(t('codeCopyFailed'))
        }
    }

    return (
        <div className="code-block-wrapper">
            <div className="code-header">
                <span className="lang-tag">{language}</span>
                <button className={`copy-btn ${copied ? 'is-copied' : ''}`} onClick={handleCopy} aria-label={copied ? t('copied') : t('copyCode')}>
                    {copied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    )}
                    <span>{copied ? t('copied') : t('copy')}</span>
                </button>
            </div>
            <SyntaxHighlighter
                style={isDark ? vscDarkPlus : oneLight}
                language={resolveLanguage(language)}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    backgroundColor: isDark ? '#1e1e1e' : '#fbfbfc',
                    fontSize: '0.85rem',
                    lineHeight: '1.3', // Tighter line height for ASCII art
                    fontFamily: 'JetBrains Mono, Fira Code, monospace', // Better fonts for box drawing
                    padding: '1rem 1.25rem'
                }}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    )
}
