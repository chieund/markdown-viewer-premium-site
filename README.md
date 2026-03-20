# Markdown Viewer Premium 💎

> The most beautiful Markdown previewer — available for Chrome, VS Code, and Desktop.

A cross-platform Markdown viewer with Mermaid diagrams, Math/LaTeX rendering, syntax highlighting for 100+ languages, and a stunning glassmorphism UI. One shared core, deployed everywhere.

🌐 **Website**: [markdown-viewer-premium-site](https://chieund.github.io/markdown-viewer-premium-site)

## Download

| Platform | Link |
|----------|------|
| 🌍 Chrome / Edge / Brave | [Chrome Web Store](https://chromewebstore.google.com/detail/markdown-viewer-premium/abnpdibfmmdcjhdakgjeiepimokkhjjo) |
| 💻 VS Code | [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=bumkom.markdown-viewer-premium) |
| 🖥️ Desktop (Linux) | [GitHub Releases](https://github.com/chieund/markdown-viewer-premium-site/releases) |

## Features

- **GitHub Flavored Markdown** — tables, task lists, strikethrough, and more
- **Mermaid Diagrams** — flowcharts, sequence diagrams, gantt charts with fullscreen zoom & pan
- **Math / LaTeX** — beautiful equation rendering powered by KaTeX
- **Syntax Highlighting** — 100+ languages with one-click copy
- **GitHub Alerts** — NOTE, TIP, IMPORTANT, WARNING, CAUTION blocks
- **Table of Contents** — auto-generated with active section tracking
- **Dark / Light Theme** — seamless toggle with system preference support
- **Image Lightbox** — click any image to zoom with pan controls
- **Keyboard Shortcuts** — navigate, toggle theme, print, and more
- **PDF Export** — clean print-optimized output
- **Scroll Progress** — gradient progress bar at the top
- **Glassmorphism UI** — modern, premium design with blur and transparency

## Platforms

### Chrome Extension
Automatically renders `.md` and `.markdown` files in the browser — works with local files (`file:///`) and any web URL. Supports Chrome, Edge, and Brave (Manifest V3).

### VS Code Extension
Replaces the default Markdown preview with a premium UI. Open any `.md` file and press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac).

### Desktop App
Native desktop application built with Tauri v2. Open and preview local Markdown files with drag & drop support.

## Tech Stack

- **UI**: React 19, TypeScript, Tailwind CSS
- **Markdown**: react-markdown, remark-gfm, rehype-katex, rehype-slug
- **Diagrams**: Mermaid
- **Math**: KaTeX
- **Code**: react-syntax-highlighter (Prism)
- **Desktop**: Tauri v2
- **Build**: Vite, pnpm workspaces

## Development

```bash
pnpm install
pnpm dev          # Start dev server
pnpm build        # Build for production
```

## License

MIT

---

Made with ❤️ by [Bumkom](https://github.com/chieund)
