chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'CLOSE_TAB' && sender.tab) {
        chrome.tabs.remove(sender.tab.id);
    } else if (request.action === 'FETCH_QUOTE') {
        fetchZenQuote().then(sendResponse);
        return true; // Keep message channel open for async response
    }
});

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
    // Expanded fallback pool
    const fallbacks = [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
        { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
        { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
