// File: js/config.js
// Desc: Réglages de l'expérience (CFG) et constantes physiques de base.
// Version 1.0.3
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - Cloud disk radius matches holes + exterior polar grid (~32 km), not 125 km.
// - vertigo: focal change also dollies the observer (keeps framing).

/* ============================================================================
   MODÈLE
   ----------------------------------------------------------------------------
   Unités : mètres. Œil à (0, 1.7, 0), regard tournable.
   Le Soleil est une DIRECTION, pas un point : toutes les colonnes de lumière
   reçoivent EXACTEMENT le même vecteur directeur (voir rebuildBeams, js/rendu/colonnes.js).
   Rien dans le code ne les fait s'écarter. Ce que l'on voit à l'écran est donc
   uniquement le fait de la projection.
   ========================================================================== */
const CFG = {
  el:20, az:0, H:3700, density:49, clouds:true,
  diverge:true, dist:100, fov:52, ortho:false, axes:false, vp:true,
  vertigo:true};   // focale + travelling compensé (js/ui.js)
const SUN_ANG_RADIUS = 0.265*Math.PI/180;              // 0,53° de diamètre
// Disque nuageux : même étendue que la spirale de trous (2,4 → 26 km, js/trous.js)
// et que la grille polaire de la vue extérieure. Un rayon de 125 km (fondu
// 80–120 km) recouvrait tout le ciel depuis le sol — bord à atan(H/R) ≈ 3°
// d'élévation à 6 km d'altitude — alors que la vue extérieure lit un disque
// d'environ 30 km. Le ciel au-delà du bord doit rester le dôme, pas du nuage.
const CLOUD_R     = 32000;   // rayon géométrique du disque (m)
const CLOUD_FADE0 = 28000;   // début du fondu du bord
const CLOUD_FADE1 = 32000;   // plus de nuage au-delà
