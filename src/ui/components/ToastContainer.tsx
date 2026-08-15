import { Toast, type ToastProps } from './Toast'

interface ToastContainerProps {
    toasts: Array<{
        id: number
        message: string
        type: ToastProps['type']
        duration?: number
    }>
    onClose: (id: number) => void
    sidebarOpen?: boolean
}

export function ToastContainer({ toasts, onClose, sidebarOpen = true }: ToastContainerProps) {
    if (toasts.length === 0) return null

    return (
        // .toast-container is right:20px by default, which sits directly under
        // the 300px-wide TOC sidebar — same offset BackToTop already uses so a
        // toast (e.g. "Table of Contents toggled") doesn't render on top of it.
        <div className="toast-container" style={{ right: sidebarOpen ? '340px' : '20px' }}>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => onClose(toast.id)}
                />
            ))}
        </div>
    )
}
