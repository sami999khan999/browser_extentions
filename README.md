# Browser Extensions Collection

A curated collection of premium, developer-focused Chrome extensions designed to enhance productivity and UI/UX workflows.

## 📦 Extensions in this Repository

### 1. [Theme AI (Color Theme Picker)](file:///e:/browser_extentions/ai_color_theme_picker)
**AI-Powered Tailwind CSS Theme Generation**
- Analyzes current website branding (dominant colors, CSS variables, palettes).
- Generates harmonious Tailwind CSS variables for both Light and Dark modes.
- Supports modern color formats like OKLCH, HEX, RGB, HSL, and LCH.
- Integrated with Gemini AI for high-quality, prompt-based theme crafting.

### 2. [YouTube Time Tracker](file:///e:/browser_extentions/youtube_time_tracker)
**Advanced Watch Time Analytics & Break Reminders**
- Monitors YouTube viewing habits with high precision and channel-level attribution.
- Includes an intelligent Shorts Blocker to reduce digital noise.
- Features a smart break reminder system with focus-trapped intervention modals.
- Premium, accessibility-first interface with draggable/resizable sidebar.

### 3. [Quick Copy](file:///e:/browser_extentions/quick_copy)
**Instantaneous Sentence and Word Extraction**
- Features full sentence extraction with intelligent boundary detection.
- Includes word-level extraction for precise control (1 Word, 2 Words, N Words).
- Fully customizable shortcuts supporting mouse buttons and modifier keys.
- Premium, accessibility-first toast notifications for instant visual feedback.

---

## 🛠 Development & Installation

Each extension in this repository follows a modular, dependency-free architecture and uses a custom build script for bundling.

### Quick Start
1. Clone the repository: `git clone <repo-url>`
2. Navigate to an extension folder: `cd <extension-folder>`
3. Run the build script: `node build.js`
4. Load the extension in Chrome:
   - Go to `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the extension folder.

## 🔒 Privacy & Security
All extensions in this collection are built with a **Local-First** philosophy.
- Data (analytics, settings, keys) is stored exclusively on your device.
- No external tracking or telemetry is used.
- AI features communicate directly with Google's Gemini API via your own API key.
