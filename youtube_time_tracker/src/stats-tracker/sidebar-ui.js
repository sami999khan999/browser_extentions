// === Stats Sidebar UI: Toggle button, sidebar creation, drag & resize ===

function injectStatsUI() {
    if (!document.body) return;
    if (document.getElementById('stats-toggle-btn')) return;

    // Tooltip (Global sibling of sidebar)
    if (!document.getElementById('stats-tooltip')) {
        const tooltip = document.createElement('div');
        tooltip.id = 'stats-tooltip';
        tooltip.className = 'stats-tooltip';
        document.body.appendChild(tooltip);
    }

    // Toggle Button
    const btn = document.createElement('div');
    btn.id = 'stats-toggle-btn';
    btn.innerHTML = `
        ${icons.stats_toggle}
        <span id="stats-timer-badge" class="stats-timer-badge" style="display: none;"></span>
    `;
    btn.title = 'YouTube Stats Tracker (Drag to Move)';
    
    // Position Persistence
    const savedPos = localStorage.getItem('yt_stats_btn_pos');
    if (savedPos) {
        const { top, left } = JSON.parse(savedPos);
        btn.style.top = top;
        btn.style.left = left;
        btn.style.bottom = 'auto';
        btn.style.right = 'auto';
    }
    
    document.body.appendChild(btn);

    // Draggable Logic
    const dragStatus = { isDragging: false };
    let startX, startY, btnStartX, btnStartY;

    btn.onmousedown = (e) => {
        dragStatus.isDragging = false;
        startX = e.clientX;
        startY = e.clientY;
        const rect = btn.getBoundingClientRect();
        btnStartX = rect.left;
        btnStartY = rect.top;

        const onMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                dragStatus.isDragging = true;
                btn.classList.add('dragging');
                
                let newLeft = btnStartX + dx;
                let newTop = btnStartY + dy;
                
                // Boundary Constraints
                const padding = 10;
                newLeft = Math.max(padding, Math.min(window.innerWidth - btn.offsetWidth - padding, newLeft));
                newTop = Math.max(padding, Math.min(window.innerHeight - btn.offsetHeight - padding, newTop));
                
                btn.style.left = newLeft + 'px';
                btn.style.top = newTop + 'px';
                btn.style.bottom = 'auto';
                btn.style.right = 'auto';
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            if (dragStatus.isDragging) {
                btn.classList.remove('dragging');
                
                // Springy Edge Snapping with Scrollbar Awareness
                const rect = btn.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const padding = 10;
                const scrollbarPadding = 30; // Extra room for YouTube scrollbar
                
                if (centerX < window.innerWidth / 2) {
                    btn.style.left = padding + 'px';
                } else {
                    btn.style.left = (window.innerWidth - rect.width - scrollbarPadding) + 'px';
                }
                
                // Save state
                setTimeout(() => {
                    localStorage.setItem('yt_stats_btn_pos', JSON.stringify({
                        top: btn.style.top,
                        left: btn.style.left
                    }));
                    // Reset dragging status AFTER the click event has a chance to fire
                    dragStatus.isDragging = false;
                }, 200);
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.id = 'stats-sidebar';

    // Load and Apply Persisted Width
    const savedWidth = localStorage.getItem('yt_stats_sidebar_width');
    if (savedWidth) {
        sidebar.style.width = savedWidth + 'px';
    }

    // Add Resizer Handle
    const resizer = document.createElement('div');
    resizer.className = 'sidebar-resizer';
    sidebar.appendChild(resizer);

    // Resizing Logic
    let isResizing = false;
    resizer.onmousedown = (e) => {
        e.preventDefault(); // Prevent text selection start
        isResizing = true;
        document.body.classList.add('yt-shorts-resizing-active');
        sidebar.classList.add('resizing');
        resizer.classList.add('active');
        
        const startX = e.clientX;
        const startWidth = parseInt(getComputedStyle(sidebar).width, 10);

        const onMouseMove = (moveEvent) => {
            if (!isResizing) return;
            const currentX = moveEvent.clientX;
            const delta = startX - currentX; // Moving left increases width
            let newWidth = startWidth + delta;
            
            // Constraints
            newWidth = Math.max(300, Math.min(800, newWidth));
            sidebar.style.width = newWidth + 'px';
        };

        const onMouseUp = () => {
            isResizing = false;
            document.body.classList.remove('yt-shorts-resizing-active');
            sidebar.classList.remove('resizing');
            resizer.classList.remove('active');
            localStorage.setItem('yt_stats_sidebar_width', parseInt(sidebar.style.width, 10));
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // Insert sidebar HTML template
    sidebar.insertAdjacentHTML('beforeend', getSidebarHTML());
    document.body.appendChild(sidebar);

    // Bind all events (filters, navigation, settings, open/close)
    bindSidebarEvents(sidebar, btn, dragStatus);
}
