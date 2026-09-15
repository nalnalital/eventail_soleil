// File: js/soleil.js
// Desc: Direction du Soleil (vecteur unique pour toutes les colonnes) et « Soleil proche ».
// Version 1.0.3
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - Near-Sun distance no longer depends on cloud altitude (sun stays put when H moves).
// - Minimum Sun altitude 10 km (just above Everest); sunAlt()/sunHoriz() helpers.

const toSun  = new THREE.Vector3();   // du sol vers le Soleil
const rayDir = new THREE.Vector3();   // sens de propagation de la lumière
function updateSunDir(){
  const e=CFG.el*Math.PI/180, a=CFG.az*Math.PI/180;
  toSun.set(Math.cos(e)*Math.sin(a), Math.sin(e), Math.cos(e)*Math.cos(a)).normalize();
  rayDir.copy(toSun).multiplyScalar(-1);
}
const fakeSunPos = new THREE.Vector3();
// Distance du « Soleil proche », en ÉCHELLE LOGARITHMIQUE, mesurée depuis le
// CENTRE AU SOL (origine de la scène, à la verticale du centre du nuage)
// jusqu'à la vraie distance du Soleil.
// Borne basse : le Soleil ne descend jamais sous SUN_ALT_MIN d'altitude
// (10 km, un peu plus haut que l'Everest, toujours au-dessus des nuages dont
// le curseur plafonne à 6 km — sinon les rayons partiraient vers le haut).
// Elle ne dépend donc que de la hauteur angulaire, jamais de la couche.
const SUN_REAL    = 1.496e11;                    // 149,6 millions de km
const SUN_ALT_MIN = 10000;                       // m
const SUN_SIN_MIN = 0.06;                        // ≈ 3,4° : évite dmin → ∞ à l'horizon
function fakeDistMin(el){
  return SUN_ALT_MIN/Math.max(SUN_SIN_MIN, Math.sin(el*Math.PI/180));
}
function fakeDist(){
  const dmin = fakeDistMin(CFG.el);
  return dmin*Math.pow(SUN_REAL/dmin, CFG.dist/100);
}
// Décomposition « pour non-géomètre » : hauteur au-dessus du sol et
// éloignement horizontal, depuis le centre au sol.
function sunAlt()  { return fakeDist()*Math.sin(CFG.el*Math.PI/180); }
function sunHoriz(){ return fakeDist()*Math.cos(CFG.el*Math.PI/180); }
function fmtDist(d){
  const km = d/1000;
  if(km < 10)  return km.toFixed(2).replace('.',',')+' km';
  if(km < 1e6) return km.toLocaleString('fr-FR',{maximumFractionDigits:0})+' km';
  return (km/1e6).toLocaleString('fr-FR',{maximumFractionDigits:1})+' M km';
}
