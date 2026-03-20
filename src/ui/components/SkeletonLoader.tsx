export function SkeletonLoader() {
    return (
        <div className="skeleton-loader">
            {/* Title Skeleton */}
            <div className="skeleton-title" />
            
            {/* Paragraph Skeletons */}
            {[...Array(3)].map((_, i) => (
                <div key={`para-${i}`} className="skeleton-paragraph">
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" style={{ width: '80%' }} />
                </div>
            ))}
            
            {/* Heading Skeleton */}
            <div className="skeleton-heading" />
            
            {/* More Paragraphs */}
            {[...Array(2)].map((_, i) => (
                <div key={`para2-${i}`} className="skeleton-paragraph">
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" style={{ width: '90%' }} />
                </div>
            ))}
            
            {/* Code Block Skeleton */}
            <div className="skeleton-code-block">
                <div className="skeleton-code-line" style={{ width: '60%' }} />
                <div className="skeleton-code-line" style={{ width: '80%' }} />
                <div className="skeleton-code-line" style={{ width: '45%' }} />
                <div className="skeleton-code-line" style={{ width: '70%' }} />
            </div>
            
            {/* More Content */}
            <div className="skeleton-paragraph">
                <div className="skeleton-line" />
                <div className="skeleton-line" />
            </div>
        </div>
    )
}
