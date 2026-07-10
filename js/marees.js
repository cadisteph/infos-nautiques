// =======================================
// INFOS NAUTIQUES - V9 CORRIGÉE (VRAIE DOC)
// js/marees.js — Données réelles Meteo-Concept
// =======================================

const METEO_CONCEPT_TOKEN = "9d3f8048b6557cb217c58b330ac6713becc9f3426814914055468aaf7d408773"; 

async function calculerEtAfficherMarees(carte, mareeDataAncienne, estLittoral) {
    const body = carte.querySelector(".carte-body");

    if (!estLittoral) {
        body.innerHTML = `<p class="non-dispo">Zone fluviale — données de marée non disponibles</p>`;
        return;
    }

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Récupération du code INSEE
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom === nomVilleAffiche);

        if (!vActuelle || !vActuelle.insee) {
            throw new Error(`Code INSEE manquant dans villes.json pour ${nomVilleAffiche}`);
        }

        const codeInsee = String(vActuelle.insee).padStart(5, '0');
        const maintenant = new Date();
        const maréesCumulées = [];

        // 2. On appelle l'API Éphéméride pour Aujourd'hui (0) et Demain (1)
        for (let jour = 0; jour <= 1; jour++) {
            const url = `https://api.meteo-concept.com/api/ephemeride/${jour}?token=${METEO_CONCEPT_TOKEN}&insee=${codeInsee}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                // Si la ville a des marées fournies par le SHOM
                if (data.ephemeride && data.ephemeride.tide) {
                    data.ephemeride.tide.forEach(m => {
                        // Reconstitution d'une date propre pour le tri
                        const [heures, minutes] = m.time.split(':');
                        const dateMarée = new Date(maintenant);
                        if (jour === 1) dateMarée.setDate(dateMarée.getDate() + 1);
                        dateMarée.setHours(parseInt(heures), parseInt(minutes), 0, 0);

                        maréesCumulées.push({
                            type: m.status === "Pleine mer" ? "high" : "low",
                            t: dateMarée,
                            coeff: m.coefficient || "--"
                        });
                    });
                }
            }
        }

        if (maréesCumulées.length === 0) {
            throw new Error("Aucune marée disponible pour cette commune.");
        }

        // 3. Filtrage et tri chronologique (on garde les marées futures ou très récentes)
        const prochainesMarees = maréesCumulées
            .filter(m => m.t >= new Date(maintenant.getTime() - 2 * 3600000))
            .sort((a, b) => a.t - b.t)
            .slice(0, 4);

        // Récupération du coefficient actuel
        const coeffActuel = prochainesMarees[0]?.coeff || "--";
        const sensMaree = prochainesMarees[0]?.type === "high" ? "Montante ↑" : "Descendante ↓";

        const lignesHtml = prochainesMarees.map(e => {
            const estPassee = e.t < maintenant;
            const label = e.type === "high"
                ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer</span>`
                : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer</span>`;
            
            const heureFormatee = e.t.toLocaleTimeString("fr-FR", {
                hour: "2-digit", minute: "2-digit"
            });

            // Note : l'API éphéméride donne les heures et coefficients, mais pas la hauteur en mètres
            const infoCoeff = e.type === "high" ? ` — Coeff ${e.coeff}` : "";

            return `
                <div class="data-ligne" style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; ${estPassee ? "opacity:0.4; font-style:italic;" : ""}">
                    <span class="label">${label} ${estPassee ? "(récente)" : ""}</span>
                    <span class="valeur" style="font-weight: 500; color: #ffffff;">${heureFormatee}${infoCoeff}</span>
                </div>`;
        }).join("");

        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                    <span style="background:#0284c7; color:#ffffff; padding:3px 8px; border-radius:4px; font-weight:bold; display:inline-block;">${sensMaree}</span>
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:3px 8px; border-radius:4px; font-size:0.9rem; color:#ffffff;">Coeff global : ${coeffActuel}</span>
                </div>
                <div class="maree-horaires" style="margin-top:12px;">
                    ${lignesHtml}
                </div>
                <div style="text-align:right;margin-top:12px;font-size:0.7rem;color:rgba(255,255,255,0.4);">
                    Source : SHOM / Météo-Concept Ephemeride
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Détail de l'erreur :", error);
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:10px;">
                <p style="color:#f87171; font-weight:bold; margin-bottom:4px;">❌ Liaison SHOM interrompue</p>
                <p style="font-size:0.8rem; color:rgba(255,255,255,0.6); background:rgba(0,0,0,0.2); padding:6px; border-radius:4px; word-break:break-word;">
                    ${error.message}
                </p>
            </div>`;
    }
}
