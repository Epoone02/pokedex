// ============================================================
// CONFIGURATION — adapte ici tes lieux et personnages
// Les noms de classes DOIVENT correspondre exactement à ceux
// de Teachable Machine (minuscules, sans espaces ni accents de préférence)
// ============================================================
const database = {
    "mairie": {
        title: "crane",
        desc: " c'est un test la team mais ça scan bien le crane",
        avatar: "🏛️"
    },
    "eglise": {
        title: "Stitch",
        desc: "une creature de film disney guez de fou en vrai",
        avatar: "⛪"
    },
    "parc": {
        title: "BULBIZAR",
        desc: "c'est un POKEMON WOWOWOWOWWOOW.",
        avatar: "🌳"
    },
    // Exemple de nouveau personnage ajouté facilement :

};

const SEUIL_CONFIANCE = 0.85;
const MODEL_PATH = "./model/";

// ============================================================

let model = null;
let webcamStream = null;
let predictionLoop = null;
let detectedId = null;

// Au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    generateGrid(); // 1. On génère les cartes automatiquement
    checkSavedItems(); // 2. On vérifie celles qui sont débloquées
});

// Génère les cartes HTML en fonction de la database
function generateGrid() {
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = ''; // Vide la grille
    
    const totalItems = Object.keys(database).length;
    document.getElementById('total-count').innerText = totalItems;

    for (const [id, data] of Object.entries(database)) {
        const card = document.createElement('div');
        card.className = 'card locked';
        card.id = `item-${id}`;
        card.innerHTML = `
            <div class="pixel-avatar">${data.avatar}</div>
            <h3>${data.title}</h3>
            <span class="status">Inconnu</span>
        `;
        grid.appendChild(card);
    }
}

// Vérifie et affiche les items déjà débloqués
function checkSavedItems() {
    let count = 0;
    Object.keys(database).forEach(id => {
        if (localStorage.getItem("collection_" + id) === "true") {
            unlockCard(id);
            count++;
        }
    });
    document.getElementById('captured-count').innerText = count;
}

function unlockCard(id) {
    const card = document.getElementById(`item-${id}`);
    if (!card) return;
    card.classList.remove('locked');
    card.querySelector('.status').innerText = "Débloqué !";
    card.querySelector('.status').style.background = "#2ecc71";
}

// ============================================================
// SCANNER
// ============================================================

document.getElementById('btn-scan').addEventListener('click', async () => {
    document.getElementById('pokedex-screen').classList.add('hidden');
    document.getElementById('scanner-screen').classList.remove('hidden');
    await startScanner();
});

async function startScanner() {
    setStatus("Démarrage de la caméra...");

    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } }
        });
        document.getElementById('webcam').srcObject = webcamStream;
    } catch (err) {
        setStatus("❌ Erreur caméra : " + err.message);
        return;
    }

    if (!model) {
        setStatus("Chargement de l'IA locale...");
        try {
            model = await tmImage.load(MODEL_PATH + "model.json", MODEL_PATH + "metadata.json");
            setStatus("✅ IA chargée — pointe vers un Pixel Art !");
        } catch (err) {
            setStatus("❌ Modèle introuvable. Vérifie le dossier ./model/");
            console.error(err);
            return;
        }
    } else {
        setStatus("✅ Pointe vers un Pixel Art !");
    }

    predictionLoop = setInterval(predict, 500);
}

async function predict() {
    const video = document.getElementById('webcam');
    if (!model || video.readyState < 2) return;

    const predictions = await model.predict(video);
    
    // Cherche la prédiction la plus haute
    const best = predictions.reduce((a, b) => a.probability > b.probability ? a : b);

    if (best.probability >= SEUIL_CONFIANCE) {
        // Normalise le nom de la classe
        let id = best.className.toLowerCase().trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
            .replace(/\s+/g, "_"); 

        // Si l'ID normalisé n'existe pas, on tente l'ID brut
        if (!database[id]) {
            id = best.className.toLowerCase().trim();
        }

        // Si l'objet reconnu est bien dans notre base de données
        if (database[id]) {
            // On vérifie si l'utilisateur l'a DÉJÀ débloqué
            const isAlreadyCaptured = localStorage.getItem("collection_" + id) === "true";

            if (isAlreadyCaptured) {
                // L'objet est déjà connu : on ne stoppe PAS le scanner, on change juste le texte
                setStatus("⭐ Déjà capturé : " + database[id].title);
            } else {
                // C'est une NOUVELLE découverte ! On stoppe tout et on affiche le popup
                stopScanner();
                detectedId = id;
                showPopup(id);
            }
        }
    } else {
        // Si la certitude redescend en dessous de 85%, on remet le texte par défaut
        setStatus("✅ Pointe vers une œuvre !");
    }
}

function setStatus(msg) {
    document.getElementById('scan-status').innerText = msg;
}

function stopScanner() {
    clearInterval(predictionLoop);
    predictionLoop = null;
    if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
        webcamStream = null;
    }
    document.getElementById('webcam').srcObject = null;
}

document.getElementById('btn-close-scan').addEventListener('click', () => {
    stopScanner();
    document.getElementById('scanner-screen').classList.add('hidden');
    document.getElementById('pokedex-screen').classList.remove('hidden');
});

// ============================================================
// POPUP
// ============================================================

function showPopup(id) {
    localStorage.setItem("pokedex_" + id, "true");
    document.getElementById('popup-title').innerText = database[id].title;
    document.getElementById('popup-desc').innerText = database[id].desc;
    document.getElementById('scanner-screen').classList.add('hidden');
    document.getElementById('popup-screen').classList.remove('hidden');
}

document.getElementById('btn-close-popup').addEventListener('click', () => {
    document.getElementById('popup-screen').classList.add('hidden');
    document.getElementById('pokedex-screen').classList.remove('hidden');
    checkSavedItems();
});

// ============================================================
// RESET
// ============================================================

document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm("Voulez-vous effacer votre progression et vider le Pokédex ?")) {
        Object.keys(database).forEach(id => {
            localStorage.removeItem("pokedex_" + id);
            const card = document.getElementById(`item-${id}`);
            if (card) {
                card.classList.add('locked');
                card.querySelector('.status').innerText = "Inconnu";
                card.querySelector('.status').style.background = "#444";
            }
        });
        document.getElementById('captured-count').innerText = "0";
    }
});