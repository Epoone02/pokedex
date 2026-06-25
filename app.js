// ============================================================================
// 📊 BASE DE DONNÉES DES ŒUVRES (FACILE À MODIFIER)
// Pour ajouter un dessin d'enfant, recopie le bloc entre accolades { } 
// et veille à ce que la clé (ex: "chat_pixel") corresponde EXACTEMENT au nom
// de la classe configurée lors de l'entraînement dans Teachable Machine.
// ============================================================================
const database = {
    "sujet1": {
        title: "crane ",
        desc: "crane un peu moche c'est un test",
        avatar: "image/crane.jpg",         // L'émoji ou icône affiché sur la carte verrouillée/déverrouillée
        author: "jsp qui",        // Prénom de l'enfant
        classLevel: "chepa au pif",    // Sa classe
        date: "une anné"      // Date de création du dessin
    },
    "sujet2": {
        title: "Stitch ",
        desc: "Statut de stitch peinte oep tjr un test",
        avatar: "image/stitch.jpg",
        author: "un boug random",
        classLevel: "lezzzgoo",
        date: "uneeeee annnééé"
    },
        "sujet3": {
            title: "Bulbizarreee",
            desc: "un pokemon mon garssss WOWOWOWWOO",
            avatar: "image/bulbizare.jpg",
            author: "je sais tjr pas",
            classLevel: "j'aimerais savoir",
            date: "we are ch.... NAAAANN"
    },
        "sujet4": {
            title: "premier pixel",
            desc: "i did it bro",
            avatar: "image/bulbizare.jpg",
            author: "Moi le goat",
            classLevel: "ecole inge",
            date: "25/06/2026"
    }

};

// ============================================================================
// ⚙️ PARAMÈTRES TECHNIQUES
// ============================================================================
// Seuil de confiance (0.85 = l'IA doit être sûre à 85% avant de valider le scan)
const SEUIL_CONFIANCE = 0.85;

// Chemin vers les fichiers de ton IA (laissés en relatif pour GitHub)
const MODEL_PATH = "https://epoone02.github.io/Albert-Camus-carnet-decouverte/model/"; 

// Variables globales de l'application
let model = null;          // Contiendra le modèle IA chargé
let webcamStream = null;   // Contiendra le flux vidéo de la caméra
let predictionLoop = null; // Contiendra la boucle de rafraîchissement du scanner

// ============================================================================
// 🏁 DEMARRAGE ET INITIALISATION
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    generateGrid();     // 1. Crée les cartes visuelles dans la page
    checkSavedItems();  // 2. Vérifie la mémoire pour débloquer celles déjà trouvées
});

// Génère automatiquement les cartes HTML à partir de la database ci-dessus
function generateGrid() {
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = ''; // Nettoie la grille
    
    // Met à jour le nombre total d'œuvres existantes dans le compteur
    document.getElementById('total-count').innerText = Object.keys(database).length;

    // Crée une carte HTML pour chaque ligne de la database
    for (const [id, data] of Object.entries(database)) {
        const card = document.createElement('div');
        card.className = 'card locked'; // Verrouillée par défaut (grisée)
        card.id = `item-${id}`;
        card.innerHTML = `
            <img src="${data.avatar}" alt="Icône" class="custom-avatar">
            <h3>${data.title}</h3>
            <span class="status">Inconnu</span>
        `;
        grid.appendChild(card);
    }
}

// Parcourt la mémoire locale du téléphone pour déverrouiller les dessins trouvés
function checkSavedItems() {
    let count = 0;
    Object.keys(database).forEach(id => {
        // Nouvelle clé neutre pour éviter les conflits et références à nintendo
        if (localStorage.getItem("art_scanned_" + id) === "true") {
            unlockCard(id);
            count++;
        }
    });
    // Met à jour le score (ex: 2 / 3)
    document.getElementById('captured-count').innerText = count;
}

// Active visuellement une carte trouvée et la rend interactive
function unlockCard(id) {
    const card = document.getElementById(`item-${id}`);
    if (!card) return;
    
    card.classList.remove('locked'); // Enlève le filtre gris
    card.querySelector('.status').innerText = "Découvert !";
    card.querySelector('.status').style.background = "#2ecc71"; // Vert
    
    // ACTION : Rendre la carte cliquable pour réafficher sa description complète
    card.onclick = () => showPopup(id, true); // true = mode consultation
    card.style.cursor = "pointer";
}

// ============================================================================
// 📷 GESTION DU SCANNER CAMÉRA
// ============================================================================

// Clic sur le gros bouton d'activation du scanner
document.getElementById('btn-scan').addEventListener('click', async () => {
    document.getElementById('pokedex-screen').classList.add('hidden');
    document.getElementById('scanner-screen').classList.remove('hidden');
    await startScanner();
});

// Lance la caméra arrière du smartphone et charge le modèle TensorFlow
async function startScanner() {
    setStatus("Démarrage de la caméra...");
    try {
        // Demande l'accès à la caméra arrière (environment)
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        document.getElementById('webcam').srcObject = webcamStream;
    } catch (err) {
        setStatus("❌ Erreur caméra : " + err.message);
        return;
    }

    // Charge le modèle d'Intelligence Artificielle s'il n'est pas déjà en mémoire
    if (!model) {
        setStatus("Chargement de l'IA...");
        try {
            model = await tmImage.load(MODEL_PATH + "model.json", MODEL_PATH + "metadata.json");
            setStatus("✅ Pointe vers une œuvre !");
        } catch (err) {
            setStatus("❌ Erreur de chargement du modèle IA");
            return;
        }
    } else {
        setStatus("✅ Pointe vers une œuvre !");
    }

    // Lance l'analyse d'image toutes les 500ms (2 fois par seconde)
    predictionLoop = setInterval(predict, 500);
}

// Analyse ce que voit la caméra
async function predict() {
    const video = document.getElementById('webcam');
    if (!model || video.readyState < 2) return;

    const predictions = await model.predict(video);
    // Trouve la prédiction ayant le plus haut pourcentage de certitude
    const best = predictions.reduce((a, b) => a.probability > b.probability ? a : b);

    // Si l'IA est sûre d'elle (ex: > 85%)
    if (best.probability >= SEUIL_CONFIANCE) {
        // Nettoie l'identifiant (retire les majuscules, espaces et accents au cas où)
        let id = best.className.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_"); 
        if (!database[id]) id = best.className.toLowerCase().trim();

        // Si l'objet identifié fait bien partie de notre base de données
        if (database[id]) {
            const isAlreadyCaptured = localStorage.getItem("art_scanned_" + id) === "true";
            
            if (isAlreadyCaptured) {
                // DOUBLON : On ne stoppe pas le scanner, on prévient juste poliment l'utilisateur
                setStatus("⭐ Déjà découvert : " + database[id].title);
            } else {
                // NOUVEAUTÉ : On coupe la caméra et on ouvre le pop-up de célébration
                stopScanner();
                showPopup(id, false); // false = mode nouvelle découverte
            }
        }
    } else {
        setStatus("✅ Pointe vers une œuvre !");
    }
}

// Met à jour la petite ligne de texte d'état sous la caméra
function setStatus(msg) {
    document.getElementById('scan-status').innerText = msg;
}

// Éteint proprement la caméra et nettoie la boucle pour économiser la batterie
function stopScanner() {
    clearInterval(predictionLoop);
    predictionLoop = null;
    if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
        webcamStream = null;
    }
    document.getElementById('webcam').srcObject = null;
}

// Bouton Annuler du scanner
document.getElementById('btn-close-scan').addEventListener('click', () => {
    stopScanner();
    document.getElementById('scanner-screen').classList.add('hidden');
    document.getElementById('pokedex-screen').classList.remove('hidden');
});

// ============================================================================
// 📜 AFFICHAGE DES DESCRIPTIONS (POP-UP)
// ============================================================================

// Remplit et affiche la fiche descriptive de l'objet
function showPopup(id, isConsultation) {
    const data = database[id];
    
    // Injecte les informations dans le HTML
    document.getElementById('popup-title').innerText = data.title;
    document.getElementById('popup-author').innerText = data.author;
    document.getElementById('popup-class').innerText = data.classLevel;
    document.getElementById('popup-date').innerText = data.date;
    document.getElementById('popup-desc').innerText = data.desc;

    const badge = document.getElementById('popup-badge');
    const btnClose = document.getElementById('btn-close-popup');

    if (isConsultation) {
        // Mode consultation : on cache le badge "Nouveau" et on adapte le bouton
        badge.style.display = "none";
        btnClose.innerText = "Fermer la fiche";
    } else {
        // Mode nouvelle découverte : on sauvegarde dans le téléphone et on affiche le badge brillant
        localStorage.setItem("art_scanned_" + id, "true");
        badge.style.display = "inline-block";
        btnClose.innerText = "Ajouter à ma collection";
    }

    // Affiche la fenêtre pop-up au premier plan
    document.getElementById('scanner-screen').classList.add('hidden');
    document.getElementById('popup-screen').classList.remove('hidden');
}

// Fermeture de la pop-up
document.getElementById('btn-close-popup').addEventListener('click', () => {
    document.getElementById('popup-screen').classList.add('hidden');
    document.getElementById('pokedex-screen').classList.remove('hidden');
    checkSavedItems(); // Actualise l'affichage global
});

// ============================================================================
// 🔄 RÉINITIALISATION DE LA SAUVEGARDE
// ============================================================================
document.getElementById('btn-reset').addEventListener('click', () => {
    // SÉCURITÉ : Fenêtre d'alerte pour demander confirmation à l'utilisateur
    if (confirm("Voulez-vous vraiment effacer toute votre collection et recommencer à zéro ?")) {
        Object.keys(database).forEach(id => {
            localStorage.removeItem("art_scanned_" + id);
            const card = document.getElementById(`item-${id}`);
            if (card) {
                card.classList.add('locked');
                card.querySelector('.status').innerText = "Inconnu";
                card.querySelector('.status').style.background = "#444";
                card.onclick = null; // Retire l'action de clic
                card.style.cursor = "default";
            }
        });
        document.getElementById('captured-count').innerText = "0";
    }
});