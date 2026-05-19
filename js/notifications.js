// === NOTIFICATIONS ===
function addNotification(type,title,message){
  var notif={id:Date.now().toString(),type:type,title:title,message:message,time:new Date().toISOString(),read:false};
  notifications.unshift(notif);
  if(notifications.length>20)notifications.pop();
  try{localStorage.setItem('gdci_notifications',JSON.stringify(notifications))}catch(e){}
  updateNotifBadge();renderNotifications();showToast(type,title,message);
}
function updateNotifBadge(){
  var badge=document.getElementById('notif-badge');
  var unread=notifications.filter(function(n){return!n.read}).length;
  if(unread>0){badge.textContent=unread>9?'9+':unread;badge.style.display='block'}else{badge.style.display='none'}
}
function renderNotifications(){
  var list=document.getElementById('notif-list');
  if(notifications.length===0){list.innerHTML='<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px">Aucune notification</div>';return}
  var icons={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
  list.innerHTML=notifications.slice(0,10).map(function(n){
    var d=new Date(n.time);
    var time=d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    return '<div class="notification-item '+(n.read?'':'unread')+'" data-action="mark-read" data-id="'+escAttr(n.id)+'"><span class="notification-icon">'+(icons[n.type]||'🔔')+'</span><div class="notification-content"><div class="notification-title">'+n.title+'</div><div class="notification-message">'+n.message+'</div><div class="notification-time">'+time+'</div></div></div>';
  }).join('');
}
function markAsRead(id){
  var notif=notifications.find(function(n){return n.id===id});
  if(notif){notif.read=true;try{localStorage.setItem('gdci_notifications',JSON.stringify(notifications))}catch(e){}updateNotifBadge();renderNotifications()}
}
function markAllRead(){
  notifications.forEach(function(n){n.read=true});
  try{localStorage.setItem('gdci_notifications',JSON.stringify(notifications))}catch(e){}
  updateNotifBadge();renderNotifications();
}
function clearNotifications(){
  if(!confirm('Effacer toutes les notifications ?'))return;
  notifications=[];
  try{localStorage.setItem('gdci_notifications',JSON.stringify(notifications))}catch(e){}
  updateNotifBadge();renderNotifications();
}
function showToast(type,title,message){
  var container=document.getElementById('toast-container');
  var toast=document.createElement('div');
  toast.className='toast '+type;
  var icons={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
  toast.innerHTML='<span class="toast-icon">'+(icons[type]||'🔔')+'</span><div class="toast-content"><strong>'+title+'</strong><br>'+message+'</div><button class="toast-close" data-action="close-toast">×</button>';
  container.appendChild(toast);
  setTimeout(function(){if(toast.parentElement)toast.remove()},3000);
}
