import { useEffect, useCallback } from 'react'

export interface ShortcutConfig {
    key: string
    ctrlKey?: boolean
    shiftKey?: boolean
    altKey?: boolean
    metaKey?: boolean
    callback: () => void
    description: string
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled = true) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return

        // Don't trigger shortcuts when typing in inputs
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return
        }

        for (const shortcut of shortcuts) {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
            const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
            const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
            const altMatch = shortcut.altKey ? event.altKey : !event.altKey

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                event.preventDefault()
                shortcut.callback()
                break
            }
        }
    }, [shortcuts, enabled])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}
