// === CONFIGURATION SUPABASE ===
const SUPABASE_URL = 'https://fdkscnigeyrexbbvletr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_p5xtjM1FBjQ2sfj709_rig_cOh41SOq';
// iOS/Safari: si le SDK ne charge pas (réseau, bloqueur, etc.), on évite de casser tout le JS (boutons inactifs).
let db = null;
function initSupabase(){
  try{
    if(!window.supabase || typeof window.supabase.createClient !== 'function'){
      throw new Error('Supabase SDK introuvable (supabase.createClient manquant)');
    }
    // On n'utilise pas l'auth ici, donc on peut désactiver la persistance (évite des soucis Safari/Private).
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return true;
  }catch(e){
    console.error('Supabase init error:', e);
    db = null;
    return false;
  }
}

// === SUPABASE CRUD ===
function voyageToDb(v){return{id:v.id,num:v.num,date:v.date,matricule:v.matricule,type:v.type,destination:v.destination,marchandise:v.marchandise,prix_mat:Number(v.prixMat||0),tonnage:Number(v.tonnage||0),tarif:Number(v.tarif||0),statut:v.statut,client:v.client||'',notes:notesWithMeta(v),updated_at:new Date().toISOString()}}
function voyageFromDb(v){return applyVoyageMeta({id:v.id,num:v.num,date:v.date,matricule:v.matricule,type:v.type,destination:v.destination,marchandise:v.marchandise,prixMat:v.prix_mat,tonnage:v.tonnage,tarif:v.tarif,statut:v.statut,client:v.client,notes:v.notes,updatedAt:v.updated_at||v.created_at||''})}
function matFromDb(m){return{id:m.id,matricule:m.matricule,nom:m.nom||m.chauffeur||m.nom_chauffeur||'',tel:m.tel||m.numero||m.numéro||m.telephone||m.téléphone||'',type:m.type||'',obs:m.obs||m.observations||'',updatedAt:m.updated_at||m.created_at||''}}

async function loadData(){
  setSync('Chargement...');
  // Toujours charger le cache d'abord (permet à l'app de s'afficher même si Supabase échoue sur iPhone)
  loadCache();
  renderTable(); renderMats();

  // Si la page est ouverte en file:// sur iPhone, la connexion peut être bloquée (origin "null")
  if(location && location.protocol === 'file:'){
    offlineMode = true;
    setSync('Mode hors-ligne');
    addNotification('warning','iPhone','Ouvre la page via un lien HTTPS (pas depuis un fichier) pour connecter la base.');
    return;
  }

  if(!db){
    offlineMode = true;
    setSync('Mode hors-ligne');
    return;
  }

  try{
    offlineMode = false;
    // Timeout simple: si iPhone bloque/ralentit, on bascule en cache
    var timeout = function(ms){return new Promise(function(_,rej){setTimeout(function(){rej(new Error('timeout'))},ms)})};
    var req = Promise.all([
      db.from('gdci_voyages').select('*').order('date',{ascending:false}),
      db.from('gdci_matricules').select('*').order('matricule',{ascending:true})
    ]);
    var results = await Promise.race([req, timeout(12000)]);
    var vr=results[0],mr=results[1];
    if(vr.error||mr.error){throw (vr.error||mr.error)}
    voyages=(vr.data||[]).map(voyageFromDb).sort(function(a,b){return String(b.date).localeCompare(String(a.date))});
    matricules=(mr.data||[]).map(matFromDb).sort(function(a,b){return String(a.matricule).localeCompare(String(b.matricule))});
    await loadTarifs();
    saveCache();
    setSync('Connecté');
    renderTable(); renderMats();
  }catch(e){
    console.error('loadData error:',e);
    offlineMode = true;
    setSync('Mode hors-ligne');
    // Message plus clair iPhone
    var msg = (String(e && (e.message||e))==='timeout')
      ? 'Connexion trop lente/ bloquée. Données affichées depuis le cache.'
      : 'Impossible de joindre la base. Données affichées depuis le cache.';
    addNotification('warning','Connexion', msg);
    renderTable(); renderMats();
  }
}

async function upsertVoyage(v){
  if(!db){offlineMode=true;return true;}
  try{
    var r=await db.from('gdci_voyages').upsert(voyageToDb(v));
    if(r.error){console.error(r.error);offlineMode=true;return true}
    offlineMode=false;
    return true;
  }catch(e){console.error('upsertVoyage error:',e);offlineMode=true;return true}
}
async function removeVoyage(id){
  if(!db){offlineMode=true;return true;}
  try{
    var r=await db.from('gdci_voyages').delete().eq('id',id);
    if(r.error){console.error(r.error);offlineMode=true;return true}
    offlineMode=false;
    return true;
  }catch(e){console.error('removeVoyage error:',e);offlineMode=true;return true}
}
async function upsertMat(m){
  if(!db){offlineMode=true;return true;}
  try{
    var payloads=[{matricule:m.matricule,type:m.type||'10 Roues',nom:m.nom||'',tel:m.tel||'',updated_at:new Date().toISOString()},{matricule:m.matricule,type:m.type||'10 Roues',chauffeur:m.nom||'',numero:m.tel||'',updated_at:new Date().toISOString()}];
    var ex=await db.from('gdci_matricules').select('id').eq('matricule',m.matricule).maybeSingle();
    for(var i=0;i<payloads.length;i++){
      var r=ex.data&&ex.data.id?await db.from('gdci_matricules').update(payloads[i]).eq('id',ex.data.id):await db.from('gdci_matricules').insert(payloads[i]);
      if(!r.error){offlineMode=false;return true}
    }
    offlineMode=true;
    return true;
  }catch(e){console.error('upsertMat error:',e);offlineMode=true;return true}
}
async function removeMat(id){
  if(!db){offlineMode=true;return true;}
  try{
    var r=await db.from('gdci_matricules').delete().eq('id',id);
    if(r.error){console.error(r.error);offlineMode=true;return true}
    offlineMode=false;
    return true;
  }catch(e){console.error('removeMat error:',e);offlineMode=true;return true}
}

// FIX iOS: sécuriser system color scheme listener
if(window.matchMedia){
  var mql = window.matchMedia('(prefers-color-scheme: dark)');
  var handler = function(){
    if(currentTheme==='auto')applyTheme();
  };
  // Safari iOS anciens: addListener/removeListener au lieu de addEventListener
  if(mql && typeof mql.addEventListener === 'function') mql.addEventListener('change', handler);
  else if(mql && typeof mql.addListener === 'function') mql.addListener(handler);
}
