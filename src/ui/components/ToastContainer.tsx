import { Toast, type ToastProps } from './Toast'

interface ToastContainerProps {
    toasts: Array<{
        id: number
        message: string
        type: ToastProps['type']
        duration?: number
    }>
    onClose: (id: number) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    if (toasts.length === 0) return null

    return (
        <div className="toast-container">
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
