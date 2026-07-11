// =======================================
// INFOS NAUTIQUES - VERSION AUTONOME PERPÉTUELLE
// js/marees.js — Zéro API - Calcul Temporel Dynamique
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

        // Sécurité zone fluviale
        if (vActuelle.categorie === "Seine") {
            body.innerHTML = `<p class="non-dispo" style="color: #94a3b8; font-style: italic; text-align: center; margin: 15px 0; width:100%;">Zone fluviale — données de marée non disponibles</p>`;
            return;
        }

        // 2. Initialisation des dates (Aujourd'hui en temps réel)
        const maintenant = new Date();
        
        // Point de référence connu et stable pour la Normandie (Pleine mer de base)
        const refPM = new Date(Date.UTC(2026, 6, 11, 0, 45, 0)); 
        const cycleMaree = 12.4206 * 3600 * 1000; // Cycle maritimme de 12h 25m 14s

        // Décalages locaux estimés en minutes selon la ville
        let decalageMinutes = 0;
        const nomMinuscule = vActuelle.nom.toLowerCase();
        if (nomMinuscule.includes("étretat")) decalageMinutes = -10;
        if (nomMinuscule.includes("fécamp")) decalageMinutes = -5;
        if (nomMinuscule.includes("dieppe")) decalageMinutes = +30;
        if (nomMinuscule.includes("tréport")) decalageMinutes = +45;

        const maréesCalculées = [];
        const debutFenetre = maintenant.getTime() - 3 * 3600 * 1000; // -3h dans le passé
        const finFenetre = maintenant.getTime() + 24 * 3600 * 1000;  // +24h dans le futur

        // Calage de la boucle de calcul avant la fenêtre
        let tMaree = refPM.getTime() + (decalageMinutes * 60 * 1000);
        while (tMaree > debutFenetre) {
            tMaree -= cycleMaree / 2;
        }

        // Génération des marées sur 24 heures glissantes
        while (tMaree < finFenetre) {
            if (tMaree >= debutFenetre) {
                const nbDemiCycles = Math.round((tMaree - (refPM.getTime() + (decalageMinutes * 60 * 1000))) / (cycleMaree / 2));
                const estPM = nbDemiCycles % 2 === 0;

                maréesCalculées.push({
                    type: estPM ? "high" : "low",
                    t: new Date(tMaree)
                });
            }
            tMaree += cycleMaree / 2;
        }

        // Tri et conservation des 4 prochains horaires
        const prochains4 = maréesCalculées
            .filter(m => m.t >= new Date(maintenant.getTime() - 2 * 3600000))
            .sort((a, b) => a.t - b.t)
            .slice(0, 4);

        if (prochains4.length === 0) throw new Error("Erreur d'indexation du temps");

        const sensMaree = prochains4[0].type === "high" ? "Montante ↑" : "Descendante ↓";

        // 3. Génération de l'affichage HTML
        const lignesHtml = prochains4.map(e => {
            const estPassee = e.t < maintenant;
            const label = e.type === "high"
                ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer</span>`
                : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer</span>`;
            
            const heureFormatee = e.t.toLocaleTimeString("fr-FR", {
                hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris"
            });

            return `
                <div class="data-ligne" style="width:100%; display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); ${estPassee ? "opacity:0.4; font-style:italic;" : ""}">
                    <span class="label">${label} ${estPassee ? "(récente)" : ""}</span>
                    <span class="valeur" style="color: #ffffff; font-weight: 500;">${heureFormatee}</span>
                </div>`;
        }).join("");

        body.innerHTML = `
            <div style="width:100%">
                <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                    <span style="background:#0284c7; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:bold; display:inline-block; font-size:0.9rem;">${sensMaree}</span>
                    <span class="badge-coeff" style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px; font-size:0.9rem; color:#ffffff; font-weight:500;">Calcul Dynamique Interne</span>
                </div>
                <div class="maree-horaires" style="margin-top:12px; width:100%;">
                    ${lignesHtml}
                </div>
            </div>
        `;

    } catch (error) {
        body.innerHTML = `
            <div style="width:100%; text-align:center; padding:10px;">
                <p style="color:#f87171; font-weight:bold; margin-bottom:4px;">❌ Calcul des horaires impossible</p>
                <p style="font-size:0.75rem; color:rgba(255,255,255,0.5);">${error.message}</p>
            </div>`;
    }
}
