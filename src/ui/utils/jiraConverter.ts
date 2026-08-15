/**
 * Converts Atlassian Jira / Confluence specific wiki markup syntax to standard GitHub Flavored Markdown
 * so that it can be properly parsed by generic renderers like react-markdown.
 */
export function convertJiraToGfm(content: string): string {
    if (!content) return content;

    let processed = content;

    // 1. Headings
    // h1. -> #, h2. -> ##, etc.
    processed = processed.replace(/^h([1-6])\.\s*(.*)$/gm, (_match, level, text) => {
        return '#'.repeat(parseInt(level, 10)) + ' ' + text;
    });

    // 2. Formatting
    // Jira uses *bold* and _italic_
    // Note: Jira does not use **bold** organically. 
    processed = processed.replace(/\*(.+?)\*/g, '**$1**');
    processed = processed.replace(/_([^_]+)_/g, '*$1*');
    // Sanitize +strike+ to ~~strike~~
    processed = processed.replace(/\+(.+?)\+/g, '~~$1~~');

    // 3. Code Macro
    // {code} ... {code} -> ``` ... ```
    // {code:java} ... {code} -> ```java ... ```
    processed = processed.replace(/\{code(?:(:)([a-zA-Z0-9_-]+))?\}/gi, (_match, _colon, lang) => {
        return `\`\`\`${lang || ''}`;
    });

    // 4. Quotations
    // {quote} ... {quote} -> > ...
    processed = processed.replace(/\{quote\}([\s\S]*?)\{quote\}/g, (_match, quoteContent) => {
        return quoteContent
            .split('\n')
            .map((line: string) => line.trim() ? `> ${line}` : '>')
            .join('\n');
    });

    // 5. Links
    // [Title|URL] -> [Title](URL)
    // [URL] -> [URL](URL)
    processed = processed.replace(/\[([^|\]]+)\|([^\]]+)\]/g, '[$1]($2)');

    // 6. Images
    // !image.png! -> ![](image.png)
    // !image.png|thumbnail! -> ![](image.png)
    processed = processed.replace(/!([^|!]+)(?:\|[^!]+)?!/g, '![]($1)');

    return processed;
}
