const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const countEl = document.getElementById("count");
const searchEl = document.getElementById("search");
const template = document.getElementById("noteTemplate");

let allNotes = [];
let lang = DEFAULT_LANGUAGE;

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function render(notes) {
  listEl.innerHTML = "";
  emptyEl.hidden = notes.length > 0 || allNotes.length > 0;
  emptyEl.textContent = t("emptyState", lang);

  if (notes.length === 0 && allNotes.length > 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = t("emptyStateSearch", lang);
    listEl.appendChild(p);
  }

  for (const note of notes) {
    const node = template.content.cloneNode(true);
    node.querySelector(".note-text").textContent = note.text;

    const sourceEl = node.querySelector(".note-source");
    if (note.url) {
      sourceEl.textContent = note.title || hostname(note.url);
      sourceEl.href = note.url;
    } else {
      sourceEl.remove();
    }

    node.querySelector(".note-date").textContent = formatDate(note.createdAt);

    const copyBtn = node.querySelector(".copy-btn");
    copyBtn.textContent = "📋";
    copyBtn.title = t("copyTitle", lang);
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(note.text);
    });

    const deleteBtn = node.querySelector(".delete-btn");
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = t("deleteTitle", lang);
    deleteBtn.addEventListener("click", async () => {
      allNotes = allNotes.filter((n) => n.id !== note.id);
      await chrome.storage.local.set({ notes: allNotes });
      applyFilter();
    });

    listEl.appendChild(node);
  }

  countEl.textContent = tPlural("noteCount", allNotes.length, lang);
}

function applyFilter() {
  const q = searchEl.value.trim().toLowerCase();
  const filtered = q
    ? allNotes.filter(
        (n) =>
          n.text.toLowerCase().includes(q) ||
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.url && n.url.toLowerCase().includes(q))
      )
    : allNotes;
  render(filtered);
}

async function load() {
  const { language } = await chrome.storage.sync.get({ language: DEFAULT_LANGUAGE });
  lang = language;
  applyI18n(document, lang);

  const { notes = [] } = await chrome.storage.local.get("notes");
  allNotes = notes;
  applyFilter();
}

searchEl.addEventListener("input", applyFilter);

document.getElementById("optionsBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("clearBtn").addEventListener("click", async () => {
  if (allNotes.length === 0) return;
  if (!confirm(t("confirmClearAll", lang))) return;
  allNotes = [];
  await chrome.storage.local.set({ notes: [] });
  applyFilter();
});

document.getElementById("exportBtn").addEventListener("click", () => {
  if (allNotes.length === 0) return;
  const md = allNotes
    .map((n) => {
      const lines = [`> ${n.text.replace(/\n/g, "\n> ")}`];
      if (n.url) lines.push(`— [${n.title || n.url}](${n.url})`);
      lines.push(`_${formatDate(n.createdAt)}_`);
      return lines.join("\n");
    })
    .join("\n\n---\n\n");

  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url,
    filename: `snip-it-notes-${Date.now()}.md`,
    saveAs: true,
  });
});

load();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.notes) {
    allNotes = changes.notes.newValue || [];
    applyFilter();
  }
  if (area === "sync" && changes.language) {
    lang = changes.language.newValue;
    applyI18n(document, lang);
    applyFilter();
  }
});
