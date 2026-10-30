import { useContext } from 'react'
import { I18nContext } from './I18nContextDefinition'
import { en, type TranslationKey } from './locales'

type Translate = (key: TranslationKey, vars?: Record<string, string>) => string

const englishFallback: Translate = (key, vars) => {
    const template: string = en[key] ?? key
    if (!vars) return template
    return Object.entries(vars).reduce((acc, [name, value]) => acc.split(`{${name}}`).join(value), template)
}

/** `t()` that also works outside an I18nProvider (falling back to English) —
 * for components that render standalone too: the Chrome LandingPage, and
 * the diagram/code blocks in unit tests. Inside the viewer prefer this over
 * useI18n() only when you need that tolerance. */
export function useT(): Translate {
    const ctx = useContext(I18nContext)
    return ctx ? ctx.t : englishFallback
}
