'use strict';

// Transcribed from DALI, scenario 1, PDF pages 122-123 (printed 121-122).
// Amounts, including VAT, are those in the July 2023 estimate.
const budgetItems = [
  ['3.1','Studii',67500,12825,80325,122],
  ['3.1.1','Studii de teren',48500,9215,57715,122],
  ['3.1.2','Raport privind impactul asupra mediului',0,0,0,122],
  ['3.1.3','Alte studii specifice',19000,3610,22610,122],
  ['3.2','Documentații-suport și cheltuieli pentru obținerea de avize, acorduri și autorizații',10000,1900,11900,122],
  ['3.3','Expertizare tehnică',33000,6270,39270,122],
  ['3.4','Certificarea performanței energetice și auditul energetic al clădirilor',20000,3800,23800,122],
  ['3.5','Proiectare',1382300,262637,1644937,122],
  ['3.5.1','Temă de proiectare',11000,2090,13090,122],
  ['3.5.2','Studiu de prefezabilitate',0,0,0,122],
  ['3.5.3','Studiu de fezabilitate / documentație de avizare a lucrărilor de intervenții și deviz general',136300,25897,162197,122],
  ['3.5.4','Documentațiile tehnice necesare în vederea obținerii avizelor, acordurilor și autorizațiilor',400000,76000,476000,123],
  ['3.5.5','Verificarea tehnică de calitate a proiectului tehnic și a detaliilor de execuție',35000,6650,41650,123],
  ['3.5.6','Proiect tehnic și detalii de execuție',800000,152000,952000,123],
  ['3.6','Organizarea procedurilor de achiziție',0,0,0,123],
  ['3.7','Consultanță',600000,114000,714000,123],
  ['3.7.1','Managementul de proiect pentru obiectivul de investiții',570000,108300,678300,123],
  ['3.7.2','Auditul financiar',30000,5700,35700,123],
  ['3.8','Asistență tehnică',1360000,258400,1618400,123],
  ['3.8.1','Asistență tehnică din partea proiectantului',360000,68400,428400,123],
  ['3.8.1.1','Asistență tehnică pe perioada de execuție a lucrărilor',360000,68400,428400,123],
  ['3.8.1.2','Participarea proiectantului la fazele incluse în programul de control al lucrărilor de execuție, avizat de Inspectoratul de Stat în Construcții',0,0,0,123],
  ['3.8.2','Dirigenție de șantier',1000000,190000,1190000,123]
];
const chapter3Total=['3','Total capitol 3 — Proiectare și asistență tehnică',3472800,659832,4132632,123];
const budgetItem=code=>budgetItems.find(row=>row[0]===code);
const lei=value=>new Intl.NumberFormat('ro-RO',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
const daliRef=(page,label)=>ref('dali',page-121,label||`DALI · p. ${page}`);
const designAndAssistance=[2,3,4].map(index=>budgetItem('3.5')[index]+budgetItem('3.8.1')[index]);

function budgetTable(items,total,caption,compact=false){
  const row=(item,isTotal=false)=>`<tr class="${isTotal?'budget-total':compact&&item[0].split('.').length===2?'budget-parent':''}"><th scope="row"><span class="budget-code">${item[0]}</span><span>${item[1]}</span></th><td>${lei(item[2])}</td><td>${lei(item[3])}</td><td>${lei(item[4])}</td><td>${daliRef(item[5],`p. ${item[5]}`)}</td></tr>`;
  return `<div class="budget-table-wrap" tabindex="0" role="region" aria-label="${caption}; tabel derulabil orizontal"><table class="budget-table"><caption>${caption} · toate valorile în lei</caption><thead><tr><th scope="col">Articol și descriere</th><th scope="col">Fără TVA</th><th scope="col">TVA în deviz</th><th scope="col">Cu TVA</th><th scope="col">Sursă PDF</th></tr></thead><tbody>${items.map(item=>row(item)).join('')}</tbody>${total?`<tfoot>${row(total,true)}</tfoot>`:''}</table></div>`;
}

function budget(){
  const design=budgetItem('3.5'),assistance=budgetItem('3.8.1');
  return heading('DALI · DEVIZ GENERAL · SCENARIUL 1','Buget proiectare','Capitolul 3 — Cheltuieli pentru proiectare și asistență tehnică. Valorile sunt transcrise din paginile 122–123 ale fișierului DALI.',`<a class="button" href="assets/${sourceFiles.dali}" target="_blank" rel="noopener">${icon('file')} Deschide devizul</a>`)+`
    <div class="budget-cards">
      <section class="panel budget-card"><span class="mini-label">3.5 · PROIECTARE</span><strong>${lei(design[2])}</strong><span>lei fără TVA</span><p>${lei(design[4])} lei cu TVA</p></section>
      <section class="panel budget-card"><span class="mini-label">3.8.1 · ASISTENȚA PROIECTANTULUI</span><strong>${lei(assistance[2])}</strong><span>lei fără TVA</span><p>${lei(assistance[4])} lei cu TVA</p></section>
      <section class="panel budget-card budget-card-total"><span class="mini-label">TOTAL CALCULAT · 3.5 + 3.8.1</span><strong>${lei(designAndAssistance[0])}</strong><span>lei fără TVA</span><p>${lei(designAndAssistance[2])} lei cu TVA</p></section>
    </div>
    <section class="panel budget-context"><h2>Cum se citesc aceste valori</h2><p>Devizul este pentru <strong>întregul obiectiv de investiții</strong>, scenariul 1, în prețuri din <strong>iulie 2023</strong>. TVA este preluată din document (19%), fără actualizare. ${daliRef(124,'Data prețurilor · p. 124')}</p><p>Articolul 3.5 include și tema de proiectare și SF/DALI. Fișa de date menționează documentațiile DALI și DTAC deja elaborate. Prin urmare, aceste estimări nu confirmă singure bugetul serviciilor rămase de achiziționat prin CN1098176. ${ref('fd',3,'Documentațiile existente · p. 3')}</p></section>
    <section class="panel budget-section"><div class="panel-head"><div><h2>3.5 · Articolele de proiectare</h2><p>Defalcarea sumei de ${lei(design[2])} lei fără TVA.</p></div></div>${budgetTable(budgetItems.filter(row=>row[0].startsWith('3.5.')),design,'Proiectare')}</section>
    <section class="panel budget-section"><div class="panel-head"><div><h2>3.8.1 · Asistența tehnică a proiectantului</h2><p>Subarticolele sunt incluse în totalul de ${lei(assistance[2])} lei fără TVA.</p></div></div>${budgetTable(budgetItems.filter(row=>row[0].startsWith('3.8.1.')),assistance,'Asistența proiectantului')}<p class="budget-footnote">Valoarea zero la articolul 3.8.1.2 reprezintă alocarea din deviz; nu elimină obligațiile stabilite prin documentația contractului.</p></section>
    <details class="panel budget-context budget-details"><summary>Vezi întregul capitol 3 · ${lei(chapter3Total[2])} lei fără TVA</summary><p>Capitolul include și studii, avize, expertize, certificare energetică, consultanță și dirigenție de șantier. Totalul său nu reprezintă integral bugetul proiectantului. Rândurile detaliate sunt incluse în articolele-părinte și nu se adună încă o dată.</p>${budgetTable(budgetItems,chapter3Total,'Capitolul 3 integral',true)}</details>
    <section class="panel budget-context"><h2>Referința din document</h2><p>Capitolul 3 începe la pagina <strong>122 din fișier</strong> și continuă la pagina <strong>123</strong> (paginile tipărite 121–122). Extrasul PDF disponibil aici conține paginile originale 122–124, inclusiv data prețurilor, fără modificarea conținutului.</p><p>${daliRef(122,'Începutul capitolului · p. 122')} · ${daliRef(123,'Continuare și total · p. 123')} · <a class="source-link" href="assets/${sourceFiles.dali}" download>Descarcă extrasul PDF ↓</a></p></section>`;
}
