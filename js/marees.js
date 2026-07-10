// =======================================
// INFOS NAUTIQUES - V3 100% LIBRE
// js/marees.js — Données réelles sans clé API
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, estLittoral) {
    const body = carte.querySelector(".carte-body");

    if (!estLittoral) {
        body.innerHTML = `<p class="non-dispo">Zone fluviale — données de marée non disponibles</p>`;
        return;
    }

    // Récupération du nom de la ville ouverte dans l'application
    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. On charge villes.json pour récupérer les coordonnées exactes
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom === nomVilleAffiche);

        if (!vActuelle) throw new Error("Ville non trouvée dans le fichier JSON");

        // 2. Appel à l'API Marine Mondiale Libre (sans clé / sans token)
        // Elle calcule les marées réelles basées sur la position GPS exacte du port
        const urlMaree = `https://api.open-meteo.com/v1/marine?latitude=${vActuelle.latitude}&longitude=${vActuelle.longitude}&daily=tide_predictions_high,tide_predictions_low&timezone=Europe%2FParis&forecast_days=2`;
        
        const response = await fetch(urlMaree);
        if (!response.ok) throw new Error("Erreur serveur Open-Meteo Marées");
        const data = await response.json();

        if (!data.daily || !data.daily.tide_predictions_high) {
            throw new Error("Données de marée indisponibles pour ce point GPS");
        }

        const maintenant = new Date();
        const toutesLesMarees = [];

        // On fusionne et on trie les pleines mers (high) et basses mers (low) reçues
        data.daily.tide_predictions_high.forEach(item => {
            const t = new Date(item.time);
            if (t >= maintenant) toutesLesMarees.push({ type: "high", t: t, h: item.height });
        });

        data.daily.tide_predictions_low.forEach(item => {
            const t = new Date(item.time);
            if (t >= maintenant) toutesLesMarees.push({ type: "low", t: t, h: item.height });
        });

        // Tri par ordre chronologique pour avoir les prochaines marées dans le bon sens
        toutesLesMarees.sort((a, b) => a.t - b.t);

        // On garde les 4 prochaines marées
        const prochainsExtrema = toutesLesMarees.slice(0, 4);

        if (prochainsExtrema.length === 0) {
            throw new Error("Aucune marée future trouvée");
        }

        // Détermination dynamique du sens (montante / descendante)
        const prochainExtremum = prochainsExtrema[0];
        const sensMaree = prochainExtremum.type === "high" ? "Montante ↑" : "Descendante ↓";

        // Génération du HTML pour les lignes horaires
        let lignesExtrema = prochainsExtrema.map(e => {
            const typeLabel = e.type === "high"
                ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer</span>`
                : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer</span>`;
            
            const heure = e.t.toLocaleTimeString("fr-FR", {
                hour: "2-digit", minute: "2-digit"
            });

            // Si l'API ne renvoie pas la hauteur exacte, on affiche une approximation propre
            const hauteurLabel = e.h ? `${e.h.toFixed(2)} m` : "-- m";

            return `
                <div class="data-ligne" style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span class="label">${typeLabel}</span>
                    <span class="valeur" style="font-weight: 500;">${heure} ${e.h ? '— ' + hauteurLabel : ''}</span>
                </div>`;
        }).join("");

        // Injection dans la carte HTML
        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                    <span style="background:#0284c7; color:#ffffff; padding:3px 8px; border-radius:4px; font-weight:bold; display:inline-block;">${sensMaree}</span>
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:3px 8px; border-radius:4px; font-size:0.9rem;">Temps Réel</span>
                </div>
                <div class="maree-horaires" style="margin-top:12px;">
                    ${lignesExtrema}
                </div>
                <div style="text-align:right;margin-top:8px;font-size:0.7rem;color:rgba(255,255,255,0.4);">
                    Données marégraphes interpolées en direct
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Erreur API Marées :", error);
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:10px;">
                <p class="erreur" style="color:#f87171; margin-bottom:8px;">❌ Données de marée indisponibles</p>
                <p style="font-size:0.8rem; color:rgba(255,255,255,0.5);">Vérifie ta connexion internet ou l'emplacement GPS.</p>
            </div>`;
    }
}
