// =======================================
// INFOS NAUTIQUES - VERSION MINI & COMPACTE
// js/marees.js — Gain de place maximal
// =======================================

function calculerEtAfficherMarees(carte) {
    // 1. On cherche le conteneur principal
    let conteneur = carte.querySelector(".carte-body") || carte;
    if (!conteneur) return;

    // 2. On réduit drastiquement les marges de l'encart parent pour l'aplatir
    carte.style.padding = "8px 12px";
    carte.style.minHeight = "auto"; 
    if (carte.parentElement) {
        carte.parentElement.style.height = "auto";
    }

    // 3. Récupération du nom de la ville
    let nomVille = "votre port";
    const elVille = document.getElementById("nomVille");
    if (elVille) {
        nomVille = elVille.textContent.replace("📍 ", "").trim();
    }

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
    const numPort = correspondancePorts[nomNormalise] || "19";

    // 4. Rendu ultra-compact : Tout sur une seule ligne horizontale
    conteneur.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 10px; padding: 5px 0; box-sizing: border-box;">
            <span style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.6);">
                Marées de <strong>${nomVille}</strong>
            </span>
            <a href="https://maree.info/${numPort}" target="_blank" style="font-size: 0.8rem; color: #38bdf8; text-decoration: none; font-weight: 500; background: rgba(56, 189, 248, 0.1); padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.2); white-space: nowrap;">
                Maree.info ↗
            </a>
        </div>
    `;
}
