// =======================================
// INFOS NAUTIQUES - V2
// js/utils.js — Fonctions utilitaires
// =======================================

/**
 * Convertit des degrés en direction cardinale (16 points)
 * avec flèche unicode et nom complet
 */
function directionInfo(degres) {
    if (degres === null || degres === undefined) return { court: "--", long: "--", fleche: "–" };

    const dirs = [
        { court: "N",   long: "Nord",           fleche: "↓" },
        { court: "NNE", long: "Nord-Nord-Est",   fleche: "↙" },
        { court: "NE",  long: "Nord-Est",        fleche: "↙" },
        { court: "ENE", long: "Est-Nord-Est",    fleche: "←" },
        { court: "E",   long: "Est",             fleche: "←" },
        { court: "ESE", long: "Est-Sud-Est",     fleche: "↖" },
        { court: "SE",  long: "Sud-Est",         fleche: "↖" },
        { court: "SSE", long: "Sud-Sud-Est",     fleche: "↑" },
        { court: "S",   long: "Sud",             fleche: "↑" },
        { court: "SSO", long: "Sud-Sud-Ouest",   fleche: "↗" },
        { court: "SO",  long: "Sud-Ouest",       fleche: "↗" },
        { court: "OSO", long: "Ouest-Sud-Ouest", fleche: "→" },
        { court: "O",   long: "Ouest",           fleche: "→" },
        { court: "ONO", long: "Ouest-Nord-Ouest",fleche: "↘" },
        { court: "NO",  long: "Nord-Ouest",      fleche: "↘" },
        { court: "NNO", long: "Nord-Nord-Ouest", fleche: "↓" },
    ];

    const idx = Math.round(degres / 22.5) % 16;
    return dirs[idx];
}

/**
 * Description météo à partir du WMO weather code
 */
function descriptionMeteo(code) {
    const map = {
        0:  "Ciel dégagé ☀️",
        1:  "Peu nuageux 🌤",
        2:  "Partiellement nuageux ⛅",
        3:  "Couvert ☁️",
        45: "Brouillard 🌫",
        48: "Brouillard givrant 🌫",
        51: "Bruine légère 🌦",
        53: "Bruine 🌦",
        55: "Bruine dense 🌦",
        61: "Pluie faible 🌧",
        63: "Pluie 🌧",
        65: "Forte pluie 🌧",
        71: "Neige faible ❄️",
        73: "Neige ❄️",
        75: "Forte neige ❄️",
        80: "Averses légères 🌦",
        81: "Averses 🌦",
        82: "Fortes averses 🌦",
        95: "Orage ⛈",
        96: "Orage avec grêle ⛈",
        99: "Orage violent ⛈",
    };
    return map[code] ?? "Conditions variables";
}

/**
 * Formater une heure ISO en HH:MM heure locale
 */
function heureLocale(isoString) {
    if (!isoString) return "--";
    const d = new Date(isoString);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Formater l'heure actuelle
 */
function maintenant() {
    return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
