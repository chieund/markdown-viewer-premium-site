import { useCallback, useSyncExternalStore } from 'react'
import type { ToastType } from '../components/Toast'

export interface ToastState {
    id: number
    message: string
    type: ToastType
    duration?: number
}

// One store for the whole page. Each useToast() used to keep its own
// useState list, but only MarkdownViewer renders a ToastContainer — so every
// toast raised elsewhere (export results, "Code copied", diagram copy
// errors) went into a list nobody displayed and was never seen.
let toasts: ToastState[] = []
let toastId = 0
const listeners = new Set<() => void>()

function setToasts(next: ToastState[]) {
    toasts = next
    listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
}

const getSnapshot = () => toasts

/** The current toasts — only the component that renders them should use
 * this; it re-renders on every show/hide. */
export function useToastList(): ToastState[] {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Actions for raising toasts. Doesn't subscribe to the list, so the many
 * components that only raise toasts (every code block, every diagram) don't
 * re-render each time one appears or disappears. */
export function useToast() {
    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
        setToasts([...toasts, { id: toastId++, message, type, duration }])
    }, [])

    const hideToast = useCallback((id: number) => {
        setToasts(toasts.filter(toast => toast.id !== id))
    }, [])

    const success = useCallback((message: string, duration?: number) => {
        showToast(message, 'success', duration)
    }, [showToast])

    const error = useCallback((message: string, duration?: number) => {
        showToast(message, 'error', duration)
    }, [showToast])

    const info = useCallback((message: string, duration?: number) => {
        showToast(message, 'info', duration)
    }, [showToast])

    const warning = useCallback((message: string, duration?: number) => {
        showToast(message, 'warning', duration)
    }, [showToast])

    return {
        hideToast,
        showToast,
        success,
        error,
        info,
        warning,
    }
}
