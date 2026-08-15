import { useEffect, useMemo, useRef } from 'react'
import MermaidBlock from './MermaidBlock'
import PlantUmlBlock from './PlantUmlBlock'
import DotBlock from './DotBlock'
import VegaBlock from './VegaBlock'
import MathBlock from './MathBlock'
import ImageLightbox from './ImageLightbox'
import CodeBlock from './CodeBlock'
import { PLANTUML_LANGUAGE_TAGS, DOT_LANGUAGE_TAGS, VEGA_LANGUAGE_TAGS } from '../utils/featureDisplay'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeSlug from 'rehype-slug'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import React from 'react'
import { convertBacklogToGfm } from '../utils/backlogConverter'
import { convertJiraToGfm } from '../utils/jiraConverter'
import { convertMermaidToGfm } from '../utils/mermaidConverter'
import { convertPlantUmlToGfm } from '../utils/plantumlConverter'
import { convertDotToGfm } from '../utils/dotConverter'
import { convertVegaToGfm } from '../utils/vegaConverter'
import rehypeLineNumbers from '../utils/rehypeLineNumbers'

/** Recursively flattens rendered React children back to plain text — used to
 * pull the original source text out of a raw HTML `<pre>` (whose children
 * are already-rendered React nodes by the time the `pre` component sees
 * them, not the markdown source string `code` gets). */
function extractPlainText(node: React.ReactNode): string {
    if (node == null || typeof node === 'boolean') return ''
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(extractPlainText).join('')
    if (React.isValidElement(node)) {
        const elementProps = node.props as { children?: React.ReactNode }
        return extractPlainText(elementProps.children)
    }
    return ''
}

interface MarkdownContentProps {
    content: string
    currentUrl?: string
    /** Fires as each ```mermaid block finishes its first render pass — lets a
     * host (e.g. the VS Code extension) show "Rendering N/total" feedback. */
    onMermaidRenderProgress?: (completed: number, total: number) => void
}

export default function MarkdownContent(contentProps: MarkdownContentProps) {
    const { content, currentUrl, onMermaidRenderProgress } = contentProps

    let processedContent = content;
    const ext = currentUrl ? currentUrl.split('.').pop()?.toLowerCase() : '';

    if (ext === 'jira' || ext === 'confluence') {
        processedContent = convertJiraToGfm(content);
    } else if (ext === 'mmd' || ext === 'mermaid') {
        processedContent = convertMermaidToGfm(content);
    } else if (ext === 'puml' || ext === 'plantuml') {
        processedContent = convertPlantUmlToGfm(content);
    } else if (ext === 'dot' || ext === 'gv' || ext === 'graphviz') {
        processedContent = convertDotToGfm(content);
    } else if (ext === 'vg' || ext === 'vl') {
        processedContent = convertVegaToGfm(content, ext === 'vl');
    } else if (ext === 'backlog' || ext === 'bl' || ext === 'blg') {
        processedContent = convertBacklogToGfm(content);
    }

    // Recomputed per content change; drives the completed/total counter below.
    const mermaidTotal = useMemo(
        () => (processedContent.match(/^```mermaid\b/gm) || []).length,
        [processedContent]
    )
    const completedRef = useRef(0)
    // New content → a fresh render pass, even if the block count is unchanged.
    useEffect(() => {
        completedRef.current = 0
        onMermaidRenderProgress?.(0, mermaidTotal)
        // onMermaidRenderProgress intentionally excluded: platforms pass a
        // stable-enough callback, and including it would refire this on
        // every parent re-render, not just on content changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processedContent, mermaidTotal])
    const handleMermaidRendered = () => {
        if (!onMermaidRenderProgress) return
        completedRef.current = Math.min(mermaidTotal, completedRef.current + 1)
        onMermaidRenderProgress(completedRef.current, mermaidTotal)
    }

    return (
        <div className="markdown-glass">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeLineNumbers, rehypeSlug, rehypeKatex, rehypeRaw]}
                components={{
                    a(props) {
                        const { node: _node, href, children, ref: _ref, ...rest } = props

                        if (!href) return <a {...rest}>{children}</a>

                        // 1. External links (http, https, mailto)
                        if (href.startsWith('http') || href.startsWith('mailto:')) {
                            return (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    {...rest}
                                    className="external-link"
                                >
                                    {children}
                                    <span className="sr-only">(opens in a new tab)</span>
                                </a>
                            )
                        }

                        // 2. Anchor links (in-page navigation)
                        if (href.startsWith('#')) {
                            return <a href={href} {...rest}>{children}</a>
                        }

                        // 3. Internal/Relative links
                        // If we have a currentUrl, we try to resolve relative paths
                        if (contentProps.currentUrl) {
                            try {
                                // Resolve relative to the currentUrl
                                // Using URL constructor to handle ../ and ./ correctly
                                const resolvedUrl = new URL(href, contentProps.currentUrl).href

                                // Construct app navigation URL
                                // We keep the current origin and pathname, just update the ?url parameter
                                const appNavUrl = `?url=${encodeURIComponent(resolvedUrl)}`

                                return (
                                    <a
                                        href={appNavUrl}
                                        {...rest}
                                        onClick={() => {
                                            // Optional: You could use history.pushState here for SPA feel
                                            // But for now default anchor behavior with ?url= param works
                                        }}
                                    >
                                        {children}
                                    </a>
                                )
                            } catch {
                                console.warn('Failed to resolve relative URL:', href)
                                return <a href={href} {...rest}>{children}</a>
                            }
                        }

                        // Fallback if no currentUrl context
                        return <a href={href} {...rest}>{children}</a>
                    },
                    code(props) {
                        const { children, className, node: _node, ref: _ref, ...rest } = props
                        const match = /language-([\w-]+)/.exec(className || '')

                        // FIX: react-markdown v10+ doesn't always set inline prop
                        // Instead, check if it's inside a <pre> tag (block code)
                        // Inline code: no parent <pre>, no language class
                        // Block code: has parent <pre> OR has language-xxx class
                        // isBlockCode logic removed as it was unused and causing lint errors

                        if (match && match[1] === 'mermaid') {
                            return <MermaidBlock chart={String(children).replace(/\n$/, '')} onRendered={handleMermaidRendered} />
                        }

                        if (match && (PLANTUML_LANGUAGE_TAGS as readonly string[]).includes(match[1])) {
                            return <PlantUmlBlock source={String(children).replace(/\n$/, '')} />
                        }

                        if (match && (DOT_LANGUAGE_TAGS as readonly string[]).includes(match[1])) {
                            return <DotBlock source={String(children).replace(/\n$/, '')} />
                        }

                        if (match && (VEGA_LANGUAGE_TAGS as readonly string[]).includes(match[1])) {
                            return <VegaBlock source={String(children).replace(/\n$/, '')} mode={match[1] === 'vl' || match[1] === 'vegalite' || match[1] === 'vega-lite' ? 'vega-lite' : 'vega'} />
                        }

                        if (match && match[1] === 'math') {
                            return <MathBlock formula={String(children).replace(/\n$/, '')} />
                        }

                        // If has language class, it's a block code (```language)
                        if (match) {
                            return <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                        }

                        // If no className and simple content, it's inline code (`code`)
                        // Inline code typically doesn't have newlines
                        const hasNewline = String(children).includes('\n')
                        if (!hasNewline && !className) {
                            return (
                                <code {...rest} className={className}>
                                    {children}
                                </code>
                            )
                        }

                        // Otherwise, treat as block code (``` without language)
                        return <CodeBlock language="text" value={String(children).replace(/\n$/, '')} />
                    },
                    pre(props) {
                        const { children, node } = props
                        const firstChild = node?.children?.[0]
                        const wrapsFencedCode = firstChild != null && 'tagName' in firstChild && firstChild.tagName === 'code'

                        if (wrapsFencedCode) {
                            // The `code` component above already substituted a fully
                            // self-styled block (CodeBlock/MermaidBlock/PlantUmlBlock/
                            // MathBlock) for every fenced code block — this <pre> is
                            // just react-markdown's default wrapper around it and would
                            // otherwise double-box it, so render it as a no-op.
                            return <>{children}</>
                        }

                        // A <pre> the author wrote directly as raw HTML (e.g. GitHub's
                        // common <details><pre>@startuml...</pre></details>
                        // collapsible-example pattern) — route it through the same
                        // CodeBlock used for fenced code so it gets real syntax
                        // highlighting instead of rendering as unstyled plain text.
                        return <CodeBlock language="text" value={extractPlainText(children).replace(/\n$/, '')} />
                    },
                    img({ src, alt, node: _node, ref: _ref, ...rest }) {
                        if (!src) return <img {...rest} alt={alt} />

                        // Resolve relative paths if currentUrl is provided
                        let resolvedSrc = src;
                        if (currentUrl && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('blob:')) {
                            try {
                                resolvedSrc = new URL(src, currentUrl).href;
                            } catch (e) {
                                console.warn('Failed to resolve image URL:', src, e);
                            }
                        }

                        return (
                            <ImageLightbox src={resolvedSrc} alt={alt}>
                                <img src={resolvedSrc} alt={alt} {...rest} />
                            </ImageLightbox>
                        )
                    },
                    blockquote(props) {
                        const { children, node: _node, ...rest } = props;

                        // Extract text content to check for GitHub Alerts
                        let textContent = '';
                        try {
                            // children is often an array or a single React element (e.g. <p>).
                            // rehypeRaw inserts whitespace-only text nodes ("\n") around block
                            // children, so skip those and grab the first actual element.
                            const childrenArray = Array.isArray(children) ? children : [children];
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const firstChild: any = childrenArray.find((c: unknown) => c !== null && typeof c === 'object' && 'props' in c);
                            if (firstChild?.props?.children) {
                                const innerChildren = Array.isArray(firstChild.props.children)
                                    ? firstChild.props.children
                                    : [firstChild.props.children];
                                textContent = String(innerChildren[0] || '');
                            }
                        } catch {
                            // Fallback if parsing fails
                        }

                        const alertMatch = textContent.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

                        if (alertMatch) {
                            const type = alertMatch[1].toUpperCase();
                            const iconMap: Record<string, string> = {
                                NOTE: 'ℹ️',
                                TIP: '💡',
                                IMPORTANT: '🚀',
                                WARNING: '⚠️',
                                CAUTION: '🛑'
                            };

                            const colorMap: Record<string, { bg: string, border: string, text: string }> = {
                                NOTE: { bg: 'rgba(56, 189, 248, 0.1)', border: '#38bdf8', text: '#38bdf8' },
                                TIP: { bg: 'rgba(52, 211, 153, 0.1)', border: '#34d399', text: '#34d399' },
                                IMPORTANT: { bg: 'rgba(167, 139, 250, 0.1)', border: '#a78bfa', text: '#a78bfa' },
                                WARNING: { bg: 'rgba(251, 191, 36, 0.1)', border: '#fbbf24', text: '#fbbf24' },
                                CAUTION: { bg: 'rgba(248, 113, 113, 0.1)', border: '#f87171', text: '#f87171' }
                            };

                            const styles = colorMap[type];

                            return (
                                <div style={{
                                    borderLeft: `4px solid ${styles.border}`,
                                    backgroundColor: styles.bg,
                                    padding: '1rem 1.25rem',
                                    margin: '1.5rem 0',
                                    borderRadius: '0 8px 8px 0',
                                    position: 'relative'
                                }} className="github-alert">
                                    <div style={{ fontWeight: 600, color: styles.text, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <span>{iconMap[type]}</span>
                                        <span>{type}</span>
                                    </div>
                                    <div className="alert-content" style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                                        {/* CSS will hide the original [!TYPE] text via a small hack or we just render the raw children but skip the first text node. For simplicity, since the user usually provides a new line after the tag, we let it render but use CSS to hide the raw tag if possible, or gracefully accept it. Actually, we can just process the children here to slice it out! */}
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {React.Children.map(children, (child: any) => {
                                            if (child?.props?.children) {
                                                const innerArr = Array.isArray(child.props.children) ? child.props.children : [child.props.children];
                                                if (typeof innerArr[0] === 'string' && innerArr[0].startsWith(`[!${type}]`)) {
                                                    // Strip out the [!TYPE] tag
                                                    const newInner = [...innerArr];
                                                    newInner[0] = newInner[0].replace(new RegExp(`^\\[!${type}\\]\\s*`, 'i'), '');
                                                    return React.cloneElement(child, { children: newInner });
                                                }
                                            }
                                            return child;
                                        })}
                                    </div>
                                </div>
                            );
                        }

                        // Standard blockquote fallback
                        return <blockquote {...rest}>{children}</blockquote>;
                    }
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    )
}
