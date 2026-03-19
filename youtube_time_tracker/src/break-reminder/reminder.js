// === Break Reminder: Quote fetching, modal, and timer ===

async function fetchZenQuote() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'FETCH_QUOTE' }, (response) => {
            if (response && response.text) {
                resolve(response);
            } else {
                // Randomized local fallbacks if message fails
                const fallbacks = [
                    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
                    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
                    { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" }
                ];
                resolve(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
            }
        });
    });
}

function showBreakModal(quote) {
    if (document.getElementById('break-reminder-modal')) return;
    
    // Default fallback if quote failed
    const finalQuote = quote || { text: "The secret of getting ahead is getting started.", author: "Mark Twain" };
    
    const overlay = document.createElement('div');
    overlay.id = 'break-reminder-modal';
    overlay.className = 'break-modal-overlay';
    overlay.innerHTML = `
        <div class="break-modal">
            <div class="break-modal-icon">☕</div>
            <h2 class="break-modal-title">Time for a Break!</h2>
            <p class="break-modal-subtitle">You've been watching for ${breakSettings.intervalMinutes} minutes straight.</p>
            <blockquote class="break-modal-quote">
                <p>"${finalQuote.text}"</p>
                <cite>— ${finalQuote.author}</cite>
            </blockquote>
            <div class="break-modal-actions">
                <button id="break-keep-watching" class="break-btn secondary">Keep Watching</button>
                <button id="break-go-work" class="break-btn primary">Go to Work</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Animate in
    requestAnimationFrame(() => overlay.classList.add('visible'));
    
    document.getElementById('break-keep-watching').onclick = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
        continuousWatchStart = Date.now(); // Reset timer
        breakModalShown = false;
        preFetchedQuote = null; // Clear pre-fetched for next cycle
        
        // Resume video playback
        const video = document.querySelector('video');
        if (video) video.play();
    };
    
    document.getElementById('break-go-work').onclick = () => {
        window.location.href = breakSettings.workUrl || 'https://www.google.com';
    };
}


function checkBreakReminder() {
    if (!breakSettings.enabled) return;
    
    const video = document.querySelector('video');
    if (!video || video.paused) {
        continuousWatchStart = null;
        breakModalShown = false;
        return;
    }
    
    if (!continuousWatchStart) {
        continuousWatchStart = Date.now();
        return;
    }
    
    const elapsed = (Date.now() - continuousWatchStart) / 1000 / 60; // minutes
    
    // Pre-fetch quote 5 seconds before the interval (5/60 minutes)
    const preFetchThreshold = breakSettings.intervalMinutes - (5 / 60);
    if (elapsed >= preFetchThreshold && !preFetchedQuote && !isFetchingQuote) {
        isFetchingQuote = true;
        fetchZenQuote().then(quote => {
            preFetchedQuote = quote;
            isFetchingQuote = false;
        });
    }

    if (elapsed >= breakSettings.intervalMinutes && !breakModalShown) {
        breakModalShown = true;
        video.pause();
        showBreakModal(preFetchedQuote);
    }
}
