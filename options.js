const DEFAULT_SETTINGS = {
  includeSource: true,
  notifyOnSave: true,
  language: DEFAULT_LANGUAGE,
  highlightEnabled: true,
  highlightColor: "#ffeb3b",
  highlightPresets: ["#ffeb3b", "#8bf28b", "#8ecbff", "#ffb3d9", "#ffc178", "#d8b3ff"],
};

const includeSourceEl = document.getElementById("includeSource");
const notifyOnSaveEl = document.getElementById("notifyOnSave");
const highlightEnabledEl = document.getElementById("highlightEnabled");
const highlightColorEl = document.getElementById("highlightColor");
const presetsGridEl = document.getElementById("presetsGrid");
const languageEl = document.getElementById("language");
const savedEl = document.getElementById("saved");
const noteCountEl = document.getElementById("noteCount");
const clearAllBtn = document.getElementById("clearAll");

let lang = DEFAULT_LANGUAGE;
let savedTimeout;
let presets = [...DEFAULT_SETTINGS.highlightPresets];

async function refreshNoteCount() {
  const { notes = [] } = await chrome.storage.local.get("notes");
  noteCountEl.textContent = tPlural("noteCountHint", notes.length, lang);
}

function renderPresets() {
  presetsGridEl.innerHTML = "";
  presets.forEach((hex, i) => {
    const input = document.createElement("input");
    input.type = "color";
    input.value = hex;
    input.addEventListener("change", async () => {
      presets[i] = input.value;
      await persist();
    });
    presetsGridEl.appendChild(input);
  });
}

async function load() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  includeSourceEl.checked = settings.includeSource;
  notifyOnSaveEl.checked = settings.notifyOnSave;
  highlightEnabledEl.checked = settings.highlightEnabled;
  highlightColorEl.value = settings.highlightColor;
  presets = settings.highlightPresets;
  languageEl.value = settings.language;
  lang = settings.language;

  applyI18n(document, lang);
  document.documentElement.lang = lang;
  renderPresets();
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
    highlightEnabled: highlightEnabledEl.checked,
    highlightColor: highlightColorEl.value,
    highlightPresets: presets,
    language: languageEl.value,
  });
  showSaved();
}

includeSourceEl.addEventListener("change", persist);
notifyOnSaveEl.addEventListener("change", persist);
highlightEnabledEl.addEventListener("change", persist);
highlightColorEl.addEventListener("change", persist);
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
