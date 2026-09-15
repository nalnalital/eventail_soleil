// File: js/rendu/bruit.js
// Desc: Bruit procédural GLSL partagé (value noise + fbm).
// Version 1.0.1
// Date: [September 14, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

/* ---------------------------------------------------------------------------
   bruit partagé (GLSL)
   ------------------------------------------------------------------------ */
const NOISE = `
  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
  float vnoise(vec2 p){
    vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
  }
  float fbm(vec2 p){
    float a=0.5, s=0.0;
    for(int i=0;i<5;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; }
    return s;
  }`;
