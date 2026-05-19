// === EXPORT ===
function exportCSV(){
  var arr=getFiltered();
  var cols=['Réf','Date','Matricule','Type','Destination','Marchandise','Tonnage réel','Tonnage facturé','Prix barème/t','Prix appliqué/t','Tarif barème','Tarif appliqué','Total barème','Total appliqué','Écart','Négocié','Motif','Client','Statut','Notes'];
  var cell=function(x){return'"'+String(x||'').replace(/"/g,'""')+'"'};
  var rows=arr.map(function(v){
    var total=totalVoyage(v),bareme=baremeTotalVoyage(v);
    return[v.num,v.date,v.matricule,v.type,v.destination,v.marchandise,v.tonnage,billedTonnage(v)||'',v.prixMatBase||'',v.prixMat,v.tarifBase||'',v.tarif,bareme||'',total||'',total-bareme,isNegotiated(v)?'Oui':'Non',v.motifNegociation||'',v.client,v.statut,cleanNotes(v.notes)].map(cell).join(',')
  });
  var a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent([cols.join(',')].concat(rows).join('\n'));
  a.download='GDCI_voyages_'+today()+'.csv';
  a.click();
}
