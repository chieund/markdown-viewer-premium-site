import { useEffect, useState, type RefObject } from 'react'

interface BackToTopProps {
    containerRef: RefObject<HTMLDivElement | null>
    sidebarOpen?: boolean
}

// Constants
const SCROLL_THRESHOLD = 300

export default function BackToTop({ containerRef, sidebarOpen = true }: BackToTopProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [scrollProgress, setScrollProgress] = useState(0)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container
            const totalHeight = scrollHeight - clientHeight
            const progress = totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0

            setScrollProgress(progress)
            setIsVisible(scrollTop > SCROLL_THRESHOLD)
        }

        container.addEventListener('scroll', handleScroll)
        handleScroll() // Initial calculation

        return () => container.removeEventListener('scroll', handleScroll)
    }, [containerRef])

    const scrollToTop = () => {
        containerRef.current?.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    // Calculate circle circumference for progress indicator
    const radius = 20
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (scrollProgress / 100) * circumference

    return (
        <div
            className={`back-to-top-wrapper ${isVisible ? 'visible' : ''}`}
            style={{ right: sidebarOpen ? '340px' : '32px' }}
        >
            <button
                onClick={scrollToTop}
                className="back-to-top-btn"
                aria-label="Back to Top (Home key)"
                title="Back to Top (Home)"
            >
                {/* Progress Circle */}
                <svg className="progress-ring" width="50" height="50">
                    <circle
                        className="progress-ring-circle-bg"
                        strokeWidth="2"
                        fill="transparent"
                        r={radius}
                        cx="25"
                        cy="25"
                    />
                    <circle
                        className="progress-ring-circle"
                        strokeWidth="2"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        r={radius}
                        cx="25"
                        cy="25"
                    />
                </svg>

                {/* Arrow Icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="arrow-icon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            </button>
        </div>
    )
}
