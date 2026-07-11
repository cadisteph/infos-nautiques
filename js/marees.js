// =======================================
// INFOS NAUTIQUES - BRANCHEMENT DIRECT MAREE.INFO
// js/marees.js — Scraper Dynamique Multi-Ports
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, argumentInutile) {
    const body = carte.querySelector(".carte-body");
    if (!body) return;

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Récupération des données de la ville actuelle
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom.trim().toLowerCase() === nomVilleAffiche.toLowerCase());

        if (!vActuelle) throw new Error(`Ville "${nomVilleAffiche}" introuvable`);

        // Sécurité Zone Fluviale
        if (vActuelle.categorie === "Seine") {
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Zone fluviale — données de marée non disponibles</p>`;
            return;
        }

        // 2. Dictionnaire des correspondances de ports fournis
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
            throw new Error(`Aucun numéro de port maree.info associé à la ville : ${vActuelle.nom}`);
        }

        // 3. Appel de maree.info via un proxy public pour contourner la sécurité CORS
        const urlCible = `https://maree.info/${numPort}`;
        const urlProxy = `https://corsproxy.io/?${encodeURIComponent(urlCible)}`;

        const response = await fetch(urlProxy);
        if (!response.ok) throw new Error("Impossible d'accéder aux données distantes");
        
        const htmlText = await response.text();

        // 4. Analyse du code HTML (Scraping des tableaux de données de maree.info)
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        
        // On récupère le tableau du jour courant (#tide-t ou la table des marées)
        const lignesTableau = doc.querySelectorAll("#tide-days tr, .tide-day tr, #tide-curr tr");
        const maréesRéelles = [];
        const maintenant = new Date();
        const anneeCourante = maintenant.getFullYear();
        const moisCourant = maintenant.getMonth(); // 0-11
        const jourCourant = maintenant.getDate();

        lignesTableau.forEach(tr => {
            const tdHeure = tr.querySelector(".tide-time, td:nth-child(2)");
            const tdHauteur = tr.querySelector(".tide-height, td:nth-child(3)");
            
            if (tdHeure && tdHauteur) {
                const texteHeure = tdHeure.textContent.trim(); // Format ex: "08h15" ou "08:15"
                const texteHauteur = tdHauteur.textContent.trim(); // Format ex: "6,85m" ou "6.85"

                if (texteHeure.includes("h") || texteHeure.includes(":")) {
                    const [hrs, mins] = texteHeure.replace("h", ":").split(":");
                    const hauteurNum = parseFloat(texteHauteur.replace(",", ".").replace("m", ""));

                    if (!isNaN(hauteurNum) && hrs && mins) {
                        // Reconstitution de la date exacte
                        const dateMaree = new Date(anneeCourante, moisCourant, jourCourant, parseInt(hrs), parseInt(mins));
                        
                        // Détection automatique Haute / Basse mer par rapport aux hauteurs des lignes
                        const typeMaree = tr.innerHTML.toLowerCase().includes("haute") || tr.innerHTML.toLowerCase().includes("pm") || tr.innerHTML.toLowerCase().includes("pleine") ? "high" : "low";

                        maréesRéelles.push({
                            type: typeMaree,
                            t: dateMaree,
                            h: hauteurNum
                        });
                    }
                }
            }
        });

        // Sécurité au cas où la structure HTML de la page d'accueil du port varie légèrement
        if (maréesRéelles.length === 0) {
            // Solution de secours : cibler les éléments de la vue mobile/simplifiée de maree.info
            const cellules = doc.querySelectorAll(".tide-hilo, #tide-t td");
            if (cellules.length === 0) throw new Error("Format des données illisible");
        }

        // 5. Filtrage et tri des 4 prochaines marées de la journée
        const prochains4 = maréesRéelles
            .filter(m => m.t >= new Date(maintenant.getTime() - 2 * 3600000))
            .sort((a, b) => a.t - b.t)
            .slice(0, 4);

        if (prochains4.length === 0) throw new Error("Aucune marée proche disponible");

        const sensMaree = prochains4[0].type === "high" ? "Montante ↑" : "Descendante ↓";

        // 6. Injection dans l'interface originale (PJ2)
        const lignesHtml = prochains4.map(e => {
            const estPassee = e.t < maintenant;
            const label = e.type === "high"
                ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer</span>`
                : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer</span>`;
            
            const heureFormatee = e.t.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

            return `
                <div class="data-ligne" style="width:100%; display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); ${estPassee ? "opacity:0.4; font-style:italic;" : ""}">
                    <span class="label">${label} ${estPassee ? "(récente)" : ""}</span>
                    <span class="valeur" style="color: #ffffff; font-weight: 500;">${heureFormatee} — ${e.h.toFixed(2)}m</span>
                </div>`;
        }).join("");

        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                    <span style="background:#0284c7; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:bold; display:inline-block; font-size:0.9rem;">${sensMaree}</span>
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px; font-size:0.9rem; color:#ffffff; font-weight:500;">Source : Maree.info (${urlCible})</span>
                </div>
                <div class="maree-horaires" style="margin-top:12px; width:100%;">
                    ${lignesHtml}
                </div>
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
