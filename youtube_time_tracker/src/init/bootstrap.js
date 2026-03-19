// === Bootstrap: Initial calls, intervals, observers, event listeners ===

// Initial Run
applyShortsBlockerState();
injectStatsUI();


// Intervals
setInterval(() => {
    updateStats();
    checkBreakReminder();
}, 1000);


// Observe DOM changes for dynamic elements
const observer = new MutationObserver(() => {
    if (shortsBlockerSettings.enabled) blockShorts();
    // Ensure UI is re-injected if YouTube's SPA wipes it
    injectStatsUI();
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});

// Handle YouTube's custom navigation events
window.addEventListener('yt-page-data-updated', () => {
    applyShortsBlockerState();
    injectStatsUI();
});
window.addEventListener('yt-navigate-finish', () => {
    applyShortsBlockerState();
    injectStatsUI();
});
window.addEventListener('popstate', () => {
    if (shortsBlockerSettings.enabled) blockShorts();
});
