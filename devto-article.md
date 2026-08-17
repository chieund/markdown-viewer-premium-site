---
title: I built a beautiful Markdown Viewer for Chrome, VS Code, and Desktop — here's what I learned
published: true
description: Markdown Viewer Premium is a cross-platform Markdown previewer with Mermaid diagrams, Math/LaTeX, syntax highlighting, and a glassmorphism UI. One shared React core — deployed everywhere.
tags: webdev, opensource, react, productivity
cover_image: https://raw.githubusercontent.com/chieund/markdown-viewer-premium-site/refs/heads/master/public/screenshots/overview.png
---
## The Problem

Every developer reads Markdown daily — READMEs, docs, notes. But the default rendering is... boring. Raw GitHub files look plain. VS Code's built-in preview is basic. And if you want Mermaid diagrams or LaTeX math? Good luck.

I wanted one tool that renders Markdown beautifully — everywhere I work.

## The Solution: Markdown Viewer Premium 💎

A single React UI core, deployed as:

- 🌍 **Chrome Extension** — renders `.md` files directly in the browser
- 💻 **VS Code Extension** — replaces the default Markdown preview
- 🖥️ **Desktop App** — native app built with Tauri v2

![Overview](https://raw.githubusercontent.com/chieund/markdown-viewer-premium-site/refs/heads/master/public/screenshots/overview.png)

## Features

### Syntax Highlighting (100+ Languages)

One-click copy button on every code block. Supports JavaScript, Python, Go, Rust, SQL, and 100+ more.

![Code Blocks](https://raw.githubusercontent.com/chieund/markdown-viewer-premium-site/refs/heads/master/public/screenshots/code-blocks.png)

### Mermaid Diagrams

Flowcharts, sequence diagrams, gantt charts, pie charts — all rendered natively. Click to expand fullscreen with zoom & pan controls.

![Mermaid Flowchart](https://raw.githubusercontent.com/chieund/markdown-viewer-premium-site/refs/heads/master/public/screenshots/mermaid-flowchart.png)

![Mermaid Fullscreen](https://raw.githubusercontent.com/chieund/markdown-viewer-premium-site/refs/heads/master/public/screenshots/mermaid-fullscreen.png)

### Math & LaTeX

Render equations beautifully with KaTeX — inline and block math supported.

![Math LaTeX](https://raw.githubusercontent.com/chieund/markdown-viewer-premium-site/refs/heads/master/public/screenshots/math-latex.png)

### And More...

- **GitHub Alerts** — NOTE, TIP, IMPORTANT, WARNING, CAUTION blocks
- **Table of Contents** — auto-generated with active section tracking
- **Dark / Light Theme** — toggle with system preference support
- **Image Lightbox** — click to zoom with pan controls
- **PDF & DOC Export** — clean output with one click
- **Keyboard Shortcuts** — navigate, toggle theme, print
- **Auto-Update** — desktop app checks for updates on startup

![Tables](https://raw.githubusercontent.com/chieund/markdown-viewer-premium-site/refs/heads/master/public/screenshots/tables.png)

## Tech Stack

The architecture is a **monorepo with pnpm workspaces**:

```
packages/
├── ui/                  # Shared React component library
├── chrome-extension/    # Chrome/Edge/Brave (Manifest V3)
├── vscode-extension/    # VS Code extension
└── desktop-app/         # Tauri v2 desktop app
```

- **UI**: React 19, TypeScript, Tailwind CSS
- **Markdown**: react-markdown, remark-gfm, rehype-katex
- **Diagrams**: Mermaid
- **Math**: KaTeX
- **Code**: react-syntax-highlighter (Prism)
- **Desktop**: Tauri v2 with auto-updater
- **Build**: Vite, pnpm workspaces
- **Lint**: ESLint + typescript-eslint

### Why Monorepo?

The key insight: **all three platforms render the same Markdown**. By sharing a single `@mdp/ui` package, every bug fix and feature improvement ships to Chrome, VS Code, and Desktop simultaneously.

## Challenges & Lessons Learned

### 1. Windows Line Endings Break Everything

The Table of Contents wasn't working on Windows. After hours of debugging, the culprit was `\r\n` line endings. The heading regex `^(#{1,6})\s+(.+)$` doesn't match when lines end with `\r`.

**Fix:** `content.split(/\r?\n/)` instead of `content.split('\n')`.

### 2. Tauri v2 Changed All the Event Names

Drag & drop wasn't working on the desktop app. Turns out Tauri v2 renamed all drag-drop events:

- `tauri://file-drop` → `tauri://drag-drop`
- `tauri://file-drop-hover` → `tauri://drag-over`
- `tauri://file-drop-cancelled` → `tauri://drag-leave`

### 3. Print CSS is Harder Than You Think

Exporting to PDF from dark theme resulted in a black page. The fix required carefully overriding every CSS variable while preserving Mermaid diagram colors and code block styling.

### 4. Shared Components Need Platform Detection

The DOC export uses `Blob` download in Chrome but needs Tauri's native file dialog on desktop. Solution: detect `window.__TAURI_INTERNALS__` and dynamically import Tauri APIs.

## Try It Out

| Platform | Link |
|----------|------|
| 🌍 Chrome / Edge / Brave | [Chrome Web Store](https://chromewebstore.google.com/detail/markdown-viewer-premium/abnpdibfmmdcjhdakgjeiepimokkhjjo) |
| 💻 VS Code | [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=bumkom.markdown-viewer-premium) |
| 🖥️ Desktop (Windows, macOS & Linux) | [GitHub Releases](https://github.com/chieund/markdown-viewer-premium-site/releases/tag/v1.0.2) |
| 🌐 Website | [markdown-viewer-premium-site.vercel.app](https://markdown-viewer-premium-site.vercel.app) |

## What's Next

- **AI Summary** — summarize documents using Chrome's built-in AI
- **Presentation Mode** — convert Markdown to slides
- **Advanced Search** — full-text search with regex support

---

If you find this useful, I'd appreciate a ⭐ on the [Chrome Web Store](https://chromewebstore.google.com/detail/markdown-viewer-premium/abnpdibfmmdcjhdakgjeiepimokkhjjo) or [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=bumkom.markdown-viewer-premium)!

Built with ❤️ by [Bumkom](https://github.com/chieund)
