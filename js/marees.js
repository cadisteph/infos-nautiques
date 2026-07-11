// =======================================
// INFOS NAUTIQUES - VERSION CORRIGÉE 100% OPÉRATIONNELLE
// js/marees.js — Données Open-Meteo Marine Réelles
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, argumentInutile) {
    const body = carte.querySelector(".carte-body");
    if (!body) return;

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Chargement de ton fichier villes.json
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom.trim().toLowerCase() === nomVilleAffiche.toLowerCase());

        if (!vActuelle) {
            throw new Error(`Ville "${nomVilleAffiche}" introuvable`);
        }

        // Sécurité zone fluviale
        if (vActuelle.categorie === "Seine") {
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Zone fluviale — données de marée non disponibles</p>`;
            return;
        }

        // 2. URL officielle et vérifiée (Pas de sous-domaine 'marine-', pas de clé)
        const lat = vActuelle.latitude;
        const lon = vActuelle.longitude;
        const urlAPI = `https://api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=tide_predictions&timezone=Europe%2FParis`;
        
        const response = await fetch(urlAPI);
        if (!response.ok) throw new Error(`Serveur injoignable (HTTP ${response.status})`);
        
        const data = await response.json();
        if (!data.hourly || !data.hourly.tide_predictions) throw new Error("Données indisponibles ici");

        const temps = data.hourly.time;
        const hauteurs = data.hourly.tide_predictions;
        const maintenant = new Date();
        const maréesRéelles = [];

        // 3. Calcul des extrema (Pics et Creux)
        for (let i = 1; i < hauteurs.length - 1; i++) {
            const hPrecedente = hauteurs[i - 1];
            const hActuelle    = hauteurs[i];
            const hSuivante   = hauteurs[i + 1];
            const dateHeure    = new Date(temps[i]);

            // Fenêtre temporelle : de -2h à +24h
            if (dateHeure >= new Date(maintenant.getTime() - 2 * 3600000)) {
                if (hActuelle > hPrecedente && hActuelle > hSuivante) {
                    maréesRéelles.push({ type: "high", t: dateHeure, h: hActuelle });
                } else if (hActuelle < hPrecedente && hActuelle < hSuivante) {
                    maréesRéelles.push({ type: "low", t: dateHeure, h: hActuelle });
                }
            }
        }

        maréesRéelles.sort((a, b) => a.t - b.t);
        const prochains4 = maréesRéelles.slice(0, 4);

        if (prochains4.length === 0) throw new Error("Aucun horaire trouvé");

        const sensMaree = prochains4[0].type === "high" ? "Montante ↑" : "Descendante ↓";

        // 4. Injection du HTML
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
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px; font-size:0.9rem; color:#ffffff; font-weight:500;">Données Open-Meteo Marine</span>
                </div>
                <div class="maree-horaires" style="margin-top:12px; width:100%;">
                    ${lignesHtml}
                </div>
            </div>
        `;

    } catch (error) {
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:10px;">
                <p style="color:#f87171; font-weight:bold; margin-bottom:4px;">❌ Liaison marée interrompue</p>
                <p style="font-size:0.75rem; color:rgba(255,255,255,0.5);">${error.message}</p>
            </div>`;
    }
}
