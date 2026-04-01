// === Background Service Worker: Single Source of Truth for State ===

// Cross-browser compatibility (Chrome / Firefox / Edge)
const storage = chrome?.storage || browser.storage;
const runtime = chrome?.runtime || browser.runtime;
const tabs = chrome?.tabs || browser.tabs;

let allHistory = {};
let shortsBlockerSettings = { enabled: true };
let breakSettings = { enabled: true, intervalMinutes: 15, workUrl: 'https://www.google.com' };

// Load initial state from storage
storage.local.get(['ytt_history', 'ytt_shorts_settings', 'ytt_break_settings'], (data) => {
    if (data.ytt_history) allHistory = data.ytt_history;
    if (data.ytt_shorts_settings) shortsBlockerSettings = data.ytt_shorts_settings;
    if (data.ytt_break_settings) breakSettings = data.ytt_break_settings;
    console.log('Background: State loaded from storage.');
});

function getDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'REPORT_WATCH_TIME') {
        handleWatchTimeReport(request);
        sendResponse({ success: true });
    } else if (request.action === 'SAVE_SETTINGS') {
        handleSettingsUpdate(request);
        sendResponse({ success: true });
    } else if (request.action === 'CLOSE_TAB' && sender.tab) {
        tabs.remove(sender.tab.id);
        sendResponse({ success: true });
    } else if (request.action === 'DELETE_VIDEO') {
        handleDeleteVideo(request.uid);
        sendResponse({ success: true });
    } else if (request.action === 'CLEAR_HISTORY') {
        handleClearHistory();
        sendResponse({ success: true });
    } else if (request.action === 'FETCH_QUOTE') {
        fetchZenQuote().then(sendResponse);
        return true; 
    }
});

function handleDeleteVideo(uid) {
    Object.keys(allHistory).forEach(key => {
        allHistory[key].videos = allHistory[key].videos.filter(v => v.uid !== uid);
    });
    storage.local.set({ 'ytt_history': allHistory });
}

function handleClearHistory() {
    const currentDay = getDayKey();
    allHistory = {
        [currentDay]: { watchTime: 0, videos: [], sessionStart: Date.now() }
    };
    storage.local.set({ 'ytt_history': allHistory });
}

function handleWatchTimeReport(data) {
    const { delta, videoId, videoTitle, channelName, currentPosition, totalDuration } = data;
    const currentDay = getDayKey();
    
    if (!allHistory[currentDay]) {
        allHistory[currentDay] = { watchTime: 0, videos: [], sessionStart: Date.now() };
    }
    
    const todayData = allHistory[currentDay];
    const uid = `${currentDay}_${videoId}`;
    let videoEntry = todayData.videos.find(v => v.uid === uid);
    
    if (!videoEntry && videoId) {
        videoEntry = {
            uid: uid,
            id: videoId,
            title: videoTitle || 'Loading Video...',
            channelName: channelName || 'Loading Channel...',
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            startTime: new Date().toLocaleTimeString(),
            watchedDuration: 0,
            currentPosition: currentPosition || 0,
            totalDuration: totalDuration || 0
        };
        todayData.videos.push(videoEntry);
    }
    
    if (videoEntry) {
        if (delta > 0) {
            videoEntry.watchedDuration += delta;
            todayData.watchTime += delta;
        }
        if (currentPosition !== undefined && isFinite(currentPosition)) videoEntry.currentPosition = currentPosition;
        if (totalDuration !== undefined && isFinite(totalDuration) && totalDuration > 0) videoEntry.totalDuration = totalDuration;
        if (videoTitle && videoEntry.title === 'Loading Video...') videoEntry.title = videoTitle;
        if (channelName && videoEntry.channelName === 'Loading Channel...') videoEntry.channelName = channelName;
    }
    
    // Save to storage (throttled/debounced in a real app, but once per second per tab is usually fine for local storage)
    storage.local.set({ 'ytt_history': allHistory });
}

function handleSettingsUpdate(data) {
    if (data.type === 'shorts') {
        shortsBlockerSettings = data.settings;
        storage.local.set({ 'ytt_shorts_settings': shortsBlockerSettings });
    } else if (data.type === 'break') {
        breakSettings = data.settings;
        storage.local.set({ 'ytt_break_settings': breakSettings });
    }
}

async function fetchZenQuote() {
    try {
        const resp = await fetch(`https://zenquotes.io/api/random?t=${Date.now()}`, {
            cache: 'no-cache'
        });
        const data = await resp.json();
        if (data && data[0]) {
            return { text: data[0].q, author: data[0].a };
        }
    } catch (e) {
        console.error('Background fetch failed:', e);
    }
    const fallbacks = [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
        { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
        { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
