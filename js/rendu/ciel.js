// File: js/rendu/ciel.js
// Desc: Ciel : dôme, halo et disque solaire.
// Version 1.0.2
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - Sun disc/halo aimed at fakeSunPos from the camera (parallax), not at the
//   direction at infinity: it now sits on the "source ponctuelle" marker.

/* ---------------------------------------------------------------------------
   CIEL
   ------------------------------------------------------------------------ */
const skyMat = new THREE.ShaderMaterial({
  side:THREE.BackSide, depthWrite:false,
  uniforms:{ uToSun:{value:toSun}, uHaze:{value:HAZE}, uZen:{value:new THREE.Color(0.17,0.35,0.66)},
             uEl:{value:0.2}, uSunR:{value:SUN_ANG_RADIUS}, uDen:{value:0.55}, uOrtho:orthoU,
             uDiv:{value:0}, uSunP:{value:fakeSunPos} },
  vertexShader:`varying vec3 vW;
    void main(){ vW=(modelMatrix*vec4(position,1.)).xyz;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader:`precision highp float;
    varying vec3 vW; uniform vec3 uToSun,uHaze,uZen,uSunP; uniform float uEl,uSunR,uDen,uOrtho,uDiv;
    void main(){
      vec3 V = normalize(vW - cameraPosition);
      // Soleil proche : c'est un POINT (fakeSunPos), vu depuis la caméra.
      // Dès que l'observateur n'est pas sur la droite centre-du-nuage → Soleil,
      // la parallaxe le déplace dans le ciel (il baisse quand on l'approche
      // en regardant vers lui depuis loin). À l'infini, S = uToSun.
      // Taille apparente gardée constante : c'est une lampe ponctuelle, pas
      // un Soleil de 700 000 km de rayon qui remplirait le ciel.
      vec3 S = (uDiv > 0.5) ? normalize(uSunP - cameraPosition) : uToSun;
      float ct = clamp(dot(V,S),-1.,1.);
      float ang = acos(ct);
      float h = smoothstep(-0.04, 0.62, V.y);
      vec3 col = mix(uHaze, uZen, h);
      vec3 warm = vec3(1.0,0.70,0.42);
      col = mix(col, mix(col,warm,0.6), (1.0-smoothstep(0.02,0.32,uEl))*(1.0-h)*0.9);
      float halo = exp(-ang*6.5)*0.55 + exp(-ang*1.6)*0.13;
      col += vec3(1.0,0.93,0.78)*halo*(0.25+uDen*0.75);
      if(uOrtho < 0.5){
        float disc = 1.0 - smoothstep(uSunR*0.8, uSunR*1.25, ang);
        col = mix(col, vec3(3.2,3.0,2.7), disc);
      }
      gl_FragColor = vec4(col,1.0);
    }`
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(FAR*0.4,48,32), skyMat);
sky.renderOrder = -10; scene.add(sky);
