import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './ThemeContextDefinition'

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme') as Theme
            if (saved === 'dark' || saved === 'light' || saved === 'system') return saved
        }
        return 'system'
    })

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme') as Theme
            if (saved === 'light' || saved === 'dark') return saved
        }
        return getSystemTheme()
    })

    useEffect(() => {
        const updateResolvedTheme = () => {
            console.log('UpdateResolvedTheme called. Theme preference:', theme)
            if (theme === 'system') {
                const systemTheme = getSystemTheme()
                console.log('System theme detected:', systemTheme)
                setResolvedTheme(systemTheme)
                document.documentElement.setAttribute('data-theme', systemTheme)
            } else {
                setResolvedTheme(theme)
                document.documentElement.setAttribute('data-theme', theme)
            }
        }

        updateResolvedTheme()

        // Listen for system theme changes
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            const handler = () => updateResolvedTheme()

            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handler)
                return () => mediaQuery.removeEventListener('change', handler)
            }
        }
    }, [theme])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', newTheme)
        }
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
