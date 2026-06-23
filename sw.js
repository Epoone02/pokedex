// Installation du Service Worker
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installation ok');
});

// Intercepte les requêtes (obligatoire pour une PWA, même si on ne fait rien de spécial ici)
self.addEventListener('fetch', (e) => {
    // Laisse passer les requêtes internet normalement
});