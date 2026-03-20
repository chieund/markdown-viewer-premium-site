import MermaidBlock from './MermaidBlock'
import MathBlock from './MathBlock'
import ImageLightbox from './ImageLightbox'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeSlug from 'rehype-slug'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState } from 'react'
import React from 'react'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'

interface MarkdownContentProps {
    content: string
    currentUrl?: string
}

const CodeBlock = ({ language, value }: { language: string, value: string }) => {
    const [copied, setCopied] = useState(false)
    const { resolvedTheme } = useTheme()
    const { success, error } = useToast()
    const isDark = resolvedTheme === 'dark'

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            success('Code copied to clipboard!')
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            error('Failed to copy code')
        }
    }

    return (
        <div className="code-block-wrapper">
            <div className="code-header">
                <span className="lang-tag">{language}</span>
                <button className="copy-btn" onClick={handleCopy}>
                    {copied ? (
                        <span className="flex-center">✓</span>
                    ) : (
                        'Copy'
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                style={isDark ? vscDarkPlus : oneLight}
                language={language}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    backgroundColor: isDark ? '#1e1e1e' : '#fafafa',
                    fontSize: '0.9rem',
                    lineHeight: '1.3', // Tighter line height for ASCII art
                    fontFamily: 'JetBrains Mono, Fira Code, monospace', // Better fonts for box drawing
                    padding: '1.2rem 1.25rem'
                }}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    )
}

export default function MarkdownContent(contentProps: MarkdownContentProps) {
    const { content } = contentProps
    return (
        <div className="markdown-glass">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeSlug, rehypeKatex, rehypeRaw]}
                components={{
                    a(props) {
                        const { node, href, children, ref, ...rest } = props

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
                            } catch (e) {
                                console.warn('Failed to resolve relative URL:', href, e)
                                return <a href={href} {...rest}>{children}</a>
                            }
                        }

                        // Fallback if no currentUrl context
                        return <a href={href} {...rest}>{children}</a>
                    },
                    code(props) {
                        const { children, className, node, ref, ...rest } = props
                        const match = /language-(\w+)/.exec(className || '')

                        // FIX: react-markdown v10+ doesn't always set inline prop
                        // Instead, check if it's inside a <pre> tag (block code)
                        // Inline code: no parent <pre>, no language class
                        // Block code: has parent <pre> OR has language-xxx class
                        const isBlockCode = match || (node && node.tagName === 'code' && node.position)

                        // DEBUG: Log what we're receiving
                        console.log('🔍 Code render:', {
                            hasMatch: !!match,
                            className,
                            hasNode: !!node,
                            preview: String(children).substring(0, 50),
                            willRenderAs: isBlockCode ? 'BLOCK' : 'INLINE'
                        })

                        if (match && match[1] === 'mermaid') {
                            return <MermaidBlock chart={String(children).replace(/\n$/, '')} />
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
                    img({ src, alt, node, ref, ...rest }) {
                        if (!src) return <img {...rest} alt={alt} />
                        return (
                            <ImageLightbox src={src} alt={alt}>
                                <img src={src} alt={alt} {...rest} />
                            </ImageLightbox>
                        )
                    },
                    blockquote(props) {
                        const { children, ...rest } = props;

                        // Extract text content to check for GitHub Alerts
                        let textContent = '';
                        try {
                            // children is often an array or a single React element (e.g. <p>)
                            const childrenArray = Array.isArray(children) ? children : [children];
                            const firstChild: any = childrenArray[0];
                            if (firstChild?.props?.children) {
                                const innerChildren = Array.isArray(firstChild.props.children)
                                    ? firstChild.props.children
                                    : [firstChild.props.children];
                                textContent = String(innerChildren[0] || '');
                            }
                        } catch (e) {
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
                {content}
            </ReactMarkdown>
        </div>
    )
}
