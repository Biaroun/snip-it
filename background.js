importScripts("i18n.js");

const MENU_ID = "snip-it-save-selection";

const DEFAULT_SETTINGS = {
  includeSource: true,
  notifyOnSave: true,
  language: DEFAULT_LANGUAGE,
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

async function saveNote({ text, url, title }) {
  const settings = await getSettings();
  const { notes = [] } = await chrome.storage.local.get("notes");

  const note = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: text.trim(),
    url: settings.includeSource ? url : "",
    title: settings.includeSource ? title : "",
    createdAt: new Date().toISOString(),
  };

  notes.unshift(note);
  await chrome.storage.local.set({ notes });
  return { note, notifyOnSave: settings.notifyOnSave };
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  const { notifyOnSave } = await saveNote({
    text: info.selectionText,
    url: tab?.url ?? "",
    title: tab?.title ?? "",
  });

  if (notifyOnSave) {
    chrome.action.setBadgeText({ text: "✓" });
    chrome.action.setBadgeBackgroundColor({ color: "#635bff" });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1500);
  }
});
