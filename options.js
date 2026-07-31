const DEFAULT_SETTINGS = {
  includeSource: true,
  notifyOnSave: true,
  language: DEFAULT_LANGUAGE,
};

const includeSourceEl = document.getElementById("includeSource");
const notifyOnSaveEl = document.getElementById("notifyOnSave");
const languageEl = document.getElementById("language");
const savedEl = document.getElementById("saved");
const noteCountEl = document.getElementById("noteCount");
const clearAllBtn = document.getElementById("clearAll");

let lang = DEFAULT_LANGUAGE;
let savedTimeout;

async function refreshNoteCount() {
  const { notes = [] } = await chrome.storage.local.get("notes");
  noteCountEl.textContent = tPlural("noteCountHint", notes.length, lang);
}

async function load() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  includeSourceEl.checked = settings.includeSource;
  notifyOnSaveEl.checked = settings.notifyOnSave;
  languageEl.value = settings.language;
  lang = settings.language;

  applyI18n(document, lang);
  document.documentElement.lang = lang;
  await refreshNoteCount();
}

function showSaved() {
  savedEl.hidden = false;
  clearTimeout(savedTimeout);
  savedTimeout = setTimeout(() => (savedEl.hidden = true), 1500);
}

async function persist() {
  await chrome.storage.sync.set({
    includeSource: includeSourceEl.checked,
    notifyOnSave: notifyOnSaveEl.checked,
    language: languageEl.value,
  });
  showSaved();
}

includeSourceEl.addEventListener("change", persist);
notifyOnSaveEl.addEventListener("change", persist);
languageEl.addEventListener("change", async () => {
  await persist();
  await load();
});

clearAllBtn.addEventListener("click", async () => {
  if (!confirm(t("confirmClearAllPermanent", lang))) return;
  await chrome.storage.local.set({ notes: [] });
  await refreshNoteCount();
});

load();
