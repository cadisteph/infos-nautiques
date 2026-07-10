// =======================================
// INFOS NAUTIQUES - V7 OFFICIELLE SHOM GPS
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
        // 1. Récupération des coordonnées GPS depuis ton JSON local
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom === nomVilleAffiche);

        if (!vActuelle || !vActuelle.latitude || !vActuelle.longitude) {
            throw new Error(`Coordonnées GPS manquantes dans villes.json pour ${nomVilleAffiche}`);
        }

        // 2. La VRAIE URL officielle de Météo-Concept pour les marées du SHOM
        // Elle prend la latitude et la longitude, et on ajoute un anti-cache automatique (_)
        const antiCache = new Date().getTime();
        const urlMaree = `https://api.meteo-concept.com/api/marine/tide?token=${METEO_CONCEPT_TOKEN}&lat=${vActuelle.latitude}&lon=${vActuelle.longitude}&_=${antiCache}`;
        
        const response = await fetch(urlMaree, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (response.status === 403 || response.status === 401) {
            throw new Error("Token Météo-Concept invalide, expiré ou non activé.");
        }
        if (!response.ok) {
            throw new Error(`Erreur serveur Météo-Concept (Code ${response.status})`);
        }
        
        const data = await response.json();
        
        // Structure officielle Météo-Concept : les marées sont directement dans un tableau "tide"
        if (!data.tide || data.tide.length === 0) {
            throw new Error("Aucune marée disponible pour ces coordonnées GPS.");
        }

        const maintenant = new Date();
        
        // 3. Filtrage pour n'avoir que les prochaines marées
        const prochainesMarees = data.tide
            .map(m => ({
                type: (m.status === "Pleine mer" || m.status === "PM") ? "high" : "low",
                t: new Date(m.dateTime),
                h: m.height
            }))
            .filter(m => m.t >= new Date(maintenant.getTime() - 2 * 3600000))
            .slice(0, 4);

        // Récupération du coefficient s'il existe dans la réponse
        const coeff = data.shore && data.shore.coefficient ? data.shore.coefficient : "--";
        const sensMaree = prochainesMarees[0]?.type === "high" ? "Montante ↑" : "Descendante ↓";

        const lignesHtml = prochainesMarees.map(e => {
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
                    <span class="valeur" style="font-weight: 500; color: #ffffff;">${heureFormatee} — ${e.h ? e.h.toFixed(2) + ' m' : '--'}</span>
                </div>`;
        }).join("");

        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                    <span style="background:#0284c7; color:#ffffff; padding:3px 8px; border-radius:4px; font-weight:bold; display:inline-block;">${sensMaree}</span>
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:3px 8px; border-radius:4px; font-size:0.9rem; color:#ffffff;">Coeff ${coeff}</span>
                </div>
                <div class="maree-horaires" style="margin-top:12px;">
                    ${lignesHtml || '<p class="non-dispo">Aucune marée proche trouvée</p>'}
                </div>
                <div style="text-align:right;margin-top:12px;font-size:0.7rem;color:rgba(255,255,255,0.4);">
                    Source : Annuaire SHOM via Météo-Concept
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
