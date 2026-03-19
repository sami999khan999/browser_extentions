// === Sidebar Event Bindings: Filters, navigation, settings, open/close ===

function bindSidebarEvents(sidebar, btn, isDragging) {
    // Filter Logic
    const chips = sidebar.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        chip.onclick = (e) => {
            e.stopPropagation();
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedDayFilter = chip.dataset.filter;
            
            const titles = {
                today: 'Watch History (Today)',
                yesterday: 'Watch History (Yesterday)',
                all: 'Watch History (Last 7 Days)'
            };
            const titleEl = document.getElementById('history-title');
            if (titleEl) titleEl.textContent = titles[selectedDayFilter];
            renderStats();
        };
    });

    // View Navigation Logic
    const switchView = (viewName) => {
        activeView = viewName;
        const hView = document.getElementById('history-view');
        const aView = document.getElementById('analytics-view');
        const sView = document.getElementById('settings-view');
        const hFilters = document.getElementById('history-header-filters');
        
        if (hView) hView.style.display = (viewName === 'history' ? 'block' : 'none');
        if (aView) aView.style.display = (viewName === 'analytics' ? 'block' : 'none');
        if (sView) sView.style.display = (viewName === 'settings' ? 'block' : 'none');
        if (hFilters) hFilters.style.display = (viewName === 'history' ? 'block' : 'none');

        // Update Button Active States
        ['nav-history', 'nav-analytics', 'nav-settings'].forEach(id => {
            const navBtn = document.getElementById(id);
            if (navBtn) navBtn.classList.toggle('active', id === `nav-${viewName}`);
        });

        renderStats();
    };

    const attachNav = (id, view) => {
        const el = document.getElementById(id);
        if (el) el.onclick = (e) => { e.stopPropagation(); switchView(view); };
    };

    attachNav('nav-history', 'history');
    attachNav('nav-analytics', 'analytics');
    attachNav('nav-settings', 'settings');

    // Settings Controls
    const shortsToggle = document.getElementById('shorts-blocker-toggle');
    if (shortsToggle) {
        shortsToggle.onchange = (e) => {
            e.stopPropagation();
            shortsBlockerSettings.enabled = shortsToggle.checked;
            saveShortsBlockerSettings();
            applyShortsBlockerState();
        };
    }

    const breakToggle = document.getElementById('break-enabled-toggle');
    if (breakToggle) {
        breakToggle.onchange = (e) => {
            e.stopPropagation();
            breakSettings.enabled = breakToggle.checked;
            saveBreakSettings();
            if (!breakSettings.enabled) {
                continuousWatchStart = null;
                breakModalShown = false;
            }
        };
    }

    const workUrlInput = document.getElementById('setting-work-url');
    if (workUrlInput) {
        workUrlInput.onchange = (e) => {
            let url = workUrlInput.value.trim();
            if (url && !url.startsWith('http')) url = 'https://' + url;
            breakSettings.workUrl = url || 'https://www.google.com';
            saveBreakSettings();
        };
    }

    const intervalMinus = document.getElementById('interval-minus');
    const intervalPlus = document.getElementById('interval-plus');
    const intervalValue = document.getElementById('interval-value');
    
    if (intervalMinus) {
        intervalMinus.onclick = (e) => {
            e.stopPropagation();
            breakSettings.intervalMinutes = Math.max(1, breakSettings.intervalMinutes - 5);
            if (intervalValue) intervalValue.textContent = breakSettings.intervalMinutes;
            saveBreakSettings();
        };
    }
    if (intervalPlus) {
        intervalPlus.onclick = (e) => {
            e.stopPropagation();
            breakSettings.intervalMinutes = Math.min(120, breakSettings.intervalMinutes + 5);
            if (intervalValue) intervalValue.textContent = breakSettings.intervalMinutes;
            saveBreakSettings();
        };
    }

    // Toggle sidebar open/close
    btn.onclick = (e) => {
        if (isDragging) return; // Don't toggle if we were dragging
        e.stopPropagation();
        isStatsOpen = !isStatsOpen;
        sidebar.classList.toggle('open', isStatsOpen);
        btn.classList.toggle('active', isStatsOpen);
        if (isStatsOpen) renderStats();
    };

    const closeBtn = document.getElementById('close-stats');
    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            isStatsOpen = false;
            sidebar.classList.remove('open');
            btn.classList.remove('active');
        };
    }

    // Close on escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isStatsOpen) {
            isStatsOpen = false;
            sidebar.classList.remove('open');
            btn.classList.remove('active');
        }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (isStatsOpen && !sidebar.contains(e.target) && e.target !== btn) {
            isStatsOpen = false;
            sidebar.classList.remove('open');
            btn.classList.remove('active');
        }
    });
}
