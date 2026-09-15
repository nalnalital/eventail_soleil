// File: js/rendu/colonnes.js
// Desc: Colonnes de lumière (diffusion intégrée dans des cylindres obliques) et leurs axes.
// Version 1.0.2
// Date: [September 14, 2026] [19:18 UTC+1]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - Cloud occlusion fade matches CLOUD_FADE* (same finite disk as the layer).

/* ---------------------------------------------------------------------------
   LES COLONNES DE LUMIÈRE
   Cylindres à section CONSTANTE (aucun évasement). Le fragment shader intègre
   analytiquement la longueur d'air éclairé traversée par le rayon visuel,
   pondérée par la fonction de phase de Mie : c'est de la DIFFUSION.
   ------------------------------------------------------------------------ */
const beamFrag = `precision highp float;
  varying vec3 vW;
  uniform vec3 uA;       // origine de l'axe, dans le plan des nuages
  uniform vec3 uD;       // direction de l'axe = propagation de la lumière
  uniform float uR;      // rayon de la colonne — CONSTANT
  uniform float uTop;    // altitude de la couche
  uniform float uDen;    // aérosols
  uniform float uOrtho, uDfade, uGain;
  uniform vec3 uView;    // direction de visée (mode orthographique)
  uniform vec3 uCol;
  uniform vec3 uHoles[${NH}];
  uniform float uOcc;
  void main(){
    vec3 V, O;
    if(uOrtho > 0.5){ V = normalize(uView); O = vW - V*80000.0; }
    else            { V = normalize(vW - cameraPosition); O = cameraPosition; }

    // Un point de l'air est éclairé si, en remontant vers le Soleil jusqu'au
    // plan des nuages, on tombe dans le trou. La colonne est donc le trou
    // translaté le long de uD : un cylindre OBLIQUE à base circulaire
    // horizontale, dont la section perpendiculaire est une ellipse r × r·sin(h).
    // (Un cylindre droit de rayon r serait une triche : trop épais en lumière
    // rasante, et encore visible à hauteur nulle.)
    vec2 w = (O - uD*((O.y-uTop)/uD.y) - uA).xz;
    vec2 v = (V - uD*(V.y/uD.y)).xz;
    float a = dot(v,v), b = 2.0*dot(w,v), c = dot(w,w) - uR*uR;
    float t0, t1;
    if(a < 1e-9){                       // regard exactement parallèle à l'axe
      if(c > 0.0) discard;
      t0 = -1e9; t1 = 1e9;
    } else {
      float disc = b*b - 4.0*a*c;
      if(disc <= 0.0) discard;
      float sq = sqrt(disc);
      t0 = (-b-sq)/(2.0*a); t1 = (-b+sq)/(2.0*a);
    }
    float ta=-1e9, tb=1e9;              // découpe par la tranche 0 <= y <= uTop
    if(abs(V.y) > 1e-7){
      float s0=(0.0-O.y)/V.y, s1=(uTop-O.y)/V.y;
      ta=min(s0,s1); tb=max(s0,s1);
    } else if(O.y<0.0 || O.y>uTop) discard;
    float tn = max(max(t0,ta), 0.0);
    float tf = min(t1,tb);
    float seg = tf - tn;                // air éclairé traversé par le regard
    if(seg <= 0.0) discard;

    // Vu d'au-dessus, la couche cache l'air situé dessous, sauf à travers un
    // trou. Calculé ici plutôt que par le tampon de profondeur : la face arrière
    // du cylindre incliné n'est pas à la profondeur de l'air éclairé (elle
    // dépasse au-dessus du plan près du trou), et le test de profondeur y
    // découpait la colonne en croissant à bord net.
    float vis = 1.0;
    if(uOcc > 0.5 && O.y > uTop && V.y < 0.0){
      vec2 q = (O + V*((uTop-O.y)/V.y)).xz;
      float a = 1.0;                    // même opacité que le shader de la couche
      for(int i=0;i<${NH};i++){
        float r = uHoles[i].z;
        a *= smoothstep(r*0.80, r*1.18, distance(q, uHoles[i].xy));
      }
      a *= 1.0 - smoothstep(${CLOUD_FADE0}.0, ${CLOUD_FADE1}.0, length(q));
      vis = 1.0 - a;
      if(vis < 0.002) discard;
    }

    float ct = -dot(V, uD);             // +1 : on regarde vers le Soleil (diffusion avant)
    const float g = 0.50, gg = 0.25;
    float ph = (1.0-gg)/pow(max(1.0+gg-2.0*g*ct, 1e-4), 1.5);
    ph /= (1.0-gg)/pow(1.0+gg, 1.5);    // normalisée : 1 à 90°
    ph = min(ph, 14.0);

    vec3 P = O + V*(tn+seg*0.5);
    float ext   = exp(-clamp(1.0-P.y/uTop,0.0,1.0)*1.15);
    float dfade = mix(1.0, 1.0/(1.0 + length(P-cameraPosition)/40000.0), uDfade);
    float I = uGain*uDen*(seg/6000.0)*ph*ext*dfade;
    gl_FragColor = vec4(uCol*(1.0-exp(-I))*vis, 1.0);
  }`;
const beamVert = `varying vec3 vW;
  void main(){ vW=(modelMatrix*vec4(position,1.)).xyz;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;

const beams = new THREE.Group(); scene.add(beams);
const axesG = new THREE.Group(); axesG.visible=false; scene.add(axesG);
const unitCyl = new THREE.CylinderGeometry(1,1,1,28,1,false);
const YUP = new THREE.Vector3(0,1,0);
const bo = [];
for(const h of holes){
  const mat = new THREE.ShaderMaterial({
    vertexShader:beamVert, fragmentShader:beamFrag,
    uniforms:{ uA:{value:new THREE.Vector3()}, uD:{value:new THREE.Vector3()},
               uR:{value:h.r}, uTop:{value:CFG.H}, uDen:{value:0.55},
               uOrtho:orthoU, uView:viewDirU, uDfade:dfadeU, uGain:gainU,
               uHoles:{value:holeUni}, uOcc:occU,
               uCol:{value:new THREE.Color(1.0,0.90,0.70)} },
    transparent:true, blending:THREE.AdditiveBlending,
    // Pas de test de profondeur : sol et couche sont déjà traités
    // analytiquement dans le shader (tranche 0..uTop, masquage par les trous).
    depthWrite:false, depthTest:false, side:THREE.BackSide
  });
  const m = new THREE.Mesh(unitCyl, mat); m.renderOrder = 5; m.frustumCulled = false;
  beams.add(m);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6),3));
  const line = new THREE.Line(g, new THREE.LineBasicMaterial({
    color:new THREE.Color(1,0.5,0.12), transparent:true, opacity:.95, depthTest:false}));
  line.renderOrder = 9; line.frustumCulled = false; axesG.add(line);
  bo.push({h, mesh:m, mat, line});
}

const _d = new THREE.Vector3(), _a = new THREE.Vector3();
const BEAM_MIN_SIN = 0.003;          // ≈ 0,17° : ruban de moins de 3 m
function rebuildBeams(){
  const H = CFG.H;
  for(const b of bo){
    _a.set(b.h.x, H, b.h.z);
    if(CFG.diverge) _d.copy(_a).sub(fakeSunPos).normalize();
    else            _d.copy(rayDir);          /* ← LA MÊME DIRECTION POUR TOUTES */
    // Soleil (quasi) à l'horizon : la colonne devient un ruban d'épaisseur
    // r·sin(h) → 0. Plus rien ne passe : on la retire plutôt que de la tordre.
    const on = _d.y < -BEAM_MIN_SIN;
    b.mesh.visible = on; b.line.visible = on;
    if(!on) continue;
    const L = H/(-_d.y);
    // Le cylindre est un simple support de rasterisation : ses bouchons sont
    // perpendiculaires à l'axe, donc inclinés, et couperaient l'air éclairé
    // près du trou et près du sol (où la section est le disque du trou, qui
    // déborde d'au plus r le long de l'axe). On le prolonge d'autant aux deux
    // bouts ; le shader découpe exactement.
    const ext = 1.3*b.h.r;
    b.mat.uniforms.uA.value.copy(_a);
    b.mat.uniforms.uD.value.copy(_d);
    b.mat.uniforms.uTop.value = H;
    b.mesh.quaternion.setFromUnitVectors(YUP,_d);
    b.mesh.position.copy(_a).addScaledVector(_d, L*0.5);
    b.mesh.scale.set(b.h.r*1.3, L+2*ext, b.h.r*1.3);
    const p = b.line.geometry.attributes.position;
    p.setXYZ(0,_a.x,_a.y,_a.z);
    p.setXYZ(1,_a.x+_d.x*L, _a.y+_d.y*L, _a.z+_d.z*L);
    p.needsUpdate = true;
  }
}
