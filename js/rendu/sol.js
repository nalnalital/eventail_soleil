// File: js/rendu/sol.js
// Desc: Sol : damier de repère, taches de lumière et ombre de la couche.
// Version 1.0.2
// Date: [September 14, 2026] [19:18 UTC+1]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - Ground shadow disk fade matches CLOUD_FADE* (same finite cloud disk).

/* ---------------------------------------------------------------------------
   SOL
   Les taches lumineuses sont calculées exactement : depuis chaque point du sol
   on remonte vers le Soleil et on regarde si le rayon traverse un trou.
   ------------------------------------------------------------------------ */
const groundMat = new THREE.ShaderMaterial({
  uniforms:{ uToSun:{value:toSun}, uH:{value:CFG.H}, uHoles:{value:holeUni}, uN:{value:NH},
             uClouds:{value:1}, uHaze:{value:HAZE}, uDiv:{value:0}, uSunP:{value:fakeSunPos},
             uFogK:fogK },
  vertexShader:`varying vec3 vW;
    void main(){ vW=(modelMatrix*vec4(position,1.)).xyz;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader:`precision highp float;
    varying vec3 vW; uniform vec3 uToSun,uHaze,uSunP; uniform float uH,uClouds,uDiv,uFogK;
    uniform vec3 uHoles[${NH}]; uniform int uN;
    ${NOISE}
    void main(){
      vec3 s = (uDiv>0.5) ? normalize(uSunP - vW) : uToSun;
      float lit = 1.0;
      if(uClouds>0.5){
        if(s.y>0.003){
          float t = uH/s.y;
          vec2 q = vW.xz + t*s.xz;
          lit = 0.0;
          for(int i=0;i<${NH};i++){
            if(i>=uN) break;
            float d = distance(q, uHoles[i].xy);
            lit = max(lit, smoothstep(uHoles[i].z, uHoles[i].z*0.70, d));
            if(lit > 0.999) break;
          }
          // Le nuage lui-même est un DISQUE (cf. cloud, même fondu CLOUD_FADE*) :
          // au-delà, il n'y a plus de nuage du tout, donc plus d'ombre — sans
          // ce fondu, l'ombre resterait uniformément noire jusqu'au bord du
          // plan de sol (un carré), alors qu'elle doit s'arrêter en disque.
          float discFade = 1.0 - smoothstep(${CLOUD_FADE0}.0, ${CLOUD_FADE1}.0, length(q));
          lit = mix(1.0, lit, discFade);
        }
      }
      float n = fbm(vW.xz*0.0022)*0.7 + fbm(vW.xz*0.019)*0.3;
      // Gros damier de 20 m : repère de perspective, filtré pour ne pas
      // scintiller au loin (il se fond en gris moyen quand les cases deviennent
      // plus petites qu'un pixel).
      const float CELL = 20.0;
      vec2 cq = vW.xz/CELL;
      vec2 fw = max(fwidth(cq), 1e-4);
      vec2 tri = abs(fract((cq - 0.5*fw)*0.5) - 0.5) - abs(fract((cq + 0.5*fw)*0.5) - 0.5);
      vec2 fi = 2.0*tri/fw;                          // intégrale filtrée du créneau
      float chk = 0.5 - 0.5*fi.x*fi.y;               // 0 ou 1, 0.5 quand indiscernable
      float tile = mix(0.58, 1.15, chk);
      // lumière d'ambiance du ciel : l'ombre n'est jamais noire
      vec3 dark = vec3(0.58,0.61,0.66)*(0.88+n*0.24)*tile;
      vec3 brig = vec3(1.00,0.93,0.74)*(0.88+n*0.24)*tile;
      vec3 col = mix(dark, brig, lit);
      // Repère de direction : de grosses cases pleines (rouge = une colonne
      // sur deux le long de X, bleu = une rangée sur deux le long de Z),
      // superposées au damier N&B — sans ça, un damier pur peut sembler
      // immobile ou reculer quand on avance (illusion de type « roue de char »).
      const float BIGCELL = 250.0;
      float bx = mod(floor(vW.x/BIGCELL), 2.0);
      float bz = mod(floor(vW.z/BIGCELL), 2.0);
      col = mix(col, vec3(1.0,0.10,0.10), bx*0.45);
      col = mix(col, vec3(0.10,0.20,1.0), bz*0.45);
      float d = length(vW - cameraPosition);
      col = mix(col, uHaze*0.86, (1.0-exp(-d/7500.0))*uFogK);
      gl_FragColor = vec4(col,1.0);
    }`
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240000,240000), groundMat);
ground.rotation.x = -Math.PI/2; scene.add(ground);
