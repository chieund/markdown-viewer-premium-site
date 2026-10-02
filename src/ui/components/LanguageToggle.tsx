import { useI18n } from '../i18n/useI18n'
import type { Locale } from '../i18n/locales'
import { ToolbarMenu } from './ToolbarMenu'

const LANGUAGE_OPTIONS: Array<{ value: Locale; label: string; code: string }> = [
    { value: 'en', label: 'English', code: 'EN' },
    { value: 'vi', label: 'Tiếng Việt', code: 'VI' },
]

/** Shows the language code rather than a flag emoji: flags render
 * inconsistently across platforms (Windows shows letter pairs) and a
 * language is not a country. */
export function LanguageToggle() {
    const { locale, setLocale, t } = useI18n()
    const current = LANGUAGE_OPTIONS.find(o => o.value === locale) ?? LANGUAGE_OPTIONS[0]

    return (
        <ToolbarMenu
            label={t('language')}
            trigger={<span className="lang-code">{current.code}</span>}
            items={LANGUAGE_OPTIONS.map(option => ({
                key: option.value,
                label: option.label,
                icon: <span className="lang-code lang-code--muted">{option.code}</span>,
                active: locale === option.value,
                onSelect: () => setLocale(option.value),
            }))}
        />
    )
}
