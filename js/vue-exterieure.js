// File: js/vue-exterieure.js
// Desc: Repères de la vue extérieure : quadrillages, observateur, cône de vision, flèches.
// Version 1.0.2
// Date: [September 14, 2026] [19:18 UTC+1]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - Polar grid radius follows CLOUD_R so it is the disk, not a smaller inner patch.

/* ---------------------------------------------------------------------------
   repères de la vue extérieure
   ------------------------------------------------------------------------ */
const helpers = new THREE.Group(); scene.add(helpers);
// Quadrillages de lecture : sans eux la vue extérieure est illisible — on ne
// distingue ni le sol, ni l'altitude de la couche. Maille de 2 km.
const gGround = new THREE.GridHelper(60000, 30, 0x46607a, 0x2c3a4a);
// La couche nuageuse est un disque (cf. cloud), pas un carré : sa grille de
// lecture doit avoir la même forme, sinon elle se lit comme le contour réel
// du nuage et laisse croire qu'il est carré.
const gCloud  = new THREE.PolarGridHelper(CLOUD_R, 16, 15, 64, 0x7c7c88, 0x53535d);
for(const g of [gGround, gCloud]){
  g.material.transparent = true; g.material.opacity = 0.5;
  g.material.depthTest = false; g.renderOrder = 2;
  helpers.add(g);
}
// Rouge = l'observateur, vert = l'écran, dégradé entre les deux : sans repère
// de couleur, impossible de dire si le cône pointe vers soi ou vers le fond.
const COBS = new THREE.Color(1.0,0.20,0.20), CSCR = new THREE.Color(0.25,1.0,0.35);
const obs = new THREE.Mesh(new THREE.SphereGeometry(90,16,12),
  new THREE.MeshBasicMaterial({color:COBS, depthTest:false}));
obs.renderOrder = 21; obs.position.set(0,90,0); helpers.add(obs);
const frGeo = new THREE.BufferGeometry();
frGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16*3),3));
{ // 4× [eye, écran, écran, écran] : seul le 1er sommet de chaque groupe de 4 est l'œil
  const c = new Float32Array(16*3);
  for(let i=0;i<16;i++) (i%4===0?COBS:CSCR).toArray(c, i*3);
  frGeo.setAttribute('color', new THREE.BufferAttribute(c,3));
}
// Le cône observateur↔écran doit rester lisible en permanence dans la vue
// extérieure : depthTest désactivé et renderOrder élevé, pour qu'il passe
// devant le sol, les nuages et le quadrillage plutôt que d'être masqué par eux.
const frustum = new THREE.LineSegments(frGeo, new THREE.LineBasicMaterial({
  vertexColors:true, transparent:true, opacity:.8, depthTest:false}));
frustum.renderOrder = 20; frustum.frustumCulled = false; helpers.add(frustum);
// Volume translucide + flèche : en fil de fer seul, impossible de dire si le
// cône de vision pointe vers nous ou vers le fond.
const wedgeGeo = new THREE.BufferGeometry();
wedgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4*3*3),3));
{ // par face : [eye, coin écran, coin écran]
  const c = new Float32Array(4*3*3);
  for(let i=0;i<12;i++) (i%3===0?COBS:CSCR).toArray(c, i*3);
  wedgeGeo.setAttribute('color', new THREE.BufferAttribute(c,3));
}
const wedge = new THREE.Mesh(wedgeGeo, new THREE.MeshBasicMaterial({
  vertexColors:true, transparent:true, opacity:0.16,
  side:THREE.DoubleSide, depthWrite:false, depthTest:false}));
wedge.renderOrder = 19; wedge.frustumCulled = false; helpers.add(wedge);
const viewArrow = new THREE.ArrowHelper(new THREE.Vector3(0,0,-1), EYE.clone(),
  6200, 0x6fd3ff, 950, 430);
viewArrow.line.material.depthTest = false; viewArrow.cone.material.depthTest = false;
helpers.add(viewArrow);

const sunArrow = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(0,150,0),
  4200, 0xffc857, 600, 280);
sunArrow.line.material.depthTest = false; sunArrow.cone.material.depthTest = false;
helpers.add(sunArrow);

function updateHelpers(){
  const L = 9000;
  const dir = new THREE.Vector3(0,0,-1).applyQuaternion(camP.quaternion);
  const up  = new THREE.Vector3(0,1,0).applyQuaternion(camP.quaternion);
  const rt  = new THREE.Vector3(1,0,0).applyQuaternion(camP.quaternion);
  const hh = L*Math.tan(camP.fov*Math.PI/360), hw = hh*camP.aspect;
  const eye = camP.position;
  const ctr = eye.clone().addScaledVector(dir,L);
  const c = [
    ctr.clone().addScaledVector(rt,-hw).addScaledVector(up, hh),
    ctr.clone().addScaledVector(rt, hw).addScaledVector(up, hh),
    ctr.clone().addScaledVector(rt, hw).addScaledVector(up,-hh),
    ctr.clone().addScaledVector(rt,-hw).addScaledVector(up,-hh)];
  const seg=[];
  for(let i=0;i<4;i++){ seg.push(eye,c[i]); seg.push(c[i],c[(i+1)%4]); }
  const p = frGeo.attributes.position;
  for(let i=0;i<16;i++) p.setXYZ(i, seg[i].x, seg[i].y, seg[i].z);
  p.needsUpdate = true;
  // les quatre faces du volume de vision
  const wp = wedgeGeo.attributes.position;
  for(let i=0;i<4;i++){
    const a = c[i], b = c[(i+1)%4];
    wp.setXYZ(i*3+0, eye.x, eye.y, eye.z);
    wp.setXYZ(i*3+1, a.x, a.y, a.z);
    wp.setXYZ(i*3+2, b.x, b.y, b.z);
  }
  wp.needsUpdate = true;
  viewArrow.position.copy(eye); viewArrow.setDirection(dir);
  obs.position.copy(eye); obs.position.y = Math.max(eye.y, 90);
  gCloud.position.y = CFG.H;
  sunArrow.setDirection(toSun);
}
