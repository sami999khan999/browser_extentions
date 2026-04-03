/**
 * showConfirmModal - Reusable accessible confirmation dialog
 * 
 * @param {Object} options 
 *   - title: Modal title
 *   - message: Modal message/body
 *   - confirmText: Text for the confirm button
 *   - cancelText: Text for the cancel button
 *   - icon: Emoji or icon HTML
 *   - onConfirm: Callback when confirmed
 */
function showConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', icon = '🗑️', onConfirm }) {
    if (document.getElementById('stats-confirm-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'stats-confirm-modal';
    overlay.className = 'stats-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modal-title');

    overlay.innerHTML = `
        <div class="stats-modal">
            <span class="stats-modal-icon">${icon}</span>
            <h2 id="modal-title" class="stats-modal-title">${title}</h2>
            <p class="stats-modal-message">${message}</p>
            <div class="stats-modal-actions">
                <button id="modal-cancel" class="modal-btn secondary">${cancelText}</button>
                <button id="modal-confirm" class="modal-btn danger">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Lock Scroll & Selection
    document.body.style.overflow = 'hidden';
    document.body.style.userSelect = 'none';

    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');

    const dismiss = () => {
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
        document.body.style.userSelect = '';
        setTimeout(() => overlay.remove(), 300);
    };

    // Animation
    requestAnimationFrame(() => overlay.classList.add('visible'));
    setTimeout(() => cancelBtn.focus(), 100);

    // Events
    cancelBtn.onclick = (e) => {
        e.stopPropagation();
        dismiss();
    };

    confirmBtn.onclick = (e) => {
        e.stopPropagation();
        dismiss();
        if (onConfirm) onConfirm();
    };

    overlay.onclick = (e) => {
        if (e.target === overlay) dismiss();
    };

    // Accessibility: Focus Trap & Escape
    overlay.onkeydown = (e) => {
        if (e.key === 'Tab') {
            const focusables = [cancelBtn, confirmBtn];
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        }
        if (e.key === 'Escape') dismiss();
    };
}

/**
 * showMultiTabToast - A beautiful floating banner warning about multiple tabs playing
 * 
 * @param {number} otherTabId - The ID of the other tab to close
 * @param {Function} onDismiss - Callback when dismissed so we don't show it again immediately
 */
function showMultiTabToast(otherTabId, onDismiss) {
    if (document.getElementById('stats-multitab-toast')) return;

    // Inject keyframes for micro-animations if not present
    if (!document.getElementById('ytt-toast-keyframes')) {
        const style = document.createElement('style');
        style.id = 'ytt-toast-keyframes';
        style.textContent = `
            @keyframes ytt-pulse-border {
                0% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4); }
                70% { box-shadow: 0 0 0 8px rgba(255, 59, 48, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
            }
            .ytt-toast-icon-container {
                animation: ytt-pulse-border 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }

    const toast = document.createElement('div');
    toast.id = 'stats-multitab-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 32px;
        right: 32px;
        background: rgba(20, 20, 22, 0.75);
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
        color: #ffffff;
        padding: 16px 20px;
        border-radius: 16px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        gap: 18px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
        transform: translateY(120%) scale(0.95);
        opacity: 0;
        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        pointer-events: auto;
    `;

    toast.innerHTML = `
        <div class="ytt-toast-icon-container" style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: rgba(255, 59, 48, 0.15); border-radius: 50%; border: 1px solid rgba(255, 59, 48, 0.3); flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-weight: 600; font-size: 15px; letter-spacing: -0.2px;">Action Required</div>
            <div style="font-size: 13px; color: rgba(255, 255, 255, 0.7); line-height: 1.4;">This exact video is currently playing in another tab.</div>
        </div>
        <div style="display: flex; gap: 10px; margin-left: 8px;">
            <button id="toast-close-other" style="
                background: linear-gradient(135deg, #ff3b30, #ff2a6d);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                font-size: 13px;
                letter-spacing: 0.2px;
                box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Close Tab
            </button>
            <button id="toast-dismiss" style="
                background: rgba(255, 255, 255, 0.05);
                color: rgba(255, 255, 255, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                font-size: 13px;
                transition: all 0.2s ease;
            ">Ignore</button>
        </div>
    `;

    document.body.appendChild(toast);

    // Dynamic Hover & Active States
    const closeBtn = document.getElementById('toast-close-other');
    closeBtn.onmouseover = () => {
        closeBtn.style.transform = 'translateY(-1px)';
        closeBtn.style.boxShadow = '0 6px 16px rgba(255, 59, 48, 0.4)';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.transform = 'translateY(0)';
        closeBtn.style.boxShadow = '0 4px 12px rgba(255, 59, 48, 0.3)';
    };
    closeBtn.onmousedown = () => closeBtn.style.transform = 'translateY(1px) scale(0.96)';

    const dismissBtn = document.getElementById('toast-dismiss');
    dismissBtn.onmouseover = () => dismissBtn.style.background = 'rgba(255, 255, 255, 0.12)';
    dismissBtn.onmouseout = () => dismissBtn.style.background = 'rgba(255, 255, 255, 0.05)';
    dismissBtn.onmousedown = () => dismissBtn.style.transform = 'scale(0.96)';

    const removeToast = () => {
        toast.style.transform = 'translateY(120%) scale(0.95)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
            if (onDismiss) onDismiss();
        }, 500);
    };

    closeBtn.onclick = (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage({ action: 'CLOSE_TAB_BY_ID', tabId: otherTabId });
        removeToast();
    };

    dismissBtn.onclick = (e) => {
        e.stopPropagation();
        removeToast();
    };

    // Animate in smoothly
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0) scale(1)';
        toast.style.opacity = '1';
    });
}

/**
 * showMultiTabModal - A premium center-screen popup for duplicate videos
 * 
 * @param {number} otherTabId - The ID of the other tab to close
 * @param {Function} onKeep - Callback when the user chooses to keep the current window (and dismiss modal)
 */
function showMultiTabModal(otherTabId, onKeep) {
    if (document.getElementById('stats-multitab-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'stats-multitab-modal';
    overlay.className = 'stats-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'multitab-title');

    overlay.innerHTML = `
        <div class="stats-modal" style="
            background: rgba(20, 20, 22, 0.85);
            backdrop-filter: blur(24px) saturate(200%);
            -webkit-backdrop-filter: blur(24px) saturate(200%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        ">
            <div style="
                width: 64px; 
                height: 64px; 
                background: linear-gradient(135deg, rgba(255, 59, 48, 0.2), rgba(255, 42, 109, 0.2)); 
                border: 1px solid rgba(255, 59, 48, 0.3);
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 24px;
                font-size: 32px;
                box-shadow: 0 8px 24px rgba(255, 59, 48, 0.2);
            ">📺</div>
            <h2 id="multitab-title" class="stats-modal-title" style="color: #ffffff; letter-spacing: -0.5px;">Duplicate Playback</h2>
            <p class="stats-modal-message" style="color: rgba(255, 255, 255, 0.7); font-size: 14px; margin-bottom: 32px;">This exact video is playing in another window. We've paused it here to avoid duplicate tracking.</p>
            <div class="stats-modal-actions" style="display: flex; gap: 12px;">
                <button id="modal-keep-this" class="modal-btn secondary" style="
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    flex: 1;
                    height: 48px;
                    border-radius: 12px;
                    font-weight: 600;
                ">Keep Window</button>
                <button id="modal-close-other" class="modal-btn danger" style="
                    background: linear-gradient(135deg, #ff3b30, #ff2a6d);
                    border: none;
                    color: #fff;
                    flex: 1;
                    height: 48px;
                    border-radius: 12px;
                    font-weight: 600;
                    box-shadow: 0 4px 15px rgba(255, 59, 48, 0.4);
                ">Close Other</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Prevent background scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const keepBtn = document.getElementById('modal-keep-this');
    const closeOtherBtn = document.getElementById('modal-close-other');

    const dismiss = () => {
        overlay.classList.remove('visible');
        document.body.style.overflow = originalOverflow;
        setTimeout(() => overlay.remove(), 400);
    };

    // Animation
    requestAnimationFrame(() => overlay.classList.add('visible'));
    setTimeout(() => closeOtherBtn.focus(), 100);

    keepBtn.onclick = (e) => {
        e.stopPropagation();
        dismiss();
        if (onKeep) onKeep();
    };

    closeOtherBtn.onclick = (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage({ action: 'CLOSE_TAB_BY_ID', tabId: otherTabId });
        dismiss();
        if (onKeep) onKeep(); // Resume video if they chose to close the other one
    };

    // Close on click outside omitted for this specific high-priority warning to ensure user makes a choice

    // Accessibility: Focus Trap & Escape
    overlay.onkeydown = (e) => {
        if (e.key === 'Tab') {
            const focusables = [keepBtn, closeOtherBtn];
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        }
        if (e.key === 'Escape') dismiss();
    };
}


