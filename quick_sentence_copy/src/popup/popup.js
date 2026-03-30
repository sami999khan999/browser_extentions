document.addEventListener('DOMContentLoaded', () => {
  const wordCountInput = document.getElementById('wordCount');
  const resetButton = document.getElementById('resetDefaults');
  const shortcutItems = document.querySelectorAll('.shortcut-item');
  const globalHint = document.getElementById('global-hint');

  let recordingAction = null;

  const DEFAULTS = {
    wordCount: 5,
    shortcuts: {
      sentence: { ctrl: true, shift: false, alt: false, meta: false, trigger: 'CLICK', button: 0 },
      word1: { ctrl: true, shift: true, alt: false, meta: false, trigger: 'CLICK', button: 0 },
      word2: { ctrl: true, shift: false, alt: true, meta: false, trigger: 'CLICK', button: 0 },
      wordN: { ctrl: false, shift: true, alt: false, meta: false, trigger: 'CLICK', button: 0 }
    }
  };

  function loadSettings() {
    chrome.storage.sync.get(['wordCount', 'shortcuts'], (result) => {
      if (result.wordCount) wordCountInput.value = result.wordCount;
      const shortcuts = result.shortcuts || DEFAULTS.shortcuts;
      Object.keys(shortcuts).forEach(action => updateShortcutUI(action, shortcuts[action]));
    });
  }

  function formatTriggerText(trigger, button) {
    if (!trigger) return '...';
    if (trigger === 'CLICK') {
      if (button === 2) return 'R-CLICK';
      if (button === 1) return 'M-CLICK';
      return 'L-CLICK';
    }
    return trigger.replace('Key', '').replace('Digit', '').replace('Arrow', '').toUpperCase();
  }

  function updateShortcutUI(action, mapping) {
    const el = document.getElementById(`key-${action}`);
    if (!el) return;

    const keys = [];
    if (mapping.ctrl) keys.push('CTRL');
    if (mapping.shift) keys.push('SHIFT');
    if (mapping.alt) keys.push('ALT');
    if (mapping.meta) keys.push('META');
    
    let triggerText = formatTriggerText(mapping.trigger, mapping.button);
    const isTriggerAModifier = ['Control', 'Shift', 'Alt', 'Meta'].some(m => (mapping.trigger || "").includes(m));
    
    if (isTriggerAModifier && keys.length === 1) {
       el.textContent = keys[0];
    } else {
       el.textContent = (keys.length > 0 ? keys.join(' + ') + ' + ' : '') + triggerText;
    }
  }

  // Save word count on every input change
  wordCountInput.addEventListener('input', () => {
    const value = parseInt(wordCountInput.value, 10);
    if (value >= 1) {
      chrome.storage.sync.set({ wordCount: value });
    }
  });

  resetButton.addEventListener('click', () => {
    chrome.storage.sync.set(DEFAULTS, () => {
      loadSettings();
      const originalText = resetButton.innerHTML;
      resetButton.textContent = 'Reset Done!';
      setTimeout(() => resetButton.innerHTML = originalText, 1000);
    });
  });

  shortcutItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (recordingAction) return;

      e.stopPropagation();
      e.preventDefault();

      recordingAction = item.dataset.action;
      item.classList.add('recording');
      globalHint.style.display = 'block';
      globalHint.textContent = 'Capture: Click any mouse button OR press Key';
      
      const previewEl = document.getElementById(`key-${recordingAction}`);
      previewEl.classList.add('active');
      previewEl.textContent = '...';

      const mods = { ctrl: false, shift: false, alt: false, meta: false };

      const updateUI = (event) => {
        const keys = [];
        if (mods.ctrl) keys.push('CTRL');
        if (mods.shift) keys.push('SHIFT');
        if (mods.alt) keys.push('ALT');
        if (mods.meta) keys.push('META');
        
        let t = '...';
        if (event && event.type === 'mousedown') {
           if (event.button === 2) t = 'R-CLICK';
           else if (event.button === 1) t = 'M-CLICK';
           else t = 'L-CLICK';
        } else if (event && event.type === 'keydown' && !['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
           t = event.code.replace('Key', '').toUpperCase();
        }

        previewEl.textContent = (keys.length > 0 ? keys.join(' + ') + ' + ' : '') + t;
      };

      const recordHandler = (event) => {
        // Prevent default (like Right-Click menu) while recording
        event.preventDefault();
        event.stopPropagation();

        const isModifier = ['Control', 'Shift', 'Alt', 'Meta'].includes(event.key);
        
        if (event.type === 'keydown') {
           mods.ctrl = event.ctrlKey;
           mods.shift = event.shiftKey;
           mods.alt = event.altKey;
           mods.meta = event.metaKey;
           updateUI(event);
           if (isModifier) return;
        }

        const finalMapping = {
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey,
          meta: event.metaKey,
          trigger: event.type === 'mousedown' ? 'CLICK' : event.code,
          button: event.type === 'mousedown' ? event.button : undefined
        };

        chrome.storage.sync.get(['shortcuts'], (result) => {
          const shortcuts = result.shortcuts || DEFAULTS.shortcuts;
          shortcuts[recordingAction] = finalMapping;
          chrome.storage.sync.set({ shortcuts }, () => {
            updateShortcutUI(recordingAction, finalMapping);
            cleanup();
          });
        });

        window.removeEventListener('keydown', recordHandler, true);
        window.removeEventListener('mousedown', recordHandler, true);
      };

      const cleanup = () => {
        item.classList.remove('recording');
        if (previewEl) previewEl.classList.remove('active');
        globalHint.style.display = 'none';
        recordingAction = null;
      };

      window.focus();
      setTimeout(() => {
        window.addEventListener('keydown', recordHandler, true);
        window.addEventListener('mousedown', recordHandler, true);
      }, 100);
    });
  });

  loadSettings();
});
