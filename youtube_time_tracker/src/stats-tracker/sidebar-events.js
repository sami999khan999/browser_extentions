// === Sidebar Event Bindings: Filters, navigation, settings, open/close ===

function bindSidebarEvents(sidebar, btn, dragStatus) {
  // Filter Logic
  const chips = sidebar.querySelectorAll(".filter-chip");
  chips.forEach((chip) => {
    chip.onclick = (e) => {
      e.stopPropagation();
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      selectedDayFilter = chip.dataset.filter;

      const titles = {
        today: "Watch History (Today)",
        yesterday: "Watch History (Yesterday)",
        all: "Watch History (Last 7 Days)",
      };
      const titleEl = document.getElementById("history-title");
      if (titleEl) titleEl.textContent = titles[selectedDayFilter];
      renderStats();
    };
  });

  // View Navigation Logic
  const switchView = (viewName) => {
    activeView = viewName;
    const hView = document.getElementById("history-view");
    const aView = document.getElementById("analytics-view");
    const sView = document.getElementById("settings-view");
    const hFilters = document.getElementById("history-header-filters");

    if (hView) hView.style.display = viewName === "history" ? "block" : "none";
    if (aView)
      aView.style.display = viewName === "analytics" ? "block" : "none";
    if (sView) sView.style.display = viewName === "settings" ? "block" : "none";
    if (hFilters)
      hFilters.style.display = viewName === "history" ? "block" : "none";

    // Update Button Active States
    ["nav-history", "nav-analytics", "nav-settings"].forEach((id) => {
      const navBtn = document.getElementById(id);
      if (navBtn) navBtn.classList.toggle("active", id === `nav-${viewName}`);
    });

    renderStats();
  };

  const attachNav = (id, view) => {
    const el = document.getElementById(id);
    if (el)
      el.onclick = (e) => {
        e.stopPropagation();
        switchView(view);
      };
  };

  attachNav("nav-history", "history");
  attachNav("nav-analytics", "analytics");
  attachNav("nav-settings", "settings");

  // Settings Controls
  const shortsToggle = document.getElementById("shorts-blocker-toggle");
  if (shortsToggle) {
    shortsToggle.onchange = (e) => {
      e.stopPropagation();
      shortsBlockerSettings.enabled = shortsToggle.checked;
      saveShortsBlockerSettings();
      applyShortsBlockerState();
    };
  }

  const dislikeToggle = document.getElementById("dislike-count-toggle");
  if (dislikeToggle) {
    dislikeToggle.onchange = (e) => {
      e.stopPropagation();
      console.log("YTT: Dislike toggled:", dislikeToggle.checked);
      dislikeCountSettings.enabled = dislikeToggle.checked;
      saveDislikeCountSettings();
      // Apply state immediately, force-fetching if enabled
      applyDislikeCountState(dislikeToggle.checked);
    };
  }

  const breakToggle = document.getElementById("break-enabled-toggle");
  if (breakToggle) {
    breakToggle.onchange = (e) => {
      e.stopPropagation();
      breakSettings.enabled = breakToggle.checked;
      saveBreakSettings();
      if (!breakSettings.enabled) {
        continuousWatchStart = null;
        breakModalShown = false;
      }
    };
  }

  const workUrlInput = document.getElementById("setting-work-url");
  if (workUrlInput) {
    workUrlInput.onchange = (e) => {
      let url = workUrlInput.value.trim();
      if (url && !url.startsWith("http")) url = "https://" + url;
      breakSettings.workUrl = url || "https://www.google.com";
      saveBreakSettings();
    };
  }

  const intervalMinus = document.getElementById("interval-minus");
  const intervalPlus = document.getElementById("interval-plus");
  const intervalValue = document.getElementById("interval-value");

  if (intervalMinus) {
    intervalMinus.onclick = (e) => {
      e.stopPropagation();
      breakSettings.intervalMinutes = Math.max(
        1,
        breakSettings.intervalMinutes - 1,
      );
      if (intervalValue) intervalValue.value = breakSettings.intervalMinutes;
      saveBreakSettings();
    };
  }
  if (intervalPlus) {
    intervalPlus.onclick = (e) => {
      e.stopPropagation();
      breakSettings.intervalMinutes = Math.min(
        120,
        breakSettings.intervalMinutes + 1,
      );
      if (intervalValue) intervalValue.value = breakSettings.intervalMinutes;
      saveBreakSettings();
    };
  }
  if (intervalValue) {
    intervalValue.onchange = (e) => {
      let val = parseInt(intervalValue.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 120) val = 120;
      breakSettings.intervalMinutes = val;
      intervalValue.value = val;
      saveBreakSettings();
    };
  }

  // Clear Data Action
  const clearDataBtn = document.getElementById("clear-all-data");
  if (clearDataBtn) {
    clearDataBtn.onclick = (e) => {
      e.stopPropagation();

      showConfirmModal({
        title: "Clear All Data?",
        message:
          "Are you sure you want to delete all watch history and reset all settings? This action cannot be undone.",
        confirmText: "Clear All",
        cancelText: "Cancel",
        icon: "🗑️",
        onConfirm: () => {
          clearAllData();

          // Update UI elements immediately
          const intervalVal = document.getElementById("interval-value");
          if (intervalVal) intervalVal.value = breakSettings.intervalMinutes;

          const sToggle = document.getElementById("shorts-blocker-toggle");
          if (sToggle) sToggle.checked = shortsBlockerSettings.enabled;

          const dToggle = document.getElementById("dislike-count-toggle");
          if (dToggle) dToggle.checked = dislikeCountSettings.enabled;

          const bToggle = document.getElementById("break-enabled-toggle");
          if (bToggle) bToggle.checked = breakSettings.enabled;

          const wUrlInput = document.getElementById("setting-work-url");
          if (wUrlInput) wUrlInput.value = breakSettings.workUrl;

          // Show history view to indicate completion
          switchView("history");
          renderStats();

          // Visual feedback on the button
          const originalHtml = clearDataBtn.innerHTML;
          clearDataBtn.textContent = "Data Cleared!";
          clearDataBtn.style.background = "#2ecc71";
          clearDataBtn.style.color = "white";
          clearDataBtn.style.borderColor = "#2ecc71";
          setTimeout(() => {
            clearDataBtn.innerHTML = originalHtml;
            clearDataBtn.style.background = "";
            clearDataBtn.style.color = "";
            clearDataBtn.style.borderColor = "";
          }, 2000);
        },
      });
    };
  }

  // Toggle sidebar open/close
  btn.onclick = (e) => {
    if (dragStatus.isDragging) return; // Don't toggle if we were dragging
    e.stopPropagation();
    isStatsOpen = !isStatsOpen;

    sidebar.classList.toggle("open", isStatsOpen);
    btn.classList.toggle("active", isStatsOpen);

    if (isStatsOpen) {
      document.body.classList.add("stats-sidebar-active");
      document.body.style.overflow = "hidden";
      renderStats();
    } else {
      document.body.classList.remove("stats-sidebar-active");
      document.body.style.overflow = "";
    }
  };

  const closeBtn = document.getElementById("close-stats");
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      isStatsOpen = false;
      sidebar.classList.remove("open");
      btn.classList.remove("active");
      document.body.classList.remove("stats-sidebar-active");
      document.body.style.overflow = "";
    };
  }

  // Close on escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isStatsOpen) {
      isStatsOpen = false;
      sidebar.classList.remove("open");
      btn.classList.remove("active");
      document.body.classList.remove("stats-sidebar-active");
      document.body.style.overflow = "";
    }
  });

  // Close on click outside
  document.addEventListener("click", (e) => {
    if (isStatsOpen && !sidebar.contains(e.target) && e.target !== btn) {
      isStatsOpen = false;
      sidebar.classList.remove("open");
      btn.classList.remove("active");
      document.body.classList.remove("stats-sidebar-active");
      document.body.style.overflow = "";
    }
  });

  // Sidebar hover logic (simplified as global lock is now primary)
  sidebar.onmouseenter = () => {
    // Already handled by global lock if open
  };
  sidebar.onmouseleave = () => {
    if (!isStatsOpen) document.body.style.overflow = "";
  };
}
