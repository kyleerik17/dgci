// === CALCULS & HINTS ===
function updateTransportHint(){
  var dest=document.getElementById('f-dest').value,
      type=document.getElementById('f-camtype').value,
      hint=document.getElementById('tarif-transport-hint');
  if(dest&&TARIFS_TRANSPORT[dest]&&TARIFS_TRANSPORT[dest][type]){
    var val=TARIFS_TRANSPORT[dest][type];
    hint.innerHTML='✅ Tarif : <strong>'+val.toLocaleString('fr-FR')+' FCFA</strong>';
    hint.classList.add('show');
    document.getElementById('f-tarif-base').value=val;
    if(!document.getElementById('f-neg-transport').checked)document.getElementById('f-tarif').value=val;
  }else{
    hint.classList.remove('show');
    document.getElementById('f-tarif-base').value='';
    if(!document.getElementById('f-neg-transport').checked)document.getElementById('f-tarif').value='';
  }
  syncNegotiationFields();
  calcTotal();
}
function updateMarchHint(){
  var march=document.getElementById('f-march').value,
      hint=document.getElementById('tarif-mat-hint'),
      base=document.getElementById('f-prix-mat-base'),
      field=document.getElementById('f-prix-mat');
  if(march&&PRIX_MATERIAUX[march]){
    var val=PRIX_MATERIAUX[march];
    hint.innerHTML='✅ Prix : <strong>'+val.toLocaleString('fr-FR')+' FCFA/t</strong>';
    hint.classList.add('show');
    base.value=val;
    if(!document.getElementById('f-neg-mat').checked)field.value=val;
  }else{
    hint.classList.remove('show');
    base.value='';
    if(!document.getElementById('f-neg-mat').checked)field.value='';
  }
  syncNegotiationFields();
  calcTotal();
}
function syncNegotiationFields(){
  var negT=document.getElementById('f-neg-transport');
  var tarif=document.getElementById('f-tarif');
  var baseT=document.getElementById('f-tarif-base');
  if(negT&&tarif){
    tarif.readOnly=!negT.checked;
    tarif.style.cursor=negT.checked?'text':'not-allowed';
    if(!negT.checked&&baseT)tarif.value=baseT.value||'';
  }
  var negM=document.getElementById('f-neg-mat');
  var prix=document.getElementById('f-prix-mat');
  var baseM=document.getElementById('f-prix-mat-base');
  if(negM&&prix){
    prix.readOnly=!negM.checked&&!!(baseM&&baseM.value);
    prix.style.cursor=prix.readOnly?'not-allowed':'text';
    if(!negM.checked&&baseM&&baseM.value)prix.value=baseM.value;
  }
}
function syncMatriculeType(){
  var mat=normalizeMat(document.getElementById('f-mat').value);
  var found=matricules.find(function(m){return normalizeMat(m.matricule)===mat});
  if(found&&found.type){document.getElementById('f-camtype').value=found.type;updateTransportHint()}
}
function calcTotal(){
  var tonFact=Number(document.getElementById('f-tonnage-facture').value||0)||Number(document.getElementById('f-tonnage').value||0);
  var total=Number(document.getElementById('f-prix-mat').value||0)*tonFact+Number(document.getElementById('f-tarif').value||0);
  document.getElementById('f-total').value=total>0?total:'';
}
