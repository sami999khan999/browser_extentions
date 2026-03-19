// === Sidebar HTML Template ===

function getSidebarHTML() {
    return `
        <div class="stats-header">
            <div class="header-top">
                <h2>Stats Tracker</h2>
                <div class="header-actions">
                    <button id="nav-history" title="Watch History" class="active">${icons.history}</button>
                    <button id="nav-analytics" title="Analytics Trends">${icons.analytics}</button>
                    <button id="nav-settings" title="Settings">${icons.settings}</button>
                    <button id="close-stats">${icons.close}</button>
                </div>
            </div>
            <div id="history-header-filters">
                <div class="filter-chips">
                    <button class="filter-chip active" data-filter="today">Today</button>
                    <button class="filter-chip" data-filter="yesterday">Yesterday</button>
                    <button class="filter-chip" data-filter="all">Last 7 Days</button>
                </div>
            </div>
        </div>
        <div class="stats-body">
            <div id="history-view">
                <div class="stats-dashboard">
                    <div class="stat-card">
                        <span class="stat-label">Time on YouTube</span>
                        <span id="session-duration">00:00:00</span>
                    </div>
                    <div class="stat-card accent">
                        <span class="stat-label">Video Watch Time</span>
                        <span id="total-watch-time">00:00:00</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Videos Watched</span>
                        <span id="videos-count">0</span>
                    </div>
                </div>
                <div class="video-list-container">
                    <h3 id="history-title">Watch History (Today)</h3>
                    <ul id="video-history-list"></ul>
                </div>
            </div>
            <div id="analytics-view" style="display: none;">
                <div class="analytics-section">
                    <h3>7-Day Watch Time Trends</h3>
                    <div id="stats-chart"></div>
                </div>
                <div class="analytics-section">
                    <h3>Weekly Distribution</h3>
                    <div class="pie-chart-container">
                        <div id="pie-chart"></div>
                        <div id="pie-legend"></div>
                    </div>
                </div>
                <div id="key-insights"></div>
            </div>
            <div id="settings-view" style="display: none;">
                <h3 class="settings-title">Settings</h3>
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-item-info">
                            <span class="settings-item-label">Shorts Blocker</span>
                            <span class="settings-item-desc">Hide all YouTube Shorts from feeds, search, sidebar & block Shorts pages</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="shorts-blocker-toggle" ${shortsBlockerSettings.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-info">
                            <span class="settings-item-label">Break Reminder</span>
                            <span class="settings-item-desc">Pause video & show a motivational quote after continuous watching</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="break-enabled-toggle" ${breakSettings.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-info">
                            <span class="settings-item-label">Reminder Interval</span>
                            <span class="settings-item-desc">Minutes of continuous watching before a break</span>
                        </div>
                        <div class="interval-input-wrapper">
                            <button class="interval-btn minus" id="interval-minus">−</button>
                            <span id="interval-value" class="interval-value">${breakSettings.intervalMinutes}</span>
                            <button class="interval-btn plus" id="interval-plus">+</button>
                            <span class="interval-unit">min</span>
                        </div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-info">
                            <span class="settings-item-label">Work/Home URL</span>
                            <span class="settings-item-desc">Where the "Go to Work" button takes you</span>
                        </div>
                        <input type="text" id="setting-work-url" class="settings-text-input" value="${breakSettings.workUrl}">
                    </div>

                </div>
            </div>
        </div>
    `;
}
