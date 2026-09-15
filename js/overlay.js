// File: js/overlay.js
// Desc: Calque 2D : point de fuite, bandeaux, étiquettes de la vue extérieure.
// Version 1.0.2
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

/* ============================================================================
   OVERLAY 2D — point de fuite
   ========================================================================== */
const _v4 = new THREE.Vector4();
function projectDir(dir, camera, w, h){
  _v4.set(dir.x,dir.y,dir.z,0)
     .applyMatrix4(camera.matrixWorldInverse)
     .applyMatrix4(camera.projectionMatrix);
  if(Math.abs(_v4.w) < 1e-9) return null;
  return { x:(_v4.x/_v4.w*0.5+0.5)*w, y:(-_v4.y/_v4.w*0.5+0.5)*h, front:_v4.w>0 };
}
const _p3 = new THREE.Vector3();
function banner(txt, col, w){
  o2.font='600 13px -apple-system,system-ui,sans-serif';
  o2.textAlign='center'; o2.fillStyle=col;
  o2.fillText(txt, (w+374)/2, 36);
}
function drawOverlay(w,h){
  o2.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  o2.clearRect(0,0,w,h);
  // On découpe l'inset hors de la zone de dessin : sans cela le marqueur de
  // point de fuite de la vue principale vient se poser par-dessus.
  const ir = insetEl.getBoundingClientRect();
  const hole = new Path2D();
  hole.rect(0,0,w,h);
  hole.rect(ir.left-1, ir.top-1, ir.width+2, ir.height+2);
  o2.save();
  o2.clip(hole, 'evenodd');
  if(CFG.ortho){
    banner('projection orthographique', 'rgba(255,255,255,.95)', w);
    o2.restore(); return;
  }
  if(CFG.diverge){
    // Des droites non parallèles n'ont pas de point de fuite commun : afficher
    // le marqueur serait un contresens. En revanche le vrai centre de l'éventail
    // existe, et il est DANS la scène : c'est la source ponctuelle elle-même.
    if(CFG.vp && CFG.clouds){
      _p3.copy(fakeSunPos).project(camP);
      if(_p3.z < 1){
        const x=(_p3.x*0.5+0.5)*w, y=(-_p3.y*0.5+0.5)*h;
        o2.save();
        o2.strokeStyle='rgba(255,120,120,.9)'; o2.lineWidth=1.6;
        o2.beginPath(); o2.arc(x,y,13,0,7); o2.stroke();
        o2.globalAlpha=.4; o2.beginPath(); o2.arc(x,y,27,0,7); o2.stroke(); o2.globalAlpha=1;
        const flip = x > w-420;
        o2.textAlign = flip ? 'right' : 'left';
        const tx = x + (flip ? -34 : 34);
        o2.font='600 12px -apple-system,system-ui,sans-serif';
        o2.fillStyle='rgba(255,140,140,.98)';
        // Le curseur place le Soleil le long de la direction (hauteur, azimut)
        // issue du SOL à la verticale du centre du nuage : son altitude est
        // donc comptée depuis le sol et ne suit pas la couche. L'observateur,
        // lui, peut être à des dizaines de km de ce point.
        o2.fillText('Soleil à '+fmtDist(fakeDist())+' du centre ('+fmtDist(fakeSunPos.y)+' d\'altitude) · '
                    +fmtDist(fakeSunPos.distanceTo(camP.position))+' de vous', tx, y+4);
        o2.restore();
      }
    }
    o2.restore(); return;
  }
  if(!CFG.vp || !CFG.clouds){ o2.restore(); return; }

  const p = projectDir(rayDir, camP, w, h);
  if(!p || p.x<-800 || p.x>w+800 || p.y<-800 || p.y>h+800){ o2.restore(); return; }

  o2.save();
  o2.strokeStyle='rgba(255,200,87,.18)'; o2.lineWidth=1; o2.setLineDash([5,7]);
  for(const b of bo){
    _p3.set(b.h.x, CFG.H, b.h.z).addScaledVector(rayDir, CFG.H/Math.max(0.015,-rayDir.y));
    _p3.project(camP);
    if(_p3.z > 1) continue;
    o2.beginPath();
    o2.moveTo((_p3.x*0.5+0.5)*w, (-_p3.y*0.5+0.5)*h);
    o2.lineTo(p.x,p.y); o2.stroke();
  }
  o2.restore();

  // le point de fuite est UN SEUL point projectif : devant soi c'est le Soleil,
  // derrière soi le point antisolaire. On tranche avec la direction du regard.
  const sunFront = _fwd.dot(toSun) > 0;
  const col = sunFront ? '255,200,87' : '111,211,255';
  o2.save();
  o2.strokeStyle=`rgba(${col},.9)`; o2.lineWidth=1.6;
  o2.beginPath(); o2.arc(p.x,p.y,15,0,7); o2.stroke();
  o2.globalAlpha=.35; o2.beginPath(); o2.arc(p.x,p.y,31,0,7); o2.stroke(); o2.globalAlpha=1;
  o2.beginPath();
  o2.moveTo(p.x-27,p.y); o2.lineTo(p.x-6,p.y); o2.moveTo(p.x+6,p.y); o2.lineTo(p.x+27,p.y);
  o2.moveTo(p.x,p.y-27); o2.lineTo(p.x,p.y-6); o2.moveTo(p.x,p.y+6); o2.lineTo(p.x,p.y+27);
  o2.stroke();
  const flip = p.x > w-340;
  o2.textAlign = flip ? 'right' : 'left';
  const tx = p.x + (flip ? -38 : 38);
  o2.font='600 12px -apple-system,system-ui,sans-serif'; o2.fillStyle=`rgba(${col},.98)`;
  o2.fillText(sunFront ? 'point de fuite = direction du Soleil, depuis votre point de vue'
                      : 'point de fuite ANTISOLAIRE — rayons anti-crépusculaires', tx, p.y+4);
  o2.font='11px -apple-system,system-ui,sans-serif'; o2.fillStyle='rgba(255,255,255,.55)';
  o2.fillText('une seule famille de parallèles → un seul point de fuite', tx, p.y+21);
  o2.restore();

  o2.restore();       // fin du découpage de l'inset
}

/* ---------------------------------------------------------------------------
   Étiquettes de la vue extérieure — dessinées en 2D par-dessus l'inset, en
   projetant des points du monde avec sa caméra orthographique.
   ------------------------------------------------------------------------ */
const _lr = new THREE.Vector3(), _lp = new THREE.Vector3();
function drawInsetLabels(){
  const r = insetEl.getBoundingClientRect();
  if(r.width < 230 || !ex.wa) return;            // trop petit pour rester lisible
  _lr.setFromMatrixColumn(camX.matrixWorld, 0);  // axe « droite » de cette vue
  o2.save();
  o2.beginPath(); o2.rect(r.left, r.top, r.width, r.height); o2.clip();
  o2.font = '10.5px -apple-system,system-ui,sans-serif';
  const mark = (y, txt, c)=>{
    _lp.copy(ex.tgt).addScaledVector(_lr, -ex.wa*0.82); _lp.y = y;
    _lp.project(camX);
    const x  = r.left + (_lp.x*0.5+0.5)*r.width;
    const py = r.top  + (-_lp.y*0.5+0.5)*r.height;
    if(py < r.top+20 || py > r.bottom-22) return;
    o2.strokeStyle = `rgba(${c},.38)`; o2.lineWidth = 1; o2.setLineDash([3,4]);
    o2.beginPath(); o2.moveTo(x, py); o2.lineTo(x + r.width*0.64, py); o2.stroke();
    o2.setLineDash([]);
    o2.fillStyle = 'rgba(255,255,255,.95)'; o2.textAlign = 'left';
    o2.fillText(txt, x+3, py-4);
  };
  mark(CFG.H, 'couche — '+(CFG.H>=1000 ? (CFG.H/1000).toFixed(1).replace('.',',')+' km'
                                        : CFG.H+' m'), '198,198,212');
  mark(0, 'sol', '150,180,215');
  _lp.copy(camP.position).project(camX);
  const ox = r.left + (_lp.x*0.5+0.5)*r.width, oy = r.top + (-_lp.y*0.5+0.5)*r.height;
  if(ox > r.left+6 && ox < r.right-70 && oy > r.top+20 && oy < r.bottom-8){
    o2.fillStyle = 'rgba(255,255,255,.95)'; o2.textAlign = 'left';
    o2.fillText('observateur', ox+14, oy+4);
  }
  o2.restore();
}
