// =======================================
// INFOS NAUTIQUES - VERSION MINI INTELIGENTE
// js/marees.js — Gestion Seine & Gain de place
// =======================================

async function calculerEtAfficherMarees(carte) {
    // 1. Recherche du conteneur principal
    let conteneur = carte.querySelector(".carte-body") || carte;
    if (!conteneur) return;

    // 2. Ajustement des marges pour aplatir l'encart
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

    try {
        // 4. Vérification de la catégorie dans villes.json
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom.trim().toLowerCase() === nomVille.toLowerCase());

        // Cas Spécifique : Villes en Seine
        if (vActuelle && vActuelle.categorie === "Seine") {
            conteneur.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 5px 0; box-sizing: border-box;">
                    <span style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.6);">
                        Marées de <strong>${nomVille}</strong>
                    </span>
                    <span style="font-size: 0.8rem; color: #94a3b8; font-style: italic; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 4px; white-space: nowrap;">
                        Zone fluviale — Non dispo.
                    </span>
                </div>
            `;
            return;
        }

        // 5. Correspondance des codes pour les ports maritimes
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
        const numPort = correspondancePorts[nomNormalise];

        if (!numPort) {
            // Si le port maritime n'est pas configuré dans la liste
            conteneur.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 5px 0; box-sizing: border-box;">
                    <span style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.6);">
                        Marées de <strong>${nomVille}</strong>
                    </span>
                    <span style="font-size: 0.8rem; color: #94a3b8; font-style: italic; padding: 4px 10px;">
                        Non configuré
                    </span>
                </div>
            `;
            return;
        }

        // Rendu Maritime Standard
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

    } catch (e) {
        // Sécurité en cas de micro-coupure sur la lecture du JSON
        conteneur.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 5px 0; box-sizing: border-box;">
                <span style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.6);">
                    Marées de <strong>${nomVille}</strong>
                </span>
                <span style="font-size: 0.8rem; color: #f87171; font-style: italic;">
                    Erreur d'affichage
                </span>
            </div>
        `;
    }
}
