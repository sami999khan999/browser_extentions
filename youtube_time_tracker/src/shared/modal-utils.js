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
