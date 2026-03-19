// === Shorts Blocker: Hide shorts, reorder sidebar, manage CSS ===

function injectShortsBlockerCSS() {
    if (!document.getElementById(SHORTS_BLOCKER_CSS_ID)) {
        const style = document.createElement('style');
        style.id = SHORTS_BLOCKER_CSS_ID;
        style.textContent = SHORTS_BLOCKER_CSS;
        (document.head || document.documentElement).appendChild(style);
    }
}

function removeShortsBlockerCSS() {
    const el = document.getElementById(SHORTS_BLOCKER_CSS_ID);
    if (el) el.remove();
}

function applyShortsBlockerState() {
    if (shortsBlockerSettings.enabled) {
        injectShortsBlockerCSS();
        blockShorts();
    } else {
        removeShortsBlockerCSS();
        removeMockingScreen();
        // Un-hide any JS-hidden shorts tabs
        unhideShortsTabs();
    }
}

function unhideShortsTabs() {
    const selectors = ['yt-tab-shape', 'tp-yt-paper-tab', '.yt-tab-shape-wiz__tab', 'yt-chip-cloud-chip-renderer'];
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            const text = el.textContent.trim().toLowerCase();
            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            const title = (el.getAttribute('tab-title') || '').toLowerCase();
            if (text === 'shorts' || aria === 'shorts' || title === 'shorts') {
                el.style.removeProperty('display');
            }
        });
    });
}

function blockShorts() {
    // Hide channel tabs using JS (more reliable than CSS for text matching)
    hideShortsTabs();
    
    // Reorder sidebar as requested
    reorderSidebar();

    // Check if we are on a shorts page
    if (window.location.pathname.startsWith('/shorts/')) {
        injectMockingScreen();
    } else {
        removeMockingScreen();
    }
}

function reorderSidebar() {
    // Find the sections by targeting the links they contain
    // "Subscriptions" corresponds to /feed/subscriptions
    // "You" corresponds to /feed/you or /feed/library
    const subLink = document.querySelector('a[href="/feed/subscriptions"]');
    const youLink = document.querySelector('a[href="/feed/you"], a[href="/feed/library"]');

    if (subLink && youLink) {
        const subSection = subLink.closest('ytd-guide-section-renderer');
        const youSection = youLink.closest('ytd-guide-section-renderer');

        if (subSection && youSection && subSection.parentNode === youSection.parentNode) {
            const parent = subSection.parentNode;
            // Check if youSection is after subSection in the DOM
            if (subSection.compareDocumentPosition(youSection) & Node.DOCUMENT_POSITION_FOLLOWING) {
                // Move youSection before subSection
                parent.insertBefore(youSection, subSection);
            }
        }
    }
}

function hideShortsTabs() {
    const selectors = ['yt-tab-shape', 'tp-yt-paper-tab', '.yt-tab-shape-wiz__tab', 'yt-chip-cloud-chip-renderer'];
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            const text = el.textContent.trim().toLowerCase();
            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            const title = (el.getAttribute('tab-title') || '').toLowerCase();
            
            if (text === 'shorts' || aria === 'shorts' || title === 'shorts' || (el.querySelector && el.querySelector('a[href*="/shorts"]'))) {
                el.style.setProperty('display', 'none', 'important');
            }
        });
    });

    // Also hide any link that goes to shorts directly
    const links = document.querySelectorAll('a[href*="/shorts"]');
    links.forEach(link => {
        // If it's a tab link, hide the parent/containier if needed, but mostly the link itself
        if (link.classList.contains('yt-tab-shape-wiz__tab') || link.closest('tp-yt-paper-tab')) {
             const tab = link.closest('yt-tab-shape') || link.closest('tp-yt-paper-tab') || link;
             tab.style.setProperty('display', 'none', 'important');
        }
    });
}
