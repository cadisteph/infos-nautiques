// =======================================
// INFOS NAUTIQUES - V8 FONCTIONNELLE
// js/marees.js — Données Open-Meteo Réelles
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, estLittoral) {
    const body = carte.querySelector(".carte-body");

    if (!estLittoral) {
        body.innerHTML = `<p class="non-dispo">Zone fluviale — données de marée non disponibles</p>`;
        return;
    }

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Coordonnées de secours si villes.json ne charge pas, ou lecture du JSON
        let latitude = 49.4938;  // Par défaut Le Havre
        let longitude = 0.1077;

        try {
            const rVilles = await fetch("data/villes.json");
            const liste = await rVilles.json();
            const vActuelle = liste.find(v => v.nom === nomVilleAffiche);
            if (vActuelle) {
                latitude = vActuelle.latitude;
                longitude = vActuelle.longitude;
            }
        } catch (e) {
            console.log("Utilisation des coordonnées par défaut pour Le Havre");
        }

       // 2. L'URL Open-Meteo Marine (Nettoyée et configurée pour GitHub Pages)
        const urlAPI = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&hourly=tide_predictions&timezone=Europe%2FParis&forecast_days=2`;
        
        const response = await fetch(urlAPI, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors'
        });
        
        if (!response.ok) throw new Error(`Erreur serveur HTTP ${response.status}`);

        const tempsId = data.hourly.time;
        const hauteurs = data.hourly.tide_predictions;
        const maintenant = new Date();
        const extrema = [];

        // 3. Calcul des pics (Pleine mer) et creux (Basse mer)
        for (let i = 1; i < hauteurs.length - 1; i++) {
            const hPrecedente = hauteurs[i - 1];
            const hActuelle    = hauteurs[i];
            const hSuivante   = hauteurs[i + 1];
            const dateHeure    = new Date(tempsId[i]);

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

        if (prochains4.length === 0) throw new Error("Aucune marée trouvée");

        const sensMaree = prochains4[0].type === "high" ? "Montante ↑" : "Descendante ↓";

        const lignesHtml = prochains4.map(e => {
            const estPassee = e.t < maintenant;
            const label = e.type === "high"
                ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer</span>`
                : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer</span>`;
            
            const heureFormatee = e.t.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

            return `
                <div class="data-ligne" style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; ${estPassee ? "opacity:0.4;" : ""}">
                    <span class="label">${label}</span>
                    <span class="valeur" style="font-weight: 500; color: #ffffff;">${heureFormatee} — ${e.h.toFixed(2)} m</span>
                </div>`;
        }).join("");

        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                    <span style="background:#0284c7; color:#ffffff; padding:3px 8px; border-radius:4px; font-weight:bold; display:inline-block;">${sensMaree}</span>
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:3px 8px; border-radius:4px; font-size:0.9rem; color:#ffffff;">Temps Réel</span>
                </div>
                <div class="maree-horaires" style="margin-top:12px;">
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
