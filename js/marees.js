// =======================================
// INFOS NAUTIQUES - AUTOMATISATION MONDIALE
// js/marees.js — Service CO-OPS sans clé
// =======================================

async function calculerEtAfficherMarees(carte, mareeDataAncienne, argumentInutile) {
    const body = carte.querySelector(".carte-body");
    if (!body) return;

    const nomVilleAffiche = document.getElementById("nomVille").textContent.replace("📍 ", "").trim();
    
    try {
        // 1. Lecture de ton fichier villes.json
        const rVilles = await fetch("data/villes.json");
        const liste = await rVilles.json();
        const vActuelle = liste.find(v => v.nom.trim().toLowerCase() === nomVilleAffiche.toLowerCase());

        if (!vActuelle) {
            throw new Error(`Ville "${nomVilleAffiche}" introuvable`);
        }

        // Sécurité zone fluviale (Seine)
        if (vActuelle.categorie === "Seine") {
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Zone fluviale — données de marée non disponibles</p>`;
            return;
        }

        // 2. Préparation des dates dynamiques (Aujourd'hui et Demain)
        const maintenant = new Date();
        const demain = new Date(maintenant.getTime() + 24 * 3600 * 1000);
        
        const formatDate = (d) => d.toISOString().split('T')[0].replace(/-/g, '');
        const dateDebut = formatDate(maintenant);
        const dateFin = formatDate(demain);

        // 3. Appel de l'API Océanique CO-OPS (Service public international, sans clé)
        // Calé sur les coordonnées GPS précises de ta ville normande
        const lat = vActuelle.latitude;
        const lon = vActuelle.longitude;
        const urlAPI = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${dateDebut}&end_date=${dateFin}&lat=${lat}&lon=${lon}&product=predictions&datum=MLLW&units=metric&time_zone=lst_ldt&format=json&interval=hilo`;

        const response = await fetch(urlAPI);
        if (!response.ok) throw new Error(`Serveur océanique indisponible (HTTP ${response.status})`);
        
        const data = await response.json();
        
        if (!data.predictions || data.predictions.length === 0) {
            throw new Error("Pas de données pour cette zone côtière");
        }

        const maréesRéelles = [];

        // 4. Extraction des données (H = High/Pleine Mer, L = Low/Basse Mer)
        data.predictions.forEach(m => {
            // Le format de date renvoyé est "YYYY-MM-DD HH:MM"
            const dateFormatee = m.t.replace(/-/g, '/'); 
            maréesRéelles.push({
                type: m.type === "H" ? "high" : "low",
                t: new Date(dateFormatee),
                h: parseFloat(m.v)
            });
        });

        // Filtrage des 4 prochaines marées (-2h dans le passé)
        const prochains4 = maréesRéelles
            .filter(m => m.t >= new Date(maintenant.getTime() - 2 * 3600000))
            .sort((a, b) => a.t - b.t)
            .slice(0, 4);

        if (prochains4.length === 0) throw new Error("Aucun horaire proche trouvé");

        const sensMaree = prochains4[0].type === "high" ? "Montante ↑" : "Descendante ↓";

        // 5. Rendu HTML
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
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px; font-size:0.9rem; color:#ffffff; font-weight:500;">Données Océaniques Globales</span>
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
