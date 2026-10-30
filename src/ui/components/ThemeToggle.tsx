import { useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { useT } from '../i18n/useT'
import type { TranslationKey } from '../i18n/locales'
import type { Theme } from '../context/ThemeContextDefinition'
import { ToolbarMenu } from './ToolbarMenu'

/** Two-tone dot previewing a theme's page background and accent — tells the
 * user what they'll get before they pick it, which an emoji can't. */
function Swatch({ bg, fg, split }: { bg: string; fg: string; split?: string }) {
    return (
        <span
            className="theme-swatch"
            style={{ background: split ? `linear-gradient(135deg, ${bg} 50%, ${split} 50%)` : bg }}
            aria-hidden="true"
        >
            <span style={{ background: fg }} />
        </span>
    )
}

const THEME_OPTIONS: Array<{ value: Theme; labelKey: TranslationKey; swatch: { bg: string; fg: string; split?: string } }> = [
    { value: 'system', labelKey: 'themeSystem', swatch: { bg: '#ffffff', split: '#1e1e1e', fg: '#58a6ff' } },
    { value: 'light', labelKey: 'themeLight', swatch: { bg: '#ffffff', fg: '#2563eb' } },
    { value: 'dark', labelKey: 'themeDark', swatch: { bg: '#1e1e1e', fg: '#58a6ff' } },
    { value: 'sepia', labelKey: 'themeSepia', swatch: { bg: '#f4ecd8', fg: '#a0522d' } },
    { value: 'solarized', labelKey: 'themeSolarized', swatch: { bg: '#fdf6e3', fg: '#268bd2' } },
]

function TriggerIcon({ theme }: { theme: Theme }) {
    const common = { xmlns: 'http://www.w3.org/2000/svg', width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
    if (theme === 'light') {
        return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
    }
    if (theme === 'dark') {
        return <svg {...common}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
    }
    if (theme === 'system') {
        return <svg {...common}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
    }
    // Skins: a half-filled circle, the conventional "appearance" glyph.
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" /></svg>
}

export function ThemeToggle() {
    const { theme, setTheme, toggleTheme } = useTheme()
    // Also rendered on the Chrome LandingPage, outside any I18nProvider.
    const t = useT()

    // Ctrl+D (MarkdownViewer's shortcut list) dispatches this event; nothing
    // listened for it before, so the documented shortcut did nothing.
    useEffect(() => {
        const onToggle = () => toggleTheme()
        window.addEventListener('toggle-theme', onToggle)
        return () => window.removeEventListener('toggle-theme', onToggle)
    }, [toggleTheme])

    const current = THEME_OPTIONS.find(o => o.value === theme)

    return (
        <ToolbarMenu
            label={t('themeMenu')}
            title={`${t('theme')}: ${current ? t(current.labelKey) : theme}`}
            trigger={<TriggerIcon theme={theme} />}
            items={THEME_OPTIONS.map(option => ({
                key: option.value,
                label: t(option.labelKey),
                icon: <Swatch {...option.swatch} />,
                active: theme === option.value,
                onSelect: () => setTheme(option.value),
            }))}
        />
    )
}
