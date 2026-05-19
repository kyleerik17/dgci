// === INIT ===
var __booted = false;
function boot(force){
  if(__booted && !force) return;
  __booted = true;
  applyTheme();
  updateNotifBadge();
  renderNotifications();
  var ok = initSupabase();
  if(!ok){
    // On affiche quand même l'app via le cache (utile sur iPhone).
    var hint = (location && location.protocol === 'file:')
      ? 'Ouvre la page via un lien HTTPS (pas depuis un fichier) pour connecter la base.'
      : 'Vérifie la connexion internet.';
    addNotification('warning','Connexion', 'Base non initialisée. ' + hint);
  }
  loadData();
}
// iOS: DOMContentLoaded est plus fiable que window.load
document.addEventListener('DOMContentLoaded', function(){ boot(false); });
// iOS: quand la page revient du cache (bfcache)
window.addEventListener('pageshow', function(e){ if(e && e.persisted) boot(true); });

window.addEventListener('scroll',hideDropdowns,{passive:true});
