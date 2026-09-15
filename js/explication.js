// File: js/explication.js
// Desc: Encart « Explication de la perspective et de la focale » : fenêtre d'Alberti vue de dessus.
// Version 1.0.0
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

/* ============================================================================
   FENÊTRE D'ALBERTI (vue de dessus)
   ----------------------------------------------------------------------------
   Pendant de la vue extérieure : là où elle montre la scène sans perspective,
   cet encart montre d'où vient la perspective.
   - deux rails parallèles, deux traverses identiques (proche / lointaine) ;
   - un œil (le POINT DE VUE) et une vitre (l'écran) à distance réglable :
     la FOCALE est la distance œil → vitre.
   Les angles et les tailles sur la vitre sont ceux du dessin (unités du
   viewBox), pas une illustration : focale → toutes les tailles ×k, rapport
   inchangé ; recul → le rapport change. Dessin 100 % SVG (pas de canvas).
   ========================================================================== */
const EX = {G:25, CY:115, XR:200, XN:215, XF:435};   // demi-écart des rails, axe, début des rails, traverses
const exSvg = $('exSvg'), exRays = $('exRays');
const exRecul = $('exRecul'), exFoc = $('exFoc');
const EX_NS = 'http://www.w3.org/2000/svg';

function exLine(x1,y1,x2,y2,col,dash,op){
  const l = document.createElementNS(EX_NS,'line');
  l.setAttribute('x1',x1); l.setAttribute('y1',y1); l.setAttribute('x2',x2); l.setAttribute('y2',y2);
  l.setAttribute('stroke',col); l.setAttribute('stroke-width',1);
  if(dash) l.setAttribute('stroke-dasharray',dash);
  l.setAttribute('opacity',op);
  return l;
}
const exDeg = d => (2*Math.atan(EX.G/d)*180/Math.PI).toFixed(1).replace('.',',')+'°';

function drawExplication(){
  const e = +exRecul.value, f = +exFoc.value;
  const ex = EX.XR - e, wx = ex + f;
  $('exEye').setAttribute('transform', `translate(${ex},0)`);
  $('exWin').setAttribute('transform', `translate(${wx},0)`);
  $('exWinLbl').setAttribute('x', Math.max(40, Math.min(420, wx)) - wx);   // libellé gardé dans le cadre

  // lignes de visée : de l'œil aux bouts des traverses ; si la vitre est
  // au-delà d'une traverse, prolongement pointillé jusqu'à elle
  exRays.replaceChildren();
  for(const [X,col] of [[EX.XN,'#EF9F27'],[EX.XF,'#5DCAA5']]){
    for(const s of [-1,1]){
      const Y = EX.CY + s*EX.G;
      exRays.appendChild(exLine(ex, EX.CY, X, Y, col, null, .75));
      if(wx > X) exRays.appendChild(exLine(X, Y, wx, EX.CY + s*EX.G*(wx-ex)/(X-ex), col, '3 4', .45));
    }
  }

  // images sur la vitre : demi-hauteur = f·G/d (Thalès)
  const dN = EX.XN - ex, dF = EX.XF - ex, hN = f*EX.G/dN, hF = f*EX.G/dF;
  $('exImgN').setAttribute('y', EX.CY - hN); $('exImgN').setAttribute('height', 2*hN);
  $('exImgF').setAttribute('y', EX.CY - hF); $('exImgF').setAttribute('height', 2*hF);

  $('exMN').textContent = exDeg(dN);
  $('exMF').textContent = exDeg(dF);
  $('exMR').textContent = '× ' + (dF/dN).toFixed(2).replace('.',',');
}
exRecul.addEventListener('input', drawExplication);
exFoc.addEventListener('input', drawExplication);
drawExplication();
// Petit écran : l'encart démarre replié (il couvrirait la vue principale).
if(matchMedia('(max-width:980px)').matches) $('explic').open = false;
