# Quick Copy

A premium, high-performance Chrome extension designed for instantaneous text extraction. Effortlessly copy full sentences or specific word counts directly under your cursor using customizable mouse and keyboard shortcuts.

## 🚀 Key Features

### 1. Precision Sentence Extraction
- **Intelligent Boundaries**: Automatically detects sentence boundaries using sophisticated regex patterns, ensuring you capture complete thoughts, not just fragments.
- **Context Awareness**: Works across standard web pages, complex document editors, and `contentEditable` regions.

### 2. Multi-Word Copying
- **Dynamic Word Counts**: Custom shortcuts for copying the single word under the cursor, two words, or a user-defined "N" number of words.
- **Punctuation Handling**: Intelligently includes trailing punctuation for a natural copying experience.

### 3. Fully Customizable Shortcuts
- **Modifier Support**: Map actions to any combination of `Ctrl`, `Shift`, `Alt`, and `Meta`.
- **Button Mapping**: Assign triggers to Left-Click, Right-Click, or specific Keyboard keys.
- **Non-Invasive**: Shortcuts are active even while typing in inputs, provided a modifier is held.

### 4. Broad Compatibility
- **Input & Textareas**: Native support for extracting text from form fields and text areas.
- **Google Docs Fallback**: Advanced detection logic handles complex editors like Google Docs via smart selection fallbacks.
- **Shadow DOM Ready**: Designed to work seamlessly with modern web components.

### 5. Premium UI/UX
- **Modern Toast Notifications**: Sleek, non-intrusive visual feedback for every copy action.
- **Zero-Latency**: Optimized for performance with no external dependencies or heavy background processes.

---

## 🛠 Technical Architecture

The extension is built with a minimalist, local-first philosophy using Chrome Extension Manifest V3.

- **`src/content/`**: Houses the core extraction engine (`content.js`) and premium styling (`styles.css`).
- **`src/popup/`**: Provides a clean interface for configuration and shortcut management.
- **`background.js`**: Lightweight service worker for lifecycle management.
- **`chrome.storage.sync`**: Ensures your preferences and shortcuts are synced across all your Chrome instances.

---

## 📦 Installation (Development)

1. Clone this repository or download the source code.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the extension folder.

---

## 🔒 Privacy & Local-First

- **No External Servers**: All text extraction and processing happens locally on your machine.
- **Privacy-First**: This extension does not track your browsing history or the text you copy.
- **Local Storage**: All settings are stored securely within Chrome's local synchronization storage.
