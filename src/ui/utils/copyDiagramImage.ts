import { toCanvas } from 'html-to-image'

interface CopyDiagramImageOptions {
    /** Elements whose combined bounding box defines the crop region. Defaults
     * to every `<svg>` inside `container` — right for a plain-SVG diagram
     * (PlantUML, Mermaid Classic); pass React Flow's own node/edge elements
     * instead for RF views, since those aren't wrapped in one root `<svg>`. */
    targets?: Element[]
    backgroundColor: string
}

/** Rasterizes `container` to a PNG cropped to the tight bounding box of
 * `targets` (plus a little padding) and writes it to the clipboard. Shared
 * by MermaidBlock and PlantUmlBlock so the crop math isn't duplicated. */
export async function copyDiagramImageToClipboard(container: HTMLElement, options: CopyDiagramImageOptions): Promise<void> {
    const targets = options.targets ?? Array.from(container.querySelectorAll('svg'))

    type Rect = { left: number; top: number; right: number; bottom: number }
    const containerRect = container.getBoundingClientRect()

    const rects: Rect[] = []
    for (const el of targets) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) continue
        rects.push({
            left: r.left - containerRect.left,
            top: r.top - containerRect.top,
            right: r.right - containerRect.left,
            bottom: r.bottom - containerRect.top,
        })
    }

    const bounds: Rect | null = rects.length ? {
        left: Math.min(...rects.map(r => r.left)),
        top: Math.min(...rects.map(r => r.top)),
        right: Math.max(...rects.map(r => r.right)),
        bottom: Math.max(...rects.map(r => r.bottom)),
    } : null

    // html-to-image's own `width`/`height` options resize the actual cloned
    // node before rasterizing it (not an output crop frame), so they can't
    // be used to crop. Instead: rasterize the full container, then crop
    // that raster with a second canvas.
    const pixelRatio = 2
    const fullCanvas = await toCanvas(container, {
        backgroundColor: options.backgroundColor,
        pixelRatio,
    })

    const padding = 16
    const cropX = bounds ? Math.max(0, bounds.left - padding) : 0
    const cropY = bounds ? Math.max(0, bounds.top - padding) : 0
    const cropRight = bounds ? Math.min(container.clientWidth, bounds.right + padding) : container.clientWidth
    const cropBottom = bounds ? Math.min(container.clientHeight, bounds.bottom + padding) : container.clientHeight
    const cropWidth = Math.max(1, cropRight - cropX)
    const cropHeight = Math.max(1, cropBottom - cropY)

    const cropped = document.createElement('canvas')
    cropped.width = cropWidth * pixelRatio
    cropped.height = cropHeight * pixelRatio
    const ctx = cropped.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D canvas context')
    ctx.drawImage(
        fullCanvas,
        cropX * pixelRatio, cropY * pixelRatio, cropWidth * pixelRatio, cropHeight * pixelRatio,
        0, 0, cropWidth * pixelRatio, cropHeight * pixelRatio,
    )

    const blob: Blob | null = await new Promise(resolve => cropped.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('canvas.toBlob returned no image data')
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
