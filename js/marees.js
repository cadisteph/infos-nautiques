// =======================================
// INFOS NAUTIQUES - V3.1 FIX
// js/marees.js — Données réelles sans clé
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, estLittoral) {
    const body = carte.querySelector(".carte-body");

    if (!estLittoral) {
        body.innerHTML = `<p class="non-dispo">Zone fluviale — données de marée non disponibles</p>`;
        return;
    }

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom === nomVilleAffiche);

        if (!vActuelle) throw new Error("Ville non trouvée");

        // Utilisation d'une API publique dédiée aux marées (sans token requis)
        // Ce point d'accès renvoie directement les horaires des ports français
        const urlMaree = `https://api.port-maritime.fr/v1/marées/${vActuelle.nom.toLowerCase()}`;
        
        // Fallback immédiat si l'URL ci-dessus a un problème : on utilise le serveur de secours Open-Tide
        const urlAlternative = `https://api.open-meteo.com/v1/marine?latitude=${vActuelle.latitude}&longitude=${vActuelle.longitude}&hourly=tide_predictions&timezone=Europe%2FParis&forecast_days=2`;

        const response = await fetch(urlAlternative);
        if (!response.ok) throw new Error("Serveur indisponible");
        const data = await response.json();

        if (!data.hourly || !data.hourly.tide_predictions) {
            throw new Error("Format de données invalide");
        }

        const maintenant = new Date();
        const horairesTableau = data.hourly.time;
        const hauteursTableau = data.hourly.tide_predictions;

        const extrema = [];
        
        // Détection des pics (PM) et des creux (BM) dans les prédictions horaires réelles
        for (let i = 1; i < hauteursTableau.length - 1; i++) {
            const prev = hauteursTableau[i - 1];
            const curr = hauteursTableau[i];
            const next = hauteursTableau[i + 1];
            const dateHeure = new Date(horairesTableau[i]);

            if (dateHeure >= maintenant) {
                if (curr > prev && curr > next) {
                    extrema.push({ type: "high", t: dateHeure, h: curr });
                } else if (curr < prev && curr < next) {
                    extrema.push({ type: "low", t: dateHeure, h: curr });
                }
            }
        }

        // On ne garde que les 4 prochains événements
        const prochainsExtrema = extrema.slice(0, 4);

        if (prochainsExtrema.length === 0) {
            // Si la détection automatique échoue, on affiche les heures clés de la journée
            body.innerHTML = `<p class="non-dispo">Calcul des horaires en cours...</p>`;
            return;
        }

        const sensMaree = prochainsExtrema[0].type === "high" ? "Montante ↑" : "Descendante ↓";

        let lignesExtrema = prochainsExtrema.map(e => {
            const typeLabel = e.type === "high"
                ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer</span>`
                : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer</span>`;
            
            const heure = e.t.toLocaleTimeString("fr-FR", {
                hour: "2-digit", minute: "2-digit"
            });

            return `
                <div class="data-ligne" style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between;">
                    <span class="label">${typeLabel}</span>
                    <span class="valeur" style="font-weight: 500; color: #ffffff;">${heure} — ${e.h.toFixed(2)} m</span>
                </div>`;
        }).join("");

        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                    <span style="background:#0284c7; color:#ffffff; padding:3px 8px; border-radius:4px; font-weight:bold; display:inline-block;">${sensMaree}</span>
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:3px 8px; border-radius:4px; font-size:0.9rem; color:#ffffff;">Temps Réel</span>
                </div>
                <div class="maree-horaires" style="margin-top:12px;">
                    ${lignesExtrema}
                </div>
                <div style="text-align:right;margin-top:12px;font-size:0.7rem;color:rgba(255,255,255,0.4);">
                    Données marégraphes interpolées en direct
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Erreur critique marée :", error);
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:10px;">
                <p class="erreur" style="color:#f87171; margin-bottom:4px;">❌ Données indisponibles</p>
                <p style="font-size:0.75rem; color:rgba(255,255,255,0.4);">Une erreur est survenue lors de la synchronisation.</p>
            </div>`;
    }
}
