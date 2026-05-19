// === UTILITAIRES ===
function setSync(t){document.getElementById('sync-state').textContent=t}

// FIX iOS: today() via calcul local évite les bugs de timezone
function today(){
  var d = new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth()+1).padStart(2,'0');
  var j = String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+j;
}

function normalizeMat(s){return String(s||'').trim().replace(/[\s\-_.]/g,'').toUpperCase()}
function normalizeKey(s){return String(s||'').trim().replace(/\s+/g,' ').toLowerCase()}
function escAttr(s){return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function escText(s){return escAttr(s)}
var GDCI_META_MARK='__GDCI_META__:';
function splitVoyageNotes(notes){
  var s=String(notes||''),i=s.lastIndexOf(GDCI_META_MARK),meta={};
  if(i>=0){
    var raw=s.slice(i+GDCI_META_MARK.length).trim();
    s=s.slice(0,i).trim();
    try{meta=JSON.parse(raw)||{}}catch(e){meta={}}
  }
  return {notes:s,meta:meta};
}
function cleanNotes(notes){return splitVoyageNotes(notes).notes}
function voyageMeta(v){
  return {
    tarifBase:v.tarifBase||'',
    transportNegocie:!!v.transportNegocie,
    prixMatBase:v.prixMatBase||'',
    matNegocie:!!v.matNegocie,
    tonnageFacture:v.tonnageFacture||'',
    motifNegociation:v.motifNegociation||''
  };
}
function notesWithMeta(v){
  var notes=cleanNotes(v.notes||'');
  var meta=voyageMeta(v);
  var hasMeta=meta.transportNegocie||meta.matNegocie||meta.tonnageFacture||meta.tarifBase||meta.prixMatBase||meta.motifNegociation;
  return hasMeta?(notes+(notes?'\n':'')+GDCI_META_MARK+JSON.stringify(meta)):notes;
}
function applyVoyageMeta(v){
  var sp=splitVoyageNotes(v.notes||'');
  v.notes=sp.notes;
  Object.keys(sp.meta||{}).forEach(function(k){if(v[k]===undefined||v[k]===null||v[k]==='')v[k]=sp.meta[k]});
  return v;
}
function fmtDate(d){
  if(!d)return'—';
  var parts=String(d).split('-');
  if(parts.length<3)return d;
  return parts[2]+'/'+parts[1]+'/'+parts[0];
}
function fmtFCFA(n){return n?Number(n).toLocaleString('fr-FR')+' FCFA':'—'}
function fmtCompactFCFA(n){var v=Number(n||0);if(v>=1000000)return (v/1000000).toLocaleString('fr-FR',{maximumFractionDigits:1})+'M FCFA';if(v>=1000)return Math.round(v/1000).toLocaleString('fr-FR')+'k FCFA';return v.toLocaleString('fr-FR')+' FCFA'}
// Calcul robuste: certains anciens enregistrements peuvent avoir prixMat déjà "total" (au lieu de FCFA/tonne).
function billedTonnage(v){return Number(v.tonnageFacture||v.tonnage||0)}
function realTonnage(v){return Number(v.tonnage||0)}
function matCost(v){
  var prix = Number(v.prixMat||0);
  var ton = billedTonnage(v);
  if(!prix || !ton) return 0;

  // Si on connaît le prix officiel/t pour cette marchandise, on détecte le format.
  var ref = v.marchandise && PRIX_MATERIAUX[v.marchandise] ? Number(PRIX_MATERIAUX[v.marchandise]) : 0;
  if(ref>0){
    // Cas "prixMat déjà total": ex 162500 au lieu de 6500, et proche de ref*ton.
    var refTotal = ref * ton;
    if(prix > ref*3 && Math.abs(prix - refTotal) <= Math.max(5000, refTotal*0.2)){
      return prix; // déjà total
    }
  }

  // Heuristique générale: au-delà d'un certain seuil, on suppose que c'est déjà un total (évite les millions).
  if(prix >= 50000) return prix;

  // Sinon: prix en FCFA/tonne
  return prix * ton;
}
function totalVoyage(v){return Number(v.tarif||0) + matCost(v)}
function baremeTotalVoyage(v){
  var ton=billedTonnage(v);
  var t=Number(v.tarifBase||v.tarif||0);
  var p=Number(v.prixMatBase||v.prixMat||0);
  if(p>=50000)return t+p; // compat ancien total matière
  return t+(p*ton);
}
function isNegotiated(v){
  return !!(v.transportNegocie||v.matNegocie||v.motifNegociation||Number(v.tonnageFacture||0)&&String(v.tonnageFacture)!==String(v.tonnage||''));
}
function startOf(p){var d=new Date();if(p==='today')return today();if(p==='week'){d.setDate(d.getDate()-d.getDay());var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),j=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+j}if(p==='month'){var t=today();return t.slice(0,7)+'-01'}if(p==='year'){return today().slice(0,4)+'-01-01'}return'1970-01-01'}
function filterP(arr,p){if(!p||p==='all')return arr;var from=startOf(p),to=today();return arr.filter(function(v){return v.date>=from&&v.date<=to})}
// (ancienne version de typeTag supprimée : elle cassait l'exécution sur Safari/iPhone)
function statutTag(s){var m={'Livré':'tag-livre','En cours':'tag-cours','En attente':'tag-attente','Annulé':'tag-annule'};return'<span class="tag '+(m[s]||'')+'">'+(s||'—')+'</span>'}
function genNum(){var d=new Date();var pad=function(n){return String(n).padStart(2,'0')};var prefix='GDCI-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-';var max=voyages.reduce(function(a,v){var n=String(v.num||'').startsWith(prefix)?Number(String(v.num).slice(prefix.length)):0;return Number.isFinite(n)&&n>a?n:a},0);return prefix+String(max+1).padStart(4,'0')}

// FIX: typeTag réécrit proprement
function typeTag(t){
  var cls = t==='10 Roues'?'tag-livre':t==='12 Roues'?'tag-cours':'tag-attente';
  return '<span class="tag '+cls+'">'+(t||'—')+'</span>';
}
