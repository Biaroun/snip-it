const DEFAULT_LANGUAGE = "en";

const MESSAGES = {
  en: {
    contextMenuTitle: 'Save "%s" as note',
    searchPlaceholder: "Search notes…",
    emptyState:
      'No notes yet. Select text on a page, right-click → "Save as note".',
    emptyStateSearch: "No results for this search.",
    exportBtn: "Export as Markdown",
    clearBtn: "Clear all",
    copyTitle: "Copy",
    deleteTitle: "Delete",
    colorTitle: "Change highlight color",
    noHighlightTitle: "No highlight",
    colorEditorLabel: "Note color",
    colorEditorHint: "Closes automatically once you confirm a color.",
    syncTitle: "Re-highlight this page's notes",
    expandTitle: "Open full view",
    optionsTitle: "Options",
    noteCount_one: "{count} note",
    noteCount_other: "{count} notes",
    confirmClearAll: "Delete all notes?",

    optionsHeading: "Snip It",
    languageLabel: "Language",
    languageHint: "Choose the display language for the popup and menus.",
    includeSourceLabel: "Include source",
    includeSourceHint:
      "Saves the page title and URL together with each note.",
    notifyLabel: "Save confirmation",
    notifyHint:
      "Shows a small ✓ badge on the icon whenever a note is saved.",
    highlightLabel: "Highlight saved text",
    highlightHint:
      "Highlights the selected text on the page when you save a note.",
    highlightColorLabel: "Default highlight color",
    presetsLabel: "Preset colors",
    presetsHint: "Quick-pick colors shown in each note's color picker.",
    allNotesLabel: "All notes",
    noteCountHint_one: "{count} note stored locally",
    noteCountHint_other: "{count} notes stored locally",
    clearAllBtn: "Clear all",
    confirmClearAllPermanent:
      "Permanently delete all saved notes?",
    savedMsg: "Preferences saved ✓",
  },
  fr: {
    contextMenuTitle: 'Sauvegarder "%s" comme note',
    searchPlaceholder: "Rechercher dans les notes…",
    emptyState:
      "Aucune note pour l'instant. Sélectionne du texte sur une page, clic droit → « Sauvegarder comme note ».",
    emptyStateSearch: "Aucun résultat pour cette recherche.",
    exportBtn: "Exporter en Markdown",
    clearBtn: "Tout effacer",
    copyTitle: "Copier",
    deleteTitle: "Supprimer",
    colorTitle: "Changer la couleur du surlignage",
    noHighlightTitle: "Aucun surlignage",
    colorEditorLabel: "Couleur de la note",
    colorEditorHint: "Se ferme automatiquement une fois la couleur confirmée.",
    syncTitle: "Resurligner les notes de cette page",
    expandTitle: "Ouvrir en grand",
    optionsTitle: "Options",
    noteCount_one: "{count} note",
    noteCount_other: "{count} notes",
    confirmClearAll: "Supprimer toutes les notes ?",

    optionsHeading: "Snip It",
    languageLabel: "Langue",
    languageHint: "Choisis la langue d'affichage du popup et des menus.",
    includeSourceLabel: "Inclure la source",
    includeSourceHint:
      "Enregistre le titre et l'URL de la page avec chaque note.",
    notifyLabel: "Notification de sauvegarde",
    notifyHint:
      "Affiche un petit badge ✓ sur l'icône quand une note est enregistrée.",
    highlightLabel: "Surligner le texte sauvegardé",
    highlightHint:
      "Surligne le texte sélectionné sur la page quand tu sauvegardes une note.",
    highlightColorLabel: "Couleur de surlignage par défaut",
    presetsLabel: "Couleurs prédéfinies",
    presetsHint: "Couleurs rapides proposées dans le sélecteur de couleur de chaque note.",
    allNotesLabel: "Toutes les notes",
    noteCountHint_one: "{count} note stockée localement",
    noteCountHint_other: "{count} notes stockées localement",
    clearAllBtn: "Tout effacer",
    confirmClearAllPermanent:
      "Supprimer définitivement toutes les notes sauvegardées ?",
    savedMsg: "Préférences enregistrées ✓",
  },
};

function t(key, lang, vars) {
  const dict = MESSAGES[lang] || MESSAGES[DEFAULT_LANGUAGE];
  let str = dict[key] ?? MESSAGES[DEFAULT_LANGUAGE][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}

function tPlural(baseKey, count, lang, vars = {}) {
  const key = `${baseKey}_${count === 1 ? "one" : "other"}`;
  return t(key, lang, { count, ...vars });
}

function applyI18n(root, lang) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"), lang);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"), lang);
  });
  root.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.getAttribute("data-i18n-title"), lang);
  });
}
