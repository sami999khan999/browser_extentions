document.addEventListener('DOMContentLoaded', () => {
    // Icons
    const ICONS = {
        settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
        back: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
        key: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4a1 1 0 0 0-1.4 0l-2.1 2.1a1 1 0 0 0 0 1.4ZM7 18l-3 3m5-5-7-7c-2 1-2 5 0 7l3 3c2 2 6 2 7 0Z"/></svg>`,
        trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
        check: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
    };

    // UI Elements
    const views = {
        setup: document.getElementById('setup-view'),
        main: document.getElementById('main-view'),
        result: document.getElementById('result-view'),
        error: document.getElementById('error-display')
    };

    const keyListEls = {
        section: document.getElementById('key-list-section'),
        list: document.getElementById('key-list')
    };

    const controls = {
        apiKeyName: document.getElementById('api-key-name'),
        apiKey: document.getElementById('api-key'),
        saveKey: document.getElementById('save-key'),
        resetApi: document.getElementById('reset-api'),
        userPrompt: document.getElementById('user-prompt'),
        generateBtn: document.getElementById('generate-btn'),
        btnContent: document.getElementById('btn-content'),
        spinner: document.getElementById('spinner'),
        arrowIcon: document.getElementById('arrow-icon'),
        startOver: document.getElementById('start-over'),
        statusText: document.getElementById('system-status'),
        generatingPreview: document.getElementById('generating-preview'),
        liveCodeStream: document.getElementById('live-code-stream')
    };

    const results = {
        copyLight: document.getElementById('copy-light'),
        copyDark: document.getElementById('copy-dark'),
        copyFull: document.getElementById('copy-full'),
        lightPalette: document.getElementById('light-palette'),
        darkPalette: document.getElementById('dark-palette')
    };

    let geminiApiKey = '';
    let apiKeys = [];
    let themes = { light: '', dark: '' };
    let currentView = '';
    let isGenerating = false;

    const renderKeyList = () => {
        console.log('AI Theme Picker: Rendering Key List...', apiKeys);
        if (apiKeys.length === 0) {
            console.log('AI Theme Picker: No keys found.');
            keyListEls.section.classList.add('hidden');
            return;
        }

        keyListEls.section.classList.remove('hidden');
        keyListEls.list.innerHTML = '';

        apiKeys.forEach((item) => {
            const isActive = item.key === geminiApiKey;
            const maskedKey = item.key.slice(0, 6) + '...' + item.key.slice(-4);
            
            const element = document.createElement('div');
            element.className = `key-item ${isActive ? 'active' : ''}`;
            element.innerHTML = `
                <div class="key-info">
                    <div class="key-name-row">
                        <span class="key-icon">${ICONS.key}</span>
                        <span class="key-name">${item.name || 'Unnamed Key'}</span>
                    </div>
                    <span class="key-mask">${maskedKey}</span>
                </div>
                <div class="key-actions">
                    ${isActive ? `<span class="key-status-badge">${ICONS.check} Active</span>` : `<button class="key-action-btn activate" title="Activate Key">Use</button>`}
                    <button class="key-action-btn delete" title="Delete Key">${ICONS.trash}</button>
                </div>
            `;

            if (!isActive) {
                element.querySelector('.activate').onclick = () => activateKey(item.key);
            }
            element.querySelector('.delete').onclick = () => deleteKey(item.key);

            keyListEls.list.appendChild(element);
        });
    };

    const activateKey = (key) => {
        geminiApiKey = key;
        chrome.storage.local.set({ geminiApiKey: key }, () => {
            renderKeyList();
            showView('main');
            updateStatus('Key Activated');
        });
    };

    const deleteKey = (key) => {
        apiKeys = apiKeys.filter(k => k.key !== key);
        const updates = { apiKeys: apiKeys };
        
        if (geminiApiKey === key) {
            geminiApiKey = apiKeys.length > 0 ? apiKeys[0].key : '';
            updates.geminiApiKey = geminiApiKey;
        }

        chrome.storage.local.set(updates, () => {
            renderKeyList();
            if (!geminiApiKey) {
                showView('setup');
            }
        });
    };

    const showView = (viewName) => {
        currentView = viewName;
        Object.values(views).forEach(v => v.classList.add('hidden'));
        views[viewName].classList.remove('hidden');
        views.error.classList.add('hidden');
        updateStatus(viewName === 'setup' ? 'Authentication Required' : 'Ready');

        if (viewName === 'setup') {
            renderKeyList();
        }
        
        // Toggle the header button icon and function
        if (viewName === 'setup') {
            controls.resetApi.innerHTML = ICONS.back;
            controls.resetApi.title = "Back to Generator";
            // Explicitly show/hide based on key existence if you want, 
            // but the user wants it to be a back button.
            if (!geminiApiKey) {
                controls.resetApi.classList.add('hidden');
            } else {
                controls.resetApi.classList.remove('hidden');
            }
        } else {
            controls.resetApi.innerHTML = ICONS.settings;
            controls.resetApi.title = "API Settings";
            controls.resetApi.classList.remove('hidden');
        }
    };

    const updateStatus = (text) => {
        controls.statusText.textContent = text;
    };

    const getFriendlyError = (error) => {
        const msg = (error.message || '').toLowerCase();
        
        // Network errors
        if (msg.includes('failed to fetch') || msg.includes('network')) {
            return "Connection failed. Please check your internet.";
        }

        // Quota / Rate Limit detection
        const isQuotaWarning = msg.includes('quota') || msg.includes('limit') || msg.includes('429') || msg.includes('exhausted') || msg.includes('exceeded');
        
        if (isQuotaWarning) {
            return "Quota is expired! Please try again tomorrow or use a different API key.";
        }

        // Auth / API Key
        if (msg.includes('key') || msg.includes('401') || msg.includes('403')) {
            return "Invalid API Key. Please click the ⚙️ icon to reset it.";
        }

        // Model issues
        if (msg.includes('model') && (msg.includes('not found') || msg.includes('404'))) {
            return "Model 'gemini-2.5-flash' not found (404). Please ensure this model is available in your region or try again later.";
        }

        // Server issues
        if (msg.includes('500') || msg.includes('503') || msg.includes('overloaded')) {
            return "Gemini is currently busy. Please try again in 10 seconds.";
        }

        // Safety / Content
        if (msg.includes('safety') || msg.includes('blocked')) {
            return "The request was blocked by AI safety filters. Try a different prompt.";
        }

        // Catch-all for other errors, ensuring we show the original message if possible
        if (error.message && error.message.length > 0) {
            return error.message;
        }

        return "An unexpected error occurred. Please check the console for details.";
    };

    const showWarning = (message) => {
        if (!views.error) return;
        views.error.textContent = message;
        views.error.classList.add('warning');
        views.error.classList.remove('hidden');
        updateStatus('Notice');
        
        views.error.classList.add('shake');
        setTimeout(() => {
            if (views.error) views.error.classList.remove('shake');
        }, 400);
        
        setTimeout(() => {
            if (views.error) {
                views.error.classList.add('hidden');
                views.error.classList.remove('warning');
            }
            if (controls.statusText && controls.statusText.textContent === 'Notice') {
                updateStatus('Ready');
            }
        }, 4000);
    };

    const showError = (error) => {
        const msg = (error?.message || String(error)).toLowerCase();
        const isValidationOrQuota = msg.includes('api key') || 
                                    msg.includes('missing') || 
                                    msg.includes('429') || 
                                    msg.includes('quota') || 
                                    msg.includes('limit') ||
                                    msg.includes('exhausted');

        if (isValidationOrQuota) {
            // console.warn('AI Theme Picker: Notice', msg);
        } else {
            console.log('AI Theme Picker: Info', error);
        }

        if (!views.error) {
            console.log('Notice: Error display element missing!');
            return;
        }

        const friendlyMsg = getFriendlyError(error);
        views.error.textContent = friendlyMsg;
        
        if (isValidationOrQuota) {
            views.error.classList.add('warning');
            updateStatus('Notice');
        } else {
            views.error.classList.remove('warning');
            updateStatus('Error occurred');
        }

        views.error.classList.remove('hidden');
        
        // Add shake animation
        views.error.classList.add('shake');
        setTimeout(() => {
            if (views.error) views.error.classList.remove('shake');
        }, 400);
        
        setTimeout(() => {
            if (views.error) {
                views.error.classList.add('hidden');
                views.error.classList.remove('warning');
            }
            if (controls.statusText && (controls.statusText.textContent === 'Error occurred' || controls.statusText.textContent === 'Notice')) {
                updateStatus('Ready');
            }
        }, 6000);
    };

    // Load API Keys and perform initial scan
    chrome.storage.local.get(['geminiApiKey', 'apiKeys'], (result) => {
        console.log('AI Theme Picker: Storage loaded', result);
        let rawKeys = result.apiKeys || [];
        // Migration: Convert string keys to objects if necessary
        apiKeys = rawKeys.map(k => {
            if (typeof k === 'string') return { key: k, name: 'Imported Key' };
            if (k && k.key) return k;
            return null;
        }).filter(k => k !== null);
        
        if (result.geminiApiKey) {
            geminiApiKey = result.geminiApiKey;
            if (!apiKeys.some(k => k.key === geminiApiKey)) {
                apiKeys.push({ key: geminiApiKey, name: 'Active Key' });
                chrome.storage.local.set({ apiKeys });
            }
            showView('main');
            performInitialScan();
        } else {
            showView('setup');
        }
        renderKeyList();
    });

    const extractColorsFunc = () => {
        const body = document.body;
        const root = document.documentElement;
        const btn = document.querySelector('button, a.btn, [role="button"], h1, h2');
        
        // Use a hidden canvas to normalize ALL CSS color formats (lab, oklab, named, etc.) to sRGB HEX
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d');

        const toHex = (color) => {
            if (!color || color === 'transparent' || color === 'none' || color === 'rgba(0, 0, 0, 0)') return null;
            
            // Fallback for cases where canvas might be blocked by CSP
            try {
                if (!ctx) throw new Error("Canvas blocked");
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join("").toUpperCase();
            } catch (e) {
                // Secondary fallback: regex for rgb/rgba (limited accuracy for lab/oklch)
                const rgb = color.match(/\d+/g);
                if (rgb && rgb.length >= 3) {
                    return "#" + rgb.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join("").toUpperCase();
                }
                return null;
            }
        };

        const getVar = (name) => {
            const val = window.getComputedStyle(root).getPropertyValue(name).trim();
            return val ? toHex(val) : null;
        };

        // Common Shadcn/Tailwind variable names to check for reference
        const vars = {};
        ['--background', '--foreground', '--primary', '--secondary', '--accent', '--muted', '--border'].forEach(v => {
            const val = getVar(v);
            if (val) vars[v] = val;
        });

        const colorProperties = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'];
        const colorSet = new Set();
        
        // Get ALL elements on the page (mimics Chrome CSS Overview)
        const allElements = document.querySelectorAll('*');

        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            
            colorProperties.forEach(prop => {
                const value = style[prop];
                const hex = toHex(value);
                if (hex) colorSet.add(hex);
            });
        });

        return {
            bg: toHex(window.getComputedStyle(body).backgroundColor) || '#ffffff',
            text: toHex(window.getComputedStyle(body).color) || '#000000',
            accent: getVar('--primary') || toHex(window.getComputedStyle(btn || body).backgroundColor) || '#000000',
            variables: vars,
            palette: Array.from(colorSet).slice(0, 60) // Limit to 60 colors to avoid prompt bloat
        };
    };

    const performInitialScan = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id || tab.url.startsWith('chrome://')) return;

        try {
            const [{ result: pageColors }] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: extractColorsFunc
            });
            console.log('--- Deep Scan: Detected Colors on Open ---');
            console.log('Site:', tab.url);
            console.log('Detected Palette:', pageColors.palette);
            console.log('Variables:', pageColors.variables);
            console.log('-----------------------------------------');
        } catch (e) {
            console.log('Initial color scan failed (expected if page is still loading or restricted):', e);
        }
    };

    // Event Listeners
    controls.saveKey.onclick = () => {
        const name = controls.apiKeyName.value.trim() || 'My Key';
        const key = controls.apiKey.value.trim();
        
        if (key) {
            if (!apiKeys.some(k => k.key === key)) {
                apiKeys.push({ key, name });
            }
            geminiApiKey = key;
            chrome.storage.local.set({ 
                geminiApiKey: key,
                apiKeys: apiKeys 
            }, () => {
                showView('main');
                performInitialScan();
                controls.apiKey.value = '';
                controls.apiKeyName.value = '';
                renderKeyList();
            });
        } else {
            showWarning("API Key cannot be empty");
            controls.apiKey.classList.add('error-input');
            setTimeout(() => controls.apiKey.classList.remove('error-input'), 2000);
        }
    };

    controls.resetApi.onclick = () => {
        if (currentView === 'setup') {
            if (geminiApiKey) showView('main');
        } else {
            showView('setup');
        }
    };

    controls.startOver.onclick = () => {
        showView('main');
        controls.userPrompt.value = '';
    };

    const handleGenerate = async () => {
        if (!geminiApiKey) {
            showWarning("Missing API Key. Please click the gear icon to set it.");
            return;
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) return;

        // Restricted pages check (Chrome doesn't allow scripting on these)
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
            showError(new Error("This extension cannot run on browser system pages or restricted tabs. Please try on a regular website."));
            return;
        }

        // Tab loading check
        if (tab.status !== 'complete') {
            showWarning("The page is still loading. Please wait a moment before generating.");
            return;
        }

        isGenerating = true;
        controls.generateBtn.disabled = true;
        controls.btnContent.textContent = 'Crafting...';
        controls.arrowIcon.classList.add('hidden');
        controls.spinner.classList.remove('hidden');
        views.error.classList.add('hidden');
        
        updateStatus('Analyzing site colors...');

        try {
            // Extract dominant colors, CSS variables, and full color palette from the page
            let pageColors;
            try {
                const [{ result }] = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: extractColorsFunc
                });
                pageColors = result;
            } catch (e) {
                console.warn('AI Theme Picker: Extraction failed, using defaults', e);
                pageColors = { bg: '#ffffff', text: '#000000', accent: '#000000', variables: {}, palette: [] };
            }

            updateStatus('AI is crafting your theme...');
            const stylePrompt = controls.userPrompt.value.trim() || 'modern professional';
            
            // Format site variables for the prompt if any were found
            const varReference = Object.keys(pageColors.variables).length > 0 
                ? `\nReference Site Variables: ${JSON.stringify(pageColors.variables)}`
                : '';

            // Format extracted color palette
            const paletteReference = pageColors.palette && pageColors.palette.length > 0
                ? `\nPage Color Palette (all unique colors found on site): ${pageColors.palette.join(', ')}`
                : '';

            const systemPrompt = `You are a professional UI color expert.
Site: ${tab.url} (${tab.title})
Current Site Colors: Background: ${pageColors.bg}, Text: ${pageColors.text}, Accent/Brand: ${pageColors.accent}${varReference}${paletteReference}
User Style Preference: ${stylePrompt}

Task: Generate a set of Tailwind CSS variables in OKLCH format for both :root (Light) and .dark (Dark) modes.
The colors must be extremely accurate to the source site's branding while being optimized for high-quality UI design.

Format Example (ONLY for structure, DO NOT use these specific OKLCH values):
:root {
  --radius: 0.65rem;
  --background: oklch(<L> <C> <H>);
  --foreground: oklch(<L> <C> <H>);
  --card: oklch(<L> <C> <H>);
  --card-foreground: oklch(<L> <C> <H>);
  --popover: oklch(<L> <C> <H>);
  --popover-foreground: oklch(<L> <C> <H>);
  --primary: oklch(<L> <C> <H>);
  --primary-foreground: oklch(<L> <C> <H>);
  --secondary: oklch(<L> <C> <H>);
  --secondary-foreground: oklch(<L> <C> <H>);
  --muted: oklch(<L> <C> <H>);
  --muted-foreground: oklch(<L> <C> <H>);
  --accent: oklch(<L> <C> <H>);
  --accent-foreground: oklch(<L> <C> <H>);
  --destructive: oklch(<L> <C> <H>);
  --border: oklch(<L> <C> <H> / <opacity>);
  --input: oklch(<L> <C> <H> / <opacity>);
  --ring: oklch(<L> <C> <H>);
  --chart-1: oklch(<L> <C> <H>);
  --chart-2: oklch(<L> <C> <H>);
  --chart-3: oklch(<L> <C> <H>);
  --chart-4: oklch(<L> <C> <H>);
  --chart-5: oklch(<L> <C> <H>);
  --sidebar: oklch(<L> <C> <H>);
  --sidebar-foreground: oklch(<L> <C> <H>);
  --sidebar-primary: oklch(<L> <C> <H>);
  --sidebar-primary-foreground: oklch(<L> <C> <H>);
  --sidebar-accent: oklch(<L> <C> <H>);
  --sidebar-accent-foreground: oklch(<L> <C> <H>);
  --sidebar-border: oklch(<L> <C> <H> / <opacity>);
  --sidebar-ring: oklch(<L> <C> <H>);
}

.dark {
  --background: oklch(<L> <C> <H>);
  --foreground: oklch(<L> <C> <H>);
  --card: oklch(<L> <C> <H>);
  --card-foreground: oklch(<L> <C> <H>);
  --popover: oklch(<L> <C> <H>);
  --popover-foreground: oklch(<L> <C> <H>);
  --primary: oklch(<L> <C> <H>);
  --primary-foreground: oklch(<L> <C> <H>);
  --secondary: oklch(<L> <C> <H>);
  --secondary-foreground: oklch(<L> <C> <H>);
  --muted: oklch(<L> <C> <H>);
  --muted-foreground: oklch(<L> <C> <H>);
  --accent: oklch(<L> <C> <H>);
  --accent-foreground: oklch(<L> <C> <H>);
  --destructive: oklch(<L> <C> <H>);
  --border: oklch(<L> <C> <H> / <opacity>);
  --input: oklch(<L> <C> <H> / <opacity>);
  --ring: oklch(<L> <C> <H>);
  --chart-1: oklch(<L> <C> <H>);
  --chart-2: oklch(<L> <C> <H>);
  --chart-3: oklch(<L> <C> <H>);
  --chart-4: oklch(<L> <C> <H>);
  --chart-5: oklch(<L> <C> <H>);
  --sidebar: oklch(<L> <C> <H>);
  --sidebar-foreground: oklch(<L> <C> <H>);
  --sidebar-primary: oklch(<L> <C> <H>);
  --sidebar-primary-foreground: oklch(<L> <C> <H>);
  --sidebar-accent: oklch(<L> <C> <H>);
  --sidebar-accent-foreground: oklch(<L> <C> <H>);
  --sidebar-border: oklch(<L> <C> <H> / <opacity>);
  --sidebar-ring: oklch(<L> <C> <H>);
}

Rules:
1. CRITICAL: Use the "Current Site Colors" provided above to derive all variables. Do NOT use the example values.
2. Use OKLCH format exactly as shown. 
3. Output ONLY the raw CSS. No code blocks, no explanations.`;

            const requestBody = { contents: [{ parts: [{ text: systemPrompt }] }] };
            console.log('--- AI Request Data ---');
            console.log('Full AI System Prompt:', systemPrompt);
            console.log('Final Site Colors Summary:', pageColors);
            console.log('-----------------------');

            controls.generatingPreview.classList.remove('hidden');
            controls.liveCodeStream.textContent = '';
            // controls.btnContent.textContent = 'Crafting...';
            
            // Model set to gemini-2.5-flash as requested by user
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:streamGenerateContent?key=${geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errMsg = errorData.error?.message || response.statusText || `HTTP Error ${response.status}`;
                throw new Error(errMsg);
            }

            const reader = response.body.getReader();

            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    
                    let i = 0;
                    while (i < buffer.length) {
                        if (buffer[i] === '{') {
                            let braceCount = 0;
                            let j = i;
                            let inString = false;
                            let escaped = false;

                            while (j < buffer.length) {
                                const char = buffer[j];
                                if (escaped) {
                                    escaped = false;
                                } else if (char === '\\') {
                                    escaped = true;
                                } else if (char === '"') {
                                    inString = !inString;
                                } else if (!inString) {
                                    if (char === '{') braceCount++;
                                    else if (char === '}') braceCount--;
                                }
                                j++;
                                if (braceCount === 0) break;
                            }

                            if (braceCount === 0) {
                                const potentialJson = buffer.substring(i, j);
                                try {
                                    const json = JSON.parse(potentialJson);
                                    if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
                                        const chunkText = json.candidates[0].content.parts[0].text;
                                        fullText += chunkText;
                                        controls.liveCodeStream.textContent = fullText;
                                        controls.liveCodeStream.parentElement.scrollTop = controls.liveCodeStream.parentElement.scrollHeight;
                                    }
                                } catch (e) {
                                    console.log('AI Theme Picker: Chunk skip (invalid JSON):', e);
                                }
                                buffer = buffer.substring(j);
                                i = 0;
                            } else {
                                break; 
                            }
                        } else {
                            i++;
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }

            const aiText = fullText.replace(/```css|```/g, '').trim();
            console.log('AI Theme Picker: Full generated text:', aiText);

            const lightMatch = aiText.match(/:root\s*{([\s\S]+?)}/);
            const darkMatch = aiText.match(/\.dark\s*{([\s\S]+?)}/);

            if (lightMatch && darkMatch) {
                themes.light = lightMatch[1].trim();
                themes.dark = darkMatch[1].trim();
                
                renderPalette(themes.light, results.lightPalette);
                renderPalette(themes.dark, results.darkPalette);
                
                showView('result');
                updateStatus('Theme generated');
            } else {
                console.log('AI Theme Picker: Parsing issue. AI Text Snapshot:', aiText.slice(0, 500));
                throw new Error("I received the theme data but couldn't parse the CSS colors. Please try a different prompt or check the console.");
            }
        } catch (err) {
            showError(err);
        } finally {
            isGenerating = false;
            controls.generateBtn.disabled = false;
            controls.btnContent.textContent = 'Generate Theme';
            controls.arrowIcon.classList.remove('hidden');
            controls.spinner.classList.add('hidden');
            controls.generatingPreview.classList.add('hidden');
        }
    };

    const renderPalette = (cssString, container) => {
        container.innerHTML = '';
        const regex = /(--[\w-]+):\s*([^;]+);/g;
        let match;
        while ((match = regex.exec(cssString)) !== null) {
            const [_, name, value] = match;
            if (name === '--radius') continue;

            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            
            const box = document.createElement('div');
            box.className = 'swatch-box';
            box.style.backgroundColor = value;
            
            const label = document.createElement('span');
            label.className = 'swatch-name';
            label.textContent = name.replace('--', '');
            
            swatch.appendChild(box);
            swatch.appendChild(label);
            swatch.title = `${name}: ${value}`;
            container.appendChild(swatch);
        }
    };

    controls.generateBtn.onclick = handleGenerate;

    // Keyboard Shortcuts
    controls.userPrompt.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey || e.shiftKey) && e.key === 'Enter') {
            e.preventDefault();
            handleGenerate();
        }
    });

    const copyToClipboard = (text, element) => {
        navigator.clipboard.writeText(text).then(() => {
            const original = element.innerHTML;
            element.innerHTML = '<span style="color: var(--success); font-weight: 700;">Copied</span>';
            setTimeout(() => element.innerHTML = original, 1500);
        }).catch(() => showError(new Error("Copy failed")));
    };

    results.copyLight.onclick = () => copyToClipboard(`:root {\n  ${themes.light}\n}`, results.copyLight);
    results.copyDark.onclick = () => copyToClipboard(`.dark {\n  ${themes.dark}\n}`, results.copyDark);
    results.copyFull.onclick = () => copyToClipboard(`:root {\n  ${themes.light}\n}\n\n.dark {\n  ${themes.dark}\n}`, results.copyFull);

    // Global Error Handling to prevent "breaking errors"
    window.onerror = (message, source, lineno, colno, error) => {
        console.log('AI Theme Picker: Warning Notice', { message, source, lineno, colno, error });
        showError(error || new Error(message));
        return true; 
    };

    window.onunhandledrejection = (event) => {
        console.log('AI Theme Picker: Unhandled Rejection', event.reason);
        showError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    };
});
