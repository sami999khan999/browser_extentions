chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "copySentence",
    title: "Copy current sentence",
    contexts: ["selection", "page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab && info.menuItemId === "copySentence") {
    // Send message to content script to copy sentence at current mouse position
    // Note: info.selectionText is available if the menu was triggered on a selection,
    // but the user wants to copy without manual selection.
    
    // For now, we'll suggest the user use Alt + Click for the best experience.
    chrome.tabs.sendMessage(tab.id, { action: "copy_sentence" });
  }
});
