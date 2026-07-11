// =======================================
// INFOS NAUTIQUES - LIEN DE SECOURS FIABLE
// js/marees.js — Version Stable & Sécurisée
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, argumentInutile) {
    const body = carte.querySelector(".carte-body");
    if (!body) return;

    // Récupération propre du nom de la ville
    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    // Dictionnaire de correspondance des ports officiels
    const correspondancePorts = {
        "le havre": "19",
        "étretat": "17",
        "fécamp": "16",
        "saint-valery-en-caux": "15",
        "saint valery en caux": "15",
        "dieppe": "14",
        "le tréport": "12"
    };

    const nomNormalise = nomVilleAffiche.toLowerCase().trim();
    const numPort = correspondancePorts[nomNormalise] || "19"; // Le Havre par défaut si non trouvé

    // Rendu visuel propre, stable, avec ton lien opérationnel au centre
    body.innerHTML = `
        <div style="width:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 20px 0;">
            <div style="width:100%; display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; font-size:0.8rem; color:rgba(255,255,255,0.4);">
                <span style="background:#0284c7; color:#ffffff; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:0.75rem;">Officiel SHOM</span>
                <span>Port ${numPort}</span>
            </div>
            
            <!-- Message central propre qui remplace l'espace vide -->
            <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem; margin-bottom: 20px; text-align: center;">
                Consultez la grille officielle des marées pour <strong>${nomVilleAffiche}</strong>.
            </p>
            
            <!-- Ton lien opérationnel de fortune -->
            <a href="https://maree.info/${numPort}" target="_blank" style="font-size:0.85rem; color:#38bdf8; text-decoration:none; font-weight:500; border: 1px solid rgba(56,189,248,0.3); padding: 8px 16px; border-radius: 6px; background: rgba(56,189,248,0.05); transition: all 0.2s;">
                Voir le calendrier complet sur Maree.info ↗
            </a>
        </div>
    `;
}
