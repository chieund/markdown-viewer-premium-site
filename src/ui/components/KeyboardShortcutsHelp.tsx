import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ShortcutItem {
    keys: string[]
    description: string
    category: string
}

interface KeyboardShortcutsHelpProps {
    isOpen: boolean
    onClose: () => void
}

const shortcuts: ShortcutItem[] = [
    { keys: ['Ctrl', 'K'], description: 'Toggle Table of Contents', category: 'Navigation' },
    { keys: ['Ctrl', 'D'], description: 'Toggle Theme', category: 'Appearance' },
    { keys: ['Ctrl', 'P'], description: 'Print / Export PDF', category: 'Actions' },
    { keys: ['Ctrl', '/'], description: 'Show Keyboard Shortcuts', category: 'Help' },
    { keys: ['Home'], description: 'Scroll to Top', category: 'Navigation' },
    { keys: ['End'], description: 'Scroll to Bottom', category: 'Navigation' },
    { keys: ['Escape'], description: 'Close Modal / Menu', category: 'General' },
]

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onClose()
                }
            }
            
            window.addEventListener('keydown', handleEscape)
            return () => {
                document.body.style.overflow = ''
                window.removeEventListener('keydown', handleEscape)
            }
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    // Group shortcuts by category
    const categories = Array.from(new Set(shortcuts.map(s => s.category)))

    return createPortal(
        <div className="shortcuts-overlay" onClick={onClose}>
            <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
                <div className="shortcuts-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button onClick={onClose} className="shortcuts-close" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                
                <div className="shortcuts-content">
                    {categories.map(category => (
                        <div key={category} className="shortcuts-category">
                            <h3 className="shortcuts-category-title">{category}</h3>
                            <div className="shortcuts-list">
                                {shortcuts
                                    .filter(s => s.category === category)
                                    .map((shortcut, index) => (
                                        <div key={index} className="shortcut-item">
                                            <div className="shortcut-keys">
                                                {shortcut.keys.map((key, i) => (
                                                    <span key={i}>
                                                        <kbd className="shortcut-key">{key}</kbd>
                                                        {i < shortcut.keys.length - 1 && <span className="shortcut-plus">+</span>}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="shortcut-description">{shortcut.description}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="shortcuts-footer">
                    <p className="shortcuts-note">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        On Mac, use <kbd className="shortcut-key">⌘</kbd> instead of <kbd className="shortcut-key">Ctrl</kbd>
                    </p>
                </div>
            </div>
        </div>,
        document.body
    )
}
