// === Background Service Worker: Single Source of Truth for State ===

// Cross-browser compatibility (Chrome / Firefox / Edge)
const storage = chrome?.storage || browser.storage;
const runtime = chrome?.runtime || browser.runtime;
const tabs = chrome?.tabs || browser.tabs;

let allHistory = {};
let shortsBlockerSettings = { enabled: true };
let breakSettings = { enabled: true, intervalMinutes: 15, workUrl: 'https://www.google.com' };
const activePlayingTabs = {}; // Tracks { tabId: timestamp }

// Load initial state from storage
const loadPromise = new Promise((resolve) => {
    storage.local.get(['ytt_history', 'ytt_shorts_settings', 'ytt_break_settings'], (data) => {
        // Enforce 7-day retention policy on load
        if (data.ytt_history) {
            allHistory = cleanupOldHistory(data.ytt_history);
            // Save cleaned history back if it changed
            if (Object.keys(allHistory).length !== Object.keys(data.ytt_history).length) {
                storage.local.set({ 'ytt_history': allHistory });
            }
        }
        
        if (data.ytt_shorts_settings) shortsBlockerSettings = data.ytt_shorts_settings;
        if (data.ytt_break_settings) breakSettings = data.ytt_break_settings;
        console.log('Background: State loaded and cleaned.');
        resolve();
    });
});

function cleanupOldHistory(history) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const threshold = getDayKey(sevenDaysAgo);
    
    const cleaned = {};
    Object.keys(history).forEach(key => {
        if (key >= threshold) cleaned[key] = history[key];
    });
    return cleaned;
}

runtime.onMessage.addListener((request, sender, sendResponse) => {
    loadPromise.then(async () => {
        if (request.action === 'REPORT_WATCH_TIME') {
            const tabId = sender.tab ? sender.tab.id : null;
            
            // Track active playing tabs
            if (tabId) {
                if (request.isPlaying && request.videoId) {
                    activePlayingTabs[tabId] = { 
                        time: Date.now(), 
                        videoId: request.videoId,
                        windowId: sender.tab.windowId 
                    };
                } else {
                    delete activePlayingTabs[tabId];
                }
            }
            
            // Clean up stale tabs (older than 3 seconds)
            const now = Date.now();
            for (const tid in activePlayingTabs) {
                if (now - activePlayingTabs[tid].time > 3000) {
                    delete activePlayingTabs[tid];
                }
            }
            
            // Check if there is another playing tab with the SAME video
            let otherPlayingTabId = null;
            if (request.isPlaying && tabId && request.videoId) {
                for (const tid in activePlayingTabs) {
                    if (tid !== String(tabId) && activePlayingTabs[tid].videoId === request.videoId) {
                        otherPlayingTabId = parseInt(tid, 10);
                        break;
                    }
                }
            }

            handleWatchTimeReport(request);
            sendResponse({ success: true, otherPlayingTabId });
            
        } else if (request.action === 'SAVE_SETTINGS') {
            handleSettingsUpdate(request);
            sendResponse({ success: true });
        } else if (request.action === 'CLOSE_TAB' && sender.tab) {
            tabs.remove(sender.tab.id);
            sendResponse({ success: true });
        } else if (request.action === 'CLOSE_TAB_BY_ID') {
            if (request.tabId) {
                tabs.remove(request.tabId);
            }
            sendResponse({ success: true });
        } else if (request.action === 'DELETE_VIDEO') {
            handleDeleteVideo(request.uid);
            sendResponse({ success: true });
        } else if (request.action === 'CLEAR_HISTORY') {
            handleClearHistory();
            sendResponse({ success: true });
        } else if (request.action === 'FETCH_QUOTE') {
            const quote = await fetchZenQuote();
            sendResponse(quote);
        }
    });
    return true; // Keep message channel open for asynchronous response
});


function getDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function handleDeleteVideo(uid) {
    Object.keys(allHistory).forEach(key => {
        const videoIndex = allHistory[key].videos.findIndex(v => v.uid === uid);
        if (videoIndex !== -1) {
            const video = allHistory[key].videos[videoIndex];
            // Subtract the video's watched duration from the day total watchTime
            if (video && video.watchedDuration > 0) {
                allHistory[key].watchTime = Math.max(0, (allHistory[key].watchTime || 0) - video.watchedDuration);
            }
            allHistory[key].videos.splice(videoIndex, 1);
        }
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
            totalDuration: totalDuration || 0,
            lastUpdated: Date.now()
        };
        todayData.videos.push(videoEntry);
    }
    
    if (videoEntry) {
        videoEntry.lastUpdated = Date.now();
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
