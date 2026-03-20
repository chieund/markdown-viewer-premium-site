import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextType {
    theme: Theme // User preference
    resolvedTheme: 'light' | 'dark' // Actual applied theme
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
