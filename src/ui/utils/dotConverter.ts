/**
 * Wraps a raw `.dot`/`.gv` file's content in a ```dot fence so it renders
 * through the DotBlock pipeline as an inline fence in a regular Markdown
 * document. DOT source is plain Graphviz text — the whole file is one diagram.
 */
export function convertDotToGfm(content: string): string {
    if (!content) return content;

    if (/^```(dot|graphviz|gv)\b/m.test(content)) {
        return content;
    }

    return '```dot\n' + content.trimEnd() + '\n```\n';
}
