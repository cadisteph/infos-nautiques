// =======================================
// INFOS NAUTIQUES - V24 SÉCURISÉE
// js/marees.js — Données Littorales 76
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, argumentInutile) {
    const body = carte.querySelector(".carte-body");
    if (!body) return;

    // Récupération du nom de la ville depuis ton interface
    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Chargement de ton fichier villes.json
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom.trim().toLowerCase() === nomVilleAffiche.toLowerCase());

        if (!vActuelle) {
            throw new Error(`Ville "${nomVilleAffiche}" introuvable`);
        }

        // Vérification de ta catégorie
        if (vActuelle.categorie === "Seine") {
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Zone fluviale — données de marée non disponibles</p>`;
            return;
        }

        // 2. Appel du flux Marine open data (calé sur la Normandie)
        const lat = vActuelle.latitude;
        const lon = vActuelle.longitude;
        const urlAPI = `https://api.weatherapi.com/v1/marine.json?key=5c48b788df6743b4bb873045241107&q=${lat},${lon}`;
        
        const response = await fetch(urlAPI);
        if (!response.ok) throw new Error(`Serveur injoignable (HTTP ${response.status})`);
        
        const data = await response.json();
        
        if (!data.forecast || !data.forecast.forecastday || !data.forecast.forecastday[0].day.tides) {
            throw new Error("Données indisponibles pour ce point GPS");
        }

        const maintenant = new Date();
        const maréesBrutes = [];

        // Extraction des marées fournies pour aujourd'hui et demain
        data.forecast.forecastday.forEach(jour => {
            if (jour.day.tides && jour.day.tides[0] && jour.day.tides[0].tide) {
                jour.day.tides[0].tide.forEach(m => {
                    maréesBrutes.push({
                        type: m.tide_type.toLowerCase() === "high" ? "high" : "low",
                        t: new Date(m.tide_time),
                        h: parseFloat(m.tide_height_mt)
                    });
                });
            }
        });

        // Tri et filtrage des 4 prochaines marées
        const prochains4 = maréesBrutes
            .filter(m => m.t >= new Date(maintenant.getTime() - 2 * 3600000))
            .sort((a, b) => a.t - b.t)
            .slice(0, 4);

        if (prochains4.length === 0) throw new Error("Aucun horaire proche trouvé");

        const sensMaree = prochains4[0].type === "high" ? "Montante ↑" : "Descendante ↓";

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
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px; font-size:0.9rem; color:#ffffff; font-weight:500;">SHOM & Météo</span>
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
