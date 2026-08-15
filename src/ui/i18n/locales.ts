/**
 * Translation dictionaries. Deliberately flat (no nesting) so a missing
 * key is a simple, greppable typo rather than a path-lookup bug.
 *
 * Coverage note: this covers the sidebar chrome (Outline panel), the
 * Keyboard Shortcuts modal, and the Search panel — the highest-traffic,
 * most "app chrome"-like surfaces. It does NOT yet cover MermaidBlock's
 * per-diagram tooltips or the toast strings in MarkdownViewer.tsx; those
 * are still English-only pending a follow-up pass (see PROGRESS doc).
 */

export const en = {
    outline: 'Outline',
    filterPlaceholder: 'Filter...',
    noSectionsFound: 'No sections found',
    rawSource: 'Raw Source',
    preview: 'Preview',
    exportPdf: 'Export PDF',
    exportWord: 'Export Word',
    exportHtml: 'Export HTML',
    keyboardShortcuts: 'Keyboard Shortcuts',
    language: 'Language',

    shortcutsTitle: 'Keyboard Shortcuts',
    shortcutsFooter: 'Press {key} anytime to toggle this help.',
    categoryNavigation: 'Navigation',
    categoryAppearance: 'Appearance',
    categoryActions: 'Actions',
    categoryHelp: 'Help',
    categoryGeneral: 'General',
    shortcutToggleToc: 'Toggle Table of Contents',
    shortcutFind: 'Find in Document',
    shortcutToggleTheme: 'Toggle Theme',
    shortcutPrint: 'Print / Export PDF',
    shortcutShowShortcuts: 'Show Keyboard Shortcuts',
    shortcutScrollTop: 'Scroll to Top',
    shortcutScrollBottom: 'Scroll to Bottom',
    shortcutCloseModal: 'Close Modal / Menu',

    searchPlaceholder: 'Find in document...',
    searchCaseSensitive: 'Case sensitive',
    searchWholeWord: 'Whole word',
    searchRegex: 'Regular expression',
    searchPrevMatch: 'Previous match (Shift+Enter)',
    searchNextMatch: 'Next match (Enter)',
    searchClose: 'Close (Esc)',
} as const

export const vi: Record<keyof typeof en, string> = {
    outline: 'Mục lục',
    filterPlaceholder: 'Lọc...',
    noSectionsFound: 'Không có mục nào',
    rawSource: 'Mã gốc',
    preview: 'Xem trước',
    exportPdf: 'Xuất PDF',
    exportWord: 'Xuất Word',
    exportHtml: 'Xuất HTML',
    keyboardShortcuts: 'Phím tắt',
    language: 'Ngôn ngữ',

    shortcutsTitle: 'Phím tắt',
    shortcutsFooter: 'Nhấn {key} bất kỳ lúc nào để mở/đóng bảng này.',
    categoryNavigation: 'Điều hướng',
    categoryAppearance: 'Giao diện',
    categoryActions: 'Hành động',
    categoryHelp: 'Trợ giúp',
    categoryGeneral: 'Chung',
    shortcutToggleToc: 'Đóng/mở Mục lục',
    shortcutFind: 'Tìm trong tài liệu',
    shortcutToggleTheme: 'Đổi giao diện sáng/tối',
    shortcutPrint: 'In / Xuất PDF',
    shortcutShowShortcuts: 'Hiện bảng phím tắt',
    shortcutScrollTop: 'Cuộn lên đầu',
    shortcutScrollBottom: 'Cuộn xuống cuối',
    shortcutCloseModal: 'Đóng cửa sổ / menu',

    searchPlaceholder: 'Tìm trong tài liệu...',
    searchCaseSensitive: 'Phân biệt hoa/thường',
    searchWholeWord: 'Nguyên từ',
    searchRegex: 'Biểu thức chính quy',
    searchPrevMatch: 'Kết quả trước (Shift+Enter)',
    searchNextMatch: 'Kết quả tiếp (Enter)',
    searchClose: 'Đóng (Esc)',
}

export type TranslationKey = keyof typeof en
export type Locale = 'en' | 'vi'

export const DICTIONARIES: Record<Locale, Record<TranslationKey, string>> = { en, vi }
