// File: js/ui.js
// Desc: Panneau de réglages : liaison curseurs/interrupteurs ↔ CFG, boutons de regard.
// Version 1.0.5
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

/* ============================================================================
   UI
   ========================================================================== */
function set(id,v){ const el=$(id); el.value=v; el.dispatchEvent(new Event('input')); }
function sw(id,v){ const el=$(id); el.checked=v; el.dispatchEvent(new Event('change')); }
function bindRange(id,key,fmt,after){
  const el=$(id), out=$('o'+id.slice(1));
  const upd=()=>{ CFG[key]=parseFloat(el.value); if(out) out.textContent=fmt(CFG[key]); after&&after(); };
  el.addEventListener('input',upd); upd();
}
function bindSw(id,key,after){
  const el=$(id);
  const upd=()=>{ CFG[key]=el.checked; after&&after(); };
  el.addEventListener('change',upd); upd();
}
bindRange('sAz','az', v=>v.toFixed(0)+'°', updateSunDir);
bindRange('sDen','density', v=>Math.round(v)+' %');
bindRange('sH','H', v=> v>=1000 ? (v/1000).toFixed(1)+' km' : v+' m',
          ()=>{ cloud.position.y=CFG.H; });
// Le fov de three.js est VERTICAL : l'équivalence en focale doit donc se faire
// sur la demi-hauteur du 24x36 (12 mm), pas sur la demi-largeur (18 mm).
// Travelling compensé (effet « Vertigo ») : si l'option est active, changer
// la focale déplace AUSSI l'observateur, pour que le nuage garde à peu près la
// même taille à l'écran. La taille apparente d'un objet vaut ∝ 1/(D·tan(fov/2)) :
// on multiplie donc la distance au centre du nuage par tan(avant/2)/tan(après/2).
// Hauteur au sol et direction horizontale depuis le centre sont conservées ;
// seule la perspective change — c'est elle, pas la focale, qui ouvre l'éventail.
// Les ratios successifs se compensent : revenir à la focale de départ ramène
// l'observateur à sa distance de départ (sauf s'il a buté sur une borne).
let fovPrev = CFG.fov;
function dollyForFov(){
  if(CFG.vertigo && CFG.fov !== fovPrev){
    const t = a => Math.tan(a*Math.PI/360);
    // bornes = celles du curseur de distance (CAM_DIST_*, js/cameras.js)
    const D  = Math.max(CAM_DIST_MIN, Math.min(CAM_DIST_MAX,
               camPos.distanceTo(cloud.position) * t(fovPrev)/t(CFG.fov)));
    const dz = CFG.H - camPos.y;
    const horiz = Math.sqrt(Math.max(0, D*D - dz*dz));
    const hx = camPos.x, hz = camPos.z, hl = Math.hypot(hx, hz);
    if(hl > 1e-6) camPos.set(hx/hl*horiz, camPos.y, hz/hl*horiz);
    else          camPos.set(0, camPos.y, -horiz);          // pile sous le centre : axe -Z des sliders
    // Même logique pour le regard : l'horizon garde sa place à l'écran
    // (tan(tangage)/tan(fov/2) constant), sinon à très courte focale un
    // tangage de quelques dixièmes de degré suffit à le sortir du cadre.
    // Seulement s'il est dans l'image : si l'on regarde le ciel ou le sol,
    // on ne bascule pas le regard vers l'horizon.
    const tp = Math.tan(REGARD.pitch);
    if(Math.abs(tp) <= t(fovPrev)) REGARD.pitch = Math.atan(tp*t(CFG.fov)/t(fovPrev));
  }
  fovPrev = CFG.fov;
}
bindRange('sFov','fov', v=> Math.round(12/Math.tan(v*Math.PI/360))+' mm · '+v.toFixed(0)+'°', dollyForFov);
bindSw('cVertigo','vertigo');
// Hauteur (CFG.el) et distance (CFG.dist) du Soleil : réglées dans la vue de côté (js/vue-cote.js).

// Sliders caméra : position de l'observateur le long de l'axe -Z, sous le
// centre du nuage — distance et hauteur donnent une position 3D unique.
// Ils n'écrivent pas dans CFG (ce n'est pas un réglage de scène, mais l'état
// de camPos) ; c'est main.js qui, chaque image, resynchronise leur valeur et
// les libellés à partir de camPos — y compris après un déplacement molette.
// Le curseur de distance est LOGARITHMIQUE (0…1000) : de 500 m à 1 500 km, une
// échelle linéaire rendrait les distances usuelles (quelques km) inréglables.
const camDistFromSlider = v => CAM_DIST_MIN*Math.pow(CAM_DIST_MAX/CAM_DIST_MIN, v/1000);
const camDistToSlider   = d => 1000*Math.log(Math.max(d,CAM_DIST_MIN)/CAM_DIST_MIN)/Math.log(CAM_DIST_MAX/CAM_DIST_MIN);
function applyCamSliders(){
  const dist = camDistFromSlider(parseFloat($('sCamDist').value)), h = parseFloat($('sCamH').value);
  const dz = CFG.H - h;
  const horiz = Math.sqrt(Math.max(0, dist*dist - dz*dz));
  camPos.set(0, h, -horiz);
}
$('sCamDist').addEventListener('input', applyCamSliders);
$('sCamH').addEventListener('input', applyCamSliders);
applyCamSliders();

$('bHoriz').onclick = ()=>{ REGARD.pitch = horizonPitch(CFG.fov); };
