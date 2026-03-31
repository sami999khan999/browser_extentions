(function() {
  const sentenceBoundaryRegex = /([^.!?"]+([.!?"]+|$))/g;

  // Default mappings
  const DEFAULTS = {
    wordCount: 5,
    shortcuts: {
      sentence: { ctrl: true, shift: false, alt: false, meta: false, trigger: 'CLICK', button: 0 },
      word1: { ctrl: true, shift: true, alt: false, meta: false, trigger: 'CLICK', button: 0 },
      word2: { ctrl: true, shift: false, alt: true, meta: false, trigger: 'CLICK', button: 0 },
      wordN: { ctrl: false, shift: true, alt: false, meta: false, trigger: 'CLICK', button: 0 }
    }
  };

  const EDITABLE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

  let currentSettings = JSON.parse(JSON.stringify(DEFAULTS));
  let mousePos = { x: 0, y: 0 };

  function loadSettings() {
    chrome.storage.sync.get(['wordCount', 'shortcuts'], (result) => {
      if (result.wordCount !== undefined) currentSettings.wordCount = Number(result.wordCount);
      if (result.shortcuts) currentSettings.shortcuts = result.shortcuts;
    });
  }

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.wordCount) currentSettings.wordCount = changes.wordCount.newValue;
    if (changes.shortcuts) currentSettings.shortcuts = changes.shortcuts.newValue;
  });

  function getRangeAtPoint(clientX, clientY) {
    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(clientX, clientY);
      const range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.setEnd(pos.offsetNode, pos.offset);
      return range;
    } else if (document.caretRangeFromPoint) {
      return document.caretRangeFromPoint(clientX, clientY);
    }
    return null;
  }

  function findSentenceAtOffset(fullText, offset) {
    const sentences = [];
    const regex = new RegExp(sentenceBoundaryRegex);
    let match;
    while ((match = regex.exec(fullText)) !== null) {
      sentences.push({ text: match[0].trim(), start: match.index, end: match.index + match[0].length });
    }
    const targetSentence = sentences.find(s => offset >= s.start && offset <= s.end);
    return targetSentence ? targetSentence.text : null;
  }

  function findSentenceAtPoint(x, y) {
    const range = getRangeAtPoint(x, y);
    if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) return null;
    return findSentenceAtOffset(range.startContainer.textContent, range.startOffset);
  }

  function findWordsAtOffset(fullText, offset, numWords) {
    // Find the start of the word the cursor is over
    const beforeText = fullText.substring(0, offset);
    const startMatch = beforeText.match(/\S+$/);
    const wordStart = startMatch ? offset - startMatch[0].length : offset;

    // Capture words including trailing punctuation
    const remainingText = fullText.substring(wordStart);
    const words = remainingText.match(/\S+(\s+|$)/g) || [];
    
    if (words.length === 0) return null;

    const slice = words.slice(0, numWords);
    return slice.join('').trim();
  }

  function findWordsAtPoint(x, y, numWords) {
    const range = getRangeAtPoint(x, y);
    if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) return null;
    return findWordsAtOffset(range.startContainer.textContent, range.startOffset, numWords);
  }

  function copyToClipboard(text, description = "") {
    if (!text) return;
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      const preview = `${text.substring(0, 25)}${text.length > 25 ? '...' : ''}`;
      showToast(`Copied ${description}: "${preview}"`);
    } catch (err) {
      console.error('Failed to copy', err);
    }
    document.body.removeChild(textArea);
  }

  function showToast(message) {
    let container = document.querySelector('.sc-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'sc-toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'sc-toast';
    toast.innerHTML = `
      <div class="sc-toast-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <div class="sc-toast-content">${message}</div>
    `;
    container.appendChild(toast);
    toast.offsetHeight;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) container.remove();
      }, 400);
    }, 2500);
  }

  function isEditingText() {
    const el = document.activeElement;
    if (!el) return false;
    if (EDITABLE_TAGS.includes(el.tagName)) return true;
    if (el.isContentEditable) return true;
    return false;
  }

  // Detect Google Docs specific canvas or hidden layers
  function isGoogleDocs() {
    return window.location.hostname === 'docs.google.com';
  }

  function getFallbackSelection() {
    const selection = window.getSelection().toString().trim();
    return selection || null;
  }

  function matchShortcut(e, action, triggerType) {
    const mapping = currentSettings.shortcuts[action];
    if (!mapping) return false;
    
    let triggerMatch = false;
    if (triggerType === 'CLICK' && mapping.trigger === 'CLICK') {
      triggerMatch = (e.button === mapping.button);
    } else if (triggerType === 'KEY' && mapping.trigger === e.code) {
      triggerMatch = true;
    }

    return (
      triggerMatch &&
      e.ctrlKey === !!mapping.ctrl &&
      e.shiftKey === !!mapping.shift &&
      e.altKey === !!mapping.alt &&
      e.metaKey === !!mapping.meta
    );
  }

  async function handleAction(e, action) {
    let textToCopy = null;
    let description = "";

    const targetEl = e.target;
    const isInput = EDITABLE_TAGS.includes(targetEl.tagName);

    if (isInput) {
      // For inputs/textareas, we need to wait a tiny bit for the caret to move to the click position
      // only if it's a mouse click event. For keydown, we use current position.
      if (e.type === 'mousedown') {
        await new Promise(r => setTimeout(r, 10));
      }
      const offset = targetEl.selectionStart;
      const val = targetEl.value;

      switch (action) {
        case 'sentence':
          textToCopy = findSentenceAtOffset(val, offset);
          description = "Sentence";
          break;
        case 'word1':
        case 'word2':
        case 'wordN':
          const count = action === 'word1' ? 1 : (action === 'word2' ? 2 : currentSettings.wordCount);
          textToCopy = findWordsAtOffset(val, offset, count);
          description = count === 1 ? "Word" : `${count} Words`;
          break;
      }
    } else {
      // Standard DOM or contentEditable
      switch (action) {
        case 'sentence':
          textToCopy = findSentenceAtPoint(mousePos.x, mousePos.y);
          description = "Sentence";
          break;
        case 'word1':
          textToCopy = findWordsAtPoint(mousePos.x, mousePos.y, 1);
          description = "Word";
          break;
        case 'word2':
          textToCopy = findWordsAtPoint(mousePos.x, mousePos.y, 2);
          description = "2 Words";
          break;
        case 'wordN':
          textToCopy = findWordsAtPoint(mousePos.x, mousePos.y, currentSettings.wordCount);
          description = `${currentSettings.wordCount} Words`;
          break;
      }

      // If coordinate detection failed and it's a known complex editor or is contentEditable, try fallback
      if (!textToCopy && (isEditingText() || isGoogleDocs())) {
        textToCopy = getFallbackSelection();
        if (textToCopy) description = "Selected Text";
      }
    }

    if (textToCopy) {
      e.preventDefault();
      copyToClipboard(textToCopy, description);
      return true;
    }
    return false;
  }

  window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
  });

  const getMatchedAction = (e, type) => {
    const shortcuts = currentSettings.shortcuts;
    for (const action of Object.keys(shortcuts)) {
      if (matchShortcut(e, action, type)) return action;
    }
    return null;
  };

  window.addEventListener('mousedown', async (e) => {
    // We allow shortcuts even if typing, as long as a valid modifier is held
    const action = getMatchedAction(e, 'CLICK');
    if (action) {
      // If modifiers are held, we intercept to see if we should copy
      handleAction(e, action);
    }
  }, { capture: true });

  window.addEventListener('contextmenu', (e) => {
    // Check if right-click is assigned to a shortcut
    const action = getMatchedAction({
      button: 2,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey
    }, 'CLICK');

    if (action) {
      // Don't preventDefault here if we fail to find text later, but usually we block it
      // to avoid visual flicker.
      e.preventDefault();
    }
  }, { capture: true });

  window.addEventListener('keydown', (e) => {
    const action = getMatchedAction(e, 'KEY');
    if (action) handleAction(e, action);
  }, { capture: true });

  loadSettings();
  console.log("Quick Sentence Copy (Multi-Button) initialized.");
})();
