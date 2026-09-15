// File: js/scene.js
// Desc: Moteur three.js : renderer, scène, uniforms partagés entre shaders.
// Version 1.0.1
// Date: [September 14, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

THREE.ColorManagement.enabled = false;   // avant toute création de couleur

/* ============================================================================
   RENDU
   ========================================================================== */
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;     // couleurs littérales
const scene = new THREE.Scene();

const HAZE = new THREE.Color(0.60,0.66,0.77);
const SKY_FLAT = new THREE.Color(0.53,0.81,0.92);   // fond bleu ciel de la vue extérieure
const viewDirU = {value:new THREE.Vector3(0,0,-1)};   // direction de visée (mode ortho)
const fogK     = {value:1};   // voile atmosphérique (atténué dans la vue extérieure)
const dfadeU   = {value:1};   // atténuation avec la distance (désactivée en vue extérieure)
const gainU    = {value:1};   // gain de rendu des colonnes (exposition de la vue extérieure)
const orthoU   = {value:0};
const occU     = {value:1};   // masquage des colonnes par la couche (0 : nuage fantôme de la vue extérieure)
