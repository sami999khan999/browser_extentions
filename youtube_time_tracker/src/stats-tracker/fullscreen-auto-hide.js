// === Fullscreen Auto-hide: Hide toggle button during fullscreen inactivity ===

let autoHideTimeout = null;
const AUTO_HIDE_DELAY = 3000; // 5 seconds

function setupFullscreenAutoHide() {
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    // Listen for mouse movement to reset timer
    document.addEventListener('mousemove', resetAutoHideTimer);
}

function handleFullscreenChange() {
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const btn = document.getElementById('stats-toggle-btn');
    
    if (!btn) return;

    if (isFullscreen) {
        startAutoHideTimer();
    } else {
        stopAutoHideTimer();
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    }
}

function resetAutoHideTimer() {
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (!isFullscreen) return;

    const btn = document.getElementById('stats-toggle-btn');
    if (btn) {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    }

    startAutoHideTimer();
}

function startAutoHideTimer() {
    stopAutoHideTimer();
    autoHideTimeout = setTimeout(() => {
        const btn = document.getElementById('stats-toggle-btn');
        if (btn && !btn.classList.contains('active')) { // Only hide if sidebar is NOT open
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none'; // Prevent accidental clicks or hover while hidden
        }
    }, AUTO_HIDE_DELAY);
}

function stopAutoHideTimer() {
    if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
        autoHideTimeout = null;
    }
}
