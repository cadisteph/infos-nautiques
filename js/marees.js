// =======================================
// INFOS NAUTIQUES - RENDER IMAGES SÉCURISÉ
// js/marees.js — Affichage Garanti Multi-Villes
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, argumentInutile) {
    const body = carte.querySelector(".carte-body");
    if (!body) return;

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Récupération de la ville actuelle
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom.trim().toLowerCase() === nomVilleAffiche.toLowerCase());

        if (!vActuelle) throw new Error(`Ville "${nomVilleAffiche}" introuvable`);

        // Sécurité Zone Fluviale
        if (vActuelle.categorie === "Seine") {
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Zone fluviale — données de marée non disponibles</p>`;
            return;
        }

        // 2. Dictionnaire de correspondance des ports officiels
        const correspondancePorts = {
            "le havre": "19",
            "étretat": "17",
            "fécamp": "16",
            "saint-valery-en-caux": "15",
            "saint valery en caux": "15",
            "dieppe": "14",
            "le tréport": "12"
        };

        const nomNormalise = vActuelle.nom.toLowerCase().trim();
        const numPort = correspondancePorts[nomNormalise];

        if (!numPort) {
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Port non configuré</p>`;
            return;
        }

        // 3. Construction de l'URL de l'image via le Proxy CORS pour contourner le blocage (Anti-Hotlinking)
        const urlImageOriginale = `https://maree.info/pub/today-${numPort}.png`;
        const urlImageProxifiee = `https://corsproxy.io/?${encodeURIComponent(urlImageOriginale)}`;

        // 4. Rendu HTML de l'espace avec l'image convertie en mode sombre
        body.innerHTML = `
            <div style="width:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 5px 0;">
                <div style="width:100%; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:0.8rem; color:rgba(255,255,255,0.4);">
                    <span style="background:#0284c7; color:#ffffff; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:0.75rem;">Officiel SHOM</span>
                    <span>Port ${numPort}</span>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: center; align-items: center; width: 100%; min-height: 110px;">
                    <img src="${urlImageProxifiee}" 
                         alt="Marées pour ${vActuelle.nom}" 
                         style="filter: invert(0.95) hue-rotate(180deg) brightness(1.3) contrast(1.1); max-width: 100%; height: auto; object-fit: contain;"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<p style=\'color:#94a3b8; font-size:0.8rem; font-style:italic;\'>Aperçu indisponible — Cliquez sur le lien ci-dessous</p>';" />
                </div>
                
                <a href="https://maree.info/${numPort}" target="_blank" style="margin-top:12px; font-size:0.75rem; color:#38bdf8; text-decoration:none; font-weight:500; hover:text-decoration:underline;">
                    Voir le calendrier complet sur Maree.info ↗
                </a>
            </div>
        `;

    } catch (error) {
        body.innerHTML = `<div style="width:100%; text-align:center; padding:10px;"><p style="color:#f87171; font-weight:bold;">❌ Liaison marée interrompue</p></div>`;
    }
}
