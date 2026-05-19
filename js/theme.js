// === DARK MODE ===
function setTheme(mode){
  currentTheme=mode;
  try{localStorage.setItem('gdci_theme',mode)}catch(e){}
  applyTheme();
  document.querySelectorAll('.theme-option').forEach(function(opt){
    opt.classList.toggle('active',opt.dataset.theme===mode);
  });
  hideDropdowns();
}
function applyTheme(){
  var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme=currentTheme==='auto'?(prefersDark?'dark':'light'):currentTheme;
  document.documentElement.setAttribute('data-theme',theme);
  document.getElementById('theme-toggle').textContent=theme==='dark'?'☀️':'🌙';
}

// === DROPDOWNS ===
function toggleDropdown(id){
  var el=document.getElementById(id);
  var isShown=el.classList.contains('show');
  hideDropdowns();
  if(!isShown)el.classList.add('show');
}
function hideDropdowns(){
  document.querySelectorAll('.notification-dropdown,.theme-dropdown').forEach(function(d){d.classList.remove('show')});
}

// FIX iOS: utiliser touchstart en plus de click pour les boutons
document.addEventListener('click',function(e){
  if(!e.target.closest('#notif-toggle')&&!e.target.closest('#notif-dropdown'))document.getElementById('notif-dropdown').classList.remove('show');
  if(!e.target.closest('#theme-toggle')&&!e.target.closest('#theme-dropdown'))document.getElementById('theme-dropdown').classList.remove('show');
});
document.getElementById('notif-toggle').addEventListener('click',function(e){e.stopPropagation();toggleDropdown('notif-dropdown')});
document.getElementById('theme-toggle').addEventListener('click',function(e){e.stopPropagation();toggleDropdown('theme-dropdown')});
