// =======================================
// INFOS NAUTIQUES - EXTRACTION DE TEXTE BRUT
// js/marees.js — Intégration transparente Maree.info
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
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Port non listé sur maree.info</p>`;
            return;
        }

        // 3. Récupération discrète du flux textuel via proxy CORS pour éviter les blocages
        const urlWidget = `https://maree.info/${numPort}?d=ajax&m=1`;
        const urlProxy = `https://corsproxy.io/?${encodeURIComponent(urlWidget)}`;

        const response = await fetch(urlProxy);
        if (!response.ok) throw new Error("Données indisponibles");
        
        const htmlText = await response.text();

        // 4. Extraction des données textuelles de la table
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        const lignes = doc.querySelectorAll("table tr");
        
        const maréesRéelles = [];
        const maintenant = new Date();

        lignes.forEach(tr => {
            const cellules = tr.querySelectorAll("td");
            // La structure classique du widget textuel possède 3 à 4 colonnes : Type, Coeff, Heure, Hauteur
            if (cellules.length >= 3) {
                const typeTexte = cellules[0].textContent.trim(); // "PM" ou "BM"
                const coeffTexte = cellules[1].textContent.trim() || "—";
                const heureTexte = cellules[2].textContent.trim(); // "09h06"

                if (typeTexte && heureTexte.includes("h")) {
                    const [hrs, mins] = heureTexte.split("h");
                    const dateMaree = new Date();
                    dateMaree.setHours(parseInt(hrs, 10), parseInt(mins, 10), 0, 0);

                    maréesRéelles.push({
                        type: typeTexte.toUpperCase() === "PM" ? "high" : "low",
                        coeff: coeffTexte,
                        heure: heureTexte,
                        t: dateMaree
                    });
                }
            }
        });

        if (maréesRéelles.length === 0) throw new Error("Données de marée introuvables");

        // Tri chronologique des données extraites
        maréesRéelles.sort((a, b) => a.t - b.t);

        const sensMaree = maréesRéelles.find(m => m.t > maintenant)?.type === "high" ? "Montante ↑" : "Descendante ↓";

        // 5. Rendu dans ton format graphique d'origine (PJ2)
        const lignesHtml = maréesRéelles.map(e => {
            const estPassee = e.t < maintenant;
            const label = e.type === "high"
                ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer (PM)</span>`
                : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer (BM)</span>`;
            
            const affichageCoeff = e.coeff !== "—" ? `<span style="background:rgba(255,255,255,0.08); padding:2px 6px; border-radius:4px; font-size:0.8rem; color:#94a3b8; font-weight:bold; margin-right:10px;">Coef ${e.coeff}</span>` : '';

            return `
                <div class="data-ligne" style="width:100%; display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); ${estPassee ? "opacity:0.35; font-style:italic;" : ""}">
                    <span class="label">${label} ${estPassee ? "(récente)" : ""}</span>
                    <span class="valeur" style="color: #ffffff; font-weight: 500;">
                        ${affichageCoeff}
                        <span style="font-family: monospace; font-size: 0.95rem;">${e.heure}</span>
                    </span>
                </div>`;
        }).join("");

        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; justify-content: space-between; align-items: center; margin-bottom:14px;">
                    <span style="background:#0284c7; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:bold; display:inline-block; font-size:0.9rem;">${sensMaree}</span>
                    <span style="font-size:0.75rem; color:rgba(255,255,255,0.4);">Source : Maree.info / Port ${numPort}</span>
                </div>
                <div class="maree-horaires" style="width:100%;">
                    ${lignesHtml}
                </div>
            </div>
        `;

    } catch (error) {
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:10px;">
                <p style="color:#f87171; font-weight:bold; margin-bottom:4px;">❌ Liaison marée interrompue</p>
                <p style="font-size:0.75rem; color:rgba(255,255,255,0.5);">Erreur d'analyse des données</p>
            </div>`;
    }
}
