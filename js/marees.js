// =======================================
// INFOS NAUTIQUES - EXTRACTEUR DE TEXTE WIDGET
// js/marees.js — Extraction PM/BM/Coeff uniquement
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

        // 2. Correspondance des ports
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

        // 3. Appel du flux de données épuré (format d'impression sans fioritures) via le proxy
        const urlWidget = `https://maree.info/${numPort}?d=ajax&m=1`;
        const urlProxy = `https://corsproxy.io/?${encodeURIComponent(urlWidget)}`;

        const response = await fetch(urlProxy);
        if (!response.ok) throw new Error("Erreur réseau");
        const htmlText = await response.text();

        // 4. Extraction chirurgicale des données
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        
        // On récupère toutes les cellules du tableau de données de maree.info
        const cellules = doc.querySelectorAll("table td, div.tide-row, tr");
        const maréesTrouvées = [];
        const maintenant = new Date();

        cellules.forEach(el => {
            const texte = el.textContent.trim().toUpperCase();
            // Recherche des lignes contenant les mots clés des marées
            if (texte.includes("PM") || texte.includes("BM") || texte.includes("PLEINE") || texte.includes("BASSE")) {
                const type = (texte.includes("PM") || texte.includes("PLEINE")) ? "PM" : "BM";
                
                // Extraction de l'heure (format XXhXX)
                const matchHeure = el.textContent.match(/(\d{2})h(\d{2})/);
                // Extraction du coefficient (2 ou 3 chiffres isolés)
                const matchCoeff = el.textContent.match(/\b(\d{2,3})\b/);

                if (matchHeure) {
                    const d = new Date();
                    d.setHours(parseInt(matchHeure[1], 10), parseInt(matchHeure[2], 10), 0, 0);

                    maréesTrouvées.push({
                        type: type,
                        coeff: type === "PM" && matchCoeff ? matchCoeff[1] : "—",
                        t: d,
                        heureStr: `${matchHeure[1]}h${matchHeure[2]}`
                    });
                }
            }
        });

        if (maréesTrouvées.length === 0) throw new Error("Aucune donnée extraite");

        // Tri et filtrage pour n'avoir que les 4 marées principales
        const uniques = Array.from(new Map(maréesTrouvées.map(m => [m.heureStr, m])).values());
        const prochains4 = uniques.sort((a, b) => a.t - b.t).slice(0, 4);
        
        const sensMaree = prochains4[0].type === "PM" ? "Montante ↑" : "Descendante ↓";

        // 5. Rendu visuel propre intégré à ton application sombre
        const lignesHtml = prochains4.map(e => {
            const estPassee = e.t < maintenant;
            const label = e.type === "PM"
                ? `<span style="color:#38bdf8; font-weight:bold;">PM</span>`
                : `<span style="color:#fdba74; font-weight:bold;">BM</span>`;
            
            const affichageCoeff = e.coeff !== "—" 
                ? `<span style="color: #ffffff; font-weight: bold; font-size: 0.95rem; width: 40px; display: inline-block; text-align: center;">${e.coeff}</span>`
                : `<span style="width: 40px; display: inline-block; text-align: center; color: rgba(255,255,255,0.2);">—</span>`;

            return `
                <div class="data-ligne" style="width:100%; display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); ${estPassee ? "opacity:0.3; font-style:italic;" : ""}">
                    <div style="display: flex; gap: 40px; align-items: center;">
                        <span class="label" style="width: 30px; display: inline-block;">${label}</span>
                        ${affichageCoeff}
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
        // En cas d'échec persistant du scraping local, retour au bouton propre qui fonctionne
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:15px 0;">
                <p style="color:#94a3b8; font-size:0.85rem; font-style:italic; margin-bottom:10px;">Données indisponibles en direct</p>
                <a href="https://maree.info/${correspondancePorts[nomVilleAffiche.toLowerCase()] || '19'}" target="_blank" style="font-size:0.8rem; color:#38bdf8; text-decoration:none; font-weight:500;">
                    Consulter les marées du port ↗
                </a>
            </div>`;
    }
}
