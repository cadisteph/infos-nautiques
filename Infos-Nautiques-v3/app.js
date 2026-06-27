// =======================================
// INFOS NAUTIQUES - V5
// js/app.js — Orchestration principale
// =======================================

const elListeVilles  = document.getElementById("listeVilles");
const elAccueil      = document.getElementById("accueil");
const elPageVille    = document.getElementById("pageVille");
const elNomVille     = document.getElementById("nomVille");
const elUpdateTime   = document.getElementById("updateTime");
const elHomeBtn      = document.getElementById("homeBtn");
const elRetourBtn    = document.getElementById("retour");

const elCarteMeteo   = document.getElementById("carteMeteo");
const elCarteVent    = document.getElementById("carteVent");
const elCarteHoule   = document.getElementById("carteHoule");
const elCarteMaree   = document.getElementById("carteMaree");

let villes = [];

async function chargerVilles() {
    try {
        const r = await fetch("data/villes.json");
        villes = await r.json();
        afficherVilles();
    } catch (e) {
        elListeVilles.innerHTML = "<p>Impossible de charger les villes.</p>";
    }
}

function afficherVilles() {
    elListeVilles.innerHTML = "";
    let catCourante = "";
    villes.forEach(v => {
        if (v.categorie !== catCourante) {
            catCourante = v.categorie;
            const h2 = document.createElement("h2");
            h2.className = "categorie";
            h2.textContent = catCourante === "Littoral" ? "🌊 Littoral" : "🚢 Seine";
            elListeVilles.appendChild(h2);
        }
        const btn = document.createElement("button");
        btn.className = "ville";
        btn.textContent = "📍 " + v.nom;
        btn.addEventListener("click", () => ouvrirVille(v));
        elListeVilles.appendChild(btn);
    });
}

async function ouvrirVille(ville) {
    elAccueil.style.display   = "none";
    elPageVille.style.display = "block";
    elHomeBtn.style.display   = "inline-block";
    elNomVille.textContent    = "📍 " + ville.nom;
    elUpdateTime.textContent  = "Chargement...";

    const estLittoral = ville.categorie === "Littoral";

    // --- GESTION DES WEBCAMS : INJECTION HTML DIRECTE ---
    try {
        let elCarteWebcam = document.getElementById("carteWebcam");
        if (!elCarteWebcam) {
            const cartes = document.querySelectorAll(".carte, .card");
            cartes.forEach(c => {
                if (c.textContent.toUpperCase().includes("WEBCAM")) elCarteWebcam = c;
            });
        }

        if (elCarteWebcam) {
            let bodyWebcam = elCarteWebcam.querySelector(".carte-body, .card-body") || elCarteWebcam;
            bodyWebcam.innerHTML = ""; 
            
            if (ville.webcams && ville.webcams.length > 0) {
                let htmlBrut = `<div style="padding: 5px; display: flex; flex-direction: column; gap: 10px; width: 100%;">`;
                
                ville.webcams.forEach(cam => {
                    htmlBrut += `
                        <div style="padding: 12px; background: #2a3b5c; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.4); text-align: left;">
                            <a href="${cam.url}" target="_blank" style="color: #ffffff !important; text-decoration: none !important; font-weight: bold; display: block; width: 100%;">
                                ${cam.titre}
                            </a>
                        </div>`;
                });
                
                htmlBrut += `</div>`;
                bodyWebcam.innerHTML = htmlBrut;
            } else {
                bodyWebcam.innerHTML = `<p style="color: rgba(255,255,255,0.4); font-style: italic; font-size: 0.9rem; text-align: center; margin-top: 5px;">Aucune caméra disponible pour cette commune</p>`;
            }
        }
    } catch (e) {
        console.error("Erreur lors du chargement des webcams :", e);
    }

    // 1. Reset des loaders graphiques pour les autres cartes
    ["carteMeteo","carteVent","carteHoule","carteMaree"].forEach(id => {
        const carte = document.getElementById(id);
        if (carte) {
            carte.querySelector(".carte-body").innerHTML = '<span class="loader"></span>';
        }
    });

    // 2. Calcul local des marées (À sa place initiale pour éviter les bugs)
    try {
        calculerEtAfficherMarees(elCarteMaree, ville.maree, estLittoral);
    } catch (error) {
        console.error("Erreur lors du calcul local de la marée :", error);
        elCarteMaree.querySelector(".carte-body").innerHTML = 
            '<p class="erreur">❌ Impossible de calculer la marée localement</p>';
    }

    // --- DÉPLACEMENT DYNAMIQUE SANS CASSER LE CALCUL ---
    // On prend la carte marée calculée et on l'insère juste après la carte météo
    try {
        if (elCarteMeteo && elCarteMaree) {
            elCarteMeteo.insertAdjacentElement('afterend', elCarteMaree);
        }
    } catch (err) {
        console.error("Erreur lors de la réorganisation des cartes :", err);
    }

    // 3. Récupération Météo & Données Marines
    const [meteo, mer] = await Promise.allSettled([
        recupererMeteo(ville.latitude, ville.longitude),
        recupererMarine(ville.latitude, ville.longitude),
    ]);

    if (meteo.status === "fulfilled") {
        afficherMeteo(elCarteMeteo, meteo.value);
        afficherVent(elCarteVent, meteo.value);
    } else {
        elCarteMeteo.querySelector(".carte-body").innerHTML =
            '<p class="erreur">❌ Météo indisponible</p>';
        elCarteVent.querySelector(".carte-body").innerHTML =
            '<p class="erreur">❌ Vent indisponible</p>';
    }

    afficherHoule(
        elCarteHoule,
        mer.status === "fulfilled" ? mer.value : null,
        estLittoral
    );

    elUpdateTime.textContent = "Mis à jour à " + maintenant();
}

function retourAccueil() {
    elPageVille.style.display = "none";
    elAccueil.style.display   = "block";
    elHomeBtn.style.display   = "none";
}

elRetourBtn.addEventListener("click", retourAccueil);
elHomeBtn.addEventListener("click", retourAccueil);

chargerVilles();

function maintenant() {
    const d = new Date();
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}