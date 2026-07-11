// =======================================
// INFOS NAUTIQUES - V28 MÉTÉO-CONCEPT INSEE
// js/marees.js — Données SHOM via Code INSEE
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, argumentInutile) {
    const body = carte.querySelector(".carte-body");
    if (!body) return;

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Lecture de ton fichier villes.json
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom.trim().toLowerCase() === nomVilleAffiche.toLowerCase());

        if (!vActuelle) {
            throw new Error(`Ville "${nomVilleAffiche}" introuvable`);
        }

        // Vérification de ta catégorie Seine (Fluviale)
        if (vActuelle.categorie === "Seine") {
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Zone fluviale — données de marée non disponibles</p>`;
            return;
        }

        if (!vActuelle.insee) {
            throw new Error(`Code INSEE manquant pour ${vActuelle.nom}`);
        }

        // 2. Appel de l'API Météo-Concept avec le code INSEE officiel
        const token = "9d3f8048b6557cb217c58b330ac6713becc9f3426814914055468aaf7d408773";
        const urlAPI = `https://api.meteo-concept.com/api/marine/tide/${vActuelle.insee}?token=${token}`;
        
        const response = await fetch(urlAPI);
        if (!response.ok) throw new Error(`Erreur serveur (HTTP ${response.status})`);
        
        const data = await response.json();
        
        if (!data.tides || data.tides.length === 0) {
            throw new Error("Aucune marée disponible pour cette commune");
        }

        const maintenant = new Date();
        const maréesRéelles = [];

        // 3. Extraction des données
        data.tides.forEach(m => {
            const dateHeure = new Date(m.datetime);
            maréesRéelles.push({
                type: m.type === "high" || m.type === "PM" ? "high" : "low",
                t: dateHeure,
                h: m.height,
                coeff: m.coefficient || null
            });
        });

        const prochains4 = maréesRéelles
            .filter(m => m.t >= new Date(maintenant.getTime() - 2 * 3600000))
            .sort((a, b) => a.t - b.t)
            .slice(0, 4);

        if (prochains4.length === 0) throw new Error("Aucun horaire proche trouvé");

        const sensMaree = prochains4[0].type === "high" ? "Montante ↑" : "Descendante ↓";
        const premierCoeff = prochains4.find(c => c.coeff)?.coeff;
        const affichageCoeff = premierCoeff ? ` • Coeff : ${premierCoeff}` : "";

        // 4. Rendu HTML
        const lignesHtml = prochains4.map(e => {
            const estPassee = e.t < maintenant;
            const label = e.type === "high"
                ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer</span>`
                : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer</span>`;
            
            const heureFormatee = e.t.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
            const detailCoeff = e.coeff ? ` (Coeff ${e.coeff})` : "";

            return `
                <div class="data-ligne" style="width:100%; display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); ${estPassee ? "opacity:0.4; font-style:italic;" : ""}">
                    <span class="label">${label} ${estPassee ? "(récente)" : ""}${detailCoeff}</span>
                    <span class="valeur" style="color: #ffffff; font-weight: 500;">${heureFormatee} — ${e.h.toFixed(2)} m</span>
                </div>`;
        }).join("");

        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                    <span style="background:#0284c7; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:bold; display:inline-block; font-size:0.9rem;">${sensMaree}</span>
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px; font-size:0.9rem; color:#ffffff; font-weight:500;">SHOM / Météo-Concept${affichageCoeff}</span>
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
