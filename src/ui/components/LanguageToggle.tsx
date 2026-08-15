import { useState, useRef, useEffect } from 'react'
import { useI18n } from '../i18n/useI18n'
import type { Locale } from '../i18n/locales'

interface LanguageToggleProps {
    className?: string
}

const LANGUAGE_OPTIONS: Array<{ value: Locale; label: string; flag: string }> = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
]

/** Same dropdown pattern/CSS classes as ThemeToggle, for a consistent look. */
export function LanguageToggle({ className = '' }: LanguageToggleProps) {
    const { locale, setLocale, t } = useI18n()
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false)
            }
        }
        if (showMenu) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showMenu])

    const current = LANGUAGE_OPTIONS.find(o => o.value === locale) ?? LANGUAGE_OPTIONS[0]

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`theme-toggle-btn ${className}`}
                title={t('language')}
                aria-label={t('language')}
            >
                <span className="theme-icon-emoji" style={{ fontSize: 14 }}>{current.flag}</span>
            </button>

            {showMenu && (
                <div className="theme-menu">
                    {LANGUAGE_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            onClick={() => {
                                setLocale(option.value)
                                setShowMenu(false)
                            }}
                            className={`theme-menu-item ${locale === option.value ? 'active' : ''}`}
                        >
                            <span className="theme-icon-emoji">{option.flag}</span>
                            <span className="theme-label">{option.label}</span>
                            {locale === option.value && (
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
