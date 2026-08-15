import { createContext } from 'react'
import type { Locale, TranslationKey } from './locales'

export interface I18nContextValue {
    locale: Locale
    setLocale: (locale: Locale) => void
    /** `{placeholder}` tokens in the string are replaced from `vars`. */
    t: (key: TranslationKey, vars?: Record<string, string>) => string
}

export const I18nContext = createContext<I18nContextValue | undefined>(undefined)
