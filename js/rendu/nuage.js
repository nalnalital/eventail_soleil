// File: js/rendu/nuage.js
// Desc: Couche nuageuse trouée (disque procédural).
// Version 1.0.2
// Date: [September 14, 2026] [19:18 UTC+1]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - Disk radius and edge fade follow CLOUD_R / CLOUD_FADE* (finite disk, visible rim).

/* ---------------------------------------------------------------------------
   COUCHE NUAGEUSE — procédurale : les trous sont EXACTEMENT ceux de la liste,
   donc toujours cohérents avec les colonnes et les taches au sol.
   ------------------------------------------------------------------------ */
const cloudMat = new THREE.ShaderMaterial({
  transparent:true, side:THREE.DoubleSide,
  uniforms:{ uHoles:{value:holeUni}, uN:{value:NH}, uHaze:{value:HAZE}, uToSun:{value:toSun},
             uGhost:{value:0}, uFogK:fogK },
  vertexShader:`varying vec3 vW;
    void main(){ vW=(modelMatrix*vec4(position,1.)).xyz;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader:`precision highp float;
    varying vec3 vW; uniform vec3 uHoles[${NH}]; uniform int uN; uniform vec3 uHaze,uToSun;
    uniform float uGhost,uFogK;
    ${NOISE}
    void main(){
      float a = 1.0;
      float edge = 0.0;                      // proximité d'un bord de trou
      for(int i=0;i<${NH};i++){
        if(i>=uN) break;
        float d = distance(vW.xz, uHoles[i].xy);
        float r = uHoles[i].z;
        a *= smoothstep(r*0.80, r*1.18, d);
        edge = max(edge, 1.0 - smoothstep(r*1.0, r*2.2, d));
      }
      float R = length(vW.xz);
      a *= 1.0 - smoothstep(${CLOUD_FADE0}.0, ${CLOUD_FADE1}.0, R);
      if(a < 0.02) discard;
      float n = fbm(vW.xz*0.0016)*0.75 + fbm(vW.xz*0.0085)*0.25;
      vec3 under = vec3(0.150,0.160,0.190)*(0.55+n*1.00);
      under += vec3(0.42,0.37,0.29)*edge*edge*0.75;     // lumière qui fuit par les bords
      // rétro-éclairage : le dessous du nuage s'illumine dans la direction du Soleil
      float fs = max(dot(normalize(vW-cameraPosition), uToSun), 0.0);
      under += vec3(0.55,0.46,0.33)*pow(fs,9.0)*0.45;
      vec3 over  = vec3(0.93,0.94,0.99)*(0.55+n*0.75);
      vec3 col = gl_FrontFacing ? over : under;
      float d = length(vW - cameraPosition);
      col = mix(col, uHaze*0.92, (1.0-exp(-d/26000.0))*0.55*uFogK);
      // vue extérieure : la couche devient translucide par-dessus, sinon elle
      // masquerait justement ce qu'il faut voir — les colonnes en dessous
      if(uGhost > 0.5 && gl_FrontFacing) a *= 0.12;
      gl_FragColor = vec4(col, a);
    }`
});
const cloud = new THREE.Mesh(new THREE.CircleGeometry(CLOUD_R,96), cloudMat);
cloud.rotation.x = -Math.PI/2; cloud.position.y = CFG.H; scene.add(cloud);
