// =======================================
// INFOS NAUTIQUES - EXTRACTEUR TEXTUEL ROBUSTE
// js/marees.js — 100% Dynamique & Perpétuel
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, argumentInutile) {
    const body = carte.querySelector(".carte-body");
    if (!body) return;

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Récupération de la ville
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom.trim().toLowerCase() === nomVilleAffiche.toLowerCase());

        if (!vActuelle) throw new Error(`Ville "${nomVilleAffiche}" introuvable`);

        if (vActuelle.categorie === "Seine") {
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Zone fluviale — données de marée non disponibles</p>`;
            return;
        }

        // 2. Dictionnaire des ports fournis
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

        // 3. Récupération de la page épurée (format imprimable/mobile) via le proxy CORS
        const urlCible = `https://maree.info/${numPort}`;
        const urlProxy = `https://corsproxy.io/?${encodeURIComponent(urlCible)}`;

        const response = await fetch(urlProxy);
        if (!response.ok) throw new Error("Serveur distant injoignable");
        
        const html = await response.text();

        // 4. Analyse de la page
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // On cible le tableau principal des marées du jour
        const lignes = doc.querySelectorAll("#tide-curr tr, #tide-days tr, .tide-day tr");
        const maréesRéelles = [];
        const maintenant = new Date();

        lignes.forEach(tr => {
            const texteLigne = tr.textContent.toUpperCase();
            // On cherche uniquement les lignes contenant explicitement PM ou BM
            if (texteLigne.includes("PM") || texteLigne.includes("BM") || texteLigne.includes("PLEINE") || texteLigne.includes("BASSE")) {
                const type = (texteLigne.includes("PM") || texteLigne.includes("PLEINE")) ? "PM" : "BM";
                
                // Recherche de l'heure (ex: 09h06 ou 09:06)
                const matchHeure = tr.textContent.match(/(\d{2})[h:](\d{2})/);
                // Recherche du coefficient (nombre isolé de 2 ou 3 chiffres après le type)
                const matchCoeff = tr.textContent.match(/(?:COEFF|COEFFICIENT)?\s*\b(\d{2,3})\b/i);

                if (matchHeure) {
                    const d = new Date();
                    d.setHours(parseInt(matchHeure[1], 10), parseInt(matchHeure[2], 10), 0, 0);
                    
                    maréesRéelles.push({
                        type: type,
                        coeff: type === "PM" && matchCoeff ? matchCoeff[1] : "",
                        t: d,
                        heureStr: `${matchHeure[1]}h${matchHeure[2]}`
                    });
                }
            }
        });

        if (maréesRéelles.length === 0) throw new Error("Aucune donnée lisible trouvée");

        // Tri et sélection des 4 prochaines marées glissantes
        const prochains4 = maréesRéelles
            .filter(m => m.t >= new Date(maintenant.getTime() - 2 * 3600000))
            .sort((a, b) => a.t - b.t)
            .slice(0, 4);

        const sensMaree = prochains4[0].type === "PM" ? "Montante ↑" : "Descendante ↓";

        // 5. Rendu du tableau sombre (Identique PJ1 au format PJ2)
        const lignesHtml = prochains4.map(e => {
            const estPassee = e.t < maintenant;
            const label = e.type === "PM"
                ? `<span style="color:#38bdf8; font-weight:bold; letter-spacing: 1px;">PM</span>`
                : `<span style="color:#fdba74; font-weight:bold; letter-spacing: 1px;">BM</span>`;
            
            const colonneCoeff = e.coeff
                ? `<span style="color: #ffffff; font-weight: bold; font-size: 0.95rem; width: 40px; display: inline-block; text-align: center;">${e.coeff}</span>`
                : `<span style="width: 40px; display: inline-block;"></span>`;

            return `
                <div class="data-ligne" style="width:100%; display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); ${estPassee ? "opacity:0.3; font-style:italic;" : ""}">
                    <div style="display: flex; gap: 40px; align-items: center;">
                        <span class="label" style="width: 30px; display: inline-block;">${label}</span>
                        ${colonneCoeff}
                    </div>
                    <span class="valeur" style="color: #ffffff; font-weight: 500; font-family: monospace; font-size: 1rem;">${e.heureStr}</span>
                </div>`;
        }).join("");

        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; justify-content: space-between; margin-bottom:12px; align-items: center;">
                    <span style="background:#0284c7; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:bold; display:inline-block; font-size:0.9rem;">${sensMaree}</span>
                    <span style="font-size:0.75rem; color:rgba(255,255,255,0.4); font-weight:500;">Maree.info / Port ${numPort}</span>
                </div>
                <div class="maree-horaires" style="width:100%; margin-top: 5px;">
                    <div style="width:100%; display: flex; justify-content: space-between; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem; color: rgba(255,255,255,0.4); font-weight: bold;">
                        <div style="display: flex; gap: 40px;">
                            <span style="width: 30px;">Type</span>
                            <span style="width: 40px; text-align: center;">Coeff.</span>
                        </div>
                        <span>Heure</span>
                    </div>
                    ${lignesHtml}
                </div>
            </div>
        `;

    } catch (error) {
        // En cas de micro-coupure, affichage du lien de secours fonctionnel
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:15px 0;">
                <p style="color:#94a3b8; font-size:0.85rem; font-style:italic; margin-bottom:10px;">Données en direct indisponibles</p>
                <a href="https://maree.info/${correspondancePorts[nomVilleAffiche.toLowerCase()] || '19'}" target="_blank" style="font-size:0.8rem; color:#38bdf8; text-decoration:none; font-weight:500;">
                    Consulter le calendrier officiel ↗
                </a>
            </div>`;
    }
}
