/**
 * Backup Reminder Popup
 * Appears bottom-right on YouTube periodically based on settings.
 */

(function() {
    let reminderActive = false;

    function createReminderUI() {
        if (document.getElementById('ytt-backup-reminder')) return;

        const container = document.createElement('div');
        container.id = 'ytt-backup-reminder';
        container.style.cssText = `
            position: fixed;
            bottom: 32px;
            right: 32px;
            width: 340px;
            background: rgba(28, 28, 28, 0.85);
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            color: white;
            border-radius: 16px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.6);
            z-index: 2147483647;
            padding: 24px;
            font-family: "YouTube Sans", Roboto, Arial, sans-serif;
            border: 1px solid rgba(255,255,255,0.15);
            display: flex;
            flex-direction: column;
            gap: 14px;
            animation: ytt-premium-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes ytt-premium-slide-up {
                from { transform: translateY(40px) scale(0.95); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
            }
            #ytt-backup-reminder h3 { margin: 0; font-size: 18px; font-weight: 600; color: #fff; letter-spacing: -0.01em; }
            #ytt-backup-reminder p { margin: 0; font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.5; }
            #ytt-backup-reminder .ytt-btn-group { display: flex; gap: 10px; margin-top: 10px; }
            #ytt-backup-reminder button { 
                padding: 10px 20px; 
                border-radius: 20px; 
                border: none; 
                font-size: 14px; 
                font-weight: 600; 
                cursor: pointer; 
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                outline: none;
            }
            #ytt-backup-reminder .download-btn { 
                background: #ff0000; 
                color: white; 
                box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
            }
            #ytt-backup-reminder .download-btn:hover { 
                background: #f00; 
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(255, 0, 0, 0.4);
            }
            #ytt-backup-reminder .download-btn:active {
                transform: translateY(0);
            }
            #ytt-backup-reminder .close-btn { background: rgba(255,255,255,0.12); color: #eee; }
            #ytt-backup-reminder .close-btn:hover { background: rgba(255,255,255,0.2); }
        `;
        document.head.appendChild(style);

        container.innerHTML = `
            <h3>Backup Your Data</h3>
            <p>It's time to download a fresh backup of your YouTube history and settings to keep them safe.</p>
            <div class="ytt-btn-group">
                <button class="download-btn">Download & Save</button>
                <button class="close-btn">Dismiss</button>
            </div>
        `;

        document.body.appendChild(container);

        container.querySelector('.download-btn').onclick = () => {
            const btn = container.querySelector('.download-btn');
            btn.disabled = true;
            btn.textContent = 'Preparing...';

            chrome.runtime.sendMessage({ action: "CREATE_BACKUP_AND_DOWNLOAD" }, (response) => {
                if (response && response.success && response.data) {
                    downloadBackup(response.data);
                    btn.textContent = 'Saved!';
                    setTimeout(() => container.remove(), 1000);
                } else {
                    btn.disabled = false;
                    btn.textContent = 'Failed, retry?';
                }
            });
        };

        container.querySelector('.close-btn').onclick = () => {
            container.remove();
        };
    }

    function downloadBackup(data) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `ytt-backup-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "SHOW_BACKUP_REMINDER") {
            console.log("YTT: Received SHOW_BACKUP_REMINDER message.");
            createReminderUI();
        }
    });

    console.log("YTT: Backup reminder content script initialized.");
})();
