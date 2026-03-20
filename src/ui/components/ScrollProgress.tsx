import { useEffect, useState, type RefObject } from 'react'

interface ScrollProgressProps {
    containerRef: RefObject<HTMLDivElement | null>
}

export default function ScrollProgress({ containerRef }: ScrollProgressProps) {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container
            const winScroll = scrollTop
            const height = scrollHeight - clientHeight
            const scrolled = (winScroll / height) * 100
            setProgress(scrolled)
        }

        container.addEventListener('scroll', handleScroll)
        // Initial calc
        handleScroll()

        return () => {
            container.removeEventListener('scroll', handleScroll)
        }
    }, [containerRef])

    return (
        <div className="scroll-progress-container">
            <div
                className="scroll-progress-bar"
                style={{
                    width: `${progress}%`
                }}
            ></div>
        </div>
    )
}
