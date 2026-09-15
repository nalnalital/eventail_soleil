// File: js/vue-cote.js
// Desc: Vue de côté du Soleil (panneau) : règle hauteur et distance, valeurs posées sur les segments.
// Version 1.1.0
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - Replaces the height & distance sliders; values drawn on their segments, no legend.

/* ============================================================================
   VUE DE CÔTÉ
   ----------------------------------------------------------------------------
   Coupe verticale dans la direction du Soleil. Origine = CENTRE AU SOL (sous le
   centre du nuage), d'où sont mesurées toutes les valeurs affichées.
   - l'angle au centre est VRAI : c'est la hauteur au-dessus de l'horizon
     (90° = zénith) ;
   - le rayon est en ÉCHELLE LOG : 10 km au rayon R0, 150 M km au bord ;
   - changer la hauteur fait glisser le Soleil sur l'arc pointillé (distance
     constante) ; l'éloigner le fait glisser le long du trait jaune.
   Seule source de CFG.el et CFG.dist (plus de curseurs). Les nombres posés sur
   les segments sont les valeurs réelles, pas des mesures en pixels.
   ========================================================================== */
const COTE = {ox:40, R0:40, key:'', w:0, h:0, R1:0, oy:0};
const COTE_LN = Math.log(SUN_REAL/SUN_ALT_MIN);
const coteRad = d => COTE.R0 + (COTE.R1-COTE.R0)*Math.log(Math.max(d,SUN_ALT_MIN)/SUN_ALT_MIN)/COTE_LN;
const coteDist = r => SUN_ALT_MIN*Math.exp((r-COTE.R0)/(COTE.R1-COTE.R0)*COTE_LN);
const coteXY = (r,th) => [COTE.ox + r*Math.cos(th), COTE.oy - r*Math.sin(th)];
const COTE_FONT = '600 10.5px -apple-system,system-ui,sans-serif';

function coteLayout(){
  const w = coteCv.clientWidth, h = coteCv.clientHeight, k = devicePixelRatio;
  if(w===COTE.w && h===COTE.h) return false;
  COTE.w=w; COTE.h=h;
  coteCv.width = w*k; coteCv.height = h*k;
  cote2.setTransform(k,0,0,k,0,0);
  COTE.oy = h - 30;
  COTE.R1 = Math.min(COTE.oy - 14, w - COTE.ox - 20);
  return true;
}

// Étiquettes lisibles par-dessus le dessin : pastille sombre, centrée sur
// (x,y) dans un repère tourné de rot, gardée entièrement dans le canvas.
// Chaque valeur propose plusieurs positions (cand = [[x,y,rot], …]) : on prend
// la première qui ne chevauche ni une étiquette déjà posée ni le Soleil.
let coteBusy = [];
function cotePill(txt, col, cand){
  const c = cote2;
  c.font = COTE_FONT;
  const pw = c.measureText(txt).width + 8, ph = 15;
  const boxes = cand.map(([x,y,rot])=>{
    const ex = Math.abs(Math.cos(rot))*pw/2 + Math.abs(Math.sin(rot))*ph/2;
    const ey = Math.abs(Math.sin(rot))*pw/2 + Math.abs(Math.cos(rot))*ph/2;
    x = Math.max(ex+2, Math.min(COTE.w-ex-2, x));
    y = Math.max(ey+2, Math.min(COTE.h-ey-2, y));
    return {x, y, rot, x0:x-ex, x1:x+ex, y0:y-ey, y1:y+ey};
  });
  // recouvrement total (px²) avec ce qui est déjà posé : 0 = place libre ;
  // si aucune ne l'est, on garde la moins recouverte
  const over = p => coteBusy.reduce((s,q)=> s +
    Math.max(0, Math.min(p.x1,q.x1)-Math.max(p.x0,q.x0)) *
    Math.max(0, Math.min(p.y1,q.y1)-Math.max(p.y0,q.y0)), 0);
  const k = boxes.reduce((best,p)=> over(p) < over(best) ? p : best);
  coteBusy.push(k);
  c.save(); c.translate(k.x,k.y); c.rotate(k.rot);
  c.fillStyle = 'rgba(10,13,20,.82)';
  c.beginPath(); c.roundRect(-pw/2, -ph/2, pw, ph, 4); c.fill();
  c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(txt, 0, 0.5);
  c.restore();
  return pw;
}

function drawVueCote(){
  const resized = coteLayout();
  if(COTE.R1 <= COTE.R0) return;     // canvas pas encore mis en page (taille ~0)
  const key = CFG.el+'|'+CFG.dist+'|'+CFG.clouds;
  if(!resized && key===COTE.key) return;
  COTE.key = key;
  const {w,h,ox,oy,R0,R1} = COTE, c = cote2;
  const th = CFG.el*Math.PI/180, d = fakeDist(), r = coteRad(d);
  const [sx,sy] = coteXY(r,th);
  const SUN='#ffc857', ALT='#6fd3ff', DIM='rgba(154,163,181,', BAD='rgba(255,110,110,';
  c.clearRect(0,0,w,h);
  c.font = '9.5px -apple-system,system-ui,sans-serif';
  c.textBaseline = 'alphabetic';
  c.lineCap = 'round';

  // zone inaccessible : Soleil à moins de 10 km d'altitude
  c.beginPath(); c.moveTo(ox,oy);
  for(let i=0;i<=45;i++){
    const a = i*Math.PI/90;
    const [x,y] = coteXY(Math.min(R1, coteRad(fakeDistMin(a*180/Math.PI))), a);
    c.lineTo(x,y);
  }
  c.closePath(); c.fillStyle = BAD+'.13)'; c.fill();

  // arcs de graduation (échelle log) : un par décade, trois libellés tout en bas
  c.lineWidth = 1;
  for(let g=1e5; g<SUN_REAL; g*=10){
    c.strokeStyle = DIM+'.12)';
    c.beginPath(); c.arc(ox,oy,coteRad(g),-Math.PI/2,0); c.stroke();
  }
  const grads = [[1e5,'100 km'],[1e7,'10 000 km'],[SUN_REAL,'150 M km']];
  for(const [g,lbl] of grads){
    const rg = coteRad(g);
    c.strokeStyle = DIM+'.3)';
    c.beginPath(); c.arc(ox,oy,rg,-Math.PI/2,0); c.stroke();
    c.fillStyle = DIM+'.6)'; c.textAlign = 'center';
    c.fillText(lbl, Math.min(w-22, ox+rg), oy+25);
  }

  // axe vertical (zénith) et sol
  c.setLineDash([2,3]); c.strokeStyle = DIM+'.45)';
  c.beginPath(); c.moveTo(ox,oy); c.lineTo(ox,oy-R1-4); c.stroke();
  c.setLineDash([]);
  c.fillStyle = DIM+'.8)'; c.textAlign = 'left';
  c.fillText('zénith', ox+4, oy-R1+4);
  c.textAlign = 'right';
  c.fillText('centre', ox-6, oy-4);
  c.strokeStyle = DIM+'.7)'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(4,oy); c.lineTo(w-4,oy); c.stroke();

  // couche nuageuse : pas à l'échelle (32 km de rayon, à ≤ 6 km du sol),
  // juste pour rappeler qu'elle reste toujours sous le Soleil
  if(CFG.clouds){
    c.fillStyle = 'rgba(220,225,235,.6)';
    for(let i=0;i<4;i++){ c.beginPath(); c.ellipse(ox+8+i*11, oy-6, 6, 2.6, 0, 0, 7); c.fill(); }
  }

  // arc parcouru quand on change la hauteur (distance constante)
  c.setLineDash([3,4]); c.strokeStyle = 'rgba(255,200,87,.45)'; c.lineWidth = 1;
  c.beginPath(); c.arc(ox,oy,r,-Math.PI/2,0); c.stroke();
  c.setLineDash([]);

  // distance (trait centre → Soleil), altitude (verticale), horizontale (au sol)
  c.strokeStyle = SUN; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(ox,oy); c.lineTo(sx,sy); c.stroke();
  c.strokeStyle = ALT; c.setLineDash([2,3]);
  c.beginPath(); c.moveTo(sx,sy); c.lineTo(sx,oy); c.stroke();
  c.setLineDash([]); c.lineWidth = 2.5; c.globalAlpha = .7;
  c.beginPath(); c.moveTo(ox,oy); c.lineTo(sx,oy); c.stroke();
  c.globalAlpha = 1;

  // angle de hauteur
  c.strokeStyle = '#fff'; c.lineWidth = 1;
  c.beginPath(); c.arc(ox,oy,15,-th,0); c.stroke();

  // centre au sol
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(ox,oy,3,0,7); c.fill();

  // Soleil
  const gl = c.createRadialGradient(sx,sy,0,sx,sy,15);
  gl.addColorStop(0,'rgba(255,220,120,.7)'); gl.addColorStop(1,'rgba(255,200,87,0)');
  c.fillStyle = gl; c.beginPath(); c.arc(sx,sy,15,0,7); c.fill();
  c.fillStyle = SUN; c.beginPath(); c.arc(sx,sy,6,0,7); c.fill();

  // valeurs posées sur leurs segments (ordre = priorité de placement)
  coteBusy = [{x0:sx-9, x1:sx+9, y0:sy-9, y1:sy+9}];          // le Soleil
  c.font = COTE_FONT;
  const wOf = t => c.measureText(t).width + 8;
  // - horizontale : juste sous le sol, au milieu du trait bleu
  cotePill(fmtDist(sunHoriz()), ALT, [[Math.max(ox+30, (ox+sx)/2), oy+10, 0]]);
  // - hauteur : dans l'angle, au-dessus des nuages dessinés ; sinon à gauche
  //   de l'axe du zénith
  const [hx,hy] = coteXY(30, Math.max(0.5, th/2));
  cotePill(CFG.el.toFixed(0)+'°', '#fff', [[hx+6, hy, 0], [ox-20, oy-22, 0]]);
  // - distance : sur le trait jaune (côté haut-gauche), sinon dans son
  //   prolongement au-delà du Soleil
  const dTxt = fmtDist(d), dw = wOf(dTxt);
  const [m1x,m1y] = coteXY(r*0.5, th), [m2x,m2y] = coteXY(r+14+dw/2, th);
  const nx = -Math.sin(th)*11, ny = -Math.cos(th)*11;
  cotePill(dTxt, SUN, [
    ...(r*0.5-dw/2 > 34 ? [[m1x+nx, m1y+ny, -th]] : []),
    [m2x, m2y, -th], [m2x+nx*1.6, m2y+ny*1.6, -th]]);
  // - altitude : contre la verticale bleue, à droite puis à gauche, à
  //   mi-hauteur puis au niveau du Soleil
  const aTxt = fmtDist(sunAlt()), aw = wOf(aTxt);
  const ay = Math.min(oy-10, (sy+oy)/2);
  cotePill(aTxt, ALT, [
    [sx+6+aw/2, ay, 0], [sx-6-aw/2, ay, 0],
    [sx+12+aw/2, sy, 0], [sx-12-aw/2, sy, 0], [sx, sy-18, 0], [sx, sy-30, 0]]);
}

// Glisser dans la vue : l'angle donne la hauteur, l'éloignement la distance.
function coteFromPointer(e){
  const b = coteCv.getBoundingClientRect();
  const x = e.clientX-b.left-COTE.ox, y = Math.max(0, COTE.oy-(e.clientY-b.top));
  CFG.el = Math.round(Math.max(0, Math.min(90, Math.atan2(y, x)*180/Math.PI))*2)/2;
  const dmin = fakeDistMin(CFG.el);
  const dd = coteDist(Math.min(COTE.R1, Math.hypot(x, y)));
  CFG.dist = Math.max(0, Math.min(100, 100*Math.log(Math.max(dd,dmin)/dmin)/Math.log(SUN_REAL/dmin)));
  updateSunDir();
}
coteCv.addEventListener('pointerdown', e=>{ coteCv.setPointerCapture(e.pointerId); coteFromPointer(e); });
coteCv.addEventListener('pointermove', e=>{ if(coteCv.hasPointerCapture(e.pointerId)) coteFromPointer(e); });
