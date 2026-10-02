import { convertBacklogToGfm } from './backlogConverter'
import { convertJiraToGfm } from './jiraConverter'
import { convertMermaidToGfm } from './mermaidConverter'
import { convertPlantUmlToGfm } from './plantumlConverter'
import { convertDotToGfm } from './dotConverter'
import { convertVegaToGfm } from './vegaConverter'

/**
 * Normalizes a document to GitHub Flavored Markdown based on the file
 * extension in `currentUrl` (not content sniffing). The single place that
 * decides which dialect a file is in — used for rendering and for the
 * "Copy as Jira/Backlog" export, so both see the same Markdown.
 */
export function toGfm(content: string, currentUrl?: string): string {
    const ext = currentUrl ? currentUrl.split('.').pop()?.toLowerCase() : ''

    if (ext === 'jira' || ext === 'confluence') return convertJiraToGfm(content)
    if (ext === 'mmd' || ext === 'mermaid') return convertMermaidToGfm(content)
    if (ext === 'puml' || ext === 'plantuml') return convertPlantUmlToGfm(content)
    if (ext === 'dot' || ext === 'gv' || ext === 'graphviz') return convertDotToGfm(content)
    if (ext === 'vg' || ext === 'vl') return convertVegaToGfm(content, ext === 'vl')
    if (ext === 'backlog' || ext === 'bl' || ext === 'blg') return convertBacklogToGfm(content)
    return content
}
