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
