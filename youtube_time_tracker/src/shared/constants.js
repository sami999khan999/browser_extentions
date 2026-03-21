// === Constants: Colors & SVG Icons ===

const SHORTS_BLOCKER_CSS_ID = 'yt-shorts-blocker-dynamic-css';
const SHORTS_BLOCKER_CSS = `
/* Hiding Shorts Sidebar Entries */
ytd-guide-entry-renderer:has(a[href="/shorts"]),
ytd-mini-guide-entry-renderer:has(a[href="/shorts"]),
ytd-guide-entry-renderer:has(a[title="Shorts"]),
ytd-mini-guide-entry-renderer:has(a[title="Shorts"]) {
    display: none !important;
}
/* Hiding Home Feed Shorts Sections */
ytd-rich-shelf-renderer[is-shorts],
ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
ytd-reel-shelf-renderer {
    display: none !important;
}
/* Hiding Shorts in Search Results */
ytd-reel-shelf-renderer,
ytd-shelf-renderer:has(ytd-reel-shelf-renderer),
ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
ytd-item-section-renderer:has(ytd-reel-shelf-renderer),
ytd-item-section-renderer.ytGridShelfViewModelHost:has(a[href*="/shorts/"]),
ytd-shelf-renderer[is-shorts],
ytd-rich-shelf-renderer[is-shorts],
ytd-shelf-renderer:has(yt-icon[type="shorts"]),
ytd-rich-section-renderer:has(yt-icon[type="shorts"]),
ytd-shelf-renderer:has(a[href*="/shorts/"]),
ytd-rich-section-renderer:has(a[href*="/shorts/"]),
ytd-rich-shelf-renderer:has(a[href*="/shorts/"]) {
    display: none !important;
}
/* Hiding individual Shorts videos */
ytd-video-renderer:has(a[href*="/shorts/"]),
ytd-grid-video-renderer:has(a[href*="/shorts/"]),
ytd-rich-item-renderer:has(a[href*="/shorts/"]),
ytd-reel-item-renderer,
ytd-compact-video-renderer:has(a[href*="/shorts/"]) {
    display: none !important;
}
/* Hiding Shorts Section in Navigation Drawer */
ytd-guide-section-renderer:has(a[href*="/shorts"]),
ytd-guide-entry-renderer:has(a[href*="/shorts"]) {
    display: none !important;
}
/* Hiding Shorts Tab on Channel Pages */
yt-tab-shape[tab-title="Shorts"],
.yt-tab-shape-wiz__tab[aria-label="Shorts"],
a[href*="/shorts/"] {
    display: none !important;
}
/* Specific fix for sidebar links that might have escaped */
ytd-guide-entry-renderer a[href*="/shorts"],
ytd-mini-guide-entry-renderer a[href*="/shorts"] {
    display: none !important;
}
`;

const dayColors = [
    '#FF0033', // Today (Revised Primary)
    '#ff8a00', // -1
    '#ffc700', // -2
    '#00e000', // -3
    '#00c2ff', // -4
    '#7000ff', // -5
    '#ff00c7'  // -6
];

const icons = {
    analytics: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    history: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    delete: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    stats_toggle: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path></svg>`,
    settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
};
