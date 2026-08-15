/**
 * Wraps a raw `.puml`/`.plantuml` file's content in a ```plantuml fence so it
 * renders through the same PlantUmlBlock pipeline as an inline fence in a
 * regular Markdown document. Unlike Mermaid's raw-file converter, no
 * line-scanning heuristic is needed — PlantUML source is always delimited by
 * its own `@startuml`/`@enduml` markers, so the whole file is one diagram.
 */
export function convertPlantUmlToGfm(content: string): string {
    if (!content) return content;

    if (/^```(plantuml|puml|uml)\b/m.test(content)) {
        return content;
    }

    return '```plantuml\n' + content.trimEnd() + '\n```\n';
}
