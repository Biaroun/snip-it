const DEFAULT_SETTINGS = {
  includeSource: true,
  notifyOnSave: true,
};

const includeSourceEl = document.getElementById("includeSource");
const notifyOnSaveEl = document.getElementById("notifyOnSave");
const savedEl = document.getElementById("saved");
const noteCountEl = document.getElementById("noteCount");
const clearAllBtn = document.getElementById("clearAll");

let savedTimeout;

async function load() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  includeSourceEl.checked = settings.includeSource;
  notifyOnSaveEl.checked = settings.notifyOnSave;

  const { notes = [] } = await chrome.storage.local.get("notes");
  noteCountEl.textContent = `${notes.length} note${notes.length !== 1 ? "s" : ""} stockée${notes.length !== 1 ? "s" : ""} localement`;
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
  });
  showSaved();
}

includeSourceEl.addEventListener("change", persist);
notifyOnSaveEl.addEventListener("change", persist);

clearAllBtn.addEventListener("click", async () => {
  if (!confirm("Supprimer définitivement toutes les notes sauvegardées ?")) return;
  await chrome.storage.local.set({ notes: [] });
  load();
});

load();
