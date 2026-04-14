// === Sidebar HTML Template ===

function getSidebarHTML() {
  return `
        <div class="stats-header">
            <div class="header-top">
                <div class="header-view-title">
                    <button id="view-back-btn" class="icon-back-btn" title="Go Back">
                        ${icons.prev}
                    </button>
                    <h2 id="view-title-text">Stats Tracker</h2>
                </div>
                <div class="header-actions">
                    <button id="nav-history" title="Watch History" class="active">${icons.history}</button>
                    <button id="nav-analytics" title="Analytics Trends">${icons.analytics}</button>
                    <button id="nav-backup" title="Backup & Restore">${icons.backup}</button>
                    <button id="nav-settings" title="Settings">${icons.settings}</button>
                    <button id="close-stats">${icons.close}</button>
                </div>
            </div>
        </div>

        <div id="stats-header-filters" class="stats-subheader collapsed" style="display: none;">
            <div class="filter-toolbar">
                <div class="date-nav-group">
                    <button id="date-prev" class="nav-arrow-btn" title="Previous Day">
                        ${icons.prev}
                    </button>
                    <div class="current-date-label">Today</div>
                    <button id="date-next" class="nav-arrow-btn" title="Next Day">
                        ${icons.next}
                    </button>
                </div>

                <div class="custom-dropdown" id="history-period-dropdown" data-value="${selectedDayFilter}">
                    <div class="dropdown-trigger">
                        <span>Last 7 Days</span>
                        <svg class="dropdown-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                    <div class="dropdown-menu">
                        <div class="dropdown-item" data-value="today">Today</div>
                        <div class="dropdown-item" data-value="yesterday">Yesterday</div>
                        <div class="dropdown-item" data-value="7days">Last 7 Days</div>
                        <div class="dropdown-item" data-value="15days">Last 15 Days</div>
                        <div class="dropdown-item" data-value="30days">Last 30 Days</div>
                        <div class="dropdown-item" data-value="90days">Last 3 Months</div>
                        <div class="dropdown-item" data-value="180days">Last 6 Months</div>
                        <div class="dropdown-item" data-value="365days">Last Year</div>
                        <div class="dropdown-item special" data-value="all">All History</div>
                    </div>
                </div>

                <button id="calendar-trigger" class="nav-arrow-btn calendar-trigger-btn" title="Pick Date">
                    ${icons.calendar}
                </button>
            </div>
        </div>
        <div id="calendar-popover" class="calendar-popover" style="display: none;"></div>
        <div id="history-filter-toggle" class="filter-toggle-strip" style="display: none;">
            <button id="toggle-filter-btn" class="toggle-arrow-btn" title="Toggle Filters">
                ${icons.chevron_down}
            </button>
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
                    <div class="history-header-row">
                        <h3 id="history-title">Watch History (Today)</h3>
                        <button id="nav-to-channels" class="header-pill-btn">Channels</button>
                    </div>
                    <ul id="video-history-list"></ul>
                    <div id="history-loading" class="infinite-scroll-loader" style="display: none;">
                        <div class="loading-spinner"></div>
                        <span>Loading more activity...</span>
                    </div>
                </div>
            </div>
            <div id="analytics-view" style="display: none;">
                <div class="analytics-dashboard">
                    <div class="stat-card glass">
                        <span class="stat-label">Total Period Watch</span>
                        <span id="analytics-total-time">0h 0m</span>
                    </div>
                    <div class="stat-card glass">
                        <span class="stat-label">Daily Average</span>
                        <span id="analytics-avg-time">0h 0m</span>
                    </div>
                </div>

                <div class="analytics-section">
                    <div class="section-header">
                        <div class="header-main">
                           <span class="section-icon">${icons.analytics}</span>
                           <h3>Watch Trends</h3>
                        </div>
                        <span id="trends-period-label" class="header-period-tag">Last 7 Days</span>
                    </div>
                    <div class="chart-container-outer">
                        <div class="chart-scroll-arrow left" id="chart-scroll-left">
                            ${icons.prev}
                        </div>
                        <div class="chart-scroll-track" id="chart-scroll-track">
                            <div id="stats-chart" class="main-bar-chart"></div>
                        </div>
                        <div class="chart-scroll-arrow right" id="chart-scroll-right">
                            ${icons.next}
                        </div>
                    </div>
                </div>

                <div class="analytics-section">
                    <div class="section-header">
                        <div class="header-main">
                            <span class="section-icon">${icons.history}</span>
                            <h3>Watch Distribution</h3>
                        </div>
                    </div>
                    <div class="pie-layout-modern-v">
                        <div class="pie-chart-wrapper-large">
                            <div id="pie-chart"></div>
                            <div class="pie-center-info">
                                <span id="pie-total-label">Total</span>
                                <span id="pie-total-value">0h</span>
                            </div>
                        </div>
                        <div id="pie-legend" class="modern-legend-pills"></div>
                    </div>
                </div>

                <div class="analytics-section">
                    <div class="section-header">
                        <div class="header-main">
                            <span class="section-icon">${icons.calendar}</span>
                            <h3>Heatmap</h3>
                        </div>
                        <div class="heatmap-header-actions">
                            <div id="heatmap-year-selector" class="heatmap-year-selector"></div>
                            <div class="heatmap-legend">
                                <span>Less</span>
                                <div class="legend-cells">
                                    <div class="cell level-0"></div>
                                    <div class="cell level-1"></div>
                                    <div class="cell level-2"></div>
                                    <div class="cell level-3"></div>
                                    <div class="cell level-4"></div>
                                </div>
                                <span>More</span>
                            </div>
                        </div>
                    </div>
                    <div class="heatmap-container-outer">
                        <div class="chart-scroll-arrow left" id="heatmap-scroll-left">
                            ${icons.prev}
                        </div>
                        <div id="activity-heatmap" class="heatmap-scroll-track">
                            <div class="loading-placeholder">Generating heatmap...</div>
                        </div>
                        <div class="chart-scroll-arrow right" id="heatmap-scroll-right">
                            ${icons.next}
                        </div>
                    </div>
                </div>

                <div class="analytics-section no-border">
                    <div class="section-header">
                        <div class="header-main">
                            <span class="section-icon">${icons.analytics}</span>
                            <h3>Key Insights</h3>
                        </div>
                    </div>
                    <div id="key-insights" class="insights-grid"></div>
                </div>
            </div>

            <div id="channel-distribution-view" style="display: none;">
                <div id="full-channel-list" class="detailed-channel-list">
                    <div class="loading-placeholder">Loading distribution...</div>
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
                                      }[backupSettings.intervalHours] ||
                                      "Every Day"
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
                        <div class="settings-item vertical">
                            <div class="settings-item-info">
                                <div class="label-with-icon">
                                    <span class="item-icon">${icons.backup}</span>
                                    <span class="settings-item-label">Backups to Keep</span>
                                </div>
                                <span class="settings-item-desc">Maximum number of backups to store (1-50)</span>
                            </div>
                            <div class="interval-input-wrapper">
                                <button class="interval-btn minus" id="max-backups-minus">−</button>
                                <input type="number" id="max-backups-value" class="interval-value" value="${backupSettings.maxBackups || 10}" min="1" max="50">
                                <button class="interval-btn plus" id="max-backups-plus">+</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4 class="section-title">History Management</h4>
                    <div class="settings-card">
                        <div class="settings-item vertical">
                            <div class="settings-item-info">
                                <div class="label-with-icon">
                                    <span class="item-icon">${icons.history}</span>
                                    <span class="settings-item-label">Data Retention</span>
                                </div>
                                <span class="settings-item-desc">How long to keep your watch history</span>
                            </div>
                            <div class="custom-dropdown" id="retention-duration-dropdown" data-value="${retentionSettings.duration}">
                                <div class="dropdown-trigger">
                                    <span>${
                                      {
                                        7: "7 Days",
                                        15: "15 Days",
                                        30: "30 Days",
                                        90: "3 Months",
                                        180: "6 Months",
                                        365: "1 Year",
                                        [-1]: "Unlimited",
                                      }[retentionSettings.duration] || "7 Days"
                                    }</span>
                                    <svg class="dropdown-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                                <div class="dropdown-menu">
                                    <div class="dropdown-item ${retentionSettings.duration == 7 ? "active" : ""}" data-value="7">7 Days</div>
                                    <div class="dropdown-item ${retentionSettings.duration == 15 ? "active" : ""}" data-value="15">15 Days</div>
                                    <div class="dropdown-item ${retentionSettings.duration == 30 ? "active" : ""}" data-value="30">30 Days</div>
                                    <div class="dropdown-item ${retentionSettings.duration == 90 ? "active" : ""}" data-value="90">3 Months</div>
                                    <div class="dropdown-item ${retentionSettings.duration == 180 ? "active" : ""}" data-value="180">6 Months</div>
                                    <div class="dropdown-item ${retentionSettings.duration == 365 ? "active" : ""}" data-value="365">1 Year</div>
                                    <div class="dropdown-item ${retentionSettings.duration == -1 ? "active" : ""}" data-value="-1">Unlimited</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="section-header-row vertical">
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 4px;">
                            <h4 class="section-title" style="margin-bottom: 0;">Stored Backups</h4>
                            <button id="delete-all-backups" class="section-action-link danger">Clear All</button>
                        </div>
                        <div class="header-button-group full-width">
                            <button id="import-backup-json" class="small-action-btn secondary">
                                ${icons.download} Import JSON
                            </button>
                            <button id="create-manual-backup" class="small-action-btn">
                                ${icons.backup} New Backup
                            </button>
                            <input type="file" id="backup-file-input" accept=".json" style="display: none;">
                        </div>
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
