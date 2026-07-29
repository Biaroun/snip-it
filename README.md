# Snip It — Note Manager

Extension Chrome (Manifest V3) qui permet de sélectionner du texte sur n'importe
quelle page web, de le sauvegarder en un clic droit, puis de retrouver,
rechercher et exporter ses notes.

## Fonctionnalités

- **Capture rapide** : sélectionne du texte → clic droit → *"Sauvegarder comme note"*.
- **Popup** : liste des notes avec date, source (titre + lien vers la page d'origine),
  recherche instantanée, copie dans le presse-papiers, suppression.
- **Export Markdown** : télécharge toutes les notes sous forme de fichier `.md`.
- **Options** :
  - Inclure ou non le titre/URL de la source dans chaque note.
  - Afficher (ou non) une confirmation visuelle à la sauvegarde.
  - Effacer toutes les notes stockées.
- **100% local** : les notes sont stockées avec `chrome.storage.local`, aucune
  donnée n'est envoyée vers un serveur externe.

## Stack technique

- Manifest V3 (service worker, pas de background page persistante)
- JavaScript vanilla, sans framework ni dépendance
- `chrome.contextMenus`, `chrome.storage`, `chrome.downloads`

## Installation en local (mode développeur)

1. Ouvrir `chrome://extensions` dans Chrome.
2. Activer le **Mode développeur** (en haut à droite).
3. Cliquer sur **Charger l'extension non empaquetée**.
4. Sélectionner le dossier de ce projet.

## Structure du projet

```
manifest.json      # configuration de l'extension
background.js       # service worker : menu contextuel + sauvegarde des notes
popup.html/.js/.css # interface de la popup (liste, recherche, export)
options.html/.js/.css # page de préférences
icons/               # icônes de l'extension (16/32/48/128 px)
```

## Pistes d'évolution

- Synchronisation entre appareils via `chrome.storage.sync`
- Tags / catégories sur les notes
- Raccourci clavier pour ouvrir la popup directement
