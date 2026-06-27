// =======================================
// INFOS NAUTIQUES - V2 CORRIGÉ BADGE
// js/marees.js
// Calcul harmonique LOCAL — aucune API
// Sources: constantes TICON / annuaire SHOM
// Licence données: CC BY 4.0
// =======================================

const EPOCH_MS = Date.UTC(1970, 0, 1); // référence UTC

/**
 * Prédit la hauteur d'eau à un instant t (Date UTC).
 * h(t) = datum + Σ amp * cos(speed * t_h - phase)
 */
function predireHauteur(mareeData, t) {
    const t_h = (t.getTime() - EPOCH_MS) / 3600000; // heures depuis epoch
    let h = mareeData.datum;
    for (const c of mareeData.constituants) {
        const arg = c.speed * t_h - c.phase;
        h += c.amp * Math.cos(arg * Math.PI / 180);
    }
    return h;
}

/**
 * Génère une série horaire toutes les 5 min sur `heures` heures
 */
function genererSerie(mareeData, debut, heures = 36) {
    const serie = [];
    const PAS_MS = 5 * 60 * 1000; // 5 minutes
    const n = Math.ceil((heures * 60) / 5);
    
    // Correction ici : on s'assure d'avoir un timestamp propre au départ
    let currentTimestamp = Math.floor(debut.getTime() / PAS_MS) * PAS_MS;
    
    for (let i = 0; i < n; i++) {
        const t = new Date(currentTimestamp);
        serie.push({ 
            t: t, // On passe une instance unique de Date pour chaque ligne
            h: predireHauteur(mareeData, t) 
        });
        currentTimestamp += PAS_MS;
    }
    return serie;
}

/**
 * Détecte les extrema (PM/BM) dans la série
 */
function detecterExtrema(serie) {
    const extrema = [];
    for (let i = 1; i < serie.length - 1; i++) {
        const prev = serie[i - 1].h;
        const curr = serie[i].h;
        const next = serie[i + 1].h;
        if (curr > prev && curr > next) {
            extrema.push({ type: "high", t: serie[i].t, h: curr });
        } else if (curr < prev && curr < next) {
            extrema.push({ type: "low", t: serie[i].t, h: curr });
        }
    }
    return extrema;
}

/**
 * Calcule le coefficient de marée (~SHOM) à partir de PM et BM du cycle.
 */
function calculerCoefficient(pm_h, bm_h, datum) {
    const marnage = pm_h - bm_h;
    // Approximation du marnage moyen de morte-eau (ME) et vive-eau (VE) basé sur le datum local
    const marnage_me = datum * 0.55;  
    const marnage_ve = datum * 1.65;  
    const coeff = 20 + Math.round((marnage - marnage_me) / (marnage_ve - marnage_me) * 100);
    return Math.max(20, Math.min(120, coeff));
}

/**
 * Statut courant : montante / descendante + hauteur actuelle
 */
function statutCourant(serie) {
    const now = new Date();
    for (let i = 1; i < serie.length; i++) {
        if (serie[i].t >= now) {
            const delta = serie[i].h - serie[i - 1].h;
            const ratio = (now - serie[i - 1].t) / (serie[i].t - serie[i - 1].t);
            const hauteur = serie[i - 1].h + ratio * (serie[i].h - serie[i - 1].h);
            return {
                sens: delta > 0 ? "Montante ↑" : "Descendante ↓",
                hauteur: hauteur.toFixed(2)
            };
        }
    }
    return { sens: "—", hauteur: null };
}

/**
 * Calcule et affiche la carte marée
 */
function calculerEtAfficherMarees(carte, mareeData, estLittoral) {
    const body = carte.querySelector(".carte-body");

    if (!estLittoral || !mareeData) {
        body.innerHTML = `<p class="non-dispo">Zone fluviale — données de marée non disponibles</p>`;
        return;
    }

    const now = new Date();
    const debut = new Date(now.getTime() - 6 * 3600000); 
    const serie = genererSerie(mareeData, debut, 36);
    const extrema = detecterExtrema(serie);
    const { sens, hauteur } = statutCourant(serie);

    const limiteFutur = new Date(now.getTime() - 2 * 3600000);
    const futurEtRecent = extrema.filter(e => e.t > limiteFutur);
    const prochains4 = futurEtRecent.slice(0, 4);

    let coeff = null;
    const pms = extrema.filter(e => e.type === "high");
    const bms = extrema.filter(e => e.type === "low");
    if (pms.length > 0 && bms.length > 0) {
        coeff = calculerCoefficient(pms[0].h, bms[0].h, mareeData.datum);
    }

    // FIX : On ajoute précisément la classe unique 'badge-coeff' ici
    let badgeCoeff = "";
    if (coeff !== null) {
        badgeCoeff = `<span class="badge-coeff">Coeff ${coeff}</span>`;
    }

    const ligneHauteur = hauteur
        ? `<div class="data-ligne" style="border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:10px;margin-bottom:8px;">
               <span class="label">Hauteur actuelle</span>
               <span class="valeur" style="font-weight:bold;">${hauteur} m</span>
           </div>`
        : "";

    const lignesExtrema = prochains4.map(e => {
        const passee = e.t < now;
        const typeLabel = e.type === "high"
            ? `<span style="color:#38bdf8; font-weight:bold;">▲ Pleine mer</span>`
            : `<span style="color:#fdba74; font-weight:bold;">▼ Basse mer</span>`;
        
        const heure = e.t.toLocaleTimeString("fr-FR", {
            hour: "2-digit", minute: "2-digit"
        });
        return `
            <div class="data-ligne" style="${passee ? "opacity:0.4; font-style:italic;" : ""}">
                <span class="label">${typeLabel} ${passee ? "(passée)" : ""}</span>
                <span class="valeur">${heure} — ${e.h.toFixed(2)} m</span>
            </div>`;
    }).join("");

    body.innerHTML = `
        <div style="width:100%">
            <div class="maree-statut" style="display:flex; gap:10px; margin-bottom:12px;">
                <span style="background:#ffffff; color:#1e293b; padding:3px 8px; border-radius:4px; font-weight:bold; display:inline-block;">${sens}</span>
                ${badgeCoeff}
            </div>
            <div class="maree-horaires" style="margin-top:12px;">
                ${ligneHauteur}
                ${lignesExtrema || '<p class="non-dispo">Aucun extrême trouvé</p>'}
            </div>
            <div style="text-align:right;margin-top:8px;font-size:0.7rem;color:rgba(255,255,255,0.4);">
                Calcul astronomique local · Sources : TICON / SHOM
            </div>
        </div>
    `;
}