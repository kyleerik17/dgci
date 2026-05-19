// === ÉTAT GLOBAL ===
let voyages = [];
let matricules = [];
let editId = null;
let statPeriod = 'today';
let historyPage = 1;
let historyPageSize = 10;
let searchDebounce = null;
let notifications = [];
let currentTheme = 'auto';
let offlineMode = false;

// FIX iOS: charger depuis localStorage de façon sécurisée
try {
  notifications = JSON.parse(localStorage.getItem('gdci_notifications') || '[]');
  currentTheme = localStorage.getItem('gdci_theme') || 'auto';
} catch(e) {}

// Cache local (utile sur iPhone quand Supabase ne répond pas / file://)
function loadCache(){
  try{
    var cv = JSON.parse(localStorage.getItem('gdci_cache_voyages') || '[]');
    var cm = JSON.parse(localStorage.getItem('gdci_cache_matricules') || '[]');
    if(Array.isArray(cv) && cv.length) voyages = cv.map(function(v){return applyVoyageMeta(v)});
    if(Array.isArray(cm) && cm.length) matricules = cm;
  }catch(e){}
}
function saveCache(){
  try{ localStorage.setItem('gdci_cache_voyages', JSON.stringify(voyages||[])); }catch(e){}
  try{ localStorage.setItem('gdci_cache_matricules', JSON.stringify(matricules||[])); }catch(e){}
}
