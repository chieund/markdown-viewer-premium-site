// Ambient module for Vite's `?url` import suffix (returns the built asset's
// URL as a string instead of trying to parse the file as JS/TS). Declared
// locally rather than pulling in `vite/client` globally, since @mdp/ui has
// no Vite build of its own — this only needs to satisfy consumers' `tsc`
// passes (chrome-extension, vscode-extension) that type-check its source
// directly. Same pattern `vite/client`'s own types use.
declare module '*?url' {
    const url: string
    export default url
}
