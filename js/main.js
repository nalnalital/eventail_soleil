// File: js/main.js
// Desc: Point d'entrée : redimensionnement et boucle de rendu des deux vues.
// Version 1.0.5
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

/* ============================================================================
   BOUCLE
   ========================================================================== */
const _e = new THREE.Euler(0,0,0,'YXZ');
let cam = camP;
let mainGain = 1;
let W=0,H=0;
function resize(){
  W=innerWidth; H=innerHeight;
  renderer.setSize(W,H);
  ov.width=W*devicePixelRatio; ov.height=H*devicePixelRatio;
  ov.style.width=W+'px'; ov.style.height=H+'px';
  camP.aspect=W/H; camP.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
REGARD.pitch = horizonPitch(CFG.fov);   // vue de départ à l'horizon

function tick(){
  requestAnimationFrame(tick);
  updateSunDir();
  fakeSunPos.copy(toSun).multiplyScalar(fakeDist());
  rebuildBeams();

  const den = CFG.density/100;
  for(const b of bo) b.mat.uniforms.uDen.value = den*1.5;
  skyMat.uniforms.uDen.value = den;
  skyMat.uniforms.uEl.value  = Math.sin(CFG.el*Math.PI/180);
  skyMat.uniforms.uDiv.value = CFG.diverge?1:0;
  groundMat.uniforms.uH.value = CFG.H;
  groundMat.uniforms.uClouds.value = CFG.clouds?1:0;
  groundMat.uniforms.uDiv.value = CFG.diverge?1:0;
  orthoU.value = CFG.ortho?1:0;

  // --- direction visée (souris)
  _e.set(REGARD.pitch,REGARD.yaw,0);
  camP.quaternion.setFromEuler(_e);
  _fwd.set(0,0,-1).applyQuaternion(camP.quaternion);

  // --- position de l'observateur : état accumulé (molette), jamais recalculé
  // à partir du regard — tourner la tête ne doit jamais déplacer camPos.
  if(camPos.y < 0.5) camPos.y = 0.5;   // sécurité : jamais sous terre
  camP.position.copy(camPos);
  camP.fov = CFG.fov;                // la focale ne fait QUE cadrer, elle ne déplace rien
  // Plan proche relevé avec le recul : avec FAR à 1 600 km, near = 1 m ne
  // laisserait plus que ~90 km de résolution de profondeur au loin. Il reste
  // sous la hauteur de l'œil pour ne jamais trancher le sol juste dessous.
  camP.near = Math.max(1, Math.min(camPos.y*0.5, camPos.distanceTo(cloud.position)/4000));
  camP.updateProjectionMatrix(); camP.updateMatrixWorld();
  viewDirU.value.copy(_fwd);

  // Au-delà de quelques kilomètres, l'air réel serait opaque : on éclaircit à
  // mesure du recul, sinon l'expérience de pensée se noie dans la brume.
  // Au recul, on traverse beaucoup plus de colonnes le long de chaque rayon
  // visuel : sans corriger l'exposition, tout sature en blanc.
  // recul est un RATIO (1 = position de départ), rapporté à une échelle
  // kilométrique (8 km) sur la distance RÉELLEMENT parcourue depuis le départ —
  // sinon quelques dizaines de mètres suffiraient à saturer la formule et à
  // faire disparaître les colonnes juste après un petit mouvement de molette.
  // Plafonné à 250 km : plus loin, chaque rayon visuel traverse déjà tout le
  // disque nuageux (32 km de rayon), il ne croise plus de colonnes en plus —
  // et le travelling compensé doit garder la même image jusqu'à 1 500 km.
  const recul = 1 + Math.min(250000, camPos.distanceTo(EYE))/8000;
  fogK.value   = Math.min(1, Math.max(0.12, 1/recul));
  dfadeU.value = Math.min(1, Math.max(0.10, 1/recul));
  mainGain     = Math.min(1, Math.pow(1/recul, 0.38));
  gainU.value  = mainGain;

  if(CFG.ortho){
    const hh = ORTHO_D*Math.tan(CFG.fov*Math.PI/360);   // même angle que la perspective, à distance de référence
    camO.left=-hh*camP.aspect; camO.right=hh*camP.aspect; camO.top=hh; camO.bottom=-hh;
    camO.quaternion.copy(camP.quaternion); camO.position.copy(camP.position);
    camO.updateProjectionMatrix(); camO.updateMatrixWorld();
    cam = camO;
  } else cam = camP;

  const cp = Math.cos(ex.ph), D = EX_D;        // recul fixe : seul le cadrage change
  camX.position.set(ex.tgt.x+Math.cos(ex.th)*cp*D,
                    ex.tgt.y+Math.sin(ex.ph)*D,
                    ex.tgt.z+Math.sin(ex.th)*cp*D);
  camX.lookAt(ex.tgt);
  updateHelpers();

  // vue principale
  helpers.visible = false;
  sky.position.copy(cam.position);
  renderer.setScissorTest(true);
  renderer.setViewport(0,0,W,H); renderer.setScissor(0,0,W,H);
  // Le plan de sol (240 km) est centré sur le nuage : de très loin, l'œil est
  // hors du plan et verrait le dôme sous l'horizon. On l'agrandit pour la vue
  // principale seulement (le shader travaille en coordonnées monde : le motif
  // ne bouge pas), puis on le rend à sa taille pour la vue extérieure.
  const gs = Math.max(1, (Math.hypot(camPos.x, camPos.z) + 130000)/120000);
  ground.scale.set(gs, gs, 1);
  renderer.render(scene, cam);
  ground.scale.set(1, 1, 1);

  // vue extérieure
  const r = insetEl.getBoundingClientRect();
  helpers.visible = true;
  const axesWas = axesG.visible;
  axesG.visible = CFG.clouds;             // les axes y sont toujours tracés
  cloudMat.uniforms.uGhost.value = 1;
  cloudMat.depthWrite = false;  // nuage fantôme : ne doit pas cacher les colonnes ici
  occU.value = 0;
  fogK.value = 0.16;
  dfadeU.value = 0; gainU.value = 2.6;
  const ha = ex.r, wa = ha*(r.width/r.height); ex.wa = wa;
  camX.top=ha; camX.bottom=-ha; camX.left=-wa; camX.right=wa;
  camX.updateProjectionMatrix(); camX.updateMatrixWorld();
  // la vue extérieure est parallèle : le shader des colonnes doit le savoir
  orthoU.value = 1;
  camX.getWorldDirection(viewDirU.value);
  // fond bleu ciel uni plutôt que le dôme atmosphérique (celui-ci, vu de très
  // loin et de haut, donnait un aplat grisâtre peu lisible).
  sky.visible = false;
  renderer.setClearColor(SKY_FLAT, 1);
  renderer.setViewport(r.left, H-r.bottom, r.width, r.height);
  renderer.setScissor (r.left, H-r.bottom, r.width, r.height);
  renderer.render(scene, camX);
  renderer.setScissorTest(false);
  sky.visible = true;
  renderer.setClearColor(0x000000, 1);
  cloudMat.uniforms.uGhost.value = 0;
  cloudMat.depthWrite = true;
  occU.value = 1;
  fogK.value = 1;
  dfadeU.value = 1; gainU.value = mainGain;
  axesG.visible = axesWas;

  drawOverlay(W,H);
  drawInsetLabels();
  drawVueCote();

  // Resynchronise les sliders caméra avec camPos — source de vérité, qu'elle
  // vienne des sliders eux-mêmes ou d'un déplacement à la molette.
  const camDist = camPos.distanceTo(cloud.position);
  oCamDist.textContent = fmtDist(camDist);
  oCamH.textContent    = camPos.y.toFixed(1)+' m';
  sCamDist.value = camDistToSlider(camDist);
  sCamH.value    = camPos.y;
}
tick();
