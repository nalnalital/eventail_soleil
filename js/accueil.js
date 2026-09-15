// File: js/accueil.js
// Desc: Popup d'arrivée : la photo et la question de la page ; se ferme au bouton, au clic hors carte ou avec Échap.
// Version 1.0.0
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function(){
  const box = $('accueil');
  function fermer(){
    if(box.classList.contains('fin')) return;
    box.classList.add('fin');
    removeEventListener('keydown', clavier);
    setTimeout(()=>box.remove(), 300);   // après le fondu (css/accueil.css)
  }
  function clavier(e){ if(e.key === 'Escape' || e.key === 'Enter') fermer(); }
  $('accueilOk').addEventListener('click', fermer);
  box.addEventListener('click', e=>{ if(!e.target.closest('.carte')) fermer(); });
  addEventListener('keydown', clavier);
  $('accueilOk').focus();
})();
