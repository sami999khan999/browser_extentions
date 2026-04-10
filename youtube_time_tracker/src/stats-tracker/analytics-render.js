// === Analytics Rendering: Bar chart, pie chart, heatmaps, insights ===

function renderAnalyticsView() {
    const data = getFilteredAnalyticsData();
    
    // Update Overview Stats
    updateAnalyticsOverview(data);
    
    // Render Components
    renderMainTrendsChart(data);
    renderWatchDistribution(data);
    renderActivityHeatmap();
    renderDetailedInsights(data);
}

/**
 * Aggregates watch data based on the current global selectedDayFilter
 */
function getFilteredAnalyticsData() {
    const now = new Date();
    const result = {
        days: [], // { key, label, value, color }
        channels: [], // { label, value }
        totalWatchTime: 0,
        videoCounts: 0,
        averageWatchTime: 0,
        maxDay: { key: '', value: 0 }
    };

    const channelsMap = {};

    let keysToInclude = [];

    if (selectedDayFilter === 'today') {
        keysToInclude = [getDayKey(now)];
    } else if (selectedDayFilter === 'yesterday') {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        keysToInclude = [getDayKey(yest)];
    } else if (selectedDayFilter.endsWith('days')) {
        const daysCount = parseInt(selectedDayFilter);
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            keysToInclude.push(getDayKey(d));
        }
    } else if (selectedDayFilter === 'all') {
        keysToInclude = Object.keys(allHistory).sort();
    } else {
        // Specific date YYYY-MM-DD
        keysToInclude = [selectedDayFilter];
    }

    keysToInclude.forEach((key, index) => {
        const dayData = allHistory[key] || { watchTime: 0, activeTime: 0, videos: [] };
        const val = dayData.watchTime;
        
        // Always show labels, but format shorter for larger ranges
        const [y, m, d] = key.split('-');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        let label = '';
        
        if (keysToInclude.length <= 14) {
             label = `${d} ${months[parseInt(m)-1]}`;
        } else {
             label = `${d}/${m}`;
        }

        result.days.push({
            key,
            label,
            value: val,
            color: dayColors[index % dayColors.length],
            activeTime: dayData.activeTime || 0,
            videoCount: dayData.videos ? dayData.videos.length : 0,
            topVideos: [...(dayData.videos || [])]
                .sort((a, b) => (b.watchedDuration || 0) - (a.watchedDuration || 0))
                .slice(0, 3)
                .map(v => v.title)
        });

        // Aggregate Channels
        (dayData.videos || []).forEach(v => {
            const chan = v.channelName || 'Unknown Channel';
            channelsMap[chan] = (channelsMap[chan] || 0) + (v.watchedDuration || 0);
        });

        result.totalWatchTime += val;
        result.videoCounts += (dayData.videos ? dayData.videos.length : 0);
        
        if (val > result.maxDay.value) {
            result.maxDay = { key, value: val };
        }
    });

    result.averageWatchTime = keysToInclude.length > 0 ? result.totalWatchTime / keysToInclude.length : 0;
    
    // Sort and finalize channels
    result.channels = Object.entries(channelsMap)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
    
    return result;
}

function updateAnalyticsOverview(data) {
    const totalEl = document.getElementById('analytics-total-time');
    const avgEl = document.getElementById('analytics-avg-time');
    const periodEl = document.getElementById('trends-period-label');

    if (totalEl) totalEl.textContent = formatTimeShort(data.totalWatchTime);
    if (avgEl) avgEl.textContent = formatTimeShort(data.averageWatchTime);
    
    if (periodEl) {
        if (selectedDayFilter === 'today') periodEl.textContent = 'Today';
        else if (selectedDayFilter === 'yesterday') periodEl.textContent = 'Yesterday';
        else if (selectedDayFilter.endsWith('days')) periodEl.textContent = `Last ${parseInt(selectedDayFilter)} Days`;
        else if (selectedDayFilter === 'all') periodEl.textContent = 'All Time';
        else periodEl.textContent = selectedDayFilter;
    }
}

function formatTimeShort(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function renderMainTrendsChart(data) {
    const chartContainer = document.getElementById('stats-chart');
    if (!chartContainer) return;

    if (data.days.length === 0) {
        chartContainer.innerHTML = '<div class="no-data-msg">No data for this period</div>';
        return;
    }

    const maxValue = Math.max(...data.days.map(d => d.value), 3600); // at least 1hr scale
    
    chartContainer.innerHTML = data.days.map(d => {
        const height = Math.max(4, (d.value / maxValue) * 100);
        const isActive = d.key === getDayKey(new Date());
        
        // Construct Rich Tooltip HTML
        const [y, m, day] = d.key.split('-');
        const dateObj = new Date(y, m-1, day);
        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        
        let tooltipContent = `
            <div class="tooltip-date">${dateStr}</div>
            <div class="tooltip-stat-row">
                <span class="tooltip-stat-label">Watch Time</span>
                <span class="tooltip-stat-value">${formatTime(Math.round(d.value))}</span>
            </div>
        `;
        
        if (d.activeTime > 0) {
            tooltipContent += `
                <div class="tooltip-stat-row">
                    <span class="tooltip-stat-label">Active Time</span>
                    <span class="tooltip-stat-value">${formatTime(Math.round(d.activeTime))}</span>
                </div>
            `;
        }
        
        tooltipContent += `
            <div class="tooltip-stat-row">
                <span class="tooltip-stat-label">Videos</span>
                <span class="tooltip-stat-value">${d.videoCount}</span>
            </div>
        `;
        
        if (d.topVideos && d.topVideos.length > 0) {
            tooltipContent += `
                <div class="tooltip-videos-header">Top Videos</div>
                ${d.topVideos.map(title => `<div class="tooltip-video-item">${title}</div>`).join('')}
            `;
        }

        return `
            <div class="chart-bar-wrapper ${isActive ? 'active' : ''}" data-tooltip='${tooltipContent.replace(/'/g, "&apos;")}'>
                <div class="chart-bar-outer">
                    <div class="chart-bar-fill" style="height: ${height}%; background: ${d.color}"></div>
                </div>
                ${d.label ? `<span class="chart-label">${d.label}</span>` : ''}
            </div>
        `;
    }).join('');

    // Re-bind tooltips
    bindAnalyticsTooltips(chartContainer);

    // Setup scroll arrows
    initCustomScroll('chart-scroll-track', 'chart-scroll-left', 'chart-scroll-right');
}

function initCustomScroll(trackId, leftId, rightId) {
    const track = document.getElementById(trackId);
    const leftArrow = document.getElementById(leftId);
    const rightArrow = document.getElementById(rightId);
    if (!track || !leftArrow || !rightArrow) return;

    // Auto-scroll to end on render
    track.scrollLeft = track.scrollWidth;

    let scrollInterval = null;
    let currentSpeed = 3;
    const baseSpeed = 3;
    const turboSpeed = 12;

    const startScroll = (direction) => {
        stopScroll();
        scrollInterval = setInterval(() => {
            track.scrollLeft += direction * currentSpeed;
        }, 16); // ~60fps
    };

    const stopScroll = () => {
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
        currentSpeed = baseSpeed;
    };

    const enhanceSpeed = () => {
        currentSpeed = turboSpeed;
    };

    leftArrow.onmouseenter = () => startScroll(-1);
    leftArrow.onmouseleave = stopScroll;
    leftArrow.onmousedown = (e) => {
        if (e.button === 0) enhanceSpeed();
    };
    leftArrow.onmouseup = () => currentSpeed = baseSpeed;

    rightArrow.onmouseenter = () => startScroll(1);
    rightArrow.onmouseleave = stopScroll;
    rightArrow.onmousedown = (e) => {
        if (e.button === 0) enhanceSpeed();
    };
    rightArrow.onmouseup = () => currentSpeed = baseSpeed;

    // Update arrow visibility based on scroll position  
    const updateArrowVisibility = () => {
        const atStart = track.scrollLeft <= 2;
        const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
        leftArrow.style.opacity = atStart ? '0.15' : '';
        rightArrow.style.opacity = atEnd ? '0.15' : '';
        leftArrow.style.pointerEvents = atStart ? 'none' : '';
        rightArrow.style.pointerEvents = atEnd ? 'none' : '';
    };

    track.onscroll = updateArrowVisibility;
    // Initial check after render settles
    setTimeout(updateArrowVisibility, 50);
}

function renderWatchDistribution(data) {
    const pieChart = document.getElementById('pie-chart');
    const pieLegend = document.getElementById('pie-legend');
    const centerVal = document.getElementById('pie-total-value');
    if (!pieChart || !pieLegend) return;

    if (centerVal) centerVal.textContent = formatTimeShort(data.totalWatchTime);

    if (data.totalWatchTime === 0 || data.channels.length === 0) {
        pieChart.style.background = 'var(--stats-chart-bar-bg)';
        pieLegend.innerHTML = '<div class="legend-empty">No activity recorded</div>';
        return;
    }

    // Top 5 channels or aggregate others
    const sorted = [...data.channels];
    const topN = sorted.slice(0, 5).map((c, i) => ({
        ...c,
        color: dayColors[i % dayColors.length]
    }));
    
    const othersValue = sorted.slice(5).reduce((acc, c) => acc + c.value, 0);
    
    if (othersValue > 0) {
        topN.push({ label: 'Others', value: othersValue, color: '#666' });
    }

    let cumulativePercent = 0;
    const slices = topN.map(d => {
        const start = cumulativePercent;
        const end = start + (d.value / data.totalWatchTime) * 100;
        cumulativePercent = end;
        return { ...d, start, end };
    });

    pieChart.style.background = `conic-gradient(${slices.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')})`;
    
    pieLegend.innerHTML = slices.map(d => `
        <div class="legend-item">
            <span class="legend-color" style="background: ${d.color}"></span>
            <span class="legend-label">${d.label || d.key}</span>
            <span class="legend-value">${Math.round((d.value/data.totalWatchTime)*100)}%</span>
        </div>
    `).join('');

    // Interaction
    const tooltip = document.getElementById('stats-tooltip');
    pieChart.onmousemove = (e) => {
        const rect = pieChart.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;
        const percent = (angle / 360) * 100;
        
        const activeSlice = slices.find(s => percent >= s.start && percent < s.end);
        if (activeSlice) {
            tooltip.innerHTML = `<b>${activeSlice.label || activeSlice.key}</b><br>${formatTime(Math.round(activeSlice.value))} (${Math.round((activeSlice.value/data.totalWatchTime)*100)}%)`;
            tooltip.classList.add('visible');
            positionTooltip(e, tooltip);
        } else {
            tooltip.classList.remove('visible');
        }
    };
    pieChart.onmouseleave = () => tooltip.classList.remove('visible');
}

function renderActivityHeatmap() {
    const container = document.getElementById('activity-heatmap');
    if (!container) return;

    const weeks = 30; // Slightly wider to fill sidebar space
    const daysInHeatmap = weeks * 7;
    const now = new Date();
    
    let html = '<div class="heatmap-grid">';
    let heatmapData = [];

    for (let i = daysInHeatmap - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = getDayKey(d);
        const val = allHistory[key] ? allHistory[key].watchTime : 0;
        
        let level = 0;
        if (val > 0) level = 1;
        if (val > 3600) level = 2; // 1hr
        if (val > 7200) level = 3; // 2hr
        if (val > 14400) level = 4; // 4hr+

        heatmapData.push({ key, val, level });
    }

    html += heatmapData.map(d => `
        <div class="heatmap-cell level-${d.level}" data-tooltip="<b>${d.key}</b><br>${formatTime(Math.round(d.val))}"></div>
    `).join('');
    
    html += '</div>';
    container.innerHTML = html;

    bindAnalyticsTooltips(container);

    // Setup scroll arrows
    initCustomScroll('activity-heatmap', 'heatmap-scroll-left', 'heatmap-scroll-right');
}

function renderDetailedInsights(data) {
    const insightEl = document.getElementById('key-insights');
    if (!insightEl) return;

    const insights = [];

    // insight 1: Peak Activity
    if (data.maxDay.value > 0) {
        insights.push({
            icon: '🔥',
            title: 'Peak Activity',
            text: `Your highest watch time was on <strong>${data.maxDay.key}</strong> with <strong>${formatTime(Math.round(data.maxDay.value))}</strong>.`
        });
    }

    // insight 2: Consistency
    const activeDays = data.days.filter(d => d.value > 0).length;
    const consistency = Math.round((activeDays / data.days.length) * 100);
    insights.push({
        icon: '🎯',
        title: 'Consistency',
        text: `You watched YouTube on <strong>${activeDays}</strong> out of the last <strong>${data.days.length}</strong> days (${consistency}%).`
    });

    // insight 3: Binge-watching check
    const bingeDays = data.days.filter(d => d.value > 10800).length; // 3 hours
    if (bingeDays > 0) {
        insights.push({
            icon: '⚠️',
            title: 'Binge Warning',
            text: `You had <strong>${bingeDays}</strong> sessions exceeding 3 hours. Consider taking more frequent breaks!`
        });
    }

    insightEl.innerHTML = insights.map(i => `
        <div class="insight-card-modern">
            <div class="insight-header-row">
                <span class="insight-icon-vibrant">${i.icon}</span>
                <h4>${i.title}</h4>
            </div>
            <p>${i.text}</p>
        </div>
    `).join('');
}

function bindAnalyticsTooltips(container) {
    const tooltip = document.getElementById('stats-tooltip');
    container.querySelectorAll('[data-tooltip]').forEach(el => {
        el.onmouseenter = (e) => {
            tooltip.innerHTML = el.dataset.tooltip;
            tooltip.classList.add('visible');
            positionTooltip(e, tooltip);
        };
        el.onmousemove = (e) => positionTooltip(e, tooltip);
        el.onmouseleave = () => tooltip.classList.remove('visible');
    });
}

function positionTooltip(e, tooltip) {
    const margin = 15;
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    let left = e.clientX + margin;
    let top = e.clientY - margin;
    if (left + tooltipWidth > window.innerWidth) left = e.clientX - tooltipWidth - margin;
    if (top < margin) top = margin;
    if (top + tooltipHeight > window.innerHeight - margin) top = window.innerHeight - tooltipHeight - margin;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}
