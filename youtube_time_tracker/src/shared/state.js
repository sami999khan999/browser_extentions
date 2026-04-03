// === Global State & Storage Persistence ===

// Cross-browser compatibility (Chrome / Firefox / Edge)
const storage = chrome?.storage || browser.storage;
const runtime = chrome?.runtime || browser.runtime;

function getDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Global State (initialized with defaults)
let allHistory = {};
let shortsBlockerSettings = { enabled: true };
let breakSettings = { 
    enabled: true, 
    intervalMinutes: 15,
    workUrl: 'https://www.google.com'
};

let selectedDayFilter = 'today'; // 'today', 'yesterday', 'all', or 'YYYY-MM-DD'
let activeView = 'history'; // 'history', 'analytics', or 'settings'
let lastVideoId = '';
let currentUid = '';
let lastWatchTimeUpdate = Date.now();
let isStatsOpen = false;
let lastRenderedView = '';
let lastRenderedFilter = '';
let lastVideoCount = -1;
let continuousWatchStart = null;
let breakModalShown = false;
let preFetchedQuote = null;
let isFetchingQuote = false;
let deletedUids = new Set();

/**
 * Initializes state from storage.local
 * Handles migration from localStorage if necessary.
 */
async function initState() {
    return new Promise((resolve) => {
        storage.local.get(['ytt_history', 'ytt_shorts_settings', 'ytt_break_settings', 'ytt_migrated'], (data) => {
            let history = data.ytt_history;
            let shortsSettings = data.ytt_shorts_settings;
            let bSettings = data.ytt_break_settings;

            // Migration from localStorage for existing users
            if (!data.ytt_migrated) {
                try {
                    const localHistory = localStorage.getItem('ytt_history');
                    if (localHistory) history = JSON.parse(localHistory);
                    
                    const localShorts = localStorage.getItem('ytt_shorts_settings');
                    if (localShorts) shortsSettings = JSON.parse(localShorts);
                    
                    const localBreak = localStorage.getItem('ytt_break_settings');
                    if (localBreak) bSettings = JSON.parse(localBreak);

                    // Mark as migrated and cleanup old keys
                    localStorage.removeItem('ytt_history');
                    localStorage.removeItem('ytt_shorts_settings');
                    localStorage.removeItem('ytt_break_settings');
                    storage.local.set({ ytt_migrated: true });
                } catch (e) {
                    console.error('Migration failed:', e);
                }
            }

            // Apply history
            allHistory = history || {};
            
            const todayKey = getDayKey();
            if (!allHistory[todayKey]) {
                allHistory[todayKey] = { watchTime: 0, videos: [], sessionStart: Date.now() };
            }


            // Apply settings
            if (shortsSettings) shortsBlockerSettings = shortsSettings;
            if (bSettings) breakSettings = bSettings;

            console.log('YouTube Time Tracker: State initialized from storage.');
            resolve();
        });
    });
}

/**
 * Safely sends a message to the background script.
 * Handles "Extension context invalidated" errors gracefully.
 */
function safeSendMessage(message, callback) {
    try {
        if (runtime && runtime.id) {
            runtime.sendMessage(message, (response) => {
                if (runtime.lastError) {
                    const errorMsg = runtime.lastError.message;
                    // Ignore common harmless errors during reload/unload
                    if (errorMsg.includes('context invalidated') || 
                        errorMsg.includes('message port closed')) {
                        return;
                    }
                    console.error('YTT: Runtime error in callback:', errorMsg);
                }
                if (callback) callback(response);
            });
        }
    } catch (e) {
        if (e.message.includes('context invalidated')) {
            // Context invalidated - stop further calls if possible
            window.yttContextInvalidated = true;
        } else {
            console.error('YTT: Failed to send message:', e);
        }
    }
}

function saveHistory() {
    safeSendMessage({ action: 'REPORT_WATCH_TIME', delta: 0 }); 
}

function deleteHistoryVideo(uid) {
    deletedUids.add(uid);
    safeSendMessage({ action: 'DELETE_VIDEO', uid });
}

function clearAllData() {
    safeSendMessage({ action: 'CLEAR_HISTORY' }, () => {
        // Reset in-memory settings (history will be updated via storage listener)
        shortsBlockerSettings = { enabled: true };
        breakSettings = { 
            enabled: true, 
            intervalMinutes: 15,
            workUrl: 'https://www.google.com'
        };
        
        saveShortsBlockerSettings();
        saveBreakSettings();
        
        if (isStatsOpen) renderStats();
        applyShortsBlockerState();
    });
}

function saveShortsBlockerSettings() {
    safeSendMessage({ 
        action: 'SAVE_SETTINGS', 
        type: 'shorts', 
        settings: shortsBlockerSettings 
    });
}

function saveBreakSettings() {
    safeSendMessage({ 
        action: 'SAVE_SETTINGS', 
        type: 'break', 
        settings: breakSettings 
    });
}

// Sync listener: keeps all open tabs in sync when storage changes
storage.onChanged.addListener((changes, area) => {
    try {
        if (area === 'local') {
            let needsUIRefresh = false;

            if (changes.ytt_history) {
                allHistory = changes.ytt_history.newValue || {};
                needsUIRefresh = true;
            }
            if (changes.ytt_shorts_settings) {
                shortsBlockerSettings = changes.ytt_shorts_settings.newValue || { enabled: true };
                applyShortsBlockerState(); // Live apply shorts blocker toggle
            }
            if (changes.ytt_break_settings) {
                breakSettings = changes.ytt_break_settings.newValue || { enabled: true, intervalMinutes: 15, workUrl: 'https://www.google.com' };
            }

            // Only re-render if the stats panel is actually open
            if (needsUIRefresh && isStatsOpen) {
                renderStats();
            }
        }
    } catch (e) {
        if (e.message.includes('context invalidated')) {
            window.yttContextInvalidated = true;
        }
    }
});
