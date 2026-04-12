// === Dislike Counter: Fetches and displays dislike counts on YouTube videos ===

// Simple cache: videoId -> API response data
const dislikeDataCache = {};
let pendingDislikeFetch = null;
let dislikeRenderTimer = null;

function getVideoId() {
  const watchFlexy = document.querySelector("ytd-watch-flexy");
  if (watchFlexy && watchFlexy.getAttribute("video-id")) {
    return watchFlexy.getAttribute("video-id");
  }

  // Fallback to URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const v = urlParams.get("v");
  if (v) return v;

  // Fallback for Shorts
  const pathParts = window.location.pathname.split("/");
  if (pathParts[1] === "shorts") return pathParts[2];

  return null;
}

/**
 * Find the dislike button in the DOM using multiple strategies.
 */
function findDislikeButton() {
  // 1. Better modern selectors
  let btn = document.querySelector(
    "dislike-button-view-model button, #segmented-dislike-button button, ytd-dislike-button-renderer button, .ytd-segmented-like-dislike-button-renderer:nth-child(2) button",
  );
  if (btn) return btn;

  // 2. Aria-label check (often the most stable)
  btn = document.querySelector(
    'button[aria-label*="dislike" i], [aria-label*="dislike this video" i] button',
  );
  if (btn) return btn;

  // 3. SVG Path Matching (Flexible partial match)
  // These segments are common across different versions of the dislike icon
  const dislikePathSegments = [
    "M15 3H6c-.8",
    "M3.5 14h2.1l-.6 3.2",
    "M15 3h-9c-.83",
  ];
  const svgs = document.querySelectorAll("svg path");
  for (const path of svgs) {
    const d = path.getAttribute("d");
    if (d && dislikePathSegments.some((seg) => d.includes(seg))) {
      const parentBtn = path.closest("button");
      if (parentBtn) return parentBtn;
    }
  }

  // 4. Positional fallback (usually the second button in the like/dislike group)
  const likeBtn = findLikeButton();
  if (likeBtn && likeBtn.parentElement) {
    const commonParent = likeBtn.closest("ytd-segmented-like-dislike-button-renderer, .ytd-menu-renderer");
    if (commonParent) {
      const allBtns = commonParent.querySelectorAll("button");
      if (allBtns.length >= 2) return allBtns[1];
    }
  }

  return null;
}

/**
 * Find the like button for styling reference.
 */
function findLikeButton() {
  return document.querySelector(
    "like-button-view-model button, #segmented-like-button button, ytd-toggle-button-renderer.style-scope.ytd-menu-renderer:nth-child(1) button, .ytd-segmented-like-dislike-button-renderer:nth-child(1) button, button[aria-label*='like this video' i]",
  );
}

function formatDislikeCount(count) {
  if (count >= 1000000) {
    const val = count / 1000000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + "m";
  }
  if (count >= 1000) {
    const val = count / 1000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + "k";
  }
  return count.toString();
}

async function fetchDislikeCount(videoId) {
  console.log(`YTT: [Dislike] Fetching count for ${videoId}...`);
  try {
    const response = await fetch(
      `https://returnyoutubedislikeapi.com/votes?videoId=${videoId}`,
    );
    if (!response.ok) {
      console.error(`YTT: [Dislike] API Error: ${response.status}`);
      return null;
    }
    const data = await response.json();
    console.log("YTT: [Dislike] Data received:", data.dislikes);
    return data;
  } catch (e) {
    console.error("YTT: [Dislike] Fetch failed:", e);
    return null;
  }
}

/**
 * Core idempotent function: ensures the dislike count is displayed for the
 * current video. Safe to call repeatedly from any trigger.
 */
function tryRenderDislike() {
  if (!dislikeCountSettings || !dislikeCountSettings.enabled) return false;

  const videoId = getVideoId();
  if (!videoId) {
    // Don't log spam on home page, only if we are likely on a video page
    if (
      window.location.pathname === "/watch" ||
      window.location.pathname.startsWith("/shorts")
    ) {
      console.log("YTT: [Dislike] Waiting for Video ID...");
    }
    return false;
  }

  const dislikeBtn = findDislikeButton();
  if (!dislikeBtn) {
    // If we have data but no button, it's worth logging once
    if (dislikeDataCache[videoId]) {
      console.log("YTT: [Dislike] Have data, but button not found in DOM yet.");
    }
    return false;
  }

  // Check if already rendered for this exact video AND attached to the current button
  const existing = document.getElementById("ytt-dislike-count");
  if (
    existing &&
    existing.dataset.videoId === videoId &&
    dislikeBtn.contains(existing)
  ) {
    return true; // Already showing the correct count on the correct button
  }

  // Remove stale element if it's on a different button or for a different video
  if (existing) {
    console.log("YTT: [Dislike] Removing stale/detached element.");
    existing.remove();
  }

  // If we have cached data, try to render now
  if (dislikeDataCache[videoId]) {
    return doRenderDislike(dislikeDataCache[videoId], videoId, dislikeBtn);
  }

  // Need to fetch — guard against duplicate fetches
  if (pendingDislikeFetch !== videoId) {
    pendingDislikeFetch = videoId;
    fetchDislikeCount(videoId)
      .then((data) => {
        pendingDislikeFetch = null;
        if (data && typeof data === "object") {
          dislikeDataCache[videoId] = data;
          // Re-query button because it might have changed during fetch
          const currentBtn = findDislikeButton();
          if (currentBtn) {
            doRenderDislike(data, videoId, currentBtn);
          } else {
            scheduleDislikeRetry(videoId);
          }
        }
      })
      .catch((err) => {
        pendingDislikeFetch = null;
        console.error("YTT: [Dislike] Promise error:", err);
      });
  }

  return false;
}

/**
 * Schedule periodic retries to render the dislike count.
 */
function scheduleDislikeRetry(videoId) {
  if (dislikeRenderTimer) {
    clearTimeout(dislikeRenderTimer);
    dislikeRenderTimer = null;
  }

  let attempts = 0;
  const maxAttempts = 20; // 10 seconds total (500ms * 20)

  console.log(`YTT: [Dislike] Starting retry loop for ${videoId}`);

  function retry() {
    attempts++;
    const currentVideoId = getVideoId();

    if (
      currentVideoId !== videoId ||
      !dislikeCountSettings.enabled ||
      attempts > maxAttempts
    ) {
      console.log(`YTT: [Dislike] Ending retry loop. Attempts: ${attempts}`);
      dislikeRenderTimer = null;
      return;
    }

    const currentBtn = findDislikeButton();
    if (currentBtn && dislikeDataCache[videoId]) {
      if (doRenderDislike(dislikeDataCache[videoId], videoId, currentBtn)) {
        console.log(`YTT: [Dislike] Rendered on retry #${attempts}`);
        dislikeRenderTimer = null;
        return;
      }
    }

    dislikeRenderTimer = setTimeout(retry, 500);
  }

  dislikeRenderTimer = setTimeout(retry, 500);
}

/**
 * Actually render the dislike count into the DOM.
 */
function doRenderDislike(data, videoId, dislikeBtn) {
  if (!data || data.dislikes === undefined || !dislikeBtn) return false;

  const countText = formatDislikeCount(data.dislikes);
  let countEl = document.getElementById("ytt-dislike-count");

  if (!countEl) {
    countEl = document.createElement("span");
    countEl.id = "ytt-dislike-count";
    console.log("YTT: [Dislike] Creating new element.");
  }

  countEl.textContent = countText;
  countEl.dataset.videoId = videoId;

  // Styling
  const likeBtn = findLikeButton();
  if (likeBtn) {
    const likeText = likeBtn.querySelector(
      ".yt-spec-button-shape-next__button-text-content, .yt-core-attributed-string",
    );
    if (likeText && likeText.textContent !== "") {
      const style = window.getComputedStyle(likeText);
      countEl.style.fontSize = style.fontSize;
      countEl.style.fontWeight = style.fontWeight;
      countEl.style.color = style.color;
      countEl.style.fontFamily = style.fontFamily;
    } else {
      countEl.style.fontSize = "14px";
      countEl.style.fontWeight = "500";
      countEl.style.color = "var(--yt-spec-text-primary)";
    }
  } else {
    countEl.style.fontSize = "14px";
    countEl.style.fontWeight = "500";
    countEl.style.color = "var(--yt-spec-text-primary)";
  }

  countEl.style.marginLeft = "8px";
  countEl.style.marginRight = "8px";
  countEl.style.display = "inline-block";
  countEl.style.verticalAlign = "middle";

  // Injection
  const textContainer = dislikeBtn.querySelector(
    ".yt-spec-button-shape-next__button-text-content, .yt-core-attributed-string",
  );
  if (textContainer) {
    textContainer.style.display = "inline-block";
    if (textContainer.textContent === "") {
        textContainer.appendChild(countEl);
    } else {
        textContainer.after(countEl);
    }
  } else {
    const icon = dislikeBtn.querySelector(
      ".yt-spec-button-shape-next__icon, yt-icon, .icon",
    );
    if (icon) {
      icon.after(countEl);
    } else {
      dislikeBtn.appendChild(countEl);
    }
  }

  // Force button styles
  dislikeBtn.style.setProperty("width", "auto", "important");
  dislikeBtn.style.setProperty("min-width", "auto", "important");
  dislikeBtn.style.setProperty("padding-right", "8px", "important");
  dislikeBtn.style.setProperty("display", "inline-flex", "important");
  dislikeBtn.style.setProperty("align-items", "center", "important");
  dislikeBtn.style.setProperty("justify-content", "center", "important");

  const parentVM = dislikeBtn.closest(
    "dislike-button-view-model, #segmented-dislike-button, ytd-dislike-button-renderer",
  );
  if (parentVM) {
    parentVM.style.setProperty("width", "auto", "important");
    parentVM.style.setProperty("min-width", "auto", "important");
  }

  dislikeBtn.classList.remove("yt-spec-button-shape-next--no-text");
  return true;
}

function applyDislikeCountState() {
  if (dislikeCountSettings.enabled) {
    tryRenderDislike();
  } else {
    removeDislikeCount();
  }
}

function resetDislikeState() {
  console.log("YTT: [Dislike] Resetting state for navigation.");
  if (dislikeRenderTimer) {
    clearTimeout(dislikeRenderTimer);
    dislikeRenderTimer = null;
  }
  pendingDislikeFetch = null;
  const el = document.getElementById("ytt-dislike-count");
  if (el) el.remove();
}

function removeDislikeCount() {
  resetDislikeState();
  const dislikeBtn = findDislikeButton();
  if (dislikeBtn) {
    dislikeBtn.style.removeProperty("width");
    dislikeBtn.style.removeProperty("min-width");
    dislikeBtn.style.removeProperty("padding-right");
    dislikeBtn.style.removeProperty("display");
    dislikeBtn.style.removeProperty("align-items");
  }
}
