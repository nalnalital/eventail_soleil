// File: js/dom.js
// Desc: Accès DOM contractuels (crash si un élément manque).
// Version 1.0.3
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

const $ = id=>document.getElementById(id);
const canvas = $('gl');
const insetEl = $('inset');
const ov = $('ov'), o2 = ov.getContext('2d');
const oCamDist = $('oCamDist'), oCamH = $('oCamH');
const sCamDist = $('sCamDist'), sCamH = $('sCamH');
const coteCv = $('cote'), cote2 = coteCv.getContext('2d');
