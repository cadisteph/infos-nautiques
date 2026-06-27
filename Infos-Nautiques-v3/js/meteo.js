// =======================================
// INFOS NAUTIQUES - V4
// js/meteo.js — Météo (Actuelle + Horaire)
// =======================================

function kmhEnNoeuds(kmh) {
    if (kmh === null || kmh === undefined) return 0;
    return Math.round(kmh / 1.852);
}

function kmhEnBeaufort(kmh) {
    if (kmh === null || kmh === undefined) return 0;
    if (kmh < 1) return 0;
    if (kmh <= 5) return 1;
    if (kmh <= 11) return 2;
    if (kmh <= 19) return 3;
    if (kmh <= 28) return 4;
    if (kmh <= 38) return 5;
    if (kmh <= 49) return 6;
    if (kmh <= 61) return 7;
    if (kmh <= 74) return 8;
    if (kmh <= 88) return 9;
    if (kmh <= 102) return 10;
    if (kmh <= 117) return 11;
    return 12;
}

// Code WMO vers Émojis et descriptions météo
function interpreterCodeWMO(code, estNuit = false) {
    const mapping = {
        0: { texte: "Ciel dégagé", icone: estNuit ? "🌙" : "☀️" },
        1: { texte: "Principalement dégagé", icone: estNuit ? "🌤️" : "🌤️" },
        2: { texte: "Partiellement nuageux", icone: estNuit ? "⛅" : "⛅" },
        3: { texte: "Couvert", icone: "☁️" },
        45: { texte: "Brouillard", icone: "🌫️" },
        48: { texte: "Brouillard givrant", icone: "🌫️" },
        51: { texte: "Bruine légère", icone: "🌧️" },
        53: { texte: "Bruine modérée", icone: "🌧️" },
        55: { texte: "Bruine dense", icone: "🌧️" },
        61: { texte: "Pluie faible", icone: "🌧️" },
        63: { texte: "Pluie modérée", icone: "🌧️" },
        65: { texte: "Pluie forte", icone: "🌧️" },
        71: { texte: "Neige faible", icone: "🌨️" },
        73: { texte: "Neige modérée", icone: "🌨️" },
        75: { texte: "Neige forte", icone: "🌨️" },
        80: { texte: "Averses de pluie faibles", icone: "🌦️" },
        81: { texte: "Averses de pluie modérées", icone: "🌦️" },
        82: { texte: "Averses de pluie violentes", icone: "🌧️" },
        95: { texte: "Orage", icone: "⛈️" },
        96: { texte: "Orage avec grêle faible", icone: "⛈️" },
        99: { texte: "Orage avec grêle forte", icone: "⛈️" }
    };
    return mapping[code] || { texte: "Nuageux", icone: "☁️" };
}

function directionInfo(deg) {
    if (deg === null || deg === undefined) return { court: "N/A", long: "Inconnu", fleche: "◦" };
    const d = Math.round(deg);
    if (d >= 337.5 || d < 22.5)   return { court: "N",   long: "Nord",            fleche: "⬇️" };
    if (d >= 22.5  && d < 67.5)   return { court: "N-E", long: "Nord-Est",        fleche: "↙️" };
    if (d >= 67.5  && d < 112.5)  return { court: "E",   long: "Est",             fleche: "⬅️" };
    if (d >= 112.5 && d < 157.5)  return { court: "S-E", long: "Sud-Est",        fleche: "↖️" };
    if (d >= 157.5 && d < 202.5)  return { court: "S",   long: "Sud",             fleche: "⬆️" };
    if (d >= 202.5 && d < 247.5)  return { court: "S-O", long: "Sud-Ouest",      fleche: "↗️" };
    if (d >= 247.5 && d < 292.5)  return { court: "O",   long: "Ouest",           fleche: "➡️" };
    if (d >= 292.5 && d < 337.5)  return { court: "N-O", long: "Nord-Ouest",      fleche: "↘️" };
    return { court: "N/A", long: "Inconnu", fleche: "◦" };
}

async function recupererMeteo(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,weather_code&timezone=Europe%2FParis&forecast_days=2`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("Erreur API météo " + r.status);
    return await r.json();
}

function afficherMeteo(carte, donneesMeteo) {
    const actuelle = donneesMeteo.current;
    const horaire = donneesMeteo.hourly;
    
    const infoActuelle = interpreterCodeWMO(actuelle.weather_code);
    
    const maintenant = new Date();
    const heureActuelleBrute = maintenant.getHours();
    
    let indexDepart = horaire.time.findIndex(t => {
        const d = new Date(t);
        return d.getDate() === maintenant.getDate() && d.getHours() === heureActuelleBrute;
    });
    if (indexDepart === -1) indexDepart = 0;

    let htmlHoraires = "";
    for (let i = 0; i < 6; i++) {
        const idx = indexDepart + i;
        if (!horaire.time[idx]) break;

        const dateHeure = new Date(horaire.time[idx]);
        let hLabel = dateHeure.getHours() + " h";

        const heureLigne = dateHeure.getHours();
        const estNuit = (heureLigne >= 22 || heureLigne <= 6);
        const infoH = interpreterCodeWMO(horaire.weather_code[idx], estNuit);

        htmlHoraires += `
            <div style="flex: 0 0 60px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                <span style="font-size: 0.85rem; color: #64748b; font-weight: 500; display: block !important; visibility: visible !important;">${hLabel}</span>
                <span style="font-size: 1.6rem; line-height: 1; display: block !important; margin: 2px 0;">${infoH.icone}</span>
                <span style="font-size: 1.05rem; font-weight: bold; color: #1e293b; display: block !important; visibility: visible !important;">${Math.round(horaire.temperature_2m[idx])}°</span>
            </div>
        `;
    }

    carte.querySelector(".carte-body").innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; width: 100%;">
            <div>
                <div style="font-size: 3rem; font-weight: bold; line-height: 1; color: #1e293b;">${Math.round(actuelle.temperature_2m)}°</div>
                <div style="font-size: 1rem; color: #475569; margin-top: 4px; font-weight: 500;">${infoActuelle.texte}</div>
            </div>
            <div style="font-size: 3rem;">${infoActuelle.icone}</div>
        </div>
        
        <div style="height: 1px; background: #e2e8f0; margin-bottom: 15px; width: 100%;"></div>

        <div style="display: flex; gap: 14px; width: 100%; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; -ms-overflow-style: none;">
            ${htmlHoraires}
        </div>
    `;
}

function afficherVent(carte, donneesMeteo) {
    const meteo = donneesMeteo.current;
    const dir = directionInfo(meteo.wind_direction_10m);
    const kmh = Math.round(meteo.wind_speed_10m);
    const noeuds = kmhEnNoeuds(meteo.wind_speed_10m);
    const beaufort = kmhEnBeaufort(meteo.wind_speed_10m);

    let rafalesHtml = "";
    if (meteo.wind_gusts_10m) {
        const rafKmh = Math.round(meteo.wind_gusts_10m);
        const rafNoeuds = kmhEnNoeuds(meteo.wind_gusts_10m);
        const rafBeaufort = kmhEnBeaufort(meteo.wind_gusts_10m);
        
        rafalesHtml = `
            <div class="data-ligne" style="border-top: 1px solid rgba(0,0,0,0.06); margin-top: 5px; padding-top: 5px;">
                <span class="label">Rafales</span>
                <span class="valeur" style="color: #1e293b;">${rafKmh} km/h (${rafNoeuds} kt) - F${rafBeaufort}</span>
            </div>`;
    }

    carte.querySelector(".carte-body").innerHTML = `
        <div class="fleche-vent" style="font-size: 2rem; margin-bottom: 5px;" title="${dir.long}">${dir.fleche}</div>
        <div class="val-principal" style="font-size: 2.2rem; font-weight: bold; color: #1e293b;">F${beaufort} <span style="font-size: 1.2rem; font-weight: normal; color: #475569;">Beaufort</span></div>
        <div class="val-label" style="font-weight: bold; color: #0284c7; margin-bottom: 10px;">${noeuds} nœuds (kt)</div>
        
        <div class="data-ligne">
            <span class="label">Vitesse</span>
            <span class="valeur" style="color: #1e293b;">${kmh} km/h</span>
        </div>
        <div class="data-ligne">
            <span class="label">Direction</span>
            <span class="valeur" style="color: #1e293b;">${dir.court} (${meteo.wind_direction_10m}°)</span>
        </div>
        ${rafalesHtml}
    `;
}

function descriptionMeteo(code) {
    return interpreterCodeWMO(code).texte;
}