// === History View Rendering ===

function renderStats() {
    let displayWatchTime = 0;
    let displayVideos = [];
    let displayDuration = 0;
    
    const now = new Date();
    const today = getDayKey(now);
    const yesterday = getDayKey(new Date(now.getTime() - 86400000));
    
    if (selectedDayFilter === 'today') {
        const data = allHistory[today] || { watchTime: 0, activeTime: 0, videos: [], sessionStart: Date.now() };
        displayWatchTime = data.watchTime;
        displayVideos = data.videos;
        displayDuration = data.activeTime || 0;
    } else if (selectedDayFilter === 'yesterday') {
        const data = allHistory[yesterday] || { watchTime: 0, activeTime: 0, videos: [], sessionStart: 0 };
        displayWatchTime = data.watchTime;
        displayVideos = data.videos;
        displayDuration = data.activeTime || 0;
    } else if (selectedDayFilter === 'all') {
        Object.values(allHistory).forEach(day => {
            displayWatchTime += day.watchTime;
            displayVideos = displayVideos.concat(day.videos);
            displayDuration += (day.activeTime || 0);
        });
    } else {
        const data = allHistory[selectedDayFilter] || { watchTime: 0, activeTime: 0, videos: [], sessionStart: 0 };
        displayWatchTime = data.watchTime;
        displayVideos = data.videos;
        displayDuration = data.activeTime || 0;
    }

    const getDisplayTitle = () => {
        if (selectedDayFilter === 'today') return 'Watch History (Today)';
        if (selectedDayFilter === 'yesterday') return 'Watch History (Yesterday)';
        if (selectedDayFilter === 'all') return 'Watch History (All Time)';
        
        const [y, m, d] = selectedDayFilter.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return `History for ${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`;
    };

    if (activeView === 'history') {
        const titleEl = document.getElementById('history-title');
        if (titleEl) titleEl.textContent = getDisplayTitle();
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
                fullSortedVideos = [];
                loadedVideoCount = 0;
            } else {
                // Sort by lastUpdated descending (most recently active at the top)
                fullSortedVideos = displayVideos.slice().sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
                listEl.innerHTML = '';
                loadedVideoCount = 0;
                appendHistoryBatch();
            }
        } else if (listEl && activeView === 'history') {
            // Incremental update for ALL videos (multi-tab sync)
            displayVideos.forEach(videoData => {
                const item = listEl.querySelector(`.history-item[data-uid="${videoData.uid}"]`);
                if (item) {
                    // Update highlighting if it changed
                    const isActive = videoData.uid === currentUid;
                    item.classList.toggle('active-tab-video', isActive);
                    
                    // If active AND not already the first child, move it to the top
                    if (isActive && item.previousElementSibling) {
                        listEl.prepend(item);
                    }


                    const timeEl = item.querySelector('.time-readout');
                    const percentEl = item.querySelector('.video-percent');
                    const progressBar = item.querySelector('.progress-bar-fill');
                    const percent = videoData.totalDuration > 0 ? Math.round((videoData.watchedDuration / videoData.totalDuration) * 100) : 0;
                    
                    if (timeEl) timeEl.textContent = `${formatTime(Math.round(videoData.currentPosition || 0))} / ${formatTime(Math.round(videoData.totalDuration))}`;
                    if (percentEl) {
                        percentEl.closest('.watch-stats').querySelector('.watched-badge span').textContent = formatTime(Math.round(videoData.watchedDuration));
                        percentEl.textContent = `${percent}%`;
                    }
                    if (progressBar) {
                        const barPercent = videoData.totalDuration > 0 ? Math.min(100, ((videoData.currentPosition || 0) / videoData.totalDuration) * 100) : 0;
                        progressBar.style.width = `${barPercent}%`;
                    }
                    item.dataset.time = Math.floor(videoData.currentPosition || 0);
                }
            });
        }
    } else {
        if (activeView !== lastRenderedView) {
            lastRenderedView = activeView;
            renderAnalyticsView();
        }
    }
}
function appendHistoryBatch() {
    const listEl = document.getElementById('video-history-list');
    const loadingEl = document.getElementById('history-loading');
    if (!listEl || isInfiniteScrolling || loadedVideoCount >= fullSortedVideos.length) {
        if (loadingEl) loadingEl.style.display = 'none';
        return;
    }

    if (loadingEl) loadingEl.style.display = 'flex';
    isInfiniteScrolling = true;

    // Small delay to allow the spinner to show up (even though local render is fast)
    setTimeout(() => {
        const batch = fullSortedVideos.slice(loadedVideoCount, loadedVideoCount + historyPageSize);
        const fragment = document.createDocumentFragment();
        
        batch.forEach(v => {
            const li = document.createElement('li');
            const percent = v.totalDuration > 0 ? Math.round((v.watchedDuration / v.totalDuration) * 100) : 0;
            const isActive = v.uid === currentUid;
            
            li.className = `history-item ${isActive ? 'active-tab-video' : ''}`;
            li.dataset.videoId = v.id;
            li.dataset.uid = v.uid;
            li.dataset.time = Math.floor(v.currentPosition || 0);
            
            li.innerHTML = `
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
                        <span class="time-readout">${formatTime(Math.round(v.currentPosition || 0))} / ${formatTime(Math.round(v.totalDuration))}</span>
                        <div class="watch-stats">
                            <div class="watched-badge">
                                <span>${formatTime(Math.round(v.watchedDuration))}</span>
                            </div>
                            <span class="video-percent">${percent}%</span>
                        </div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${v.totalDuration > 0 ? Math.min(100, ((v.currentPosition || 0) / v.totalDuration) * 100) : 0}%"></div>
                    </div>
                </div>
            `;

            li.onclick = (e) => {
                e.stopPropagation();
                const vid = li.dataset.videoId;
                const t = li.dataset.time;
                if (vid && vid !== 'undefined') {
                    window.location.href = `https://www.youtube.com/watch?v=${vid}&t=${t}s`;
                }
            };

            const delBtn = li.querySelector('.delete-video-btn');
            if (delBtn) {
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    const uid = li.dataset.uid;
                    const videoTitle = li.querySelector('.video-title').textContent;

                    showConfirmModal({
                        title: 'Remove from History?',
                        message: `Are you sure you want to remove "${videoTitle}" from your watch history?`,
                        confirmText: 'Remove',
                        cancelText: 'Cancel',
                        icon: '🗑️',
                        onConfirm: () => {
                            deleteHistoryVideo(uid);
                            lastVideoCount = -1; // Force rebuild
                            renderStats();
                        }
                    });
                };
            }
            
            fragment.appendChild(li);
        });

        listEl.appendChild(fragment);
        loadedVideoCount += batch.length;
        isInfiniteScrolling = false;
        
        // Hide loading indicator if no more videos
        if (loadedVideoCount >= fullSortedVideos.length && loadingEl) {
            loadingEl.style.display = 'none';
        }
    }, 100);
}
