document.addEventListener("DOMContentLoaded", () => {
  const wordCountInput = document.getElementById("wordCount");
  const resetButton = document.getElementById("resetDefaults");
  const shortcutItems = document.querySelectorAll(".shortcut-item");

  let recordingAction = null;
  let activeKeys = []; // Array to preserve order
  let pressedKeysSet = new Set(); // To handle multiple keydown events for the same key

  const DEFAULTS = {
    wordCount: 5,
    shortcuts: {
      sentence: "L-Ctrl + R-Click",
      word1: "L-Ctrl + L-Shift + R-Click",
      word2: "L-Ctrl + L-Alt + R-Click",
      wordN: "L-Shift + R-Click",
    },
  };

  function loadSettings() {
    chrome.storage.sync.get(["wordCount", "shortcuts"], (result) => {
      if (result.wordCount) wordCountInput.value = result.wordCount;
      const shortcuts = result.shortcuts || DEFAULTS.shortcuts;
      Object.keys(shortcuts).forEach((action) => {
        const el = document.getElementById(`key-${action}`);
        if (el) el.textContent = shortcuts[action] || "None";
      });
      checkConflicts();
    });
  }

  function getReadableKeyName(event) {
    const code = event.code;
    const key = event.key;

    // Modifiers with L/R distinction
    const modifiers = {
      ShiftLeft: "L-Shift",
      ShiftRight: "R-Shift",
      ControlLeft: "L-Ctrl",
      ControlRight: "R-Ctrl",
      AltLeft: "L-Alt",
      AltRight: "R-Alt",
      MetaLeft: "L-Meta",
      MetaRight: "R-Meta",
    };

    if (modifiers[code]) return modifiers[code];

    // Regular keys
    if (key === " ") return "Space";
    if (key.length === 1) return key.toUpperCase();
    
    // Function keys, arrow keys, etc.
    return key;
  }

  function checkConflicts() {
    chrome.storage.sync.get(["shortcuts"], (result) => {
      const shortcuts = result.shortcuts || DEFAULTS.shortcuts;
      const counts = {};
      
      // Count occurrences of each shortcut
      Object.values(shortcuts).forEach(val => {
        if (val && val !== "None") {
          counts[val] = (counts[val] || 0) + 1;
        }
      });

      // Update UI for each item
      shortcutItems.forEach(item => {
        const action = item.dataset.action;
        const val = shortcuts[action];
        const isConflict = val && val !== "None" && counts[val] > 1;
        
        item.classList.toggle("conflict", isConflict);
        item.querySelector(".conflict-warning").style.display = isConflict ? "block" : "none";
      });
    });
  }

  function saveShortcut(action, shortcutString) {
    chrome.storage.sync.get(["shortcuts"], (result) => {
      const shortcuts = result.shortcuts || DEFAULTS.shortcuts;
      shortcuts[action] = shortcutString;
      chrome.storage.sync.set({ shortcuts }, () => {
        const el = document.getElementById(`key-${action}`);
        if (el) el.textContent = shortcutString || "None";
        checkConflicts();
      });
    });
  }

  function startRecording(item) {
    if (recordingAction) return;

    recordingAction = item.dataset.action;
    item.classList.add("recording");
    document.body.classList.add("is-recording");
    
    // Dim other items
    shortcutItems.forEach(i => {
      if (i !== item) i.classList.add("dimmed");
    });

    const previewEl = document.getElementById(`key-${recordingAction}`);
    previewEl.textContent = "Recording...";
    
    activeKeys = [];
    pressedKeysSet.clear();

    const handleKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        cancelRecording();
        return;
      }

      const keyName = getReadableKeyName(e);
      if (!pressedKeysSet.has(e.code)) {
        pressedKeysSet.add(e.code);
        activeKeys.push(keyName);
        previewEl.textContent = activeKeys.join(" + ");
      }
    };

    const handleKeyUp = (e) => {
      e.preventDefault();
      e.stopPropagation();

      pressedKeysSet.delete(e.code);
      
      // When all keys are released, finalize
      if (pressedKeysSet.size === 0 && activeKeys.length > 0) {
        finalizeRecording();
      }
    };

    const finalizeRecording = () => {
      const finalShortcut = activeKeys.join(" + ") + " + R-Click";
      saveShortcut(recordingAction, finalShortcut);
      stopListeners();
      cleanup();
    };

    const cancelRecording = () => {
      loadSettings(); // Revert UI
      stopListeners();
      cleanup();
    };

    const cleanup = () => {
      item.classList.remove("recording");
      document.body.classList.remove("is-recording");
      shortcutItems.forEach(i => i.classList.remove("dimmed"));
      recordingAction = null;
    };

    const stopListeners = () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("blur", cancelRecording);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("blur", cancelRecording);
  }

  // Event Listeners
  shortcutItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      startRecording(item);
    });
  });

  wordCountInput.addEventListener("input", () => {
    const value = parseInt(wordCountInput.value, 10);
    if (value >= 1) {
      chrome.storage.sync.set({ wordCount: value });
    }
  });

  resetButton.addEventListener("click", () => {
    const originalContent = resetButton.innerHTML;
    chrome.storage.sync.set(DEFAULTS, () => {
      loadSettings();
      resetButton.textContent = "Done!";
      setTimeout(() => resetButton.innerHTML = originalContent, 1000);
    });
  });

  loadSettings();
});
