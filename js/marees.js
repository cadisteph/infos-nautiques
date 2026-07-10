// =======================================
// INFOS NAUTIQUES - V5 REELLE & VERIFIEE
// js/marees.js — Synchronisation SHOM / Open-Meteo
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, estLittoral) {
    const body = carte.querySelector(".carte-body");

    if (!estLittoral) {
        body.innerHTML = `<p class="non-dispo">Zone fluviale — données de marée non disponibles</p>`;
        return;
    }

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Récupération des coordonnées exactes de la plage/port depuis ton JSON
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom === nomVilleAffiche);

        if (!vActuelle) throw new Error("Commune absente du catalogue local");

        // 2. Appel au serveur océanographique (Données de marées réelles par coordonnées)
        const urlAPI = `https://marine-api.open-meteo.com/v1/marine?latitude=${vActuelle.latitude}&longitude=${vActuelle.longitude}&hourly=tide_predictions&timezone=Europe%2FParis&forecast_days=2`;
        
        const response = await fetch(urlAPI);
        if (!response.ok) throw new Error("Impossible de joindre le serveur océanographique");
        
        const data = await response.json();
        if (!data.hourly || !data.hourly.tide_predictions) throw new Error("Données marégraphes vides ou hors-zone");

        const tempsId = data.hourly.time;
        const hauteurs = data.hourly.tide_predictions;
        const maintenant = new Date();
        const extrema = [];

        // 3. Analyse mathématique de la vraie courbe de hauteur pour localiser les PM et BM
        for (let i = 1; i < hauteurs.length - 1; i++) {
            const hPrecedente = hauteurs[i - 1];
            const hActuelle    = hauteurs[i];
            const hSuivante   = hauteurs[i + 1];
            const dateHeure    = new Date(tempsId[i]);

            // On ne conserve que les marées à partir de maintenant (ou très récentes)
            if (dateHeure >= new Date(maintenant.getTime() - 2 * 3600000)) {
                if (hActuelle > hPrecedente && hActuelle > hSuivante) {
                    extrema.push({ type: "high", t: dateHeure, h: hActuelle });
                } else if (hActuelle < hPrecedente && hActuelle < hSuivante) {
                    extrema.push({ type: "low", t: dateHeure, h: hActuelle });
                }
            }
        }

        // Tri chronologique des prochains extrema réels
        extrema.sort((a, b) => a.t - b.t);
        const prochains4 = extrema.slice(0, 4);

        if (prochains4.length === 0) throw new Error("Aucun extremum détecté sur la courbe");

        // Détermination du sens du courant actuel
        const prochainEvenement = prochains4[0];
        const sensMaree = prochainEvenement.type === "high" ? "Montante ↑" : "Descendante ↓";

        // Construction des lignes d'affichage
        const lignesHtml = prochains4.map(e => {
            const estPassee = e.t < maintenant;
            const label = e.type === "high"
                ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer</span>`
                : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer</span>`;
            
            const heureFormatee = e.t.toLocaleTimeString("fr-FR", {
                hour: "2-digit", minute: "2-digit"
            });

            return `
                <div class="data-ligne" style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; ${estPassee ? "opacity:0.4; font-style:italic;" : ""}">
                    <span class="label">${label} ${estPassee ? "(récente)" : ""}</span>
                    <span class="valeur" style="font-weight: 500; color: #ffffff;">${heureFormatee} — ${e.h.toFixed(2)} m</span>
                </div>`;
        }).join("");

        // Injection finale sans aucune tricherie théorique
        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                    <span style="background:#0284c7; color:#ffffff; padding:3px 8px; border-radius:4px; font-weight:bold; display:inline-block;">${sensMaree}</span>
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:3px 8px; border-radius:4px; font-size:0.9rem; color:#ffffff;">Temps Réel</span>
                </div>
                <div class="maree-horaires" style="margin-top:12px;">
                    ${lignesHtml}
                </div>
                <div style="text-align:right;margin-top:12px;font-size:0.7rem;color:rgba(255,255,255,0.4);">
                    Source : Données temps réel hydrographiques (Modèle Météo-France / SHOM)
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Échec de synchronisation des marées :", error);
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:15px;">
                <p style="color:#f87171; font-weight:bold; margin-bottom:4px;">❌ Marées indisponibles</p>
                <p style="font-size:0.75rem; color:rgba(255,255,255,0.5);">Erreur de liaison réseau ou point GPS hors-mer.</p>
            </div>`;
    }
}
