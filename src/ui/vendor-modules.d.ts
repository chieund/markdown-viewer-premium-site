// Ambient types for third-party modules that ship without declarations.
// Pulled in with a triple-slash reference from the files that import them,
// because consumers type-check @mdp/ui's source through their own tsconfig
// (chrome-extension's `include` is only its own src/), so a loose .d.ts here
// would never be seen and `tsc -b` failed with TS7016.

declare module '@plantuml/core' {
    export function render(lines: string[], targetId: string, options?: { dark?: boolean }): void
}

// pdfmake's standard-14 font containers (AFM metrics), passed to
// pdfMake.addFontContainer(); their shape is pdfmake-internal.
declare module 'pdfmake/build/standard-fonts/Helvetica.js' {
    const fontContainer: Record<string, unknown>
    export default fontContainer
}

declare module 'pdfmake/build/standard-fonts/Courier.js' {
    const fontContainer: Record<string, unknown>
    export default fontContainer
}
