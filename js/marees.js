// =======================================
// INFOS NAUTIQUES - V11 DIRECT SHOM
// js/marees.js — Données officielles SHOM
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, estLittoral) {
    const body = carte.querySelector(".carte-body");

    if (!estLittoral) {
        body.innerHTML = `<p class="non-dispo">Zone fluviale — données de marée non disponibles</p>`;
        return;
    }

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Récupération des coordonnées GPS depuis ton JSON
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom === nomVilleAffiche);

        if (!vActuelle || !vActuelle.latitude || !vActuelle.longitude) {
            throw new Error(`Coordonnées GPS manquantes dans villes.json pour ${nomVilleAffiche}`);
        }

        const lat = vActuelle.latitude;
        const lon = vActuelle.longitude;

        // 2. Requête directe sur l'API publique de prédiction du SHOM
        // On demande les prédictions des hauteurs d'eau (海事 SHOM)
        const urlSHOM = `https://services.data.shom.fr/hmar/wfs/public?service=WFS&version=2.0.0&request=GetFeature&typename=ECRANS_MAR_PREDICT&outputFormat=application/json&lon=${lon}&lat=${lat}`;
        
        const response = await fetch(urlSHOM);
        
        if (!response.ok) {
            throw new Error(`Erreur serveur SHOM (Code ${response.status})`);
        }
        
        const data = await response.json();
        
        if (!data.features || data.features.length === 0) {
            throw new Error("Le SHOM ne fournit pas de point de niveau pour ces coordonnées précises.");
        }

        const maintenant = new Date();
        const marées = [];

        // 3. Extraction et tri des extrêmes (Pleines et Basses mers)
        // Le SHOM renvoie les caractéristiques dans les propriétés des "features"
        data.features.forEach(f => {
            const props = f.properties;
            if (props && props.date_heure) {
                const dateMarée = new Date(props.date_heure);
                // On ne garde que les marées de maintenant à +36h
                if (dateMarée >= new Date(maintenant.getTime() - 2 * 3600000)) {
                    marées.push({
                        type: props.type_maree === "PM" ? "high" : "low",
                        t: dateMarée,
                        h: props.hauteur,
                        coeff: props.coefficient || "--"
                    });
                }
            }
        });

        // Tri chronologique
        marées.sort((a, b) => a.t - b.t);
        const prochaines4 = marées.slice(0, 4);

        if (prochains4.length === 0) {
            throw new Error("Aucune marée proche trouvée dans les données du SHOM.");
        }

        const coeffActuel = prochains4.find(m => m.type === "high")?.coeff || "--";
        const sensMaree = prochains4[0]?.type === "high" ? "Montante ↑" : "Descendante ↓";

        const lignesHtml = prochains4.map(e => {
            const estPassee = e.t < maintenant;
            const label = e.type === "high"
                ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer</span>`
                : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer</span>`;
            
            const heureFormatee = e.t.toLocaleTimeString("fr-FR", {
                hour: "2-digit", minute: "2-digit"
            });

            const infoCoeff = e.coeff && e.coeff !== "--" ? ` (Coeff ${e.coeff})` : "";

            return `
                <div class="data-ligne" style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; ${estPassee ? "opacity:0.4; font-style:italic;" : ""}">
                    <span class="label">${label} ${estPassee ? "(récente)" : ""}</span>
                    <span class="valeur" style="font-weight: 500; color: #ffffff;">${heureFormatee} — ${e.h.toFixed(2)} m${infoCoeff}</span>
                </div>`;
        }).join("");

        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                    <span style="background:#0284c7; color:#ffffff; padding:3px 8px; border-radius:4px; font-weight:bold; display:inline-block;">${sensMaree}</span>
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:3px 8px; border-radius:4px; font-size:0.9rem; color:#ffffff;">Coeff : ${coeffActuel}</span>
                </div>
                <div class="maree-horaires" style="margin-top:12px;">
                    ${lignesHtml}
                </div>
                <div style="text-align:right;margin-top:12px;font-size:0.7rem;color:rgba(255,255,255,0.4);">
                    Source : Data.shom.fr (Direct Flux)
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Détail de l'erreur SHOM :", error);
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:10px;">
                <p style="color:#f87171; font-weight:bold; margin-bottom:4px;">❌ Liaison SHOM directe interrompue</p>
                <p style="font-size:0.8rem; color:rgba(255,255,255,0.6); background:rgba(0,0,0,0.2); padding:6px; border-radius:4px; word-break:break-word;">
                    ${error.message}
                </p>
            </div>`;
    }
}
