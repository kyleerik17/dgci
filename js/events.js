// === EVENT DELEGATION ===
// Remplace les attributs inline (onclick/oninput/onchange) par des listeners centralisés.
function bindAppEvents(){
  if(window.__gdciEventsBound) return;
  window.__gdciEventsBound = true;

  document.addEventListener('click', function(e){
    var el = e.target.closest('[data-action]');
    if(!el) return;
    var action = el.dataset.action;

    switch(action){
      case 'set-theme':
        setTheme(el.dataset.theme || 'auto');
        break;
      case 'mark-all-read':
        markAllRead();
        break;
      case 'clear-notifications':
        clearNotifications();
        break;
      case 'new-voyage':
        openVoyageModal();
        break;
      case 'show-tab':
        showTab(el.dataset.tab, el);
        break;
      case 'export-csv':
        exportCSV();
        break;
      case 'load-data':
        loadData();
        break;
      case 'set-period':
        setPeriod(el.dataset.period, el);
        break;
      case 'open-tarif':
        openTarifModal(el.dataset.dest || undefined);
        break;
      case 'print-bareme':
        printBareme();
        break;
      case 'open-matricule':
        openMatriculeModal();
        break;
      case 'hide-modal':
        hideModal(el.dataset.modal);
        break;
      case 'save-voyage':
        saveVoyage();
        break;
      case 'save-matricule':
        saveMatricule();
        break;
      case 'print-receipt':
        printReceipt();
        break;
      case 'save-tarif':
        saveTarif();
        break;
      case 'set-history-page':
        setHistoryPage(Number(el.dataset.page || 1));
        break;
      case 'view-detail':
        viewDetail(el.dataset.id);
        break;
      case 'open-receipt':
        openReceipt(el.dataset.id);
        break;
      case 'edit-voyage':
        editVoyage(el.dataset.id);
        break;
      case 'del-voyage':
        delVoyage(el.dataset.id);
        break;
      case 'del-mat':
        delMat(el.dataset.id);
        break;
      case 'driver-book':
        openDriverBook(el.dataset.id);
        break;
      case 'del-tarif':
        delTarif(el.dataset.dest);
        break;
      case 'mark-read':
        markAsRead(el.dataset.id);
        break;
      case 'close-toast':
        if(el.parentElement) el.parentElement.remove();
        break;
    }
  });

  document.addEventListener('input', function(e){
    var el = e.target.closest('[data-input]');
    if(!el) return;
    switch(el.dataset.input){
      case 'history-search':
        onSearchInput();
        break;
      case 'mat-search':
        renderMats();
        break;
      case 'sync-mat-type':
        syncMatriculeType();
        break;
      case 'calc-total':
        calcTotal();
        break;
    }
  });

  document.addEventListener('change', function(e){
    var el = e.target.closest('[data-change]');
    if(!el) return;
    switch(el.dataset.change){
      case 'filter-history':
        resetHistoryPage();
        renderTable();
        break;
      case 'page-size':
        changePageSize(el.value);
        break;
      case 'transport-hint':
        updateTransportHint();
        break;
      case 'march-hint':
        updateMarchHint();
        break;
      case 'negotiation-toggle':
        syncNegotiationFields();
        calcTotal();
        break;
    }
  });
}

bindAppEvents();
