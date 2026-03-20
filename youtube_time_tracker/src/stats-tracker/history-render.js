// === History View Rendering ===

function renderStats() {
    let displayWatchTime = 0;
    let displayVideos = [];
    let displayDuration = 0;
    
    const now = new Date();
    const today = getDayKey(now);
    const yesterday = getDayKey(new Date(now.getTime() - 86400000));
    
    if (selectedDayFilter === 'today') {
        const data = allHistory[today] || { watchTime: 0, videos: [], sessionStart: Date.now() };
        displayWatchTime = data.watchTime;
        displayVideos = data.videos;
        displayDuration = Math.floor((Date.now() - data.sessionStart) / 1000);
    } else if (selectedDayFilter === 'yesterday') {
        const data = allHistory[yesterday] || { watchTime: 0, videos: [], sessionStart: 0 };
        displayWatchTime = data.watchTime;
        displayVideos = data.videos;
        displayDuration = 0;
    } else {
        Object.values(allHistory).forEach(day => {
            displayWatchTime += day.watchTime;
            displayVideos = displayVideos.concat(day.videos);
        });
        displayDuration = 0;
    }

    if (activeView === 'history') {
        const durationEl = document.getElementById('session-duration');
        const watchTimeEl = document.getElementById('total-watch-time');
        const countEl = document.getElementById('videos-count');
        const listEl = document.getElementById('video-history-list');

        // Update basic counts always
        if (durationEl) {
            if (selectedDayFilter === 'today') {
                durationEl.parentElement.style.display = 'flex';
                durationEl.textContent = formatTime(displayDuration);
            } else {
                durationEl.parentElement.style.display = 'none';
            }
        }
        if (watchTimeEl) watchTimeEl.textContent = formatTime(displayWatchTime);
        if (countEl) countEl.textContent = displayVideos.length;

        // Check if we need to rebuild the list structure
        const needsFullRebuild = (activeView !== lastRenderedView || 
                                  selectedDayFilter !== lastRenderedFilter || 
                                  displayVideos.length !== lastVideoCount);

        if (needsFullRebuild && listEl) {
            lastRenderedView = activeView;
            lastRenderedFilter = selectedDayFilter;
            lastVideoCount = displayVideos.length;

            if (displayVideos.length === 0) {
                listEl.innerHTML = '<div style="text-align:center; padding: 40px; color:#666;">No activity recorded for this period.</div>';
            } else {
                listEl.innerHTML = displayVideos.slice().reverse().map(v => {
                    const percent = v.totalDuration > 0 ? Math.min(100, Math.round((v.watchedDuration / v.totalDuration) * 100)) : 0;
                    return `
                        <li class="history-item" data-video-id="${v.id}" data-time="${Math.floor(v.watchedDuration)}">
                            <img class="history-thumb" src="${v.thumbnail}" alt="thumbnail" onerror="this.onerror=null;this.src='https://www.gstatic.com/youtube/src/web/htdocs/img/favicon_144x144.png';">
                            <div class="history-info">
                                <div class="video-header-row">
                                    <div style="flex: 1; min-width: 0;">
                                        <span class="video-title" title="${v.title}">${v.title}</span>
                                        <span class="video-channel">${v.channelName || ''}</span>
                                    </div>
                                    <button class="delete-video-btn" title="Remove from History">${icons.delete}</button>
                                </div>
                                <div class="video-meta">
                                    <span class="time-readout">${formatTime(Math.round(v.watchedDuration))} / ${formatTime(Math.round(v.totalDuration))}</span>
                                    <span class="video-percent">${percent}% watched</span>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill" style="width: ${percent}%"></div>
                                </div>
                            </div>
                        </li>
                    `;
                }).join('');

                // Re-bind handlers
                listEl.querySelectorAll('.history-item').forEach(item => {
                    item.onclick = (e) => {
                        e.stopPropagation();
                        const vid = item.dataset.videoId;
                        const t = item.dataset.time;
                        if (vid && vid !== 'undefined') {
                            window.location.href = `https://www.youtube.com/watch?v=${vid}&t=${t}s`;
                        }
                    };
                    const delBtn = item.querySelector('.delete-video-btn');
                    if (delBtn) {
                        delBtn.onclick = (e) => {
                            e.stopPropagation();
                            const vid = item.dataset.videoId;
                            const videoTitle = item.querySelector('.video-title').textContent;

                            showConfirmModal({
                                title: 'Remove from History?',
                                message: `Are you sure you want to remove "${videoTitle}" from your watch history?`,
                                confirmText: 'Remove',
                                cancelText: 'Cancel',
                                icon: '🗑️',
                                onConfirm: () => {
                                    Object.keys(allHistory).forEach(key => {
                                        allHistory[key].videos = allHistory[key].videos.filter(v => v.id !== vid);
                                    });
                                    saveHistory();
                                    lastVideoCount = -1; // Force rebuild
                                    renderStats();
                                }
                            });
                        };
                    }
                });
            }
        } else if (listEl && lastVideoId) {
            // Incremental update for the active video
            const activeItem = listEl.querySelector(`.history-item[data-video-id="${lastVideoId}"]`);
            if (activeItem) {
                const videoData = displayVideos.find(v => v.id === lastVideoId);
                if (videoData) {
                    const timeEl = activeItem.querySelector('.time-readout');
                    const percentEl = activeItem.querySelector('.video-percent');
                    const progressEl = activeItem.querySelector('.progress-bar-fill');
                    const percent = videoData.totalDuration > 0 ? Math.min(100, Math.round((videoData.watchedDuration / videoData.totalDuration) * 100)) : 0;
                    
                    if (timeEl) timeEl.textContent = `${formatTime(Math.round(videoData.watchedDuration))} / ${formatTime(Math.round(videoData.totalDuration))}`;
                    if (percentEl) percentEl.textContent = `${percent}% watched`;
                    if (progressEl) progressEl.style.width = `${percent}%`;
                    activeItem.dataset.time = Math.floor(videoData.watchedDuration);
                }
            }
        }
    } else {
        if (activeView !== lastRenderedView) {
            lastRenderedView = activeView;
            renderAnalyticsView();
        }
    }
}
