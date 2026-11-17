/* Shared offline localisation for the portal and all three original analyses. */
(() => {
  'use strict';
  const dictionary = window.VCE_EN || {};
  const key = 'vce-language';
  const languages = {ro: 'Română', en: 'English'};
  const normalise = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const entries = Object.entries(dictionary).sort((a,b) => b[0].length-a[0].length);
  const fragments = entries.filter(([ro])=>ro.length>=3).map(([ro])=>ro.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')||'(?!)';
  const fragmentPattern = new RegExp('(?<![\\p{L}\\p{N}_])(?:'+fragments+')(?![\\p{L}\\p{N}_])','gu');
  const sourceNodes = new WeakMap(), sourceAttributes = new WeakMap(), pickers = new Set();
  let language = 'ro', observer, queued = false, picker;
  try { language = localStorage.getItem(key) === 'en' ? 'en' : 'ro'; } catch {}
  try { const requested = new URL(location.href).searchParams.get('lang'); if (Object.hasOwn(languages,requested)) language = requested; } catch {}
  const months = {'ian.':'Jan','feb.':'Feb','mar.':'Mar','apr.':'Apr','mai':'May','iun.':'Jun','iul.':'Jul','aug.':'Aug','sept.':'Sep','oct.':'Oct','nov.':'Nov','dec.':'Dec'};
  function english(value) {
    const text = normalise(value);
    if (Object.hasOwn(dictionary,text)) return dictionary[text];
    if (/^[0-9.]+,[0-9]{2}( RON)?$/.test(text)) {
      const amount=Number(text.replace(' RON','').replaceAll('.','').replace(',','.')).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});
      return text.endsWith(' RON')?'RON '+amount:amount;
    }
    let match = text.match(/^(\d{1,2}) (ian\.|feb\.|mar\.|apr\.|mai|iun\.|iul\.|aug\.|sept\.|oct\.|nov\.|dec\.)( \d{4})?$/);
    if(match) return `${match[1]} ${months[match[2]]}${match[3]||''}`;
    match = text.match(/^(\d+) din (\d+) (elemente pregătite|elemente marcate ca pregătite|documente pregătite|pași pregătiți|acțiuni bifate)$/);
    if(match) return `${match[1]} of ${match[2]} ${{'elemente pregătite':'items ready','elemente marcate ca pregătite':'items marked as ready','documente pregătite':'documents ready','pași pregătiți':'steps ready','acțiuni bifate':'actions checked'}[match[3]]}`;
    match = text.match(/^(\d+) rezultate$/); if(match)return `${match[1]} results`;
    match = text.match(/^(\d+) din (\d+) cerințe documentate$/);if(match)return `${match[1]} of ${match[2]} documented requirements`;
    match = text.match(/^Cerințe care conțin „(.*)”\.$/);if(match)return `Requirements containing “${match[1]}”.`;
    match = text.match(/^(\d+) (zile până la termen|cerințe preluate|fișiere locale|licitații|licitație|cerințe documentate|cerințe|pagini|puncte|PAȘI)$/);
    if(match) return `${match[1]} ${{'zile până la termen':'days until the deadline','cerințe preluate':'imported requirements','fișiere locale':'local files','licitații':'tenders','licitație':'tender','cerințe documentate':'documented requirements','cerințe':'requirements','pagini':'pages','puncte':'points','PAȘI':'STEPS'}[match[2]]}`;
    match = text.match(/^(?:Până la )?(\d+) puncte$/);
    if(match) return `${text.startsWith('Până')?'Up to ':''}${match[1]} points`;
    // Source names, chapter references and composite labels use the same reviewed
    // translations as the body, without touching identifiers, links or form values.
    return text.replace(fragmentPattern,match=>dictionary[match]);
  }
  function translate(value) { return language === 'en' ? english(value) : String(value ?? ''); }
  function searchable(value) { const text=String(value??''); return text+' '+english(text); }
  function excluded(element) { return element?.closest('script,style,textarea,input,code,pre,svg,[data-no-i18n],.vce-lang-picker'); }
  function translateNode(node) {
    if(!node.parentElement || excluded(node.parentElement)) return;
    let original = sourceNodes.get(node);
    if(!original || node.nodeValue !== original.last) original={ro:node.nodeValue,last:node.nodeValue};
    const core=normalise(original.ro);
    if(!core) return;
    if(node.parentElement.tagName==='OPTION' && !node.parentElement.hasAttribute('value')) node.parentElement.setAttribute('value',core);
    const leading=original.ro.match(/^\s*/)[0], trailing=original.ro.match(/\s*$/)[0];
    const value=language==='en' ? leading+english(core)+trailing : original.ro;
    if(node.nodeValue!==value) node.nodeValue=value;
    original.last=value;sourceNodes.set(node,original);
  }
  function localiseAttribute(element,name) {
    if(element.closest('script,style,svg,[data-no-i18n],.vce-lang-picker')||!element.hasAttribute(name))return;
    let record=sourceAttributes.get(element)||{};
    const current=element.getAttribute(name);
    if(!record[name] || record[name].last!==current)record[name]={ro:current,last:current};
    const result=translate(record[name].ro);
    if(current!==result)element.setAttribute(name,result);
    record[name].last=result;sourceAttributes.set(element,record);
  }
  function carryLanguage() {
    for(const a of document.querySelectorAll('a[href]')){
      const href=a.getAttribute('href');
      if(!href || href.startsWith('#') || a.hasAttribute('download'))continue;
      try{const url=new URL(href,location.href);if(url.origin===location.origin && url.pathname.endsWith('.html')){
        url.searchParams.set('lang',language);const next=url.href;
        if(a.href!==next)a.setAttribute('href',next);
      }}catch{}
    }
  }
  function apply() {
    queued=false;observer?.disconnect();
    document.documentElement.lang=language;
    installDialogPickers();
    const walker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);
    while(walker.nextNode())translateNode(walker.currentNode);
    for(const element of document.querySelectorAll('[aria-label],[title],[placeholder],img[alt]'))for(const name of ['aria-label','title','placeholder','alt'])localiseAttribute(element,name);
    const description=document.querySelector('meta[name="description"]');if(description)localiseAttribute(description,'content');
    carryLanguage();updatePicker();
    observer?.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt','open']});
  }
  function queueApply(){if(!queued){queued=true;queueMicrotask(apply)}}
  function flag(lang){return lang==='ro'?'<svg class="vce-flag" viewBox="0 0 30 20" aria-hidden="true"><path fill="#002B7F" d="M0 0h10v20H0z"/><path fill="#FCD116" d="M10 0h10v20H10z"/><path fill="#CE1126" d="M20 0h10v20H20z"/></svg>':'<svg class="vce-flag" viewBox="0 0 60 40" aria-hidden="true"><path fill="#012169" d="M0 0h60v40H0z"/><path stroke="#fff" stroke-width="8" d="m0 0 60 40M60 0 0 40"/><path stroke="#C8102E" stroke-width="3" d="m0 0 60 40M60 0 0 40"/><path stroke="#fff" stroke-width="13" d="M30 0v40M0 20h60"/><path stroke="#C8102E" stroke-width="7" d="M30 0v40M0 20h60"/></svg>'}
  function updatePicker(){
    for(const control of pickers){
      if(!control.isConnected){pickers.delete(control);continue}
      control.querySelector('.vce-language-current').innerHTML=flag(language)+`<span>${languages[language]}</span>`;
      control.querySelector('.vce-language-trigger').setAttribute('aria-label',language==='ro'?'Schimbă limba. Limba curentă: Română':'Change language. Current language: English');
      for(const b of control.querySelectorAll('[data-language]'))b.setAttribute('aria-checked',String(b.dataset.language===language));
    }
  }
  function closeMenu(control,focus=false){
    if(!control)return;
    const trigger=control.querySelector('.vce-language-trigger');
    control.querySelector('.vce-language-menu').hidden=true;
    trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();
  }
  function setLanguage(next,control=picker){
    if(!Object.hasOwn(languages,next))return;
    language=next;try{localStorage.setItem(key,language)}catch{}
    try{const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(history.state,'',url.href)}catch{}
    apply();for(const item of pickers)closeMenu(item);closeMenu(control,true);
    window.dispatchEvent(new CustomEvent('vce-language-change',{detail:{language}}));
  }
  let pickerNumber=0;
  function createPicker(){
    const control=document.createElement('div'),menuId='vce-language-menu-'+(++pickerNumber);
    control.className='vce-lang-picker';
    control.innerHTML=`<button type="button" class="vce-language-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="${menuId}"><span class="vce-language-current"></span><svg class="vce-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="vce-language-menu" id="${menuId}" role="menu" aria-label="Language / Limbă" hidden>${Object.entries(languages).map(([code,name])=>`<button type="button" role="menuitemradio" aria-checked="${code===language}" data-language="${code}" lang="${code}">${flag(code)}<span>${name}</span><span class="vce-language-check" aria-hidden="true">✓</span></button>`).join('')}</div>`;
    const trigger=control.querySelector('.vce-language-trigger'),menu=control.querySelector('.vce-language-menu');
    trigger.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open)control.querySelector(`[data-language="${language}"]`).focus()});
    for(const b of control.querySelectorAll('[data-language]'))b.addEventListener('click',()=>setLanguage(b.dataset.language,control));
    control.addEventListener('keydown',event=>{
      if(!['Escape','ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();
      if(event.key==='Escape'){closeMenu(control,true);return}
      menu.hidden=false;trigger.setAttribute('aria-expanded','true');
      const options=[...control.querySelectorAll('[data-language]')],active=options.indexOf(document.activeElement);
      const index=event.key==='Home'?0:event.key==='End'?options.length-1:(active+(event.key==='ArrowUp'?-1:1)+options.length)%options.length;
      options[index].focus();
    });
    pickers.add(control);return control;
  }
  function installDialogPickers(){
    // Modal dialogs make the surrounding page inert, so they get an equivalent
    // control in their own top-right corner without moving or closing the dialog.
    for(const dialog of document.querySelectorAll('dialog[open]')){
      if(dialog.querySelector('.vce-dialog-language'))continue;
      const bar=document.createElement('div');bar.className='vce-dialog-language';
      bar.append(createPicker());dialog.prepend(bar);
    }
  }
  function install(){
    try{localStorage.setItem(key,language)}catch{}
    const isPortal=document.body.classList.contains('vce-portal-page');
    let host=document.querySelector('.top-actions');
    if(!isPortal){
      document.body.classList.add('vce-legacy-page');
      const toolbar=document.createElement('header');toolbar.className='vce-global-toolbar';
      const id=(location.pathname.match(/CN\d+/)||[])[0]||'';
      document.body.dataset.analysis=id;
      toolbar.innerHTML=`<a class="vce-portal-back" href="../../index.html#${id}/date">← Portal licitații</a><div class="vce-toolbar-actions"><span class="vce-beta" data-no-i18n>Beta</span></div>`;
      document.body.prepend(toolbar);host=toolbar.querySelector('.vce-toolbar-actions');
    }else{
      const beta=document.createElement('span');beta.className='vce-beta';beta.textContent='Beta';beta.setAttribute('data-no-i18n','');document.querySelector('.breadcrumb').before(beta);
    }
    picker=createPicker();host.append(picker);
    for(const name of ['click','focusin'])document.addEventListener(name,event=>{for(const control of pickers)if(!control.contains(event.target))closeMenu(control)});
    window.addEventListener('storage',event=>{if(event.key===key && Object.hasOwn(languages,event.newValue)){
      language=event.newValue;
      try{const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(history.state,'',url.href)}catch{}
      apply();
    }});
    observer=new MutationObserver(queueApply);apply();
  }
  window.VCE_I18N={text:translate,english,searchable,setLanguage,get language(){return language},apply};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
