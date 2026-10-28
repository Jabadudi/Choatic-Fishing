import {SaveManager,IndexedSaveStore,findUsableSave,saveCandidates} from './save-store.js';
import {captureSave,parseSave,restoreSave} from './save-format.js';
export function mountSaveUI({getWorld,onLoad,onNew,onTitle,onOpen,onClose}){
 const button=document.createElement('button');button.id='open-saves';button.textContent='Save';button.hidden=true;button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-label','Save and load game');
 const badge=document.createElement('span');badge.id='save-status';badge.setAttribute('role','status');
 document.querySelector('.playfield').append(button,badge);
 const dialog=document.createElement('dialog');dialog.id='save-menu';dialog.setAttribute('aria-labelledby','save-title');
 dialog.innerHTML='<div class="backpack-heading"><div><small>YOUR JOURNEY</small><h2 id="save-title">Save and load</h2></div><button id="close-saves">Close</button></div><p id="save-message" role="status"></p><div class="save-controls"><button id="manual-save">Save game</button><button id="export-save">Export save</button><button id="import-save">Import save</button><button id="return-title">Return to title</button></div><input id="save-file" type="file" accept=".json,application/json" hidden><section id="save-confirm" hidden><p></p><button id="confirm-save-action">Confirm</button><button id="cancel-save-action">Cancel</button></section><div id="save-records"></div><p class="save-note">Saved on this device and browser. Export a file for a backup or to move devices. Unfinished casts resume with your line put away.</p>';
 document.body.append(dialog);
 const q=id=>dialog.querySelector('#'+id),store=new IndexedSaveStore();let records=null,busy=false,confirmAction=null,status=null;
 const manager=new SaveManager(store,value=>{status=value;badge.textContent=value.text;badge.classList.toggle('save-error',value.kind==='error');badge.hidden=!getWorld()?.adventure;q('save-message').textContent=value.kind==='saved'?`Saved ${new Date(value.at).toLocaleTimeString()}`:value.text;});
 const continueButton=document.createElement('button');continueButton.id='continue-journey';continueButton.textContent='Continue';continueButton.disabled=true;
 document.querySelector('.lobby-actions').prepend(continueButton);
 async function refresh(){
  try{records=await store.read();continueButton.disabled=!findUsableSave(records);}
  catch(error){continueButton.disabled=true;q('save-message').textContent=`Could not read saved progress: ${error.message}`;}
 }
 function showError(error){q('save-message').textContent=error.message||'Action failed. Existing saves were not changed.';}
 async function run(action){if(busy)return;busy=true;try{await action();await refresh();await renderRecords();}catch(error){showError(error);}finally{busy=false;}}
 function ask(text,action){confirmAction=action;q('save-confirm').hidden=false;q('save-confirm').querySelector('p').textContent=text;q('confirm-save-action').focus();}
 function close(){dialog.close();}
 function show(){onOpen();q('save-confirm').hidden=true;confirmAction=null;dialog.showModal();q('manual-save').disabled=!getWorld()?.adventure;q('return-title').hidden=!getWorld()?.adventure;refresh().then(renderRecords);}
 async function load(save){restoreSave(save);ask('Load this save? Progress since the last save will be replaced.',async()=>{const restored=await manager.restore(save);onLoad(restored);close();});}
 async function renderRecords(){
  const list=q('save-records');list.replaceChildren();
  const entries=saveCandidates(records);
  if(!entries.length){const empty=document.createElement('p');empty.textContent='No saves yet. Start a new journey or import a save.';list.append(empty);return;}
  for(const save of entries){
   const row=document.createElement('button');row.className='save-record';
   const manual=save===records.manual;row.textContent=`${manual?'Manual save':save===records.current?'Autosave':'Autosave backup'} | ${new Date(save.savedAt).toLocaleString()}`;
   try{restoreSave(save);row.onclick=()=>load(save);}catch(error){row.disabled=true;row.textContent+=` | Unavailable: ${error.message}`;}
   list.append(row);
  }
 }
 button.onclick=show;q('close-saves').onclick=close;
 dialog.addEventListener('close',()=>{onClose();});
 q('cancel-save-action').onclick=()=>{q('save-confirm').hidden=true;confirmAction=null;};
 q('confirm-save-action').onclick=()=>{const action=confirmAction;confirmAction=null;q('save-confirm').hidden=true;if(action)run(action);};
 q('manual-save').onclick=()=>run(async()=>{await manager.request('manual',true);if(globalThis.navigator?.storage?.persist)navigator.storage.persist().catch(()=>{});});
 q('return-title').onclick=()=>run(async()=>{await manager.request('auto',true);manager.world=null;close();onTitle();});
 continueButton.onclick=()=>run(async()=>{const usable=findUsableSave(await store.read());if(!usable)throw Error('No readable save found.');const restored=await manager.restore(usable.save);onLoad(restored);if(usable.recovered)restored.message='Recovered your journey from a save backup.';});
 q('export-save').onclick=()=>run(async()=>{
  const world=getWorld(),save=world?.adventure?captureSave(world,'export'):saveCandidates(await store.read())[0];
  if(!save)throw Error('No journey to export yet.');
  const file=new Blob([JSON.stringify(save,null,2)],{type:'application/json'}),url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=`the-wilds-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  q('save-message').textContent='Save file exported. Keep it somewhere safe.';
 });
 q('import-save').onclick=()=>q('save-file').click();
 q('save-file').onchange=()=>run(async()=>{
  const file=q('save-file').files[0];q('save-file').value='';if(!file)return;if(file.size>5*1024*1024)throw Error('Save file is too large.');
  const save=parseSave(await file.text());
  ask('Import this journey? It will replace the saves on this browser. Export your current journey first if you want to keep it.',async()=>{const restored=restoreSave(save);await manager.begin(restored,save);onLoad(restored);close();});
 });
 refresh();
 return {
  get open(){return dialog.open;},manager,
  newGame(){
   const start=async()=>{const world=onNew();try{await manager.begin(world);}catch(error){manager.attach(world);showError(error);}if(dialog.open)close();};
   store.read().then(root=>{if(root||getWorld()?.adventure){show();ask('Start a new journey? This replaces the current local journey and its saves. Export first if you want to keep them.',start);}else run(start);}).catch(()=>{show();ask('Saved progress could not be checked. Start a new journey and replace any existing local saves?',start);});
  },
  update(){const active=!!getWorld()?.adventure;button.hidden=!active;badge.hidden=!active||!status;manager.observe();},
  flush(){if(manager.world)manager.request('auto').catch(()=>{});},
  close,show
 };
}
