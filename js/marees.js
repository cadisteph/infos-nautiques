// =======================================
// INFOS NAUTIQUES - INTÉGRATION COMMUNE MAREE.INFO
// js/marees.js — Rendu Natif Garanti sans Scraping
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, argumentInutile) {
    const body = carte.querySelector(".carte-body");
    if (!body) return;

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Récupération des données de ta ville
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom.trim().toLowerCase() === nomVilleAffiche.toLowerCase());

        if (!vActuelle) throw new Error(`Ville "${nomVilleAffiche}" introuvable`);

        // Sécurité Zone Fluviale
        if (vActuelle.categorie === "Seine") {
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Zone fluviale — données de marée non disponibles</p>`;
            return;
        }

        // 2. Ton dictionnaire exact de ports
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
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Port non listé sur maree.info</p>`;
            return;
        }

        // 3. Injection du composant officiel Maree.info persistant
        // On utilise leur interface épurée spéciale intégration ("ajax") pour éviter les pubs et le superflu
        body.innerHTML = `
            <div style="width:100%; height: 260px; overflow: hidden; border-radius: 8px; background: rgba(30, 41, 59, 0.5);">
                <div style="padding: 6px 10px; background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.8rem; color: #38bdf8; font-weight: bold;">📊 Données Officielles SHOM</span>
                    <a href="https://maree.info/${numPort}" target="_blank" style="font-size: 0.75rem; color: #94a3b8; text-decoration: none;">Ref. Port ${numPort} ↗</a>
                </div>
                <iframe src="https://maree.info/${numPort}?d=ajax&m=1" 
                        style="width:100%; height:220px; border:none; filter: invert(0.9) hue-rotate(180deg) opacity(0.85);" 
                        scrolling="no">
                </iframe>
            </div>
        `;

    } catch (error) {
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:10px;">
                <p style="color:#f87171; font-weight:bold; margin-bottom:4px;">❌ Liaison marée interrompue</p>
                <p style="font-size:0.75rem; color:rgba(255,255,255,0.5);">${error.message}</p>
            </div>`;
    }
}
