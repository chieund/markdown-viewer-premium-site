import { useState, type ReactNode } from 'react'
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

    const setLocale = (next: Locale) => {
        setLocaleState(next)
        if (typeof window !== 'undefined') localStorage.setItem('locale', next)
    }

    // "Adjusting state when a prop changes", during render rather than in an
    // effect — see ThemeContext.tsx's identical hostTheme handling for why.
    const [lastHostLocale, setLastHostLocale] = useState(hostLocale)
    if (hostLocale !== lastHostLocale) {
        setLastHostLocale(hostLocale)
        if (hostLocale) setLocale(hostLocale)
    }

    const t = (key: TranslationKey, vars?: Record<string, string>): string => {
        const template = DICTIONARIES[locale][key] ?? DICTIONARIES.en[key] ?? key
        if (!vars) return template
        return Object.entries(vars).reduce((acc, [name, value]) => acc.replaceAll(`{${name}}`, value), template)
    }

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    )
}
