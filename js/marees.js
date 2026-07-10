// =======================================
// INFOS NAUTIQUES - V5 OFFICIELLE SHOM
// js/marees.js — Données réelles Meteo-Concept
// =======================================

// 🔴 COLLE TA CLÉ API ENTRE LES GUILLEMETS ICI :
const METEO_CONCEPT_TOKEN = 9d3f8048b6557cb217c58b330ac6713becc9f3426814914055468aaf7d408773; 

async function calculerEtAfficherMarees(carte, mareeDataAncienne, estLittoral) {
    const body = carte.querySelector(".carte-body");

    if (!estLittoral) {
        body.innerHTML = `<p class="non-dispo">Zone fluviale — données de marée non disponibles</p>`;
        return;
    }

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. On récupère le code INSEE de la ville
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom === nomVilleAffiche);

        if (!vActuelle || !vActuelle.insee) {
            throw new Error("Code INSEE manquant dans villes.json pour " + nomVilleAffiche);
        }

        // 2. Appel à l'API officielle Météo-Concept (Données SHOM)
        const urlMaree = `https://api.meteo-concept.com/api/marine/tide?token=${METEO_CONCEPT_TOKEN}&insee=${vActuelle.insee}`;
        
        const response = await fetch(urlMaree);
        if (!response.ok) throw new Error("Clé API invalide ou serveur injoignable");
        
        const data = await response.json();
        
        if (!data.tide) throw new Error("Pas de données de marée reçues");

        const maintenant = new Date();
        
        // 3. Filtrer et trier les marées pour n'afficher que les prochaines
        const prochainesMarees = data.tide
            .map(m => ({
                type: m.status === "Pleine mer" ? "high" : "low",
                t: new Date(m.dateTime),
                h: m.height
            }))
            .filter(m => m.t >= new Date(maintenant.getTime() - 2 * 3600000)) // Garde les récentes et futures
            .slice(0, 4);

        // Récupération du coefficient du jour
        const coeff = data.shore && data.shore.coefficient ? data.shore.coefficient : "--";
        
        // Détermination du sens du courant (si la prochaine marée est une pleine mer, ça monte !)
        const sensMaree = prochainesMarees[0]?.type === "high" ? "Montante ↑" : "Descendante ↓";

        // Construction des lignes HTML
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
                    <span class="valeur" style="font-weight: 500; color: #ffffff;">${heureFormatee} — ${e.h.toFixed(2)} m</span>
                </div>`;
        }).join("");

        // Affichage final sur l'écran
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
                    Source : Annuaire officiel du SHOM via Météo-Concept
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Erreur API Marées :", error);
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:15px;">
                <p style="color:#f87171; font-weight:bold; margin-bottom:4px;">❌ Connexion SHOM impossible</p>
                <p style="font-size:0.75rem; color:rgba(255,255,255,0.5);">Vérifie ta clé API dans js/marees.js ou ta connexion internet.</p>
            </div>`;
    }
}
