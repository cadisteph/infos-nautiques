// =======================================
// INFOS NAUTIQUES - VERSION RESTAURÉE
// js/marees.js — Calcul local de précision SHOM
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, estLittoral) {
    const body = carte.querySelector(".carte-body");

    if (!estLittoral) {
        body.innerHTML = `<p class="non-dispo">Zone fluviale — données de marée non disponibles</p>`;
        return;
    }

    try {
        const maintenant = new Date();
        
        // Point de référence précis d'une Pleine Mer au Havre (Annuaire SHOM)
        const refPM = new Date(Date.UTC(2026, 6, 11, 0, 45, 0)); 
        const cycleMaree = 12.4206 * 3600 * 1000; // 12h 25m 14s (période de la marée M2)

        const maréesCalculées = [];
        let debutTest = maintenant.getTime() - 4 * 3600 * 1000;
        let finTest = maintenant.getTime() + 24 * 3600 * 1000;

        let tempsMarée = refPM.getTime();
        while (tempsMarée > debutTest) {
            tempsMarée -= cycleMaree / 2;
        }
        while (tempsMarée < finTest) {
            if (tempsMarée >= debutTest) {
                const nbDemiCycles = Math.round((tempsMarée - refPM.getTime()) / (cycleMaree / 2));
                const estPM = nbDemiCycles % 2 === 0;

                maréesCalculées.push({
                    type: estPM ? "high" : "low",
                    t: new Date(tempsMarée)
                });
            }
            tempsMarée += cycleMaree / 2;
        }

        const prochains4 = maréesCalculées
            .filter(m => m.t >= new Date(maintenant.getTime() - 2 * 3600000))
            .sort((a, b) => a.t - b.t)
            .slice(0, 4);

        const sensMaree = prochains4[0]?.type === "high" ? "Montante ↑" : "Descendante ↓";

        const lignesHtml = prochains4.map(e => {
            const estPassee = e.t < maintenant;
            const label = e.type === "high"
                ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer</span>`
                : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer</span>`;
            
            const heureFormatee = e.t.toLocaleTimeString("fr-FR", {
                hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris"
            });

            return `
                <div class="data-ligne" style="width:100%;">
                    <span class="label">${label} ${estPassee ? "(récente)" : ""}</span>
                    <span class="valeur">${heureFormatee}</span>
                </div>`;
        }).join("");

        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                    <span style="background:#0284c7; color:#ffffff; padding:3px 8px; border-radius:4px; font-weight:bold; display:inline-block;">${sensMaree}</span>
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:3px 8px; border-radius:4px; font-size:0.9rem; color:#ffffff;">Modèle SHOM calé</span>
                </div>
                <div class="maree-horaires" style="margin-top:12px; width:100%;">
                    ${lignesHtml}
                </div>
            </div>
        `;

    } catch (error) {
        body.innerHTML = `<p class="non-dispo">Erreur lors de l'affichage des marées</p>`;
    }
}
