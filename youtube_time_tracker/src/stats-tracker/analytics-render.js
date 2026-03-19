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
            <div class="chart-bar-wrapper" title="${d.key}: ${formatTime(Math.round(d.value))}">
                <div class="chart-bar-outer">
                    <div class="chart-bar-fill" style="height: ${height}%; background: ${d.color}"></div>
                </div>
                <span class="chart-label">${d.label}</span>
            </div>
        `;
    }).join('');
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
        last7Days.push({ label: (i === 0 ? 'Today' : key), value: val, color: dayColors[i] });
        totalWatchAll += val;
    }

    if (totalWatchAll === 0) {
        pieChart.style.background = '#333';
        pieLegend.innerHTML = '<div style="color:#666">No data to display</div>';
        return;
    }

    let cumulativePercent = 0;
    const gradientSlices = last7Days.map(d => {
        if (d.value === 0) return null;
        const start = cumulativePercent;
        const end = start + (d.value / totalWatchAll) * 100;
        cumulativePercent = end;
        return `${d.color} ${start}% ${end}%`;
    }).filter(Boolean);

    pieChart.style.background = `conic-gradient(${gradientSlices.join(', ')})`;
    
    pieLegend.innerHTML = last7Days.filter(d => d.value > 0).map(d => `
        <div class="legend-item">
            <span class="legend-color" style="background: ${d.color}"></span>
            <span class="legend-label">${d.label}</span>
            <span class="legend-value">${Math.round((d.value/totalWatchAll)*100)}%</span>
        </div>
    `).join('');

    const insightEl = document.getElementById('key-insights');
    if (insightEl) {
        const sorted = [...last7Days].sort((a,b) => b.value - a.value);
        const maxDay = sorted[0];
        const avgTime = totalWatchAll / 7;
        insightEl.innerHTML = `
            <div class="insight-card">
                <h4>Top Activity</h4>
                <p>Your highest watch time was on <strong>${maxDay.label}</strong> with <strong>${formatTime(Math.round(maxDay.value))}</strong>.</p>
            </div>
            <div class="insight-card">
                <h4>Weekly Average</h4>
                <p>You watch about <strong>${formatTime(Math.round(avgTime))}</strong> of YouTube per day.</p>
            </div>
        `;
    }
}
