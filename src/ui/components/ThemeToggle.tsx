import { useTheme } from '../hooks/useTheme'
import { useState, useRef, useEffect } from 'react'

interface ThemeToggleProps {
    className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme()
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false)
            }
        }

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showMenu])

    const themeOptions = [
        { value: 'light', label: 'Light', icon: '☀️', kbd: 'L' },
        { value: 'dark', label: 'Dark', icon: '🌙', kbd: 'D' },
        { value: 'system', label: 'System', icon: '💻', kbd: 'S' },
    ] as const

    const currentIcon = theme === 'light' 
        ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="theme-icon">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
        </svg>
        : theme === 'dark'
        ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="theme-icon">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
        : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="theme-icon">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
        </svg>

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`theme-toggle-btn ${className}`}
                title={`Current theme: ${theme}`}
                aria-label="Toggle theme menu"
            >
                {currentIcon}
            </button>

            {showMenu && (
                <div className="theme-menu">
                    {themeOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                setTheme(option.value)
                                setShowMenu(false)
                            }}
                            className={`theme-menu-item ${theme === option.value ? 'active' : ''}`}
                        >
                            <span className="theme-icon-emoji">{option.icon}</span>
                            <span className="theme-label">{option.label}</span>
                            {theme === option.value && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="check-icon">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
