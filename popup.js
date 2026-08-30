const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const countEl = document.getElementById("count");
const searchEl = document.getElementById("search");
const template = document.getElementById("noteTemplate");

let allNotes = [];
let lang = DEFAULT_LANGUAGE;
let highlightPresets = ["#ffeb3b", "#8bf28b", "#8ecbff", "#ffb3d9", "#ffc178", "#d8b3ff"];

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

// Injected into the page via chrome.scripting.executeScript — must be fully
// self-contained (no closures over popup.js variables).
function updateOrCreateHighlight(text, colorHex, highlightKey) {
  try {
    if (typeof Highlight === "undefined" || !window.CSS || !CSS.highlights) return;
    const name = `snip-it-${highlightKey}`;

    window.__snipItSheets = window.__snipItSheets || {};
    let sheet = window.__snipItSheets[name];
    if (!sheet) {
      sheet = new CSSStyleSheet();
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      window.__snipItSheets[name] = sheet;
    }
    sheet.replaceSync(`::highlight(${name}) { background-color: ${colorHex}; color: inherit; }`);

    let highlight = CSS.highlights.get(name);
    if (highlight && highlight.size > 0) {
      // A range was already highlighted for this note — the stylesheet update above recolors it.
      return;
    }
    if (!highlight) {
      highlight = new Highlight();
      CSS.highlights.set(name, highlight);
    }

    // No existing range (e.g. highlighting was off when the note was saved) —
    // search the page text for it and highlight the first match.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.data.trim()) return NodeFilter.FILTER_REJECT;
        const tag = node.parentElement && node.parentElement.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    let full = "";
    let n;
    while ((n = walker.nextNode())) {
      nodes.push({ node: n, start: full.length });
      full += n.data;
    }

    const idx = full.indexOf(text);
    if (idx === -1) return;
    const end = idx + text.length;

    let startNode, startOffset, endNode, endOffset;
    for (const entry of nodes) {
      const nodeEnd = entry.start + entry.node.data.length;
      if (startNode === undefined && idx >= entry.start && idx < nodeEnd) {
        startNode = entry.node;
        startOffset = idx - entry.start;
      }
      if (end > entry.start && end <= nodeEnd) {
        endNode = entry.node;
        endOffset = end - entry.start;
        break;
      }
    }
    if (!startNode || !endNode) return;

    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    highlight.add(range);
  } catch {
    // Custom Highlight API unavailable or blocked on this page — skip silently.
  }
}

// ---- Custom HSV color picker (avoids the native <input type="color">
// dialog, which steals focus and closes the extension popup). ----

function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgbToHsv(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = (((g - b) / d) % 6) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec((hex || "").trim());
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

const colorModal = document.getElementById("colorModal");
const colorModalClose = document.getElementById("colorModalClose");
const slSquare = document.getElementById("slSquare");
const slThumb = document.getElementById("slThumb");
const hueSlider = document.getElementById("hueSlider");
const colorPreview = document.getElementById("colorPreview");
const hexInput = document.getElementById("hexInput");
const presetRow = document.getElementById("presetRow");

const picker = { hue: 50, sat: 1, val: 1, note: null, article: null };

function renderPicker() {
  const [r, g, b] = hsvToRgb(picker.hue, picker.sat, picker.val);
  const hex = rgbToHex(r, g, b);
  slSquare.style.background = `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0)), hsl(${picker.hue}, 100%, 50%)`;
  slThumb.style.left = `${picker.sat * 100}%`;
  slThumb.style.top = `${(1 - picker.val) * 100}%`;
  hueSlider.value = picker.hue;
  colorPreview.style.backgroundColor = hex;
  hexInput.value = hex;
  return hex;
}

async function commitPickerColor() {
  const hex = renderPicker();
  const note = picker.note;
  if (!note) return;
  note.highlightColor = hex;
  if (picker.article) picker.article.style.setProperty("--note-color", hex);
  const idx = allNotes.findIndex((n) => n.id === note.id);
  if (idx !== -1) allNotes[idx] = { ...allNotes[idx], highlightColor: hex };
  await chrome.storage.local.set({ notes: allNotes });

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && note.url && tab.url === note.url) {
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          func: updateOrCreateHighlight,
          args: [note.text, hex, `note-${note.id}`],
        })
        .catch(() => {});
    }
  } catch {
    // No matching active tab — stored color still updates.
  }
}

function applyPresetColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return;
  const [h, s, v] = rgbToHsv(...rgb);
  picker.hue = h;
  picker.sat = s || 1;
  picker.val = v || 1;
  commitPickerColor();
}

async function applyNoHighlight() {
  const note = picker.note;
  if (!note) return;
  note.highlightColor = null;
  if (picker.article) picker.article.style.removeProperty("--note-color");
  const idx = allNotes.findIndex((n) => n.id === note.id);
  if (idx !== -1) allNotes[idx] = { ...allNotes[idx], highlightColor: null };
  await chrome.storage.local.set({ notes: allNotes });
  await removeLiveHighlight(note);
  colorModal.hidden = true;
}

function renderPresetRow() {
  presetRow.innerHTML = "";

  const noneBtn = document.createElement("button");
  noneBtn.className = "preset-swatch preset-none";
  noneBtn.title = t("noHighlightTitle", lang);
  noneBtn.addEventListener("click", applyNoHighlight);
  presetRow.appendChild(noneBtn);

  for (const hex of highlightPresets) {
    const swatch = document.createElement("button");
    swatch.className = "preset-swatch";
    swatch.style.backgroundColor = hex;
    swatch.addEventListener("click", () => applyPresetColor(hex));
    presetRow.appendChild(swatch);
  }
}

function openColorPicker(note, article) {
  renderPresetRow();
  const rgb = hexToRgb(note.highlightColor) || [255, 235, 59];
  const [h, s, v] = rgbToHsv(...rgb);
  picker.hue = h;
  picker.sat = s || 1;
  picker.val = v || 1;
  picker.note = note;
  picker.article = article;
  renderPicker();
  colorModal.hidden = false;
}

function updateFromSquarePointer(e) {
  const rect = slSquare.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
  picker.sat = x;
  picker.val = 1 - y;
  renderPicker();
}

let draggingSquare = false;
slSquare.addEventListener("pointerdown", (e) => {
  draggingSquare = true;
  slSquare.setPointerCapture(e.pointerId);
  updateFromSquarePointer(e);
});
slSquare.addEventListener("pointermove", (e) => {
  if (draggingSquare) updateFromSquarePointer(e);
});
slSquare.addEventListener("pointerup", () => {
  draggingSquare = false;
  commitPickerColor();
});

hueSlider.addEventListener("input", () => {
  picker.hue = Number(hueSlider.value);
  renderPicker();
});
hueSlider.addEventListener("change", commitPickerColor);

hexInput.addEventListener("change", () => {
  const rgb = hexToRgb(hexInput.value);
  if (!rgb) {
    renderPicker();
    return;
  }
  const [h, s, v] = rgbToHsv(...rgb);
  picker.hue = h;
  picker.sat = s;
  picker.val = v;
  commitPickerColor();
});

colorModalClose.addEventListener("click", () => {
  colorModal.hidden = true;
});
colorModal.addEventListener("click", (e) => {
  if (e.target === colorModal) colorModal.hidden = true;
});

// Injected into the page via chrome.scripting.executeScript — must be fully
// self-contained (no closures over popup.js variables).
function removeHighlightOnPage(highlightKey) {
  try {
    const name = `snip-it-${highlightKey}`;
    if (window.CSS && CSS.highlights && CSS.highlights.has(name)) {
      CSS.highlights.delete(name);
    }
  } catch {
    // Custom Highlight API unavailable on this page — nothing to clean up.
  }
}

async function removeLiveHighlight(note) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !note.url || tab.url !== note.url) return;
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: removeHighlightOnPage,
      args: [`note-${note.id}`],
    });
  } catch {
    // No matching active tab, or the page blocks injection.
  }
}

function openAndHighlightNote(note) {
  chrome.tabs.create({ url: note.url, active: true }, (tab) => {
    if (!tab?.id) return;
    const color = note.highlightColor || "#ffeb3b";
    const listener = (tabId, changeInfo) => {
      if (tabId !== tab.id || changeInfo.status !== "complete") return;
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          func: updateOrCreateHighlight,
          args: [note.text, color, `note-${note.id}`],
        })
        .catch(() => {});
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
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
    const article = node.querySelector(".note");
    if (note.highlightColor) {
      article.style.setProperty("--note-color", note.highlightColor);
    }
    const textEl = node.querySelector(".note-text");
    textEl.textContent = note.text;
    textEl.classList.add("clamped");

    const expandBtn = node.querySelector(".expand-btn");
    expandBtn.textContent = "▾";
    expandBtn.addEventListener("click", () => {
      const clamped = textEl.classList.toggle("clamped");
      expandBtn.textContent = clamped ? "▾" : "▴";
    });

    const sourceEl = node.querySelector(".note-source");
    if (note.url) {
      sourceEl.textContent = note.title || hostname(note.url);
      sourceEl.href = note.url;
      sourceEl.addEventListener("click", (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        openAndHighlightNote(note);
      });
    } else {
      sourceEl.remove();
    }

    node.querySelector(".note-date").textContent = formatDate(note.createdAt);

    const colorBtn = node.querySelector(".color-btn");
    colorBtn.title = t("colorTitle", lang);
    colorBtn.addEventListener("click", () => openColorPicker(note, article));

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
      removeLiveHighlight(note);
    });

    listEl.appendChild(node);

    if (textEl.scrollHeight > textEl.clientHeight + 1) {
      expandBtn.hidden = false;
    }
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
  const { language, highlightPresets: presets } = await chrome.storage.sync.get({
    language: DEFAULT_LANGUAGE,
    highlightPresets,
  });
  lang = language;
  highlightPresets = presets;
  applyI18n(document, lang);

  const { notes = [] } = await chrome.storage.local.get("notes");
  allNotes = notes;
  applyFilter();
}

searchEl.addEventListener("input", applyFilter);

document.getElementById("optionsBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("expandBtn")?.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("fullview.html") });
});

document.getElementById("syncBtn").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  if (btn.disabled) return;
  btn.disabled = true;
  btn.textContent = "⏳";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const matching = tab?.url ? allNotes.filter((n) => n.url === tab.url) : [];

    if (tab?.id) {
      for (const note of matching) {
        await chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: updateOrCreateHighlight,
            args: [note.text, note.highlightColor || "#ffeb3b", `note-${note.id}`],
          })
          .catch(() => {});
      }
    }
  } finally {
    btn.textContent = "✅";
    setTimeout(() => {
      btn.textContent = "🔄";
      btn.disabled = false;
    }, 1200);
  }
});

document.getElementById("clearBtn").addEventListener("click", async () => {
  if (allNotes.length === 0) return;
  if (!confirm(t("confirmClearAll", lang))) return;
  const cleared = allNotes;
  allNotes = [];
  await chrome.storage.local.set({ notes: [] });
  applyFilter();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      for (const note of cleared) {
        if (note.url === tab.url) {
          await chrome.scripting
            .executeScript({
              target: { tabId: tab.id },
              func: removeHighlightOnPage,
              args: [`note-${note.id}`],
            })
            .catch(() => {});
        }
      }
    }
  } catch {
    // No matching active tab.
  }
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
