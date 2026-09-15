// File: js/cameras.js
// Desc: Observateur, caméras principale (persp./ortho) et vue extérieure, état du regard.
// Version 1.0.4
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

const EYE = new THREE.Vector3(0,1.7,0);
/* ---------------------------------------------------------------------------
   Observateur et focale, DÉCOUPLÉS
   ----------------------------------------------------------------------------
   La molette déplace l'observateur (recul réel, un « travelling ») : la
   position change, le cadrage (focale) n'est pas touchée.
   Le curseur Focale change uniquement le champ de vision de la caméra, à
   position fixe : c'est un cadrage/recadrage, l'observateur ne bouge pas.
   Exception volontaire, optionnelle : « Garder le cadrage » (CFG.vertigo) lie
   les deux en travelling compensé — voir dollyForFov, js/ui.js.
   ------------------------------------------------------------------------ */
// Position accumulée de l'observateur — un ÉTAT, pas une formule dépendant du
// regard. Avant, la position se recalculait chaque frame à partir de la
// direction COURANTE (EYE - fwd*recul) : tourner la tête (glisser, ou les
// boutons Regarder…) changeait alors aussi la position, en faisant orbiter
// l'observateur autour de EYE au lieu de le laisser tourner sur place — d'où
// les trous de nuage qui redevenaient nets en cliquant « Regarder à l'opposé »
// alors même qu'on avait reculé. La molette ne fait plus que translater ce
// point ; tourner la tête ne le touche jamais.
const camPos = EYE.clone();
const ORTHO_D = 8000;                  // distance de référence pour cadrer la vue orthographique
// Plan lointain : le travelling compensé doit pouvoir garder le cadrage de la
// focale la plus large (110°) jusqu'à la plus serrée (2°), soit une distance
// ×82 — depuis la vue de départ (42 km à 52°), environ 1 170 km à 2°.
const CAM_DIST_MIN = 500, CAM_DIST_MAX = 1500000;   // bornes de la distance au centre du nuage
const FAR = CAM_DIST_MAX + 100000;                 // + rayon du nuage et marge
const camP = new THREE.PerspectiveCamera(CFG.fov, 1, 1, FAR);
const camO = new THREE.OrthographicCamera(-1,1,1,-1,-FAR/2,FAR);
// La vue extérieure est ORTHOGRAPHIQUE, et ce n'est pas un détail : en
// perspective, des droites parallèles convergeraient là aussi — la « preuve »
// n'en serait pas une. En projection parallèle, ce qui est parallèle le reste.
const camX = new THREE.OrthographicCamera(-1,1,1,-1, -260000, 460000);
const REGARD = {yaw:Math.PI, pitch:0.12};   // lacet / tangage de l'observateur
// Regard « Horizon » : l'horizon posé un peu sous le centre de l'image, à la
// MÊME place à l'écran quelle que soit la focale. Un tangage fixe (0,03 rad)
// ne marche qu'aux focales usuelles : à 2° de champ (±1°), 1,7° vers le haut
// sort tout le sol du cadre et l'on ne voit plus que les nuages. La position
// à l'écran d'une direction de tangage p vaut tan(p)/tan(fov/2) : on garde ce
// rapport égal à celui de la vue de départ (0,03 rad à 52°).
const HORIZ_PITCH0 = 0.03, HORIZ_FOV0 = 52;
function horizonPitch(fov){
  return Math.atan(Math.tan(HORIZ_PITCH0)*Math.tan(fov*Math.PI/360)/Math.tan(HORIZ_FOV0*Math.PI/360));
}
// Cadrage par défaut : presque rasant (EX_PH), depuis derrière l'observateur,
// dans l'axe azimut 0° (face). Projection parallèle + regard dans le plan
// vertical du Soleil : les colonnes sont VERTICALES à l'écran, quelle que soit
// la hauteur du Soleil. Le cadrage est fixe par rapport au monde : tourner
// l'azimut les fait pencher.
const EX_PH = 0.03;
const ex = {th:-Math.PI/2, ph:EX_PH, r:14000, tgt:new THREE.Vector3(0,1150,0)};
const EX_D = 120000;   // recul fixe de la caméra de la vue extérieure
// Plafond de l'angle vers le bas : interdit de passer sous le sol (on garde
// au moins 1 m d'altitude), quel que soit ex.tgt.
function exPhMin(){ return Math.asin(Math.min(1, Math.max(-1, (1-ex.tgt.y)/EX_D))); }

// direction de visée courante (recalculée à chaque image par main.js)
const _fwd = new THREE.Vector3();
