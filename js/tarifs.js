// === TARIFS ===
var editTarifDest=null;
async function loadTarifs(){
  try{
    var result=await db.from('gdci_tarifs').select('*');
    if(!result.error&&result.data&&result.data.length){
      TARIFS_TRANSPORT={};
      result.data.forEach(function(r){TARIFS_TRANSPORT[r.destination]={'10 Roues':r.tarif_10r,'12 Roues':r.tarif_12r,'Semi-Remorque':r.tarif_sr}});
    }
  }catch(e){}
}
async function upsertTarif(dest,t10r,t12r,tsr){
  try{
    var ex=await db.from('gdci_tarifs').select('id').eq('destination',dest.trim()).maybeSingle();
    var payload={destination:dest.trim(),tarif_10r:Number(t10r)||0,tarif_12r:Number(t12r)||0,tarif_sr:Number(tsr)||0,updated_at:new Date().toISOString()};
    var result=ex.data&&ex.data.id?await db.from('gdci_tarifs').update(payload).eq('id',ex.data.id):await db.from('gdci_tarifs').insert(payload);
    return!result.error;
  }catch(e){return false}
}
async function removeTarif(dest){var r=await db.from('gdci_tarifs').delete().eq('destination',dest);return!r.error}
function openTarifModal(dest){
  editTarifDest=dest||null;
  document.getElementById('tarif-modal-title').textContent=dest?'MODIFIER TARIF':'NOUVEAU TARIF';
  var t=dest?TARIFS_TRANSPORT[dest]:{};
  document.getElementById('t-dest').value=dest||'';
  document.getElementById('t-dest').readOnly=!!dest;
  document.getElementById('t-10r').value=t&&t['10 Roues']?t['10 Roues']:'';
  document.getElementById('t-12r').value=t&&t['12 Roues']?t['12 Roues']:'';
  document.getElementById('t-sr').value=t&&t['Semi-Remorque']?t['Semi-Remorque']:'';
  showModal('modal-tarif');
}
async function saveTarif(){
  var dest=(document.getElementById('t-dest').value||'').trim();
  var t10r=Number(document.getElementById('t-10r').value||0);
  var t12r=Number(document.getElementById('t-12r').value||0);
  var tsr=Number(document.getElementById('t-sr').value||0);
  if(!dest||!t10r||!t12r||!tsr){addNotification('warning','Champs requis','Tous les tarifs sont obligatoires');return}
  setSync('Sauvegarde...');
  if(!(await upsertTarif(dest,t10r,t12r,tsr))){setSync('Erreur');addNotification('error','Échec','Impossible de sauvegarder');return}
  TARIFS_TRANSPORT[dest]={'10 Roues':t10r,'12 Roues':t12r,'Semi-Remorque':tsr};
  setSync('Connecté');addNotification('success','Tarif mis à jour',dest);hideModal('modal-tarif');renderTarifs();
}
async function delTarif(dest){
  if(!confirm('Supprimer le tarif pour "'+dest+'" ?'))return;
  setSync('Suppression...');
  if(!(await removeTarif(dest))){setSync('Erreur');addNotification('error','Échec','Suppression impossible');return}
  delete TARIFS_TRANSPORT[dest];setSync('Connecté');addNotification('info','Tarif supprimé',dest);renderTarifs();
}
function renderTarifs(){
  var fmt=function(n){return Number(n).toLocaleString('fr-FR')};
  document.getElementById('tarif-dest-tbody').innerHTML=Object.entries(TARIFS_TRANSPORT).map(function(entry){
    var dest=entry[0],prix=entry[1];
    return'<tr><td style="font-weight:500">'+dest+'</td><td>'+fmt(prix['10 Roues'])+'</td><td>'+fmt(prix['12 Roues'])+'</td><td>'+fmt(prix['Semi-Remorque'])+'</td><td><div style="display:flex;gap:4px"><button class="icon-btn" data-action="open-tarif" data-dest="'+escAttr(dest)+'">✏</button><button class="icon-btn" data-action="del-tarif" data-dest="'+escAttr(dest)+'" style="color:var(--danger)">✕</button></div></td></tr>';
  }).join('');
  var mats=Object.entries(PRIX_MATERIAUX);
  document.getElementById('tarif-mat-grid').innerHTML=mats.map(function(entry,i){
    var mat=entry[0],prix=entry[1];
    return'<div style="padding:6px 10px;font-size:11px;border-bottom:1px solid var(--border);'+(i%2===1?'border-left:1px solid var(--border)':'')+'"><div style="color:var(--text-muted);font-size:9px;margin-bottom:2px">'+mat+'</div><div style="color:var(--text-primary);font-weight:600;font-family:var(--font-mono)">'+fmt(prix)+' FCFA</div></div>';
  }).join('');
}
