// =======================================
// INFOS NAUTIQUES - VERSION DE SECOURS FIXE
// js/marees.js — Sécurité Maximale & Anti-Plantage
// =======================================

function calculerEtAfficherMarees(carte) {
    // 1. Recherche du conteneur dans l'encart Marée (on teste le body ou la carte elle-même)
    let conteneur = carte.querySelector(".carte-body") || carte;
    if (!conteneur) return;

    // 2. Récupération sécurisée du nom de la ville
    let nomVille = "votre port";
    const elVille = document.getElementById("nomVille");
    if (elVille) {
        nomVille = elVille.textContent.replace("📍 ", "").trim();
    }

    // 3. Correspondance des codes ports pour maree.info
    const correspondancePorts = {
        "le havre": "19",
        "étretat": "17",
        "fécamp": "16",
        "saint-valery-en-caux": "15",
        "saint valery en caux": "15",
        "dieppe": "14",
        "le tréport": "12"
    };

    const nomNormalise = nomVille.toLowerCase().trim();
    const numPort = correspondancePorts[nomNormalise] || "19"; // Le Havre par défaut si inconnu

    // 4. Injection immédiate du HTML sans risque de blocage
    conteneur.innerHTML = `
        <div style="width:100%; padding: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box;">
            <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin: 0 0 15px 0; text-align: center;">
                Consultez les horaires officiels pour le port de <strong>${nomVille}</strong>.
            </p>
            <a href="https://maree.info/${numPort}" target="_blank" style="display: inline-block; font-size: 0.85rem; color: #38bdf8; text-decoration: none; font-weight: 500; border: 1px solid rgba(56, 189, 248, 0.3); padding: 8px 16px; border-radius: 6px; background: rgba(56, 189, 248, 0.05);">
                Ouvrir Maree.info (Port ${numPort}) ↗
            </a>
        </div>
    `;
}
