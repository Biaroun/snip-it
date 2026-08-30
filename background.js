importScripts("i18n.js");

const MENU_ID = "snip-it-save-selection";

const DEFAULT_SETTINGS = {
  includeSource: true,
  notifyOnSave: true,
  language: DEFAULT_LANGUAGE,
  highlightEnabled: true,
  highlightColor: "#ffeb3b",
};

function getSettings() {
  return chrome.storage.sync.get(DEFAULT_SETTINGS);
}

async function syncMenuTitle() {
  const { language } = await getSettings();
  chrome.contextMenus.update(MENU_ID, { title: t("contextMenuTitle", language) });
}

chrome.runtime.onInstalled.addListener(async () => {
  const { language } = await getSettings();
  chrome.contextMenus.create({
    id: MENU_ID,
    title: t("contextMenuTitle", language),
    contexts: ["selection"],
  });
});

chrome.runtime.onStartup.addListener(syncMenuTitle);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.language) {
    syncMenuTitle();
  }
});

async function saveNote(settings, { id, text, url, title, highlightColor }) {
  const { notes = [] } = await chrome.storage.local.get("notes");

  const note = {
    id,
    text: text.trim(),
    url: settings.includeSource ? url : "",
    title: settings.includeSource ? title : "",
    highlightColor: highlightColor || null,
    createdAt: new Date().toISOString(),
  };

  notes.unshift(note);
  await chrome.storage.local.set({ notes });
  return note;
}

// Injected into the page via chrome.scripting.executeScript — must be fully
// self-contained (no closures over background.js variables).
function highlightSelectionOnPage(colorHex, highlightKey) {
  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    if (typeof Highlight === "undefined" || !window.CSS || !CSS.highlights) return;

    const range = selection.getRangeAt(0).cloneRange();
    const name = `snip-it-${highlightKey}`;

    // Constructable stylesheets bypass strict style-src CSPs that would
    // otherwise block an injected <style> tag on many sites.
    window.__snipItSheets = window.__snipItSheets || {};
    let sheet = window.__snipItSheets[name];
    if (!sheet) {
      sheet = new CSSStyleSheet();
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      window.__snipItSheets[name] = sheet;
    }
    sheet.replaceSync(`::highlight(${name}) { background-color: ${colorHex}; color: inherit; }`);

    let highlight = CSS.highlights.get(name);
    if (!highlight) {
      highlight = new Highlight();
      CSS.highlights.set(name, highlight);
    }
    highlight.add(range);
  } catch {
    // Custom Highlight API unavailable or blocked on this page — skip silently.
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  const settings = await getSettings();
  const noteId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const colorHex = settings.highlightEnabled ? settings.highlightColor : null;

  if (colorHex && tab?.id) {
    chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        func: highlightSelectionOnPage,
        args: [colorHex, `note-${noteId}`],
      })
      .catch(() => {});
  }

  await saveNote(settings, {
    id: noteId,
    text: info.selectionText,
    url: tab?.url ?? "",
    title: tab?.title ?? "",
    highlightColor: colorHex,
  });

  if (settings.notifyOnSave) {
    chrome.action.setBadgeText({ text: "✓" });
    chrome.action.setBadgeBackgroundColor({ color: "#635bff" });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1500);
  }
});
