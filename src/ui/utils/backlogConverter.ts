/**
 * Converts Nulab Backlog specific markdown syntax to standard GitHub Flavored Markdown
 * so that it can be properly parsed by generic renderers like react-markdown.
 */
export function convertBacklogToGfm(content: string): string {
    if (!content) return content;

    let processed = content;

    // 1. Text formatting
    // Italic: '''Italic''' -> *Italic*
    processed = processed.replace(/'''(.*?)'''/g, '*$1*');

    // Bold: ''Bold'' -> **Bold**
    processed = processed.replace(/''(.*?)''/g, '**$1**');

    // Strike: %%Strike%% -> ~~Strike~~
    // Skip if escaped: \%\%
    // regex is a bit simplistic, but we handle typical %%text%%
    processed = processed.replace(/%%(.*?)%%/g, '~~$1~~');

    // 2. Color formatting (inline CSS)
    // &color(#f00) { Color } -> <span style="color:#f00">Color</span>
    // &color(#ffffff, #abd500) { Color } -> <span style="color:#ffffff;background-color:#abd500">Color</span>
    processed = processed.replace(/&color\(([^,]+?)(?:,\s*([^)]+?))?\)\s*\{\s*([^}]+)\s*\}/g, (_match, fg, bg, text) => {
        let style = `color:${fg.trim()}`;
        if (bg) {
            style += `;background-color:${bg.trim()}`;
        }
        return `<span style="${style}">${text.trim()}</span>`;
    });

    // 3. Code Macro
    // {code} ... {/code} -> ``` ... ```
    processed = processed.replace(/\{code\}/g, '```');
    processed = processed.replace(/\{\/code\}/g, '```');

    // 4. Quotations
    // {quote} ... {/quote}
    processed = processed.replace(/\{quote\}([\s\S]*?)\{\/quote\}/g, (_match, quoteContent) => {
        return quoteContent
            .split('\n')
            .map((line: string) => line.trim() ? `> ${line}` : '>')
            .join('\n');
    });

    // 5. Images and Thumbnails
    // #image(url) -> ![](url)
    // #thumbnail(url) -> ![](url)
    // Ignore if it looks like an attachment ID (numbers) for now, or just map it to an empty image tag
    processed = processed.replace(/#(?:image|thumbnail)\(([^)]+)\)/g, (_match, url) => {
        // if it's just numbers e.g. #image(11), we might not have a URL, but we output standard markdown image
        return `![](${url})`;
    });

    // 6. Links
    // [[Text>URL]] -> [Text](URL)
    // [[Text:URL]] -> [Text](URL)
    processed = processed.replace(/\[\[(.*?)[>|:](.*?)\]\]/g, '[$1]($2)');

    // 7. Cacoo diagram stub
    // #cacoo(path, width, height)
    processed = processed.replace(/#cacoo\((.*?),\s*(\d+),\s*(\d+).*?\)/g, '[Cacoo Diagram $1]()');

    // 8. Revisions / attach
    // #rev(11) -> [r11]()
    processed = processed.replace(/#rev\((.*?)\)/g, '[r$1]()');

    // #attach(file:id) -> [file]()
    processed = processed.replace(/#attach\((.*?):.*?\)/g, '[$1]()');
    // #attach(file) -> [file]()
    processed = processed.replace(/#attach\((.*?)\)/g, '[$1]()');

    // 9. Line breaks
    processed = processed.replace(/&br;/g, '<br/>');

    // 10. Escaping special letters
    processed = processed.replace(/\\\\%/g, '%');

    // 11. Tables without GFM delimiters
    // Backlog tables often do not have |---|---| rows, which GFM requires to render.
    const lines = processed.split('\n');
    const resultLines = [];
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const trimmed = line.trim();
        const isTableLine = trimmed.startsWith('|') && (trimmed.endsWith('|') || trimmed.endsWith('|h'));

        if (isTableLine) {
            const isHeaderPattern = trimmed.endsWith('|h');
            if (isHeaderPattern) {
                line = line.replace(/h$/, ''); // remove h at end of row
            }

            const isDelimiter = /^\|[\s\-:|]+\|$/.test(trimmed) && trimmed.includes('-');

            if (!inTable) {
                inTable = true;
                resultLines.push(line);

                if (!isDelimiter) {
                    const isNextLineDelimiter = i + 1 < lines.length && /^\|[\s\-:|]+\|$/.test(lines[i + 1].trim()) && lines[i + 1].trim().includes('-');
                    if (!isNextLineDelimiter) {
                        const cols = line.split('|').length - 2;
                        const delimiter = '|' + Array(Math.max(1, cols)).fill('---').join('|') + '|';
                        resultLines.push(delimiter);
                    }
                }
            } else {
                resultLines.push(line);
            }
        } else {
            inTable = false;
            resultLines.push(line);
        }
    }
    processed = resultLines.join('\n');

    return processed;
}
