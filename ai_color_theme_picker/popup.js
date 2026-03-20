document.addEventListener('DOMContentLoaded', () => {
    // Icons
    const ICONS = {
        settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
        back: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`
    };

    // UI Elements
    const views = {
        setup: document.getElementById('setup-view'),
        main: document.getElementById('main-view'),
        result: document.getElementById('result-view'),
        error: document.getElementById('error-display')
    };

    const controls = {
        apiKey: document.getElementById('api-key'),
        saveKey: document.getElementById('save-key'),
        resetApi: document.getElementById('reset-api'),
        userPrompt: document.getElementById('user-prompt'),
        generateBtn: document.getElementById('generate-btn'),
        btnContent: document.getElementById('btn-content'),
        spinner: document.getElementById('spinner'),
        arrowIcon: document.getElementById('arrow-icon'),
        startOver: document.getElementById('start-over'),
        statusText: document.getElementById('system-status')
    };

    const results = {
        copyLight: document.getElementById('copy-light'),
        copyDark: document.getElementById('copy-dark'),
        copyFull: document.getElementById('copy-full')
    };

    let geminiApiKey = '';
    let themes = { light: '', dark: '' };
    let currentView = '';

    const showView = (viewName) => {
        currentView = viewName;
        Object.values(views).forEach(v => v.classList.add('hidden'));
        views[viewName].classList.remove('hidden');
        views.error.classList.add('hidden');
        updateStatus(viewName === 'setup' ? 'Authentication Required' : 'Ready');
        
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

        // Quota / Rate Limit
        if (msg.includes('quota') || msg.includes('limit') || msg.includes('429')) {
            return "Quota exceeded. Please wait a minute and try again.";
        }

        // Auth / API Key
        if (msg.includes('key') || msg.includes('401') || msg.includes('403')) {
            return "Invalid API Key. Please click the ⚙️ icon to reset it.";
        }

        // Model issues
        if (msg.includes('model') && (msg.includes('not found') || msg.includes('404'))) {
            return "The AI model is currently unavailable. Please try again later.";
        }

        // Server issues
        if (msg.includes('500') || msg.includes('503') || msg.includes('overloaded')) {
            return "Gemini is currently busy. Please try again in 10 seconds.";
        }

        // Safety / Content
        if (msg.includes('safety') || msg.includes('blocked')) {
            return "The request was blocked by AI safety filters. Try a different prompt.";
        }

        return error.message || "An unexpected error occurred. Please try again.";
    };

    const showError = (error) => {
        const friendlyMsg = getFriendlyError(error);
        views.error.textContent = friendlyMsg;
        views.error.classList.remove('hidden');
        updateStatus('Error occurred');
        
        // Add shake animation
        views.error.classList.add('shake');
        setTimeout(() => views.error.classList.remove('shake'), 5000);
        
        setTimeout(() => {
            views.error.classList.add('hidden');
            if (controls.statusText.textContent === 'Error occurred') {
                updateStatus('Ready');
            }
        }, 6000);
    };

    // Load API Key
    chrome.storage.local.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            geminiApiKey = result.geminiApiKey;
            showView('main');
        } else {
            showView('setup');
        }
    });

    // Event Listeners
    controls.saveKey.onclick = () => {
        const key = controls.apiKey.value.trim();
        if (key) {
            chrome.storage.local.set({ geminiApiKey: key }, () => {
                geminiApiKey = key;
                showView('main');
                controls.apiKey.value = '';
            });
        } else {
            showError(new Error("API Key cannot be empty"));
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
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        controls.generateBtn.disabled = true;
        controls.btnContent.classList.add('hidden');
        controls.arrowIcon.classList.add('hidden');
        controls.spinner.classList.remove('hidden');
        views.error.classList.add('hidden');
        updateStatus('Generating theme...');

        try {
            const stylePrompt = controls.userPrompt.value.trim() || 'modern professional';
            const systemPrompt = `Site: ${tab.url} (${tab.title}). Style: ${stylePrompt}. ` +
                `Generate Tailwind CSS variables in OKLCH format. ` +
                `Output ONLY: :root { ... } .dark { ... }`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
            });

            const data = await response.json();
            if (data.error) {
                // Pass the whole error object
                throw new Error(data.error.message || data.error.status);
            }

            if (!data.candidates || !data.candidates[0]) {
                throw new Error("No response from AI. Try a different prompt.");
            }

            const aiText = data.candidates[0].content.parts[0].text.replace(/```css|```/g, '').trim();
            const lightMatch = aiText.match(/:root\s*{([^}]+)}/);
            const darkMatch = aiText.match(/\.dark\s*{([^}]+)}/);

            if (lightMatch && darkMatch) {
                themes.light = lightMatch[1].trim();
                themes.dark = darkMatch[1].trim();
                showView('result');
                updateStatus('Theme generated');
            } else {
                throw new Error("Invalid format from AI");
            }
        } catch (err) {
            showError(err);
        } finally {
            controls.generateBtn.disabled = false;
            controls.btnContent.classList.remove('hidden');
            controls.arrowIcon.classList.remove('hidden');
            controls.spinner.classList.add('hidden');
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
});
