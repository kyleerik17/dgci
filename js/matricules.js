// === MATRICULES ===
function openMatriculeModal(){['m-mat','m-nom','m-tel'].forEach(function(id){document.getElementById(id).value=''});showModal('modal-mat')}
async function saveMatricule(){
  var mat=normalizeMat(document.getElementById('m-mat').value),
      nom=document.getElementById('m-nom').value.trim(),
      tel=document.getElementById('m-tel').value.trim();
  if(!mat||!nom||!tel){addNotification('warning','Champs requis','Veuillez remplir tous les champs');return}
  if(matricules.find(function(m){return normalizeMat(m.matricule)===mat})){addNotification('warning','Doublon','Ce matricule existe déjà');return}
  var obj={id:Date.now().toString(),matricule:mat,nom:nom,tel:tel};
  setSync('Sauvegarde...');
  if(!(await upsertMat(obj))){setSync('Erreur');addNotification('error','Échec','Impossible d\'enregistrer');return}
  matricules.push(obj);
  saveCache();
  setSync(offlineMode?'Mode hors-ligne':'Connecté');
  if(offlineMode) addNotification('warning','Mode hors-ligne','Camion enregistré localement (non synchronisé).');
  addNotification('success','Camion ajouté',mat);
  hideModal('modal-mat');renderMats();
}
async function delMat(id){
  if(!confirm('Supprimer ce matricule ?'))return;
  setSync('Suppression...');
  if(!(await removeMat(id))){setSync('Erreur');addNotification('error','Échec','Suppression impossible');return}
  matricules=matricules.filter(function(m){return m.id!==id});
  saveCache();
  setSync(offlineMode?'Mode hors-ligne':'Connecté');
  if(offlineMode) addNotification('warning','Mode hors-ligne','Suppression faite localement (non synchronisée).');
  addNotification('info','Camion supprimé');renderMats();
}
function driverScore(voy){
  if(!voy.length) return 0;
  var delivered=voy.filter(function(v){return v.statut==='Livré'}).length;
  var cancelled=voy.filter(function(v){return v.statut==='Annulé'}).length;
  var ca=voy.reduce(function(a,v){return a+totalVoyage(v)},0);
  var tons=voy.reduce(function(a,v){return a+Number(v.tonnage||0)},0);
  var regularity=Math.min(25,voy.length*3);
  var reliability=voy.length?Math.round((delivered/voy.length)*35):0;
  var volume=Math.min(20,Math.round(tons/20));
  var value=Math.min(20,Math.round(ca/250000));
  return Math.max(0,Math.min(100,regularity+reliability+volume+value-(cancelled*8)));
}
function topDriverDestination(voy){
  var by={};
  voy.forEach(function(v){if(v.destination)by[v.destination]=(by[v.destination]||0)+1});
  var best=Object.entries(by).sort(function(a,b){return b[1]-a[1]})[0];
  return best?best[0]+' ('+best[1]+')':'—';
}
function openDriverBook(id){
  var m=matricules.find(function(x){return x.id===id});
  if(!m)return;
  var mat=normalizeMat(m.matricule);
  var hist=voyages.filter(function(v){return normalizeMat(v.matricule)===mat})
    .sort(function(a,b){return String(b.date).localeCompare(String(a.date))});
  var delivered=hist.filter(function(v){return v.statut==='Livré'});
  var inProgress=hist.filter(function(v){return v.statut==='En cours'||v.statut==='En attente'});
  var cancelled=hist.filter(function(v){return v.statut==='Annulé'});
  var ca=hist.reduce(function(a,v){return a+totalVoyage(v)},0);
  var caDelivered=delivered.reduce(function(a,v){return a+totalVoyage(v)},0);
  var tons=hist.reduce(function(a,v){return a+Number(v.tonnage||0)},0);
  var avg=hist.length?Math.round(ca/hist.length):0;
  var score=driverScore(hist);
  var last=hist[0];
  var scoreClass=score>=75?'tag-livre':score>=45?'tag-cours':'tag-attente';
  var body=document.getElementById('driver-body');
  document.getElementById('driver-modal-title').textContent='CARNET CHAUFFEUR — '+(m.nom||m.matricule||'');
  var rows=hist.map(function(v){
    return '<tr><td class="mono">'+fmtDate(v.date)+'</td><td class="mono">'+(v.num||'—')+'</td><td>'+escText(v.destination||'—')+'</td><td>'+escText(v.marchandise||'—')+'</td><td class="mono">'+(v.tonnage?v.tonnage+' t':'—')+'</td><td style="font-weight:600">'+fmtFCFA(totalVoyage(v))+'</td><td>'+statutTag(v.statut)+'</td></tr>';
  }).join('');
  if(!rows)rows='<tr><td colspan="7"><div class="empty-state"><p>Aucun voyage pour ce chauffeur</p></div></td></tr>';
  body.innerHTML=
    '<div class="driver-hero">'+
      '<div><div class="driver-name">'+escText(m.nom||'—')+'</div><div class="driver-sub"><span class="mono">'+escText(m.matricule||'—')+'</span> · '+escText(m.tel||'—')+'</div></div>'+
      '<div class="driver-score"><span class="tag '+scoreClass+'">Score '+score+'/100</span></div>'+
    '</div>'+
    '<div class="driver-kpis">'+
      '<div class="driver-kpi"><div class="driver-kpi-lbl">Voyages</div><div class="driver-kpi-val">'+hist.length+'</div></div>'+
      '<div class="driver-kpi"><div class="driver-kpi-lbl">Livrés</div><div class="driver-kpi-val">'+delivered.length+'</div></div>'+
      '<div class="driver-kpi"><div class="driver-kpi-lbl">En cours</div><div class="driver-kpi-val">'+inProgress.length+'</div></div>'+
      '<div class="driver-kpi"><div class="driver-kpi-lbl">Annulés</div><div class="driver-kpi-val">'+cancelled.length+'</div></div>'+
      '<div class="driver-kpi"><div class="driver-kpi-lbl">Montant généré</div><div class="driver-kpi-val">'+fmtCompactFCFA(ca)+'</div></div>'+
      '<div class="driver-kpi"><div class="driver-kpi-lbl">CA livré</div><div class="driver-kpi-val">'+fmtCompactFCFA(caDelivered)+'</div></div>'+
      '<div class="driver-kpi"><div class="driver-kpi-lbl">Tonnage</div><div class="driver-kpi-val">'+tons.toFixed(1)+' t</div></div>'+
      '<div class="driver-kpi"><div class="driver-kpi-lbl">Moyenne / voyage</div><div class="driver-kpi-val">'+fmtCompactFCFA(avg)+'</div></div>'+
    '</div>'+
    '<div class="driver-insight">'+
      '<div><strong>Destination dominante :</strong> '+escText(topDriverDestination(hist))+'</div>'+
      '<div><strong>Dernier voyage :</strong> '+(last?fmtDate(last.date)+' · '+escText(last.destination||'—'):'—')+'</div>'+
      '<div><strong>Lecture rapide :</strong> '+(score>=75?'chauffeur très performant':score>=45?'chauffeur actif à suivre':'pas encore assez de données')+'</div>'+
    '</div>'+
    '<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Date</th><th>N°</th><th>Destination</th><th>Marchandise</th><th>Tonnage</th><th>Total</th><th>Statut</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  showModal('modal-driver');
}
function renderMats(){
  var tb=document.getElementById('mat-tbody');
  var q=(document.getElementById('mat-search')?document.getElementById('mat-search').value:'')||'';
  q=String(q).trim().toLowerCase();
  var list=q?matricules.filter(function(m){
    var a=String(m.matricule||'').toLowerCase();
    var b=String(m.nom||'').toLowerCase();
    var c=String(m.tel||'').toLowerCase();
    return a.indexOf(q)!==-1||b.indexOf(q)!==-1||c.indexOf(q)!==-1;
  }):matricules;

  if(!matricules.length){tb.innerHTML='<tr><td colspan="6"><div class="empty-state"><p>Aucun camion</p></div></td></tr>';return}
  if(q && !list.length){tb.innerHTML='<tr><td colspan="6"><div class="empty-state"><p>Aucun résultat pour \"'+q+'\"</p></div></td></tr>';return}
  var mob=window.innerWidth<=768;
  if(mob){
    tb.innerHTML=list.map(function(m){
      var voy=voyages.filter(function(v){return normalizeMat(v.matricule)===normalizeMat(m.matricule)});
      var last=voy.slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date))})[0];
      return'<tr style="display:block;background:var(--surface);border-bottom:2px solid var(--border)"><td style="display:block;padding:12px"><div style="display:-webkit-flex;display:flex;-webkit-justify-content:space-between;justify-content:space-between;-webkit-align-items:center;align-items:center;margin-bottom:8px"><strong style="font-family:var(--font-mono);font-size:15px;color:var(--text-primary)">'+m.matricule+'</strong><div style="display:flex;gap:6px"><button class="icon-btn" data-action="driver-book" data-id="'+escAttr(m.id)+'" style="padding:6px 10px">📒</button><button class="icon-btn" data-action="del-mat" data-id="'+escAttr(m.id)+'" style="padding:6px 10px;color:var(--danger)">✕</button></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">Chauffeur</div><div style="font-size:12px;font-weight:500">'+(m.nom||'—')+'</div></div><div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">Téléphone</div><div style="font-size:12px;font-family:var(--font-mono)">'+(m.tel||'—')+'</div></div><div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">Voyages</div><div style="margin-top:4px"><span class="tag tag-livre">'+voy.length+'</span></div></div><div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">Dernier</div><div style="font-size:11px;font-family:var(--font-mono);color:var(--text-muted)">'+(last?fmtDate(last.date):'—')+'</div></div></div></td></tr>';
    }).join('');
    return;
  }
  tb.innerHTML=list.map(function(m){
    var voy=voyages.filter(function(v){return normalizeMat(v.matricule)===normalizeMat(m.matricule)});
    var last=voy.slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date))})[0];
    return'<tr><td><strong style="color:var(--text-primary)">'+m.matricule+'</strong></td><td style="font-weight:500">'+(m.nom||'—')+'</td><td class="mono">'+(m.tel||'—')+'</td><td><span class="tag tag-livre">'+voy.length+'</span></td><td class="mono">'+(last?fmtDate(last.date):'—')+'</td><td><div class="act-btns"><button class="icon-btn" data-action="driver-book" data-id="'+escAttr(m.id)+'">📒 Fiche</button><button class="icon-btn" data-action="del-mat" data-id="'+escAttr(m.id)+'" style="color:var(--danger)">✕</button></div></td></tr>';
  }).join('');
}
