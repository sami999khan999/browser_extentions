// === Sidebar Event Bindings: Filters, navigation, settings, open/close ===

function bindSidebarEvents(sidebar, btn, dragStatus) {
  // Date Navigator & Calendar Logic
  let calendarDate = new Date(); // Month/Year currently shown in the calendar popover

  const updateDateLabel = () => {
    const label = document.querySelector(".current-date-label");
    if (!label) return;

    if (selectedDayFilter === "today") {
      label.textContent = "Today";
    } else if (selectedDayFilter === "yesterday") {
      label.textContent = "Yesterday";
    } else if (selectedDayFilter === "all") {
      label.textContent = "All Time";
    } else {
      // YYYY-MM-DD format
      const [y, m, d] = selectedDayFilter.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      label.textContent = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: y !== new Date().getFullYear() ? "numeric" : undefined,
      });
    }
    
    // Update "All Time" chip active state
    const allTimeChip = sidebar.querySelector('.filter-chip.special');
    if (allTimeChip) {
        allTimeChip.classList.toggle('active', selectedDayFilter === 'all');
    }
  };

  const renderCalendar = () => {
    const container = document.getElementById("calendar-popover");
    if (!container) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthName = new Date(year, month).toLocaleString(undefined, {
      month: "long",
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = getDayKey(new Date());
    const selectedStr =
      selectedDayFilter === "today"
        ? todayStr
        : selectedDayFilter === "yesterday"
        ? getDayKey(new Date(Date.now() - 86400000))
        : selectedDayFilter;

    let html = `
      <div class="calendar-header">
        <div class="calendar-month-year">${monthName} ${year}</div>
        <div class="calendar-nav">
          <button id="cal-prev" class="nav-arrow-btn">${icons.prev}</button>
          <button id="cal-next" class="nav-arrow-btn">${icons.next}</button>
        </div>
      </div>
      <div class="calendar-grid">
        <div class="calendar-day-label">Su</div>
        <div class="calendar-day-label">Mo</div>
        <div class="calendar-day-label">Tu</div>
        <div class="calendar-day-label">We</div>
        <div class="calendar-day-label">Th</div>
        <div class="calendar-day-label">Fr</div>
        <div class="calendar-day-label">Sa</div>
    `;

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        d,
      ).padStart(2, "0")}`;
      const isToday = dateKey === todayStr;
      const isSelected = dateKey === selectedStr;

      html += `
        <div class="calendar-day ${isToday ? "today" : ""} ${
        isSelected ? "selected" : ""
      }" data-date="${dateKey}">
          ${d}
        </div>
      `;
    }

    html += "</div>";
    container.innerHTML = html;

    // Calendar Handlers
    container.querySelector("#cal-prev").onclick = (e) => {
      e.stopPropagation();
      calendarDate.setMonth(calendarDate.getMonth() - 1);
      renderCalendar();
    };
    container.querySelector("#cal-next").onclick = (e) => {
      e.stopPropagation();
      calendarDate.setMonth(calendarDate.getMonth() + 1);
      renderCalendar();
    };
    container.querySelectorAll(".calendar-day:not(.empty)").forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation();
        selectedDayFilter = el.dataset.date === todayStr ? "today" : el.dataset.date;
        container.style.display = "none";
        updateDateLabel();
        renderStats();
      };
    });
  };

  const trigger = document.getElementById("calendar-trigger");
  const popover = document.getElementById("calendar-popover");
  if (trigger && popover) {
    trigger.onclick = (e) => {
      e.stopPropagation();
      const isVisible = popover.style.display === "block";
      popover.style.display = isVisible ? "none" : "block";
      if (!isVisible) renderCalendar();
    };
  }

  const prevBtn = document.getElementById("date-prev");
  const nextBtn = document.getElementById("date-next");

  const shiftDate = (offset) => {
    let current;
    if (selectedDayFilter === "today") current = new Date();
    else if (selectedDayFilter === "yesterday") current = new Date(Date.now() - 86400000);
    else if (selectedDayFilter === "all") current = new Date();
    else {
      const [y, m, d] = selectedDayFilter.split("-").map(Number);
      current = new Date(y, m - 1, d);
    }
    current.setDate(current.getDate() + offset);
    
    const newKey = getDayKey(current);
    selectedDayFilter = (newKey === getDayKey(new Date())) ? "today" : newKey;
    updateDateLabel();
    renderStats();
  };

  if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); shiftDate(-1); };
  if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); shiftDate(1); };

  const allTimeChip = sidebar.querySelector('.filter-chip.special');
  if (allTimeChip) {
    allTimeChip.onclick = (e) => {
        e.stopPropagation();
        selectedDayFilter = 'all';
        updateDateLabel();
        renderStats();
    };
  }

  // Initial label update
  updateDateLabel();

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

    const bView = document.getElementById("backup-view");
    if (bView) bView.style.display = viewName === "backup" ? "block" : "none";

    // Update Button Active States
    ["nav-history", "nav-analytics", "nav-backup", "nav-settings"].forEach((id) => {
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

  const navBackup = document.getElementById("nav-backup");
  if (navBackup) {
    navBackup.onclick = (e) => {
      e.stopPropagation();
      switchView("backup");
      renderBackups();
    };
  }

  const backToSettings = document.getElementById("back-to-settings");
  if (backToSettings) {
    backToSettings.onclick = (e) => {
      e.stopPropagation();
      switchView("settings");
    };
  }

  // Remove the old nav-backup-view button listener (no longer in HTML)

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

  // Backup Settings
  const backupEnabledToggle = document.getElementById("backup-enabled-toggle");
  if (backupEnabledToggle) {
    backupEnabledToggle.onchange = (e) => {
      e.stopPropagation();
      backupSettings.enabled = backupEnabledToggle.checked;
      saveBackupSettings();
    };
  }

  const backupOnCloseToggle = document.getElementById("backup-on-close-toggle");
  if (backupOnCloseToggle) {
    backupOnCloseToggle.onchange = (e) => {
      e.stopPropagation();
      backupSettings.backupOnClose = backupOnCloseToggle.checked;
      saveBackupSettings();
    };
  }

  const backupDropdown = document.getElementById("backup-interval-dropdown");
  if (backupDropdown) {
    const trigger = backupDropdown.querySelector(".dropdown-trigger");
    const menu = backupDropdown.querySelector(".dropdown-menu");
    const items = backupDropdown.querySelectorAll(".dropdown-item");

    trigger.onclick = (e) => {
      e.stopPropagation();
      const isOpen = backupDropdown.classList.contains("open");
      // Close any other open dropdowns first (if we had more)
      document
        .querySelectorAll(".custom-dropdown.open")
        .forEach((d) => d.classList.remove("open"));
      if (!isOpen) backupDropdown.classList.add("open");
    };

    items.forEach((item) => {
      item.onclick = (e) => {
        e.stopPropagation();
        const value = parseInt(item.dataset.value, 10);
        const label = item.textContent;

        // Update state
        backupSettings.intervalHours = value;
        saveBackupSettings();

        // Update UI
        backupDropdown.dataset.value = value;
        trigger.querySelector("span").textContent = label;
        items.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        // Close
        backupDropdown.classList.remove("open");
      };
    });
  }

  const retentionDropdown = document.getElementById("retention-duration-dropdown");
  if (retentionDropdown) {
    const trigger = retentionDropdown.querySelector(".dropdown-trigger");
    const menu = retentionDropdown.querySelector(".dropdown-menu");
    const items = retentionDropdown.querySelectorAll(".dropdown-item");

    trigger.onclick = (e) => {
      e.stopPropagation();
      const isOpen = retentionDropdown.classList.contains("open");
      document
        .querySelectorAll(".custom-dropdown.open")
        .forEach((d) => d.classList.remove("open"));
      if (!isOpen) retentionDropdown.classList.add("open");
    };

    items.forEach((item) => {
      item.onclick = (e) => {
        e.stopPropagation();
        const value = parseInt(item.dataset.value, 10);
        const label = item.textContent;

        // Update state
        retentionSettings.duration = value;
        saveRetentionSettings();

        // Update UI
        retentionDropdown.dataset.value = value;
        trigger.querySelector("span").textContent = label;
        items.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        // Close
        retentionDropdown.classList.remove("open");
      };
    });
  }
  
  const maxBackupsMinus = document.getElementById("max-backups-minus");
  const maxBackupsPlus = document.getElementById("max-backups-plus");
  const maxBackupsValue = document.getElementById("max-backups-value");

  if (maxBackupsMinus) {
    maxBackupsMinus.onclick = (e) => {
      e.stopPropagation();
      backupSettings.maxBackups = Math.max(
        1,
        (backupSettings.maxBackups || 10) - 1,
      );
      if (maxBackupsValue) maxBackupsValue.value = backupSettings.maxBackups;
      saveBackupSettings();
    };
  }
  if (maxBackupsPlus) {
    maxBackupsPlus.onclick = (e) => {
      e.stopPropagation();
      backupSettings.maxBackups = Math.min(
        50,
        (backupSettings.maxBackups || 10) + 1,
      );
      if (maxBackupsValue) maxBackupsValue.value = backupSettings.maxBackups;
      saveBackupSettings();
    };
  }
  if (maxBackupsValue) {
    maxBackupsValue.onchange = (e) => {
      let val = parseInt(maxBackupsValue.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 50) val = 50;
      backupSettings.maxBackups = val;
      maxBackupsValue.value = val;
      saveBackupSettings();
    };
  }

  // Close dropdowns on outside click
  document.addEventListener("click", () => {
    document
      .querySelectorAll(".custom-dropdown.open")
      .forEach((d) => d.classList.remove("open"));
  });

  const createBackupBtn = document.getElementById("create-manual-backup");
  const deleteBtn = document.getElementById("delete-all-backups");
  if (deleteBtn) {
    deleteBtn.onclick = () => {
        showConfirmModal({
            title: "Clear All Backups?",
            message: "This will permanently delete all stored snapshots in the local database. This action cannot be undone.",
            confirmText: "Clear All",
            cancelText: "Cancel",
            icon: "🗑️",
            onConfirm: () => {
                safeSendMessage({ action: "DELETE_ALL_BACKUPS" }, (response) => {
                    if (response && response.success) {
                        renderBackups();
                    } else {
                        alert("Failed to clear backups: " + (response ? response.error : "Unknown error"));
                    }
                });
            }
        });
    };
  }

  // Import JSON Click
  const importBtn = document.getElementById("import-backup-json");
  const fileInput = document.getElementById("backup-file-input");

  if (importBtn && fileInput) {
    importBtn.onclick = (e) => {
      e.stopPropagation();
      fileInput.click();
    };

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          
          // Basic validation
          if (!importedData.allHistory && !importedData.shortsBlockerSettings) {
             throw new Error("Invalid backup file format");
          }

          showConfirmModal({
            title: "Import Backup?",
            message: "This will overwrite your current history and settings. Are you sure?",
            confirmText: "Import & Restore",
            cancelText: "Cancel",
            icon: "📥",
            onConfirm: () => {
              importBtn.disabled = true;
              importBtn.textContent = "Importing...";

              safeSendMessage({ action: "IMPORT_BACKUP", clientData: importedData }, (response) => {
                importBtn.disabled = false;
                importBtn.textContent = "Import JSON";
                fileInput.value = ""; // Reset input

                if (response && response.success) {
                   // Refresh everything
                   switchView("history");
                   renderStats();
                   renderBackups();
                   
                   // Show success feedback
                   const originalHtml = importBtn.innerHTML;
                   importBtn.textContent = "Imported!";
                   importBtn.style.color = "#2ecc71";
                   setTimeout(() => {
                      importBtn.innerHTML = originalHtml;
                      importBtn.style.color = "";
                   }, 2000);
                } else {
                   alert("Failed to import backup: " + (response ? response.error : "Unknown error"));
                }
              });
            }
          });
        } catch (err) {
          alert("Error parsing backup file: " + err.message);
          fileInput.value = "";
        }
      };
      reader.readAsText(file);
    };
  }

  if (createBackupBtn) {
    createBackupBtn.onclick = (e) => {
      e.stopPropagation();
      createBackupBtn.disabled = true;
      const originalHtml = createBackupBtn.innerHTML;
      createBackupBtn.textContent = "Backing up...";

      safeSendMessage({ action: "CREATE_BACKUP_MANUAL" }, () => {
        createBackupBtn.disabled = false;
        createBackupBtn.innerHTML = originalHtml;
        renderBackups();
      });
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

  // Scroll Listener for Infinite History
  const statsBody = sidebar.querySelector(".stats-body");
  if (statsBody) {
    statsBody.onscroll = () => {
        if (activeView !== 'history') return;
        
        // Trigger if we are 200px from the bottom
        const threshold = 200;
        const remaining = statsBody.scrollHeight - (statsBody.scrollTop + statsBody.clientHeight);
        
        if (remaining < threshold) {
            appendHistoryBatch();
        }
    };
  }

  // Close on click outside
  document.addEventListener("click", (e) => {
    if (popover && !popover.contains(e.target) && e.target !== trigger) {
        popover.style.display = "none";
    }
    
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

/**
 * Fetches and renders the list of backups present in IndexedDB.
 */
function renderBackups() {
  const list = document.getElementById("backup-history-list");
  if (!list) return;

  safeSendMessage({ action: "GET_BACKUPS" }, (backups) => {
    if (!backups || backups.length === 0) {
      list.innerHTML =
        '<li class="loading-placeholder">No backups found yet.</li>';
      return;
    }

    list.innerHTML = "";
    backups.forEach((b) => {
      const item = document.createElement("li");
      item.className = "backup-item";
      item.innerHTML = `
                <div class="backup-lead">
                    ${icons.backup}
                </div>
                <div class="backup-info">
                    <span class="backup-date">${b.dateString}</span>
                    <span class="backup-meta">Snapshot - YouTube History</span>
                </div>
                <div class="backup-actions">
                    <button class="backup-btn restore-btn" title="Restore this Backup" data-id="${b.id}">
                        ${icons.restore}
                    </button>
                    <button class="backup-btn download-btn" title="Download as JSON" data-id="${b.id}">
                        ${icons.download}
                    </button>
                    <button class="backup-btn delete-btn" title="Delete Backup" data-id="${b.id}">
                        ${icons.close}
                    </button>
                </div>
            `;

      // Restore Action
      item.querySelector(".restore-btn").onclick = (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        showConfirmModal({
          title: "Restore this Backup?",
          message: "This will completely overwrite your current history and settings with data from this snapshot. Are you sure?",
          confirmText: "Restore Now",
          cancelText: "Cancel",
          icon: "🔄",
          onConfirm: () => {
             safeSendMessage({ action: "RESTORE_BACKUP", id: id }, (response) => {
                 if (response && response.success) {
                    // Success feedback
                    switchView("history");
                    renderStats();
                    renderBackups();
                 } else {
                    alert("Failed to restore: " + (response ? response.error : "Unknown error"));
                 }
             });
          }
        });
      };

      // Download Action
      item.querySelector(".download-btn").onclick = (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        // In extension content scripts, we can't directly use yttDB if it's in a different world,
        // but since we bundled it into content.js, it should be available.
        // However, it's safer to ask background for the full data and then trigger download here.
        chrome.runtime.sendMessage(
          { action: "GET_BACKUPS" },
          (allFullBackups) => {
            // Wait, GET_BACKUPS in background now returns metadata only? 
            // I should have a GET_BACKUP_BY_ID in background.
          },
        );
        // Correct approach: ask background for full data via a new message or use GET_BACKUPS if it returned everything.
        // Actually, my getAllBackups returns metadata only. I need a GET_BACKUP_BY_ID handler.
        
        // Re-routing through background for full data
        safeSendMessage({ action: "GET_BACKUP_FULL", id: id }, (fullBackup) => {
            if (fullBackup) {
                const blob = new Blob([JSON.stringify(fullBackup.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ytt_backup_${id}_${new Date(fullBackup.timestamp).toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
      };

      // Delete Action
      item.querySelector(".delete-btn").onclick = (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        showConfirmModal({
          title: "Delete Backup?",
          message: "Are you sure you want to remove this backup? This cannot be undone.",
          confirmText: "Delete",
          cancelText: "Cancel",
          icon: "🗑️",
          onConfirm: () => {
             safeSendMessage({ action: "DELETE_BACKUP", id: id }, () => {
                 renderBackups();
             });
          }
        });
      };

      list.appendChild(item);
    });
  });
}
