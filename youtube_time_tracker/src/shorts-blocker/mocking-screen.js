// === Mocking Screen: Overlay when user navigates to /shorts/ ===

function removeMockingScreen() {
    const overlay = document.getElementById('shorts-blocker-overlay');
    if (overlay) {
        // Clear the playback killer interval
        const intervalId = overlay.dataset.playbackIntervalId;
        if (intervalId) {
            clearInterval(Number(intervalId));
        }
        overlay.remove();
    }
}

function injectMockingScreen() {
    if (document.getElementById('shorts-blocker-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'shorts-blocker-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: #0f0f0f;
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 2147483647;
        font-family: 'Roboto', Arial, sans-serif;
        text-align: center;
        padding: 20px;
    `;

    overlay.innerHTML = `
        <div style="margin-bottom: 24px; animation: bounce 1.5s infinite ease-in-out;">
            <!-- Realistic YouTube Logo -->
            <svg version="1.1" id="YouTube_Logo" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	             viewBox="0 0 1024 721" enable-background="new 0 0 1024 721" xml:space="preserve" style="width: 120px; height: auto;">
                <path fill="#FF0000" d="M1013,156.3c-11.9-44.7-47.1-79.8-91.8-91.7C841,40,512,40,512,40S183,40,102.8,64.6
                    C58.1,76.5,22.9,111.6,11,156.3C-13.3,236.8-13.3,404-13.3,404s0,167.2,24.3,247.7c11.9,44.7,47.1,79.8,91.8,91.7
                    C183,768,512,768,512,768s329,0,409.2-24.6c44.7-11.9,79.9-47,91.8-91.7C1037.3,571.2,1037.3,404,1037.3,404S1037.3,236.8,1013,156.3z"/>
                <polygon fill="#FFFFFF" points="408,528 674,404 408,280"/>
            </svg>
        </div>
        <h1 style="font-size: 56px; font-weight: 900; margin-bottom: 16px; text-transform: uppercase; color: #ff0000; letter-spacing: -2px; text-shadow: 0 0 30px rgba(255, 0, 0, 0.4);">SHORTS BLOCKED</h1>
        <p style="font-size: 26px; color: #ffffff; max-width: 700px; line-height: 1.3; margin-bottom: 48px; font-weight: 500;">
            Wait... were you really trying to watch <span style="color:#ff0000; font-weight: 800;">Shorts</span>? <br>
            <span style="font-size: 19px; color: #aaaaaa; font-weight: 400; display: block; margin-top: 10px;">Your attention span is at stake! Go do something productive.</span>
        </p>
        <button id="go-back-btn" style="
            background-color: #ff0000;
            color: #ffffff;
            border: none;
            padding: 16px 40px;
            border-radius: 8px;
            font-size: 20px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 10px 20px rgba(255, 0, 0, 0.3);
            text-transform: uppercase;
        ">Back to Civilization</button>
        <style>
            @keyframes bounce {
                0%, 100% { transform: translateY(0) scale(1.05); }
                50% { transform: translateY(-20px) scale(0.95); }
            }
            #go-back-btn:hover {
                background-color: #cc0000;
                transform: scale(1.1) translateY(-5px);
                box-shadow: 0 15px 30px rgba(255, 0, 0, 0.5);
            }
            #go-back-btn:active {
                transform: scale(0.98) translateY(0);
            }
        </style>
    `;

    document.documentElement.appendChild(overlay);

    document.getElementById('go-back-btn').onclick = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'https://www.youtube.com';
        }
    };

    // Kill all video/audio playback immediately and continuously
    const killPlayback = () => {
        const media = document.querySelectorAll('video, audio');
        media.forEach(m => {
            m.pause();
            m.muted = true;
            m.volume = 0;
            m.currentTime = 0;
            m.style.display = 'none';
        });
    };
    
    killPlayback();
    // Keep killing playback to prevent auto-play or next-video triggers
    const playbackInterval = setInterval(killPlayback, 100);
    
    // Store interval to clean up later if needed
    overlay.dataset.playbackIntervalId = playbackInterval;
}
