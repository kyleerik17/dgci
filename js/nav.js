// === NAVIGATION ===
function showTab(name,btn){
  ['historique','stats','tarifs','matricules'].forEach(function(t){document.getElementById('tab-'+t).style.display=t===name?'':'none'});
  document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  if(name==='stats')renderStats();
  if(name==='matricules')renderMats();
  if(name==='tarifs')renderTarifs();
}
function showModal(id){document.getElementById(id).classList.remove('hidden')}
function hideModal(id){document.getElementById(id).classList.add('hidden')}
