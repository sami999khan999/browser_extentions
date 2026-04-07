// === Dislike Counter: Fetches and displays dislike counts on YouTube videos ===

let lastDislikeVideoId = "";
let dislikeFetchInProgress = false;
let lastFetchedDislikeData = null;

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

function applyDislikeCountState(force = false) {
  if (dislikeCountSettings.enabled) {
    if (force) console.log("YTT: Force applying dislike state...");
    injectDislikeCount(force);
  } else {
    removeDislikeCount();
  }
}

function removeDislikeCount() {
  const el = document.getElementById("ytt-dislike-count");
  if (el) {
    console.log("YTT: Removing dislike count element.");
    el.remove();
  }

  // Reset button styles to YouTube defaults
  const dislikeBtn = document.querySelector(
    "dislike-button-view-model button, #segmented-dislike-button button, ytd-toggle-button-renderer.style-scope.ytd-menu-renderer:nth-child(2) button",
  );
  if (dislikeBtn) {
    dislikeBtn.style.removeProperty("width");
    dislikeBtn.style.removeProperty("min-width");
    dislikeBtn.style.removeProperty("padding-right");
    dislikeBtn.style.removeProperty("display");
    dislikeBtn.style.removeProperty("align-items");

    const parentVM = dislikeBtn.closest(
      "dislike-button-view-model, #segmented-dislike-button",
    );
    if (parentVM) {
      parentVM.style.removeProperty("width");
      parentVM.style.removeProperty("min-width");
    }
  }
  // Reset fetch state so re-enabling always triggers a fresh fetch
  lastDislikeVideoId = "";
  lastFetchedDislikeData = null;
  dislikeFetchInProgress = false;
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
  console.log(`YTT: Fetching dislike count for ${videoId}...`);
  try {
    const response = await fetch(
      `https://returnyoutubedislikeapi.com/votes?videoId=${videoId}`,
    );
    if (!response.ok) {
      console.error(`YTT: API Error: ${response.status}`);
      return null;
    }
    const data = await response.json();
    console.log("YTT: Dislike data received:", data.dislikes);
    return data;
  } catch (e) {
    console.error("YTT: Dislike fetch failed:", e);
    return null;
  }
}

function renderDislikeCount(data) {
  if (!dislikeCountSettings.enabled) return;
  if (!data || data.dislikes === undefined) return;

  // Re-query buttons to ensure they're current in the DOM
  const likeBtn = document.querySelector(
    "like-button-view-model button, #segmented-like-button button, ytd-toggle-button-renderer.style-scope.ytd-menu-renderer:nth-child(1) button",
  );
  const dislikeBtn = document.querySelector(
    "dislike-button-view-model button, #segmented-dislike-button button, ytd-toggle-button-renderer.style-scope.ytd-menu-renderer:nth-child(2) button",
  );

  if (!dislikeBtn) {
    return;
  }

  let countEl = document.getElementById("ytt-dislike-count");
  const countText = formatDislikeCount(data.dislikes);

  if (countEl) {
    if (countEl.textContent === countText) return;
    countEl.textContent = countText;
  } else {
    countEl = document.createElement("span");
    countEl.id = "ytt-dislike-count";
    countEl.textContent = countText;

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

    const icon = dislikeBtn.querySelector(
      ".yt-spec-button-shape-next__icon, yt-icon, .icon",
    );
    if (icon) {
      icon.after(countEl);
    } else {
      dislikeBtn.appendChild(countEl);
    }
    console.log("YTT: Dislike count element injected.");
  }

  dislikeBtn.style.setProperty("width", "auto", "important");
  dislikeBtn.style.setProperty("min-width", "auto", "important");
  dislikeBtn.style.setProperty("padding-right", "12px", "important");
  dislikeBtn.style.setProperty("display", "inline-flex", "important");
  dislikeBtn.style.setProperty("align-items", "center", "important");

  const parentVM = dislikeBtn.closest(
    "dislike-button-view-model, #segmented-dislike-button",
  );
  if (parentVM) {
    parentVM.style.setProperty("width", "auto", "important");
    parentVM.style.setProperty("min-width", "auto", "important");
  }

  dislikeBtn.classList.remove("yt-spec-button-shape-next--no-text");
}

function injectDislikeCount(forceFetch = false) {
  if (!dislikeCountSettings.enabled) return;

  const videoId = getVideoId();
  if (!videoId) return;

  // 1. Instant Cache Check (unless forced)
  if (
    !forceFetch &&
    lastFetchedDislikeData &&
    lastFetchedDislikeData.videoId === videoId &&
    dislikeCountSettings.enabled
  ) {
    renderDislikeCount(lastFetchedDislikeData);
    return;
  }

  // 2. Fetch Guard
  if (!forceFetch && dislikeFetchInProgress && videoId === lastDislikeVideoId)
    return;

  lastDislikeVideoId = videoId;
  dislikeFetchInProgress = true;

  fetchDislikeCount(videoId)
    .then((data) => {
      dislikeFetchInProgress = false;
      if (!data || typeof data !== "object") {
        console.warn("YTT: Dislike data is invalid or empty.");
        return;
      }

      lastFetchedDislikeData = { ...data, videoId };

      // Defensive check for settings object
      if (!dislikeCountSettings || dislikeCountSettings.enabled === false) {
        return;
      }

      console.log("YTT: Ready to render dislike count.");
      try {
        renderDislikeCount(lastFetchedDislikeData);
      } catch (err) {
        console.error("YTT: Failed to render dislike count:", err);
      }
    })
    .catch((err) => {
      dislikeFetchInProgress = false;
      console.error("YTT: Dislike fetch/process error:", err);
    });
}

