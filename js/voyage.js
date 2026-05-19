// === VOYAGE MODAL ===
function openVoyageModal(prefill){
  editId=prefill&&prefill.id?prefill.id:null;
  document.getElementById('voyage-modal-title').textContent=editId?'MODIFIER VOYAGE':'NOUVEAU VOYAGE';
  document.getElementById('f-date').value=prefill&&prefill.date?prefill.date:today();
  document.getElementById('f-mat').value=prefill&&prefill.matricule?prefill.matricule:'';
  document.getElementById('f-camtype').value=prefill&&prefill.type?prefill.type:'10 Roues';
  document.getElementById('f-dest').value=prefill&&prefill.destination?prefill.destination:'';
  document.getElementById('f-march').value=prefill&&prefill.marchandise?prefill.marchandise:'';
  var baseTransport=(prefill&&prefill.destination&&prefill.type&&TARIFS_TRANSPORT[prefill.destination])?Number(TARIFS_TRANSPORT[prefill.destination][prefill.type]||0):0;
  var baseMat=(prefill&&prefill.marchandise&&PRIX_MATERIAUX[prefill.marchandise])?Number(PRIX_MATERIAUX[prefill.marchandise]||0):0;
  document.getElementById('f-neg-transport').checked=!!(prefill&&(prefill.transportNegocie||(baseTransport&&Number(prefill.tarif||0)!==baseTransport)));
  document.getElementById('f-neg-mat').checked=!!(prefill&&(prefill.matNegocie||(baseMat&&Number(prefill.prixMat||0)!==baseMat&&Number(prefill.prixMat||0)<50000)));
  document.getElementById('f-tarif-base').value=prefill&&prefill.tarifBase?prefill.tarifBase:'';
  document.getElementById('f-prix-mat-base').value=prefill&&prefill.prixMatBase?prefill.prixMatBase:'';
  // Toujours afficher un prix / tonne dans le formulaire (même si d'anciens voyages ont un prix total stocké).
  (function(){
    var prix=prefill&&prefill.prixMat?Number(prefill.prixMat):0;
    var ton=prefill&&billedTonnage(prefill)?billedTonnage(prefill):0;
    if(prix && ton){
      var mc=matCost(prefill);
      var unit=mc?Math.round(mc/ton):prix;
      document.getElementById('f-prix-mat').value=unit||'';
    }else{
      document.getElementById('f-prix-mat').value=prefill&&prefill.prixMat?prefill.prixMat:'';
    }
  })();
  document.getElementById('f-prix-mat').readOnly=false;
  document.getElementById('f-tonnage').value=prefill&&prefill.tonnage?prefill.tonnage:'';
  document.getElementById('f-tonnage-facture').value=prefill&&prefill.tonnageFacture?prefill.tonnageFacture:'';
  document.getElementById('f-tarif').value=prefill&&prefill.tarif?prefill.tarif:'';
  document.getElementById('f-total').value=prefill&&totalVoyage(prefill)?totalVoyage(prefill):'';
  document.getElementById('f-statut2').value=prefill&&prefill.statut?prefill.statut:'Livré';
  document.getElementById('f-client').value=prefill&&prefill.client?prefill.client:'';
  document.getElementById('f-motif-neg').value=prefill&&prefill.motifNegociation?prefill.motifNegociation:'';
  document.getElementById('f-notes').value=prefill&&prefill.notes?cleanNotes(prefill.notes):'';
  document.getElementById('tarif-transport-hint').classList.remove('show');
  document.getElementById('tarif-mat-hint').classList.remove('show');
  document.getElementById('mat-dl').innerHTML=matricules.map(function(m){return'<option value="'+m.matricule+'">'}).join('');
  if(prefill&&prefill.destination)updateTransportHint();
  if(prefill&&prefill.marchandise)updateMarchHint();
  syncNegotiationFields();
  calcTotal();
  showModal('modal-voyage');
}
function editVoyage(id){
  var v=voyages.find(function(x){return x.id===id});
  if(v)openVoyageModal(v);
}
function validateTruckTonnage(){
  var tonnage=Number(document.getElementById('f-tonnage').value||0),
      type=document.getElementById('f-camtype').value;
  if(type==='10 Roues'&&(tonnage<0||tonnage>25)){alert('10 Roues : 0 à 25t');return false}
  if(type==='12 Roues'&&(tonnage<25||tonnage>30)){alert('12 Roues : 25 à 30t');return false}
  if(type==='Semi-Remorque'&&(tonnage<30||tonnage>45)){alert('Semi-Remorque : 30 à 45t');return false}
  return true;
}
async function saveVoyage(){
  var mat=normalizeMat(document.getElementById('f-mat').value),
      date=document.getElementById('f-date').value,
      dest=document.getElementById('f-dest').value,
      marc=document.getElementById('f-march').value.trim();
  if(!date||!mat||!dest||!marc){addNotification('error','Champs manquants','Veuillez remplir les champs obligatoires');return}
  var registeredTruck=matricules.find(function(m){return normalizeMat(m.matricule)===mat});
  var truckType=registeredTruck&&registeredTruck.type?registeredTruck.type:document.getElementById('f-camtype').value;
  document.getElementById('f-camtype').value=truckType;
  if(!validateTruckTonnage())return;
  if(editId){
    var old=voyages.find(function(v){return v.id===editId});
    if(old&&old.statut==='Livré'&&document.getElementById('f-statut2').value==='En cours'){addNotification('warning','Action impossible',"Impossible de repasser un voyage de 'Livré' à 'En cours'");return}
  }
  var realTon=document.getElementById('f-tonnage').value;
  var billTon=document.getElementById('f-tonnage-facture').value||realTon;
  var obj={id:editId||Date.now().toString(),num:editId?(function(){var x=voyages.find(function(v){return v.id===editId});return x&&x.num?x.num:genNum()})():genNum(),date:date,matricule:mat,type:truckType,destination:dest,marchandise:marc,prixMat:document.getElementById('f-prix-mat').value,prixMatBase:document.getElementById('f-prix-mat-base').value,matNegocie:document.getElementById('f-neg-mat').checked,tonnage:realTon,tonnageFacture:String(billTon)!==String(realTon)?billTon:'',tarif:document.getElementById('f-tarif').value,tarifBase:document.getElementById('f-tarif-base').value,transportNegocie:document.getElementById('f-neg-transport').checked,statut:document.getElementById('f-statut2').value,client:document.getElementById('f-client').value.trim(),motifNegociation:document.getElementById('f-motif-neg').value.trim(),notes:document.getElementById('f-notes').value.trim()};
  setSync('Sauvegarde...');
  if(!(await upsertVoyage(obj))){setSync('Erreur');addNotification('error','Échec','Impossible de sauvegarder le voyage');return}
  var i=voyages.findIndex(function(v){return v.id===obj.id});
  if(i>=0)voyages[i]=obj;else voyages.push(obj);
  saveCache();
  setSync(offlineMode?'Mode hors-ligne':'Connecté');
  if(offlineMode) addNotification('warning','Mode hors-ligne','Enregistré localement (iPhone). Ouvre via HTTPS pour synchroniser.');
  addNotification('success','Voyage enregistré',obj.num+' - '+obj.destination);
  hideModal('modal-voyage');renderTable();
}
async function delVoyage(id){
  if(!confirm('Supprimer ce voyage ?'))return;
  setSync('Suppression...');
  if(!(await removeVoyage(id))){setSync('Erreur');addNotification('error','Échec','Suppression impossible');return}
  voyages=voyages.filter(function(v){return v.id!==id});
  saveCache();
  setSync(offlineMode?'Mode hors-ligne':'Connecté');
  if(offlineMode) addNotification('warning','Mode hors-ligne','Suppression faite localement (non synchronisée).');
  addNotification('info','Voyage supprimé','Le voyage a été retiré');
  renderTable();
}

// === DETAILS & RECEIPT ===
function dRow(l,v){return'<div style="background:var(--surface-alt);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 10px"><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">'+l+'</div><div style="font-size:12px;font-weight:500">'+v+'</div></div>'}
function viewDetail(id){
  var v=voyages.find(function(x){return x.id===id});if(!v)return;
  var hist=voyages.filter(function(x){return normalizeMat(x.matricule)===normalizeMat(v.matricule)});
  var caM=hist.filter(function(x){return x.statut==='Livré'}).reduce(function(a,x){return a+totalVoyage(x)},0);
  var ton=billedTonnage(v);
  var mCost=matCost(v);
  var unitMat=ton>0&&mCost?Math.round(mCost/ton):Number(v.prixMat||0);
  var neg=isNegotiated(v),bareme=baremeTotalVoyage(v),ecart=totalVoyage(v)-bareme;
  var negBox=neg?'<div style="grid-column:1/-1;background:var(--accent-light);border:1px solid rgba(59,130,246,.2);border-radius:var(--radius-sm);padding:10px"><strong>Prix négocié</strong> · Barème : '+fmtFCFA(bareme)+' · Écart : '+(ecart>=0?'+':'')+fmtFCFA(ecart).replace('—','0 FCFA')+(v.motifNegociation?' · Motif : '+escText(v.motifNegociation):'')+'</div>':'';
  document.getElementById('detail-body').innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+dRow('Réf.',v.num||'—')+dRow('Date',fmtDate(v.date))+dRow('Matricule','<span style="color:var(--text-primary);font-family:var(--font-mono);font-size:14px">'+(v.matricule||'—')+'</span>')+dRow('Type',typeTag(v.type))+dRow('Destination',v.destination||'—')+dRow('Marchandise','<strong>'+(v.marchandise||'—')+'</strong>')+dRow('Tonnage réel',v.tonnage?v.tonnage+' t':'—')+dRow('Tonnage facturé',ton?ton+' t':'—')+dRow('Transport appliqué',fmtFCFA(v.tarif))+(v.tarifBase?dRow('Transport barème',fmtFCFA(v.tarifBase)):'')+dRow('Prix/t appliqué',unitMat?fmtFCFA(unitMat)+'/t':'—')+(v.prixMatBase?dRow('Prix/t barème',fmtFCFA(v.prixMatBase)+'/t'):'')+dRow('Total','<span style="font-weight:600">'+fmtFCFA(totalVoyage(v))+'</span>')+dRow('Client',v.client||'—')+dRow('Statut',statutTag(v.statut))+negBox+'<div style="grid-column:1/-1;background:var(--surface-alt);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">Historique '+(v.matricule||'')+' : <strong>'+hist.length+'</strong> voyage(s) · CA : <strong style="color:var(--success)">'+fmtFCFA(caM)+'</strong></div></div>';
  showModal('modal-detail');
}
function openReceipt(id){
  var v=voyages.find(function(x){return x.id===id});if(!v)return;
  var isLivre=v.statut==='Livré',total=totalVoyage(v);
  var ton=billedTonnage(v);
  var montantMat=matCost(v);
  var unitMat=ton>0&&montantMat?Math.round(montantMat/ton):null;
  var unitTransport=ton>0?Math.round(Number(v.tarif||0)/ton):null;
  var negLine=isNegotiated(v)?'<div style="font-size:10px;color:#64748b;margin-top:6px"><strong>Note :</strong> prix/tonnage négocié'+(v.motifNegociation?' — '+escText(v.motifNegociation):'')+'</div>':'';
  document.getElementById('receipt-modal-title').textContent=isLivre?'REÇU DE LIVRAISON':'BON DE TRANSPORT';
  document.getElementById('receipt-printable').innerHTML='<div><div class="rcpt-header"><div><div class="rcpt-brand">GDCI</div><div style="font-size:11px;color:#64748b;margin-top:2px">Transport & Logistique</div></div><div class="rcpt-meta"><div class="rcpt-title">'+(isLivre?'Reçu':'Bon')+'</div><div style="font-family:var(--font-mono);font-size:11px;color:#64748b;margin-top:4px">'+(v.num||'—')+'</div><div style="font-size:10px;color:#94a3b8;margin-top:2px">'+fmtDate(today())+'</div></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px"><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px"><div style="font-size:9px;text-transform:uppercase;color:#64748b;margin-bottom:6px;font-weight:600">Transport</div><div style="font-size:12px;margin-bottom:4px"><strong>Date :</strong> '+fmtDate(v.date)+'</div><div style="font-size:12px;margin-bottom:4px"><strong>Matricule :</strong> '+(v.matricule||'—')+'</div><div style="font-size:12px"><strong>Type :</strong> '+(v.type||'—')+'</div>'+negLine+'</div><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px"><div style="font-size:9px;text-transform:uppercase;color:#64748b;margin-bottom:6px;font-weight:600">Client</div><div style="font-size:12px;margin-bottom:4px"><strong>Client :</strong> '+(v.client||'—')+'</div><div style="font-size:12px;margin-bottom:4px"><strong>Destination :</strong> '+(v.destination||'—')+'</div><div style="font-size:12px"><strong>Marchandise :</strong> '+(v.marchandise||'—')+'</div></div></div><table class="rcpt-table"><thead><tr><th>Désignation</th><th>Tonnage facturé</th><th>Prix / tonne</th><th style="text-align:right">Montant</th></tr></thead><tbody><tr><td>Transport — <strong>'+(v.marchandise||'marchandise')+'</strong></td><td>'+((ton||v.tonnage)?(ton||v.tonnage)+' t':'—')+'</td><td>'+(unitTransport?fmtFCFA(unitTransport)+'/t':'—')+'</td><td style="text-align:right">'+fmtFCFA(v.tarif)+'</td></tr>'+(montantMat?'<tr><td>Fourniture — <strong>'+(v.marchandise||'')+'</strong></td><td>'+((ton||v.tonnage)?(ton||v.tonnage)+' t':'—')+'</td><td>'+(unitMat?fmtFCFA(unitMat)+'/t':'—')+'</td><td style="text-align:right">'+fmtFCFA(montantMat)+'</td></tr>':'')+'<tr class="total-row"><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:right">'+fmtFCFA(total)+'</td></tr></tbody></table><div style="font-size:10px;color:#64748b;margin:-6px 0 12px">Tonnage réel : '+(v.tonnage?v.tonnage+' t':'—')+'</div><div style="border-top:1px solid #e2e8f0;padding-top:12px;display:-webkit-flex;display:flex;-webkit-justify-content:space-between;justify-content:space-between;-webkit-align-items:flex-end;align-items:flex-end"><div style="font-size:9px;color:#94a3b8;max-width:220px;font-style:italic">'+(isLivre?'Reçu officiel GDCI':'Bon de transport GDCI')+'</div><div style="display:-webkit-flex;display:flex;gap:24px"><div style="text-align:center"><div style="width:120px;border-top:1px solid #cbd5e1;margin:24px auto 4px"></div><div style="font-size:9px;color:#64748b;text-transform:uppercase">Chauffeur</div></div><div style="text-align:center"><div style="width:120px;border-top:1px solid #cbd5e1;margin:24px auto 4px"></div><div style="font-size:9px;color:#64748b;text-transform:uppercase">Client</div></div></div></div></div>';
  showModal('modal-receipt');
}
function printReceipt(){window.print()}
function printBareme(){window.print()}
