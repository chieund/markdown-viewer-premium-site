/**
 * Detects and wraps only Mermaid diagram blocks, leaving plain text as-is.
 */
export function convertMermaidToGfm(content: string): string {
    if (!content) return content;

    if (/^```mermaid\s*[\s\S]*?^```$/gm.test(content)) {
        return content;
    }

    const diagramStartPattern = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|mindmap|journey|gitGraph|blockDiagram|c4Diagram)\s/i;
    const diagramContPattern = /^[\sA-Za-z0-9\-_|+<>[\](){}]/;
    
    const lines = content.split('\n');
    const result: string[] = [];
    let inDiagram = false;
    let diagramLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (inDiagram) {
            if (trimmed === '' || (i > 0 && !diagramContPattern.test(trimmed))) {
                result.push('```mermaid');
                result.push(...diagramLines);
                result.push('```');
                diagramLines = [];
                inDiagram = false;
                if (trimmed !== '') {
                    result.push(line);
                }
            } else {
                diagramLines.push(line);
            }
        } else if (diagramStartPattern.test(trimmed)) {
            inDiagram = true;
            diagramLines = [line];
        } else {
            result.push(line);
        }
    }
    
    if (inDiagram && diagramLines.length > 0) {
        result.push('```mermaid');
        result.push(...diagramLines);
        result.push('```');
    }
    
    return result.join('\n');
}
