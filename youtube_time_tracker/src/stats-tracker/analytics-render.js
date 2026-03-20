// === Analytics Rendering: Bar chart, pie chart, insights ===

function renderChart() {

    const chartContainer = document.getElementById('stats-chart');
    if (!chartContainer) return;

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = getDayKey(d);
        last7Days.push({
            key,
            label: (i === 0 ? 'T' : d.getDate()),
            value: allHistory[key] ? allHistory[key].watchTime : 0,
            color: dayColors[i]
        });
    }

    const maxValue = Math.max(...last7Days.map(d => d.value), 3600);
    
    chartContainer.innerHTML = last7Days.map(d => {
        const height = Math.max(5, (d.value / maxValue) * 100);
        return `
            <div class="chart-bar-wrapper" data-tooltip="<b>${d.key}</b><br>${formatTime(Math.round(d.value))}">
                <div class="chart-bar-outer">
                    <div class="chart-bar-fill" style="height: ${height}%; background: ${d.color}"></div>
                </div>
                <span class="chart-label">${d.label}</span>
            </div>
        `;
    }).join('');

    // Tooltip Logic
    const tooltip = document.getElementById('stats-tooltip');
    
    chartContainer.querySelectorAll('.chart-bar-wrapper').forEach(bar => {
        bar.onmouseenter = (e) => {
            tooltip.innerHTML = bar.dataset.tooltip;
            tooltip.classList.add('visible');
            positionTooltip(e, tooltip); // Position immediately
        };
        bar.onmousemove = (e) => {
            positionTooltip(e, tooltip);
        };
        bar.onmouseleave = () => {
            tooltip.classList.remove('visible');
        };
    });
}

function positionTooltip(e, tooltip) {
    const margin = 15;
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    
    let left = e.clientX + margin;
    let top = e.clientY - margin;
    
    // Check horizontal flip
    if (left + tooltipWidth > window.innerWidth) {
        left = e.clientX - tooltipWidth - margin;
    }
    
    // Check vertical overflow (ensure it doesn't go off top or bottom)
    if (top < margin) {
        top = margin;
    }
    if (top + tooltipHeight > window.innerHeight - margin) {
        top = window.innerHeight - tooltipHeight - margin;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

function renderAnalyticsView() {
    renderChart();
    
    const pieChart = document.getElementById('pie-chart');
    const pieLegend = document.getElementById('pie-legend');
    if (!pieChart || !pieLegend) return;

    const last7Days = [];
    let totalWatchAll = 0;
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = getDayKey(d);
        const val = allHistory[key] ? allHistory[key].watchTime : 0;
        last7Days.push({ 
            label: (i === 0 ? 'Today' : key), 
            value: val, 
            color: dayColors[i],
            date: key
        });
        totalWatchAll += val;
    }

    if (totalWatchAll === 0) {
        pieChart.style.background = 'var(--stats-chart-bar-bg)';
        pieLegend.innerHTML = '<div style="color:var(--stats-text-secondary)">No data to display</div>';
        return;
    }

    // Pie Chart Tooltip logic
    const tooltip = document.getElementById('stats-tooltip');
    
    // Prepare slices for tooltip logic
    let cumulativePercent = 0;
    const slices = last7Days.map(d => {
        if (d.value === 0) return null;
        const start = cumulativePercent;
        const end = start + (d.value / totalWatchAll) * 100;
        cumulativePercent = end;
        return { ...d, start, end };
    }).filter(Boolean);

    pieChart.style.background = `conic-gradient(${slices.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')})`;
    
    pieLegend.innerHTML = last7Days.filter(d => d.value > 0).map(d => `
        <div class="legend-item">
            <span class="legend-color" style="background: ${d.color}"></span>
            <span class="legend-label">${d.label}</span>
            <span class="legend-value">${Math.round((d.value/totalWatchAll)*100)}%</span>
        </div>
    `).join('');

    pieChart.onmousemove = (e) => {
        const rect = pieChart.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate angle (0-360, starts at top)
        let angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;
        const percent = (angle / 360) * 100;
        
        const activeSlice = slices.find(s => percent >= s.start && percent < s.end);
        if (activeSlice) {
            tooltip.innerHTML = `<b>${activeSlice.label}</b><br>${formatTime(Math.round(activeSlice.value))} (${Math.round((activeSlice.value/totalWatchAll)*100)}%)`;
            tooltip.classList.add('visible');
            positionTooltip(e, tooltip);
        } else {
            tooltip.classList.remove('visible');
        }
    };
    pieChart.onmouseleave = () => {
        tooltip.classList.remove('visible');
    };

    const insightEl = document.getElementById('key-insights');
    if (insightEl) {
        const sorted = [...last7Days].sort((a,b) => b.value - a.value);
        const maxDay = sorted[0];
        const avgTime = totalWatchAll / 7;
        insightEl.innerHTML = `
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon">🔥</span>
                    <h4>Peak Activity</h4>
                </div>
                <p>Your highest watch time was on <strong>${maxDay.label}</strong> with <strong>${formatTime(Math.round(maxDay.value))}</strong>.</p>
            </div>
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon">📊</span>
                    <h4>Weekly Average</h4>
                </div>
                <p>You watch about <strong>${formatTime(Math.round(avgTime))}</strong> of YouTube per day.</p>
            </div>
        `;
    }
}
