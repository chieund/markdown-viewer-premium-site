import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-primary)] p-4">
          <div className="max-w-2xl w-full p-8 rounded-2xl bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-full bg-red-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Oops! Something went wrong
                </h2>
                <p className="text-[var(--text-secondary)] mb-4">
                  The markdown viewer encountered an unexpected error. This usually happens with invalid syntax or unsupported content.
                </p>
              </div>
            </div>

            {this.state.error && (
              <details className="mb-6">
                <summary className="cursor-pointer text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-2">
                  Error Details (click to expand)
                </summary>
                <div className="p-4 rounded-lg bg-[var(--bg-code)] border border-[var(--border-light)] font-mono text-xs text-[var(--text-primary)] overflow-auto max-h-64">
                  <p className="text-red-500 font-semibold mb-2">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <pre className="text-[var(--text-secondary)] whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="px-6 py-3 rounded-lg bg-[var(--sidebar-bg-secondary)] hover:bg-[var(--sidebar-hover)] text-[var(--text-primary)] font-medium border border-[var(--sidebar-border)] transition-colors"
              >
                Try Again
              </button>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">💡 Tip:</span> If this keeps happening, try viewing the raw markdown or check if your markdown syntax is valid.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
