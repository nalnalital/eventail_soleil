// File: js/interfaces.js
// Desc: Charge les composants partagés de _interfaces/ (tooltips) au bon chemin, local ou en ligne.
// Version 1.0.0
// Date: [September 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

/* ============================================================================
   _interfaces/ n'est pas au même niveau selon l'hébergement :
   - local (serve_site.py sur site/, ou file://) : site/soleil/  → ../_interfaces/
   - en ligne (OVH, www/pages/eventail/)         : www/_interfaces/ → ../../_interfaces/
   tooltips.js s'initialise tout de suite si le DOM est déjà prêt : un
   chargement dynamique (asynchrone) suffit, rien d'autre n'en dépend.
   ========================================================================== */
(function(){
  const online = /(^|\.)dnavatar\.org$/.test(location.hostname);
  const s = document.createElement('script');
  s.src = (online ? '../../' : '../') + '_interfaces/tooltips.js';
  document.body.appendChild(s);
})();
