// === Stats Tracking: Video watch time recording ===

function updateStats() {
    const now = Date.now();
    const delta = (now - lastWatchTimeUpdate) / 1000;
    lastWatchTimeUpdate = now;

    const watchFlexy = document.querySelector('ytd-watch-flexy');
    let videoId = watchFlexy ? watchFlexy.getAttribute('video-id') : new URLSearchParams(window.location.search).get('v');
    
    const video = document.querySelector('video.video-stream.html5-main-video') || document.querySelector('video');
    
    // Ensure we have a bucket for today (in case the date rolled over while tab was open)
    const currentDay = getDayKey();
    if (!allHistory[currentDay]) {
        allHistory[currentDay] = { watchTime: 0, videos: [], sessionStart: now };
    }
    const todayData = allHistory[currentDay];

    if (videoId) {
        if (videoId !== lastVideoId) {
            lastVideoId = videoId;
            const videoTitleEl = document.querySelector('h1.ytd-watch-metadata') || 
                                 document.querySelector('.ytd-video-primary-info-renderer h1.title') ||
                                 document.querySelector('h1.title.ytd-video-primary-info-renderer');
            const title = videoTitleEl ? videoTitleEl.textContent.trim() : 'Loading Video...';
            
            if (!todayData.videos.find(v => v.id === videoId)) {
                todayData.videos.push({
                    id: videoId,
                    title: title,
                    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    startTime: new Date().toLocaleTimeString(),
                    watchedDuration: 0,
                    totalDuration: (video && isFinite(video.duration) && video.duration > 0) ? video.duration : 0
                });
            }
        }

        const activeVideo = todayData.videos.find(v => v.id === videoId);
        if (activeVideo && video) {
            if (activeVideo.title === 'Loading Video...') {
                 const videoTitleEl = document.querySelector('h1.ytd-watch-metadata') || 
                                      document.querySelector('.ytd-video-primary-info-renderer h1.title');
                 if (videoTitleEl) activeVideo.title = videoTitleEl.textContent.trim();
            }

            if ((!activeVideo.totalDuration || activeVideo.totalDuration === 0) && isFinite(video.duration) && video.duration > 0) {
                 activeVideo.totalDuration = video.duration;
            }
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
