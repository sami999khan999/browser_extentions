// === Global State & LocalStorage Persistence ===

// 7-Day Stats State Persistence (localStorage)
function getDayKey(date = new Date()) {
    return date.toISOString().split('T')[0];
}

function loadHistory() {
    try {
        const data = localStorage.getItem('yt_shorts_blocker_history');
        const history = data ? JSON.parse(data) : {};
        
        // Cleanup: Remove keys older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const threshold = getDayKey(sevenDaysAgo);
        
        const cleanedHistory = {};
        Object.keys(history).forEach(key => {
            if (key >= threshold) cleanedHistory[key] = history[key];
        });
        
        return cleanedHistory;
    } catch (e) { 
        console.error('Failed to load history:', e); 
        return {};
    }
}

function saveHistory() {
    try {
        localStorage.setItem('yt_shorts_blocker_history', JSON.stringify(allHistory));
    } catch (e) { console.error('Failed to save history:', e); }
}

// Global State
let allHistory = loadHistory();
const todayKey = getDayKey();
if (!allHistory[todayKey]) {
    allHistory[todayKey] = { watchTime: 0, videos: [], sessionStart: Date.now() };
}

let selectedDayFilter = 'today'; // 'today', 'yesterday', 'all', or 'YYYY-MM-DD'
let activeView = 'history'; // 'history', 'analytics', or 'settings'
let lastVideoId = '';
let lastWatchTimeUpdate = Date.now();
let isStatsOpen = false;
let lastRenderedView = '';
let lastRenderedFilter = '';
let lastVideoCount = -1;

// Shorts Blocker State
function loadShortsBlockerSettings() {
    try {
        const data = localStorage.getItem('yt_shorts_blocker_settings');
        return data ? JSON.parse(data) : { enabled: true };
    } catch (e) { return { enabled: true }; }
}
function saveShortsBlockerSettings() {
    localStorage.setItem('yt_shorts_blocker_settings', JSON.stringify(shortsBlockerSettings));
}
let shortsBlockerSettings = loadShortsBlockerSettings();

// Break Reminder State
function loadBreakSettings() {
    try {
        const data = localStorage.getItem('yt_break_reminder_settings');
        return data ? JSON.parse(data) : { 
            enabled: true, 
            intervalMinutes: 15,
            workUrl: 'https://www.google.com'
        };
    } catch (e) { return { enabled: true, intervalMinutes: 15, workUrl: 'https://www.google.com' }; }
}
function saveBreakSettings() {
    localStorage.setItem('yt_break_reminder_settings', JSON.stringify(breakSettings));
}
let breakSettings = loadBreakSettings();

let continuousWatchStart = null;
let breakModalShown = false;
let preFetchedQuote = null;
let isFetchingQuote = false;

function clearAllData() {
    // Clear targeted extension keys
    localStorage.removeItem('yt_shorts_blocker_history');
    localStorage.removeItem('yt_shorts_blocker_settings');
    localStorage.removeItem('yt_break_reminder_settings');
    
    // Reset in-memory state
    const currentDay = getDayKey();
    allHistory = {
        [currentDay]: { watchTime: 0, videos: [], sessionStart: Date.now() }
    };
    shortsBlockerSettings = { enabled: true };
    breakSettings = { 
        enabled: true, 
        intervalMinutes: 15,
        workUrl: 'https://www.google.com'
    };
    
    // Trigger immediate UI refresh/save
    saveHistory();
    saveShortsBlockerSettings();
    saveBreakSettings();
}
