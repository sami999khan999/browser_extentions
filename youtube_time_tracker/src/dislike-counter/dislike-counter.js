// === Dislike Counter: Attribute Observation Version (Take 12) ===

const dislikeDataCache = {};
let pendingDislikeFetch = null;
let globalObserver = null;
let isDislikeInitialized = false;

// Registry to prevent duplicate observers on buttons
const buttonObservers = new WeakMap();

function getVideoId() {
  const watchFlexy = document.querySelector("ytd-watch-flexy");
  if (watchFlexy && watchFlexy.getAttribute("video-id")) {
    return watchFlexy.getAttribute("video-id");
  }
  const urlParams = new URLSearchParams(window.location.search);
  const v = urlParams.get("v");
  if (v) return v;
  const pathParts = window.location.pathname.split("/");
  if (pathParts[1] === "shorts") return pathParts[2];
  return null;
}

function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

/**
 * Recursive helper to find ALL elements inside Shadow DOM.
 */
function findAllDeep(selector, root = document, results = []) {
    const nodes = root.querySelectorAll(selector);
    nodes.forEach(n => results.push(n));

    const walkers = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walkers.nextNode();
    while (node) {
        if (node.shadowRoot) {
            findAllDeep(selector, node.shadowRoot, results);
        }
        node = walkers.nextNode();
    }
    return results;
}

function findDislikeButton() {
    const selectors = [
        "yt-animated-action-button-view-model:nth-child(2) button",
        "dislike-button-view-model button",
        "#segmented-dislike-button button",
        "ytd-dislike-button-renderer button"
    ];

    for (const sel of selectors) {
        const matches = findAllDeep(sel);
        const visibleBtn = matches.find(isElementVisible);
        if (visibleBtn) return visibleBtn;
    }
    return null;
}

function findLikeButton() {
    const selectors = [
        "yt-animated-action-button-view-model:nth-child(1) button",
        "like-button-view-model button",
        "#segmented-like-button button",
        "ytd-like-button-renderer button"
    ];

    for (const sel of selectors) {
        const matches = findAllDeep(sel);
        const visibleBtn = matches.find(isElementVisible);
        if (visibleBtn) return visibleBtn;
    }
    return null;
}

function findTextSlot(button) {
    if (!button) return null;
    const root = button.shadowRoot || button;
    return root.querySelector(".yt-core-attributed-string, .yt-spec-button-shape-next__button-text-content");
}

function formatDislikeCount(count) {
  if (count >= 1000000) {
    const val = count / 1000000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + "M";
  }
  if (count >= 1000) {
    const val = count / 1000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + "K";
  }
  return count.toString();
}

async function fetchDislikeCount(videoId) {
  return new Promise((resolve) => {
    safeSendMessage({ action: "GET_DISLIKE_COUNT", videoId }, (data) => {
      resolve(data);
    });
  });
}

/**
 * Initialize global listeners once.
 */
function initDislikeCounter() {
    if (isDislikeInitialized) return;
    isDislikeInitialized = true;

    // YouTube SPA navigation hook
    window.addEventListener("yt-navigate-finish", () => {
        console.log("YTT: [Dislike] SPA Navigation detected.");
        setTimeout(tryRenderDislike, 500); 
    });

    console.log("YTT: [Dislike] System initialized.");
}

function isDislikedState(btn) {
    if (!btn) return false;
    const ariaPressed = btn.getAttribute("aria-pressed") === "true";
    const ariaLabel = btn.getAttribute("aria-label") || "";
    const hasActiveClass = btn.classList.contains("yt-spec-button-shape-next--active");
    const isLabelActive = ariaLabel.toLowerCase().includes("remove");
    return ariaPressed || hasActiveClass || isLabelActive;
}

function observeButtonStates(videoId, dislikeBtn, likeBtn) {
    if (!dislikeBtn || !likeBtn) return;
    
    // Cleanup old observers if button changed
    if (buttonObservers.has(dislikeBtn)) buttonObservers.get(dislikeBtn).disconnect();
    if (buttonObservers.has(likeBtn)) buttonObservers.get(likeBtn).disconnect();

    const observer = new MutationObserver(() => {
        const data = dislikeDataCache[videoId];
        if (!data) return;

        const currentState = isDislikedState(dislikeBtn);
        const lastKnownState = dislikeBtn.dataset.yttWasDisliked === "true";

        if (currentState !== lastKnownState) {
            if (currentState) {
                data.dislikes++;
                console.log("YTT: [Dislike] Internal state change: (+1)");
            } else {
                data.dislikes--;
                console.log("YTT: [Dislike] Internal state change: (-1)");
            }
            dislikeBtn.dataset.yttWasDisliked = currentState;
            doRender(data, videoId, dislikeBtn);
        }

        // Like button interaction: if Like becomes active, YouTube un-dislikes
        // We implicitly handle this because the Dislike button's aria-pressed 
        // will flip to false when Like is pressed.
    });

    const config = { attributes: true, attributeFilter: ["aria-pressed", "aria-label", "class"] };
    observer.observe(dislikeBtn, config);
    observer.observe(likeBtn, config);

    buttonObservers.set(dislikeBtn, observer);
    buttonObservers.set(likeBtn, observer);
}

function tryRenderDislike() {
  if (!dislikeCountSettings || !dislikeCountSettings.enabled) return;
  
  initDislikeCounter();

  const videoId = getVideoId();
  if (!videoId) return;

  const dislikeBtn = findDislikeButton();
  const likeBtn = findLikeButton();
  if (!dislikeBtn) return;

  if (dislikeBtn.dataset.yttDislikeVideo === videoId && dislikeBtn.querySelector(".ytt-hijacked-label")) {
      // Refresh state without full re-render
      dislikeBtn.dataset.yttWasDisliked = isDislikedState(dislikeBtn);
      return;
  }

  if (dislikeDataCache[videoId]) {
     const data = dislikeDataCache[videoId];
     dislikeBtn.dataset.yttWasDisliked = isDislikedState(dislikeBtn);
     doRender(data, videoId, dislikeBtn);
     observeButtonStates(videoId, dislikeBtn, likeBtn);
  } else if (pendingDislikeFetch !== videoId) {
     pendingDislikeFetch = videoId;
     fetchDislikeCount(videoId).then(data => {
         pendingDislikeFetch = null;
         if (data) {
             dislikeDataCache[videoId] = data;
             const currentDislikeBtn = findDislikeButton();
             const currentLikeBtn = findLikeButton();
             if (currentDislikeBtn) {
                 currentDislikeBtn.dataset.yttWasDisliked = isDislikedState(currentDislikeBtn);
                 doRender(data, videoId, currentDislikeBtn);
                 observeButtonStates(videoId, currentDislikeBtn, currentLikeBtn);
             }
         }
     });
  }
}

function forceVisibility(btn) {
    let curr = btn;
    for (let i = 0; i < 4; i++) {
        if (!curr || curr === document.body) break;
        if (curr.nodeType === 1) {
            curr.style.setProperty("width", "auto", "important");
            curr.style.setProperty("min-width", "unset", "important");
            curr.style.setProperty("overflow", "visible", "important");
            curr.style.setProperty("display", "inline-flex", "important");
        }
        
        if (curr.parentNode instanceof ShadowRoot) {
            curr = curr.parentNode.host;
        } else {
            curr = curr.parentElement;
        }
    }
}

function doRender(data, videoId, btn) {
    const countText = formatDislikeCount(data.dislikes);
    let label = findTextSlot(btn);

    if (!label) {
        label = document.createElement("span");
        label.className = "yt-core-attributed-string ytt-hijacked-label";
        const root = btn.shadowRoot || btn;
        const icon = root.querySelector("yt-icon, svg, .yt-spec-button-shape-next__icon");
        if (icon) {
            icon.insertAdjacentElement("afterend", label);
        } else {
            root.appendChild(label);
        }
    }

    label.textContent = countText;
    label.classList.add("ytt-hijacked-label");
    btn.dataset.yttDislikeVideo = videoId;

    label.style.cssText = `
        display: inline-block !important;
        margin-left: 6px !important;
        opacity: 1 !important;
        visibility: visible !important;
        font-family: inherit !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        color: inherit !important;
    `;

    forceVisibility(btn);
    // console.log(`YTT: [Dislike] Rendered ${countText} for video ${videoId}`);
    
    setupObserver();
}

function setupObserver() {
    if (globalObserver) return;
    
    globalObserver = new MutationObserver((mutations) => {
        const isSelfMutation = mutations.every(m => {
            const target = m.target;
            return target.nodeType === 1 && (
                target.classList.contains("ytt-hijacked-label") || 
                target.closest?.(".ytt-hijacked-label")
            );
        });

        if (!isSelfMutation) {
            tryRenderDislike();
        }
    });

    globalObserver.observe(document.body, { childList: true, subtree: true });
}

function applyDislikeCountState() {
    if (dislikeCountSettings.enabled) {
        tryRenderDislike();
    } else {
        removeDislikeCount();
    }
}

function removeDislikeCount() {
    const labels = document.querySelectorAll(".ytt-hijacked-label");
    labels.forEach(l => l.remove());
    if (globalObserver) {
        globalObserver.disconnect();
        globalObserver = null;
    }
}
