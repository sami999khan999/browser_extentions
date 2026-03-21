// === Stats Tracking: Video watch time recording ===

function updateStats() {
    const now = Date.now();
    const delta = (now - lastWatchTimeUpdate) / 1000;
    lastWatchTimeUpdate = now;

    const watchFlexy = document.querySelector('ytd-watch-flexy');
    let videoId = watchFlexy ? watchFlexy.getAttribute('video-id') : new URLSearchParams(window.location.search).get('v');
    
    const video = document.querySelector('video.video-stream.html5-main-video') || document.querySelector('video');
    
    // Skip tracking during YouTube ads
    const isAd = !!document.querySelector('.ad-showing, .ad-interrupting, .ytp-ad-player-overlay');
    if (isAd) return;
    
    // Ensure we have a bucket for today
    const currentDay = getDayKey();
    if (!allHistory[currentDay]) {
        allHistory[currentDay] = { watchTime: 0, videos: [], sessionStart: now };
    }
    const todayData = allHistory[currentDay];
    const isNewVideo = videoId !== lastVideoId;
    
    if (videoId) {
        currentUid = `${currentDay}_${videoId}`;
        if (isNewVideo || !todayData.videos.find(v => v.uid === currentUid)) {
            if (isNewVideo) {
                lastVideoId = videoId;
            }
            
            const videoTitleEl = document.querySelector('h1.ytd-watch-metadata') || 
                                 document.querySelector('.ytd-video-primary-info-renderer h1.title') ||
                                 document.querySelector('h1.title.ytd-video-primary-info-renderer');
            const title = videoTitleEl ? videoTitleEl.textContent.trim() : 'Loading Video...';
            
            const channelNameEl = document.querySelector('#upload-info #channel-name a') || 
                                  document.querySelector('ytd-video-owner-renderer #channel-name a') ||
                                  document.querySelector('#owner-sub-count');
            const channelName = channelNameEl ? channelNameEl.textContent.trim() : 'Loading Channel...';

            if (!todayData.videos.find(v => v.uid === currentUid)) {
                todayData.videos.push({
                    uid: currentUid,
                    id: videoId,
                    title: title,
                    channelName: channelName,
                    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    startTime: new Date().toLocaleTimeString(),
                    watchedDuration: 0,
                    currentPosition: 0,
                    totalDuration: (video && isFinite(video.duration) && video.duration > 0) ? video.duration : 0
                });
            }
        }

        const activeVideo = todayData.videos.find(v => v.uid === currentUid);
        if (activeVideo && video) {
            // Lazy-load title and channel
            if (activeVideo.title === 'Loading Video...') {
                 const videoTitleEl = document.querySelector('h1.ytd-watch-metadata') || 
                                      document.querySelector('.ytd-video-primary-info-renderer h1.title');
                 if (videoTitleEl) activeVideo.title = videoTitleEl.textContent.trim();
            }
            if (activeVideo.channelName === 'Loading Channel...') {
                const channelNameEl = document.querySelector('#upload-info #channel-name a') || 
                                      document.querySelector('ytd-video-owner-renderer #channel-name a');
                if (channelNameEl) activeVideo.channelName = channelNameEl.textContent.trim();
            }
            if ((!activeVideo.totalDuration || activeVideo.totalDuration === 0) && isFinite(video.duration) && video.duration > 0) {
                 activeVideo.totalDuration = video.duration;
            }

            // Track current position specifically for the progress bar.
            // Guard: don't clobber with 0 when the video is resetting, buffering, or loading.
            if (video.currentTime > 0 || (!video.paused && video.readyState >= 2)) {
                activeVideo.currentPosition = video.currentTime;
            }

            // Only count time when video is actually playing
            if (!video.paused && !video.ended && video.readyState >= 2) {
                activeVideo.watchedDuration += delta;
                todayData.watchTime += delta;
            }
        }
    }

    if (isStatsOpen) {
        renderStats();
    }
    
    saveHistory();
}
