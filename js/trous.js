// File: js/trous.js
// Desc: Trous de la couche nuageuse : liste unique partagée par tous les rendus.
// Version 1.0.1
// Date: [September 14, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

/* ---------- trous dans la couche ---------------------------------------- */
function mulberry32(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rnd = mulberry32(20260912);
const NH = 64;
const holes = [];
// Répartition en spirale de tournesol : angle d'or entre deux trous successifs,
// distance croissante. Résultat : couverture uniforme de tous les azimuts, donc
// un éventail correct quelle que soit la position du Soleil — ce qu'un tirage
// purement aléatoire ne garantit pas.
const GOLD = Math.PI*(3-Math.sqrt(5));
for(let i=0;i<NH;i++){
  const a = i*GOLD + (rnd()-0.5)*0.30;
  const t = (i+0.5)/NH;
  const d = 2400 + Math.pow(t,1.6)*24000;             // 2,4 km → 26 km
  // largeur angulaire du trou vue d'ici : 1,1° à 3,2°. Un vrai ciel mélange
  // toutes les tailles ; garder des largeurs comparables évite que les trous
  // proches occupent tout le ciel et que les lointains soient invisibles.
  // La géométrie des colonnes, elle, n'est pas touchée.
  const r = Math.max(90, Math.min(950, d*(0.013 + rnd()*0.019)));
  holes.push({x:Math.cos(a)*d, z:Math.sin(a)*d, r});
}
const holeUni = holes.map(h=>new THREE.Vector3(h.x,h.z,h.r));
