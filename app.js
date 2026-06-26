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
            avatar: "image/pixelart.png",
            author: "Moi le goat",
            classLevel: "ecole inge",
            date: "25/06/2026"
    }

};
// Image par défaut quand l'œuvre n'est pas encore découverte (Point d'interrogation)
const UNKNOWN_IMG = "image/interrogation.png"

const SEUIL_CONFIANCE = 0.85;
const MODEL_PATH = "./model/"; 

let model = null;
let webcamStream = null;
let predictionLoop = null;

// ==========================================
// INITIALISATION
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    loadUsername();
    generateGrid();
    checkSavedItems();
});

// ==========================================
// GESTION DU NOM D'UTILISATEUR
// ==========================================
function loadUsername() {
    const savedName = localStorage.getItem("app_username") || "Explorateur";
    document.getElementById("app-title").innerText = "Carnet de " + savedName;
    document.getElementById("username-input").value = savedName;
}

document.getElementById("btn-save-name").addEventListener("click", () => {
    const newName = document.getElementById("username-input").value.trim() || "Explorateur";
    localStorage.setItem("app_username", newName);
    loadUsername();
    toggleSidebar(false);
});

// ==========================================
// MENU LATÉRAL (SIDEBAR)
// ==========================================
function toggleSidebar(show) {
    const sidebar = document.getElementById("sidebar");
    if (show) {
        sidebar.classList.remove("hidden");
    } else {
        sidebar.classList.add("hidden");
    }
}
document.getElementById("btn-menu").addEventListener("click", () => toggleSidebar(true));
document.getElementById("btn-close-menu").addEventListener("click", () => toggleSidebar(false));
document.getElementById("sidebar-overlay").addEventListener("click", () => toggleSidebar(false));

// ==========================================
// AFFICHAGE & PROGRESSION
// ==========================================
function generateGrid() {
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';
    document.getElementById('total-count').innerText = Object.keys(database).length;

    for (const [id, data] of Object.entries(database)) {
        const card = document.createElement('div');
        card.className = 'card locked';
        card.id = `item-${id}`;
        
        // Par défaut : Inconnu avec l'image mystère
        card.innerHTML = `
            <img src="${UNKNOWN_IMG}" class="pixel-avatar" alt="Inconnu">
            <h3>À découvrir</h3>
            <span class="status">Mystère</span>
        `;
        grid.appendChild(card);
    }
}

function checkSavedItems() {
    let count = 0;
    const total = Object.keys(database).length;

    Object.keys(database).forEach(id => {
        if (localStorage.getItem("art_scanned_" + id) === "true") {
            unlockCard(id);
            count++;
        }
    });
    
    // Mise à jour de la barre et du texte
    document.getElementById('captured-count').innerText = count;
    const progressPercent = total === 0 ? 0 : (count / total) * 100;
    document.getElementById('progress-bar').style.width = progressPercent + "%";

    // Vérification de la victoire
    if (count === total && total > 0 && sessionStorage.getItem("victory_shown") !== "true") {
        setTimeout(showVictory, 1000);
    }
}

function unlockCard(id) {
    const card = document.getElementById(`item-${id}`);
    const data = database[id];
    if (!card) return;
    
    card.classList.remove('locked');
    card.innerHTML = `
        <img src="${data.avatar}" class="pixel-avatar" alt="${data.title}" onerror="this.src='${UNKNOWN_IMG}'">
        <h3>${data.title}</h3>
        <span class="status unlocked">Consultable</span>
    `;
    
    card.onclick = () => openDetailView(id);
    card.style.cursor = "pointer";
}

// ==========================================
// VUE DÉTAIL PLEINE PAGE
// ==========================================
function openDetailView(id) {
    const data = database[id];
    document.getElementById("detail-img").src = data.avatar;
    document.getElementById("detail-title").innerText = data.title;
    document.getElementById("detail-author").innerText = data.author;
    document.getElementById("detail-class").innerText = data.classLevel;
    document.getElementById("detail-date").innerText = data.date;
    document.getElementById("detail-desc").innerText = data.desc;

    document.getElementById("pokedex-screen").classList.add("hidden");
    document.getElementById("detail-screen").classList.remove("hidden");
}

document.getElementById("btn-close-detail").addEventListener("click", () => {
    document.getElementById("detail-screen").classList.add("hidden");
    document.getElementById("pokedex-screen").classList.remove("hidden");
});

// ==========================================
// SCANNER CAMÉRA
// ==========================================
document.getElementById('btn-scan').addEventListener('click', async () => {
    document.getElementById('pokedex-screen').classList.add('hidden');
    document.getElementById('scanner-screen').classList.remove('hidden');
    await startScanner();
});

async function startScanner() {
    setStatus("Démarrage de la caméra...");
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        document.getElementById('webcam').srcObject = webcamStream;
    } catch (err) {
        setStatus("❌ Erreur caméra : " + err.message);
        return;
    }

    if (!model) {
        setStatus("Chargement de l'IA...");
        try {
            model = await tmImage.load(MODEL_PATH + "model.json", MODEL_PATH + "metadata.json");
            setStatus("✅ Pointe vers une œuvre !");
        } catch (err) {
            setStatus("❌ Erreur modèle");
            return;
        }
    } else {
        setStatus("✅ Pointe vers une œuvre !");
    }
    predictionLoop = setInterval(predict, 500);
}

async function predict() {
    const video = document.getElementById('webcam');
    if (!model || video.readyState < 2) return;

    const predictions = await model.predict(video);
    const best = predictions.reduce((a, b) => a.probability > b.probability ? a : b);

    if (best.probability >= SEUIL_CONFIANCE) {
        let id = best.className.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_"); 
        if (!database[id]) id = best.className.toLowerCase().trim();

        if (database[id]) {
            if (localStorage.getItem("art_scanned_" + id) === "true") {
                setStatus("⭐ Déjà découvert : " + database[id].title);
            } else {
                stopScanner();
                localStorage.setItem("art_scanned_" + id, "true");
                
                // Ferme le scanner, met à jour la progression et ouvre la fiche
                document.getElementById('scanner-screen').classList.add('hidden');
                checkSavedItems();
                openDetailView(id);
            }
        }
    } else {
        setStatus("✅ Pointe vers une œuvre !");
    }
}

function setStatus(msg) { document.getElementById('scan-status').innerText = msg; }

function stopScanner() {
    clearInterval(predictionLoop);
    if (webcamStream) { webcamStream.getTracks().forEach(t => t.stop()); }
}

document.getElementById('btn-close-scan').addEventListener('click', () => {
    stopScanner();
    document.getElementById('scanner-screen').classList.add('hidden');
    document.getElementById('pokedex-screen').classList.remove('hidden');
});

// ==========================================
// ÉCRAN DE VICTOIRE
// ==========================================
function showVictory() {
    sessionStorage.setItem("victory_shown", "true"); // Pour ne pas l'afficher en boucle
    const name = localStorage.getItem("app_username") || "Explorateur";
    document.getElementById("victory-message").innerText = `Félicitations ${name}, tu as découvert l'intégralité du patrimoine artistique !`;
    document.getElementById('pokedex-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.remove('hidden');
}

document.getElementById("btn-close-victory").addEventListener("click", () => {
    document.getElementById("victory-screen").classList.add("hidden");
    document.getElementById("pokedex-screen").classList.remove("hidden");
});

// ==========================================
// RÉINITIALISATION
// ==========================================
document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm("Voulez-vous vraiment effacer toute la collection ?")) {
        Object.keys(database).forEach(id => localStorage.removeItem("art_scanned_" + id));
        sessionStorage.removeItem("victory_shown");
        toggleSidebar(false);
        generateGrid();
        checkSavedItems();
    }
});