import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

interface ImageLightboxProps {
    src: string
    alt?: string
    children?: React.ReactNode
}

interface LightboxContentProps {
    src: string
    alt?: string
    onClose: () => void
}

function LightboxContent({ src, alt, onClose }: LightboxContentProps) {
    return (
        <div className="lightbox-overlay animate-fade-in" onClick={onClose}>
            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={5}
                    centerOnInit
                    centerZoomedOut
                >
                    {({ zoomIn, zoomOut, centerView }) => (
                        <>
                            <div className="lightbox-controls">
                                <button onClick={() => zoomIn()} title="Zoom In" className="control-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                </button>
                                <button onClick={() => zoomOut()} title="Zoom Out" className="control-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                </button>
                                <button onClick={() => centerView(1)} title="Reset View" className="control-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" /><path d="M3 3v9h9" /></svg>
                                </button>
                                <div className="divider"></div>
                                <button onClick={onClose} title="Close" className="control-btn close-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                            <TransformComponent wrapperClass="lightbox-transform-wrapper" contentClass="lightbox-transform-content">
                                <img
                                    src={src}
                                    alt={alt || 'Image preview'}
                                    className="lightbox-image"
                                />
                            </TransformComponent>
                        </>
                    )}
                </TransformWrapper>
            </div>
        </div>
    )
}

export default function ImageLightbox({ src, alt, children }: ImageLightboxProps) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    return (
        <>
            <div
                className="image-wrapper cursor-pointer group"
                onClick={() => setIsOpen(true)}
            >
                {children}
                <div className="image-overlay opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                </div>
            </div>
            {isOpen && createPortal(<LightboxContent src={src} alt={alt} onClose={() => setIsOpen(false)} />, document.body)}
        </>
    )
}