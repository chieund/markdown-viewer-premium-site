import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './ThemeContextDefinition'

const VALID_THEMES: Theme[] = ['light', 'dark', 'system', 'sepia', 'solarized']

/** Sepia/Solarized are light-or-dark-toned "skins" layered on top of the
 * light/dark variable set (via `[data-skin]` in index.css) rather than a
 * third resolvedTheme value — this keeps CodeBlock's syntax-highlighter
 * choice and the existing `[data-theme="dark"]` mermaid overrides working
 * unchanged for every theme, skinned or not. */
const SKIN_BASE: Record<'sepia' | 'solarized', 'light' | 'dark'> = {
    sepia: 'light',
    solarized: 'light',
}

function isSkin(theme: Theme): theme is 'sepia' | 'solarized' {
    return theme === 'sepia' || theme === 'solarized'
}

function baseOf(theme: Theme): 'light' | 'dark' {
    if (isSkin(theme)) return SKIN_BASE[theme]
    return theme === 'dark' ? 'dark' : 'light'
}

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light'

    // Inside the VS Code webview, `body` carries `vscode-dark` / `vscode-light`
    // / `vscode-high-contrast`, kept in sync with the user's actual active
    // color theme — a much better "system" signal there than OS-level
    // prefers-color-scheme, which only reflects the OS setting and can
    // disagree with whatever theme VS Code itself is using.
    const body = document.body
    if (body?.classList.contains('vscode-dark') || body?.classList.contains('vscode-high-contrast')) return 'dark'
    if (body?.classList.contains('vscode-light')) return 'light'

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface ThemeProviderProps {
    children: ReactNode
    /** Host-provided theme (e.g. VS Code's `markdownViewerPremium.theme`
     * setting). Applied whenever this value changes — including live
     * settings.json edits — taking priority over the saved local toggle,
     * since it reflects a deliberate choice the user made outside the app. */
    hostTheme?: Theme
}

export function ThemeProvider({ children, hostTheme }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (hostTheme) return hostTheme
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme') as Theme
            if (VALID_THEMES.includes(saved)) return saved
        }
        return 'system'
    })

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme') as Theme
            if (VALID_THEMES.includes(saved) && saved !== 'system') return baseOf(saved)
        }
        return getSystemTheme()
    })

    useEffect(() => {
        const updateResolvedTheme = () => {
            const resolved = theme === 'system' ? getSystemTheme() : baseOf(theme)
            setResolvedTheme(resolved)
            document.documentElement.setAttribute('data-theme', resolved)
            if (isSkin(theme)) {
                document.documentElement.setAttribute('data-skin', theme)
            } else {
                document.documentElement.removeAttribute('data-skin')
            }
        }

        updateResolvedTheme()

        // Listen for system theme changes
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            const handler = () => updateResolvedTheme()

            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handler)
            }

            // VS Code swaps `vscode-dark`/`vscode-light`/`vscode-high-contrast`
            // on <body> live when the user switches color theme, without
            // reloading the webview — matchMedia alone would miss that.
            const bodyObserver = new MutationObserver(handler)
            bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] })

            return () => {
                if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', handler)
                bodyObserver.disconnect()
            }
        }
    }, [theme])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', newTheme)
        }
    }

    // "Adjusting state when a prop changes", done during render rather than
    // in an effect (react.dev/learn/you-might-not-need-an-effect) — applies
    // a new hostTheme the moment it arrives without an extra render pass,
    // and only reacts to it actually changing rather than every render.
    const [lastHostTheme, setLastHostTheme] = useState(hostTheme)
    if (hostTheme !== lastHostTheme) {
        setLastHostTheme(hostTheme)
        if (hostTheme) setTheme(hostTheme)
    }

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
    }

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}
