// === KPI & TABLE ===
function renderKPI(){
  var mV=filterP(voyages,'month'),tV=filterP(voyages,'today'),wV=filterP(voyages,'week');
  var ca=voyages.filter(function(v){return v.statut==='Livré'}).reduce(function(a,v){return a+totalVoyage(v)},0);
  var kpis=[{lbl:"Aujourd'hui",val:tV.length,sub:'voyages'},{lbl:'Semaine',val:wV.length,sub:'voyages'},{lbl:'Ce mois',val:mV.length,sub:'voyages'},{lbl:'Total',val:voyages.length,sub:'voyages'},{lbl:'CA livré',val:fmtCompactFCFA(ca).replace(' FCFA',''),sub:'FCFA'}];
  document.getElementById('kpi-row').innerHTML=kpis.map(function(k){return'<div class="kpi"><div class="kpi-lbl">'+k.lbl+'</div><div class="kpi-val">'+k.val+'</div><div class="kpi-sub">'+k.sub+'</div></div>'}).join('');
  document.getElementById('hdr-today').textContent=tV.length;
  document.getElementById('hdr-month').textContent=mV.length;
  document.getElementById('hdr-total').textContent=voyages.length;
}
function resetHistoryPage(){historyPage=1}
function changePageSize(v){historyPageSize=Number(v)||10;resetHistoryPage();renderTable()}
function setHistoryPage(p){historyPage=p;renderTable()}

function renderPagination(total){
  var el=document.getElementById('pagination');if(!el)return;
  if(!total){el.innerHTML='';return}
  var pages=Math.max(1,Math.ceil(total/historyPageSize));
  historyPage=Math.min(Math.max(1,historyPage),pages);
  var from=(historyPage-1)*historyPageSize+1,to=Math.min(total,historyPage*historyPageSize);
  var nums=new Set([1,pages,historyPage-1,historyPage,historyPage+1]);
  if(pages<=7)for(var i=1;i<=pages;i++)nums.add(i);
  var sorted=Array.from(nums).filter(function(n){return n>=1&&n<=pages}).sort(function(a,b){return a-b});
  var last=0,buttons='';
  sorted.forEach(function(n){if(n-last>1)buttons+='<span style="color:var(--text-muted);padding:0 4px">…</span>';buttons+='<button class="page-btn '+(n===historyPage?'active':'')+'" data-action="set-history-page" data-page="'+n+'">'+n+'</button>';last=n});
  el.innerHTML='<div class="pagination-info">'+from+'-'+to+' sur '+total+'</div><div class="pagination-pages"><button class="page-btn" data-action="set-history-page" data-page="1" '+(historyPage===1?'disabled':'')+'>«</button><button class="page-btn" data-action="set-history-page" data-page="'+(historyPage-1)+'" '+(historyPage===1?'disabled':'')+'>‹</button>'+buttons+'<button class="page-btn" data-action="set-history-page" data-page="'+(historyPage+1)+'" '+(historyPage===pages?'disabled':'')+'>›</button><button class="page-btn" data-action="set-history-page" data-page="'+pages+'" '+(historyPage===pages?'disabled':'')+'>»</button></div>';
}

// FIX iOS: oninput pour la recherche avec fallback
function onSearchInput(){
  clearTimeout(searchDebounce);
  searchDebounce=setTimeout(function(){resetHistoryPage();renderTable()},200);
}

function getFiltered(){
  var q=document.getElementById('search').value.toLowerCase(),
      ft=document.getElementById('filter-type').value,
      fs=document.getElementById('filter-statut').value,
      fp=document.getElementById('filter-period').value;
  var arr=voyages.slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date))});
  if(q)arr=arr.filter(function(v){return JSON.stringify(v).toLowerCase().indexOf(q)>=0});
  if(ft)arr=arr.filter(function(v){return v.type===ft});
  if(fs)arr=arr.filter(function(v){return v.statut===fs});
  if(fp)arr=filterP(arr,fp);
  return arr;
}

function renderTable(){
  renderKPI();
  var arr=getFiltered(),tb=document.getElementById('tbody');
  renderPagination(arr.length);
  if(!arr.length){tb.innerHTML='<tr><td colspan="10"><div class="empty-state"><p>Aucun voyage trouvé</p></div></td></tr>';return}
  var pageArr=arr.slice((historyPage-1)*historyPageSize,historyPage*historyPageSize);
  var mob=window.innerWidth<=768;
  if(mob){
    tb.innerHTML=pageArr.map(function(v){
      return '<tr style="display:block;background:var(--surface);border-bottom:2px solid var(--border)"><td style="display:block;padding:12px"><div style="display:-webkit-flex;display:flex;-webkit-justify-content:space-between;justify-content:space-between;-webkit-align-items:center;align-items:center;margin-bottom:10px"><div><div style="font-family:var(--font-mono);font-size:14px;font-weight:600;color:var(--text-primary)">'+(v.matricule||'—')+'</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">'+(v.num||'')+' · '+fmtDate(v.date)+'</div></div><div style="display:-webkit-flex;display:flex;-webkit-flex-direction:column;flex-direction:column;-webkit-align-items:flex-end;align-items:flex-end;gap:4px">'+statutTag(v.statut)+typeTag(v.type)+(isNegotiated(v)?'<span class="tag tag-attente">Négocié</span>':'')+'</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;margin-bottom:12px"><div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">Destination</div><div style="font-size:12px;font-weight:500">'+(v.destination||'—')+'</div></div><div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">Marchandise</div><div style="font-size:12px;font-weight:500">'+(v.marchandise||'—')+'</div></div><div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">Tonnage</div><div style="font-size:12px;font-family:var(--font-mono)">'+(v.tonnage?v.tonnage+' t':'—')+(v.tonnageFacture?' · fact. '+v.tonnageFacture+' t':'')+'</div></div><div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">Total</div><div style="font-size:14px;font-family:var(--font-mono);color:var(--text-primary);font-weight:700">'+fmtFCFA(totalVoyage(v))+'</div></div></div><div style="display:-webkit-flex;display:flex;gap:6px;-webkit-justify-content:flex-end;justify-content:flex-end"><button class="icon-btn" data-action="view-detail" data-id="'+escAttr(v.id)+'" style="padding:6px 10px">👁</button><button class="icon-btn" data-action="open-receipt" data-id="'+escAttr(v.id)+'" style="padding:6px 10px">🧾</button><button class="icon-btn" data-action="edit-voyage" data-id="'+escAttr(v.id)+'" style="padding:6px 10px">✏</button><button class="icon-btn" data-action="del-voyage" data-id="'+escAttr(v.id)+'" style="padding:6px 10px;color:var(--danger)">✕</button></div></td></tr>';
    }).join('');
    return;
  }
  tb.innerHTML=pageArr.map(function(v){return'<tr><td class="mono">'+(v.num||'—')+'</td><td class="mono">'+fmtDate(v.date)+'</td><td><strong style="color:var(--text-primary)">'+(v.matricule||'—')+'</strong></td><td>'+typeTag(v.type)+'</td><td>'+(v.destination||'—')+'</td><td style="font-weight:500">'+(v.marchandise||'—')+'</td><td class="mono">'+(v.tonnage?v.tonnage+' t':'—')+(v.tonnageFacture?'<br><span style="color:var(--text-muted)">Fact. '+v.tonnageFacture+' t</span>':'')+'</td><td style="font-weight:600">'+fmtFCFA(totalVoyage(v))+(isNegotiated(v)?'<br><span class="tag tag-attente">Négocié</span>':'')+'</td><td>'+statutTag(v.statut)+'</td><td><div class="act-btns"><button class="icon-btn" data-action="view-detail" data-id="'+escAttr(v.id)+'">👁</button><button class="icon-btn" data-action="open-receipt" data-id="'+escAttr(v.id)+'">🧾</button><button class="icon-btn" data-action="edit-voyage" data-id="'+escAttr(v.id)+'">✏</button><button class="icon-btn" data-action="del-voyage" data-id="'+escAttr(v.id)+'" style="color:var(--danger)">✕</button></div></td></tr>'}).join('');
}
