/** Saves `blob` to disk — via a native save dialog on the Tauri desktop app,
 * or a browser download otherwise. Shared by every export feature
 * (exportDocx.ts, exportHtml.ts, ...) since the platform-branching logic is
 * identical regardless of what's being exported.
 * Returns `false` if the user cancelled the Tauri save dialog. */
export async function saveBlobAsFile(blob: Blob, options: { filename: string; tauriFilter: { name: string; extensions: string[] } }): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).__TAURI_INTERNALS__) {
        // Dynamic import with a variable specifier to prevent Vite from
        // trying to resolve these (desktop-only) packages in the other two
        // consumer builds (Chrome extension, VS Code extension).
        const dialogMod = '@tauri-apps/plugin-dialog'
        const fsMod = '@tauri-apps/plugin-fs'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { save } = await (import(/* @vite-ignore */ dialogMod) as Promise<any>)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { writeFile } = await (import(/* @vite-ignore */ fsMod) as Promise<any>)
        const filePath = await save({ defaultPath: options.filename, filters: [options.tauriFilter] })
        if (!filePath) return false
        const bytes = new Uint8Array(await blob.arrayBuffer())
        await writeFile(filePath, bytes)
        return true
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = options.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
}
