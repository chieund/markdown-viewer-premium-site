import { useState, useCallback } from 'react'
import type { ToastType } from '../components/Toast'

export interface ToastState {
    id: number
    message: string
    type: ToastType
    duration?: number
}

let toastId = 0

export function useToast() {
    const [toasts, setToasts] = useState<ToastState[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
        const id = toastId++
        setToasts(prev => [...prev, { id, message, type, duration }])
    }, [])

    const hideToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
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
        toasts,
        hideToast,
        showToast,
        success,
        error,
        info,
        warning,
    }
}
