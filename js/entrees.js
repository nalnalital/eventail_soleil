// File: js/entrees.js
// Desc: Souris et molette : regard, déplacement de l'observateur, cadrage de la vue extérieure.
// Version 1.0.3
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - Exterior zoom comment: cloud disk is CLOUD_R (32 km), not 125 km.
// - Perspective explainer box (#explic) ignored like the panel.

/* ============================================================================
   ENTRÉES
   ========================================================================== */
let drag = null;
const inInset = (x,y)=>{ const r=insetEl.getBoundingClientRect();
  return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom; };
addEventListener('pointerdown', e=>{
  if(e.target.closest('#panel, #explic')) return;
  drag = {x:e.clientX, y:e.clientY, ins:inInset(e.clientX,e.clientY)};
  if(drag.ins) insetEl.classList.add('d');
});
addEventListener('pointermove', e=>{
  if(!drag) return;
  const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY;
  if(drag.ins){
    ex.th -= dx*0.006;
    ex.ph = Math.max(exPhMin(), Math.min(1.35, ex.ph + dy*0.005));
  }else{
    const k = (CFG.fov/66)*0.0028;
    REGARD.yaw -= dx*k;
    REGARD.pitch = Math.max(-0.75, Math.min(1.53, REGARD.pitch - dy*k));
  }
});
addEventListener('pointerup', ()=>{ drag=null; insetEl.classList.remove('d'); });
addEventListener('wheel', e=>{
  if(e.target.closest('#panel, #explic')) return;
  if(inInset(e.clientX,e.clientY))
    // borne haute : la couche nuageuse est un disque de CLOUD_R (cf. config.js)
    // — il faut pouvoir reculer assez pour le voir en entier, pas seulement
    // sa portion centrale.
    ex.r = Math.max(900, Math.min(80000, ex.r*(1+Math.sign(e.deltaY)*0.12)));
  else{
    // la molette déplace l'observateur le long du regard ACTUEL (translation
    // réelle) — la focale n'est pas touchée, et tourner la tête ensuite ne
    // rejoue jamais ce déplacement. Pas constant en mètres, linéaire (pas
    // exponentiel), pas de borne min/max (un zoom, c'est juste une
    // translation), pas multiple de la case du damier (20 m) pour ne pas
    // retomber sur la même phase à chaque cran (illusion type « roue de char »).
    camPos.addScaledVector(_fwd, -Math.sign(e.deltaY)*90);
    if(camPos.y < 0.5) camPos.y = 0.5;   // on recule au sol, pas sous terre
  }
},{passive:true});
