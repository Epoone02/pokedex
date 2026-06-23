# Pokédex Communal — README

## Structure du projet

```
pokedex/
├── index.html
├── style.css
├── app.js
├── README.md
└── model/              ← TU DOIS CRÉER CE DOSSIER
    ├── model.json      ← exporté depuis Teachable Machine
    ├── metadata.json   ← exporté depuis Teachable Machine
    └── weights.bin     ← exporté depuis Teachable Machine
```

## Étapes pour faire marcher la reconnaissance

### 1. Entraîner le modèle sur Teachable Machine
- Va sur https://teachablemachine.withgoogle.com
- "Image Project" → "Standard image model"
- Crée une classe par lieu avec le même nom que les clés dans `database` dans app.js :
  - `mairie`
  - `eglise`
  - `parc`
- Prends minimum 30 photos par classe dans les vraies conditions (lumière, distance, angle)
- Clique "Train Model"
- Clique "Export Model" → onglet "Tensorflow.js" → **"Download"** (pas Upload !)
- Tu récupères un fichier ZIP

### 2. Mettre les fichiers dans le projet
- Extrais le ZIP
- Copie les 3 fichiers (`model.json`, `metadata.json`, `weights.bin`) dans le dossier `./model/`

### 3. Lancer avec Live Server (obligatoire)
- Ouvre le dossier dans VS Code
- Lance Live Server (clic droit sur index.html → "Open with Live Server")
- L'app s'ouvre sur http://127.0.0.1:5500

**Ne pas ouvrir index.html directement dans le navigateur** (erreur CORS)

## Adapter le projet à ta commune

Dans `app.js`, modifie la variable `database` :
- Les **clés** (`"mairie"`, `"eglise"`, `"parc"`) doivent correspondre exactement
  aux noms de classes Teachable Machine (en minuscules)
- Les champs `title` et `desc` sont ce qui s'affiche dans la popup

Tu peux changer `SEUIL_CONFIANCE` (ligne ~22) :
- `0.85` = 85% de certitude requise (recommandé)
- Baisse à `0.70` si ça ne détecte pas assez souvent
- Monte à `0.90` pour éviter les faux positifs
