import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface ToolbarMenuItem {
    key: string
    label: string
    /** Native tooltip; also what e2e tests target via getByTitle. */
    title?: string
    icon?: ReactNode
    /** Marks the current choice in a pick-one menu (theme, language). */
    active?: boolean
    /** Draws a divider above this item to start a new group. */
    separatorBefore?: boolean
    onSelect: () => void
}

interface ToolbarMenuProps {
    /** Accessible name of the trigger button. */
    label: string
    /** Tooltip of the trigger; defaults to `label`. */
    title?: string
    trigger: ReactNode
    items: ToolbarMenuItem[]
}

/** Small dropdown used by the sidebar toolbar (theme, language, export) —
 * one implementation so all three look and behave the same: closes on
 * outside click, on Escape, and after a pick. Uses the disclosure pattern
 * (button + aria-expanded, plain buttons inside) rather than ARIA menu
 * roles, which would also promise arrow-key navigation. */
export function ToolbarMenu({ label, title, trigger, items }: ToolbarMenuProps) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const onPointerDown = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return
            // Consume it so one Escape doesn't also close a search panel or
            // fullscreen diagram listening underneath.
            event.preventDefault()
            event.stopImmediatePropagation()
            setOpen(false)
        }
        document.addEventListener('mousedown', onPointerDown)
        // Capture phase so this runs before other Escape handlers.
        document.addEventListener('keydown', onKeyDown, true)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown, true)
        }
    }, [open])

    return (
        <div className="toolbar-menu-root" ref={rootRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`icon-btn ${open ? 'is-open' : ''}`}
                title={title ?? label}
                aria-label={label}
                aria-expanded={open}
            >
                {trigger}
            </button>

            {open && (
                <div className="toolbar-menu">
                    {items.map(item => [
                        item.separatorBefore && <div key={`${item.key}-sep`} className="toolbar-menu-separator" role="separator" />,
                        <button
                            key={item.key}
                            type="button"
                            title={item.title}
                            onClick={() => {
                                setOpen(false)
                                item.onSelect()
                            }}
                            className={`toolbar-menu-item ${item.active ? 'active' : ''}`}
                            aria-pressed={item.active === undefined ? undefined : item.active}
                        >
                            {item.icon && <span className="toolbar-menu-icon">{item.icon}</span>}
                            <span className="toolbar-menu-label">{item.label}</span>
                            {item.active && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="toolbar-menu-check" aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </button>,
                    ])}
                </div>
            )}
        </div>
    )
}
