// === Sidebar HTML Template ===

function getSidebarHTML() {
  return `
        <div class="stats-header">
            <div class="header-top">
                <h2>Stats Tracker</h2>
                <div class="header-actions">
                    <button id="nav-history" title="Watch History" class="active">${icons.history}</button>
                    <button id="nav-analytics" title="Analytics Trends">${icons.analytics}</button>
                    <button id="nav-backup" title="Backup & Restore">${icons.backup}</button>
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
                    <div class="section-header">
                        <span class="section-icon">${icons.analytics}</span>
                        <h3>7-Day Trends</h3>
                    </div>
                    <div id="stats-chart"></div>
                </div>
                
                <div class="analytics-section">
                    <div class="section-header">
                        <span class="section-icon">${icons.history}</span>
                        <h3>Watch Distribution</h3>
                    </div>
                    <div class="pie-layout">
                        <div id="pie-chart"></div>
                        <div id="pie-legend"></div>
                    </div>
                </div>

                <div class="analytics-section no-border">
                    <div class="section-header">
                        <span class="section-icon">${icons.analytics}</span>
                        <h3>Key Insights</h3>
                    </div>
                    <div id="key-insights" class="insights-container"></div>
                </div>
            </div>

            <div id="settings-view" style="display: none;">
                <div class="settings-section">
                    <h4 class="section-title">Features</h4>
                    <div class="settings-card">
                        <div class="settings-item">
                            <div class="settings-item-info">
                                <div class="label-with-icon">
                                    <span class="item-icon">${icons.close}</span>
                                    <span class="settings-item-label">Shorts Blocker</span>
                                </div>
                                <span class="settings-item-desc">Hide all YouTube Shorts from feeds and ignore Shorts pages</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="shorts-blocker-toggle" ${shortsBlockerSettings.enabled ? "checked" : ""}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-info">
                                <div class="label-with-icon">
                                    <span class="item-icon">${icons.history}</span>
                                    <span class="settings-item-label">Break Reminder</span>
                                </div>
                                <span class="settings-item-desc">Show a motivational quote after continuous watching</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="break-enabled-toggle" ${breakSettings.enabled ? "checked" : ""}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-info">
                                <div class="label-with-icon">
                                    <span class="item-icon">${icons.dislike}</span>
                                    <span class="settings-item-label">Show Dislike Count</span>
                                </div>
                                <span class="settings-item-desc">Bring back the YouTube dislike count using the RYD API</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="dislike-count-toggle" ${dislikeCountSettings.enabled ? "checked" : ""}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h4 class="section-title">Configuration</h4>
                    <div class="settings-card">
                        <div class="settings-item vertical">
                            <div class="settings-item-info">
                                <span class="settings-item-label">Reminder Interval</span>
                                <span class="settings-item-desc">Minutes of watching before a break (1-120)</span>
                            </div>
                            <div class="interval-input-wrapper">
                                <button class="interval-btn minus" id="interval-minus">−</button>
                                <input type="number" id="interval-value" class="interval-value" value="${breakSettings.intervalMinutes}" min="1" max="120">
                                <button class="interval-btn plus" id="interval-plus">+</button>
                                <span class="interval-unit">min</span>
                            </div>
                        </div>
                        <div class="settings-item vertical">
                            <div class="settings-item-info">
                                <span class="settings-item-label">Go-to-Work URL</span>
                                <span class="settings-item-desc">Target URL for the "Go to Work" break action</span>
                            </div>
                            <input type="text" id="setting-work-url" class="settings-text-input" value="${breakSettings.workUrl}" placeholder="https://google.com">
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h4 class="section-title">Maintenance</h4>
                    <div class="settings-action-card">
                        <button id="clear-all-data" class="danger-btn">
                            ${icons.delete} Clear All History & Stats
                        </button>
                    </div>
                </div>
            </div>

            <div id="backup-view" style="display: none;">
               

                <div class="settings-section">
                    <h4 class="section-title">Backup Strategy</h4>
                    <div class="settings-card">
                        <div class="settings-item">
                            <div class="settings-item-info">
                                <div class="label-with-icon">
                                    <span class="item-icon">${icons.backup}</span>
                                    <span class="settings-item-label">Enable Automatic Backups</span>
                                </div>
                                <span class="settings-item-desc">Regularly save state to local database</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="backup-enabled-toggle" ${backupSettings.enabled ? "checked" : ""}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="settings-item">
                            <div class="settings-item-info">
                                <div class="label-with-icon">
                                    <span class="item-icon">${icons.history}</span>
                                    <span class="settings-item-label">Backup on YouTube Close</span>
                                </div>
                                <span class="settings-item-desc">Trigger backup when you finish your session</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="backup-on-close-toggle" ${backupSettings.backupOnClose ? "checked" : ""}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="settings-item vertical">
                            <div class="settings-item-info">
                                <div class="label-with-icon">
                                    <span class="item-icon">${icons.history}</span>
                                    <span class="settings-item-label">Backup Interval</span>
                                </div>
                                <span class="settings-item-desc">How often to perform periodic backup</span>
                            </div>
                            <div class="custom-dropdown" id="backup-interval-dropdown" data-value="${backupSettings.intervalHours}">
                                <div class="dropdown-trigger">
                                    <span>${
                                      {
                                        1: "Every Hour",
                                        6: "Every 6 Hours",
                                        12: "Every 12 Hours",
                                        24: "Every Day",
                                        168: "Every Week",
                                      }[backupSettings.intervalHours] || "Every Day"
                                    }</span>
                                    <svg class="dropdown-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                                <div class="dropdown-menu">
                                    <div class="dropdown-item ${backupSettings.intervalHours == 1 ? "active" : ""}" data-value="1">Every Hour</div>
                                    <div class="dropdown-item ${backupSettings.intervalHours == 6 ? "active" : ""}" data-value="6">Every 6 Hours</div>
                                    <div class="dropdown-item ${backupSettings.intervalHours == 12 ? "active" : ""}" data-value="12">Every 12 Hours</div>
                                    <div class="dropdown-item ${backupSettings.intervalHours == 24 ? "active" : ""}" data-value="24">Every Day</div>
                                    <div class="dropdown-item ${backupSettings.intervalHours == 168 ? "active" : ""}" data-value="168">Every Week</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="section-header-row">
                        <h4 class="section-title">Stored Backups</h4>
                        <button id="create-manual-backup" class="small-action-btn">
                            ${icons.backup} New Backup
                        </button>
                    </div>
                    <div class="backup-list-container">
                        <ul id="backup-history-list" class="backup-list">
                            <li class="loading-placeholder">Loading backups...</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}
