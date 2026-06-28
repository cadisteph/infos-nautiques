// =======================================
// INFOS NAUTIQUES - V2
// js/marine.js — Houle (Open-Meteo Marine)
// =======================================

/**
 * Récupère l'état de la mer pour une coordonnée.
 * Retourne null si la zone n'est pas couverte (ex: Seine intérieure).
 */
async function recupererMarine(lat, lon) {
    const url = `https://marine-api.open-meteo.com/v1/marine`
        + `?latitude=${lat}&longitude=${lon}`
        + `&current=wave_height,wave_direction,wave_period,wind_wave_height`
        + `&timezone=Europe%2FParis`;

    const r = await fetch(url);
    if (!r.ok) return null; // zone non couverte (rivière, estuaire intérieur)

    const data = await r.json();
    if (data.error) return null;

    // Vérifie que les valeurs ne sont pas toutes nulles
    const c = data.current;
    if (c.wave_height === null && c.wave_period === null) return null;

    return c;
}

function afficherHoule(carte, mer, estLittoral) {
    if (!estLittoral || !mer) {
        carte.querySelector(".carte-body").innerHTML = `
            <p class="non-dispo">Données non disponibles pour ce point</p>
        `;
        return;
    }

    const dir = directionInfo(mer.wave_direction);
    const h = mer.wave_height !== null ? mer.wave_height.toFixed(1) + " m" : "--";
    const p = mer.wave_period !== null ? mer.wave_period.toFixed(0) + " s" : "--";

    carte.querySelector(".carte-body").innerHTML = `
        <div class="val-principal">${h}</div>
        <div class="data-ligne">
            <span class="label">Période</span>
            <span class="valeur">${p}</span>
        </div>
        <div class="data-ligne">
            <span class="label">Direction</span>
            <span class="valeur">${dir.fleche} ${dir.long}</span>
        </div>
    `;
}
