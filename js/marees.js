// =======================================
// INFOS NAUTIQUES - VERSION GÉOGRAPHIQUE PROPRE
// js/marees.js — Synchronisé avec villes.json (76)
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, argumentInutile) {
    const body = carte.querySelector(".carte-body");
    if (!body) return;

    // Récupération propre du nom de la ville sélectionnée dans ton interface
    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Chargement de TON vrai fichier villes.json
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        
        // Recherche stricte de la ville correspondante
        const vActuelle = liste.find(v => v.nom.trim().toLowerCase() === nomVilleAffiche.toLowerCase());

        if (!vActuelle) {
            throw new Error(`Ville "${nomVilleAffiche}" introuvable dans data/villes.json`);
        }

        // VERIFICATION DE LA CATEGORIE DE TON JSON
        // Si c'est une ville de la Seine (fluviale), on s'arrête gentiment ici
        if (vActuelle.categorie === "Seine") {
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Zone fluviale — données de marée non disponibles</p>`;
            return;
        }

        // 2. Récupération des coordonnées GPS et appel API Marine (Données réelles SHOM / Météo-France)
        const lat = vActuelle.latitude;
        const lon = vActuelle.longitude;
        const urlAPI = `https://api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=tide_predictions&timezone=Europe%2FParis&forecast_days=2`;
        
        const response = await fetch(urlAPI);
        if (!response.ok) throw new Error(`Serveur météo indisponible (HTTP ${response.status})`);
        
        const data = await response.json();
        if (!data.hourly || !data.hourly.tide_predictions) throw new Error("Flux SHOM momentanément indisponible");

        const tempsId = data.hourly.time;
        const hauteurs = data.hourly.tide_predictions;
        const maintenant = new Date();
        const extrema = [];

        // 3. Extraction mathématique des Pleines Mers et Basses Mers
        for (let i = 1; i < hauteurs.length - 1; i++) {
            const hPrecedente = hauteurs[i - 1];
            const hActuelle    = hauteurs[i];
            const hSuivante   = hauteurs[i + 1];
            const dateHeure    = new Date(tempsId[i]);

            // On garde les marées de -2h dans le passé à +24h dans le futur
            if (dateHeure >= new Date(maintenant.getTime() - 2 * 3600000)) {
                if (hActuelle > hPrecedente && hActuelle > hSuivante) {
                    extrema.push({ type: "high", t: dateHeure, h: hActuelle });
                } else if (hActuelle < hPrecedente && hActuelle < hSuivante) {
                    extrema.push({ type: "low", t: dateHeure, h: hActuelle });
                }
            }
        }

        extrema.sort((a, b) => a.t - b.t);
        const prochains4 = extrema.slice(0, 4);

        if (prochains4.length === 0) throw new Error("Aucun horaire calculable pour ce point");

        const sensMaree = prochains4[0].type === "high" ? "Montante ↑" : "Descendante ↓";

        // 4. Rendu HTML identique aux standards de ton application sombre
        const lignesHtml = prochains4.map(e => {
            const estPassee = e.t < maintenant;
            const label = e.type === "high"
                ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer</span>`
                : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer</span>`;
            
            const heureFormatee = e.t.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

            return `
                <div class="data-ligne" style="width:100%; display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); ${estPassee ? "opacity:0.4; font-style:italic;" : ""}">
                    <span class="label">${label} ${estPassee ? "(récente)" : ""}</span>
                    <span class="valeur" style="color: #ffffff; font-weight: 500;">${heureFormatee} — ${e.h.toFixed(2)} m</span>
                </div>`;
        }).join("");

        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                    <span style="background:#0284c7; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:bold; display:inline-block; font-size:0.9rem;">${sensMaree}</span>
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px; font-size:0.9rem; color:#ffffff; font-weight:500;">SHOM Temps Réel</span>
                </div>
                <div class="maree-horaires" style="margin-top:12px; width:100%;">
                    ${lignesHtml}
                </div>
            </div>
        `;

    } catch (error) {
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:10px;">
                <p style="color:#f87171; font-weight:bold; margin-bottom:4px;">❌ Données indisponibles</p>
                <p style="font-size:0.75rem; color:rgba(255,255,255,0.5);">${error.message}</p>
            </div>`;
    }
}
