import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { I18nContext } from './I18nContextDefinition'
import { DICTIONARIES, type Locale, type TranslationKey } from './locales'

function detectLocale(): Locale {
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('vi')) return 'vi'
    return 'en'
}

interface I18nProviderProps {
    children: ReactNode
    /** Host-provided locale (e.g. VS Code's `markdownViewerPremium.locale`
     * setting, or `vscode.env.language`). Same "wins on change, including
     * live config edits" pattern as ThemeProvider's `hostTheme` — see that
     * component for the full rationale. */
    hostLocale?: Locale
}

export function I18nProvider({ children, hostLocale }: I18nProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (hostLocale) return hostLocale
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('locale')
            if (saved === 'en' || saved === 'vi') return saved
        }
        return detectLocale()
    })

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next)
        if (typeof window !== 'undefined') localStorage.setItem('locale', next)
    }, [])

    // "Adjusting state when a prop changes", during render rather than in an
    // effect — see ThemeContext.tsx's identical hostTheme handling for why.
    const [lastHostLocale, setLastHostLocale] = useState(hostLocale)
    if (hostLocale !== lastHostLocale) {
        setLastHostLocale(hostLocale)
        if (hostLocale) setLocale(hostLocale)
    }

    // Stable per locale: diagram blocks use t() inside render effects, so a
    // new function every provider render would re-run them on each keystroke.
    const t = useCallback((key: TranslationKey, vars?: Record<string, string>): string => {
        const template = DICTIONARIES[locale][key] ?? DICTIONARIES.en[key] ?? key
        if (!vars) return template
        // split/join rather than replaceAll: the desktop app compiles against ES2020.
        return Object.entries(vars).reduce((acc, [name, value]) => acc.split(`{${name}}`).join(value), template)
    }, [locale])

    const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    )
}
