import {SaveManager,IndexedSaveStore,findUsableSave,saveCandidates} from './save-store.js';
import {captureSave,parseSave,restoreSave} from './save-format.js';
import {CloudSync,firebaseBackend,planSync,describeSave} from './cloud-save.js';
const GOOGLE_G='<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.2C6.6 42.6 14.6 48 24 48z"/></svg>';
const googleButton=id=>`<button id="${id}" class="google-signin" type="button">${GOOGLE_G}<span>Sign in with Google</span></button>`;
export function mountSaveUI({getWorld,onLoad,onNew,onTitle,onOpen,onClose}){
 const button=document.createElement('button');button.id='open-saves';button.textContent='Save';button.hidden=true;button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-label','Save and load game');
 const badge=document.createElement('span');badge.id='save-status';badge.setAttribute('role','status');
 document.querySelector('.playfield').append(button,badge);
 const dialog=document.createElement('dialog');dialog.id='save-menu';dialog.setAttribute('aria-labelledby','save-title');
 dialog.innerHTML='<div class="backpack-heading"><div><small>YOUR JOURNEY</small><h2 id="save-title">Save and load</h2></div><button id="close-saves">Close</button></div><p id="save-message" role="status"></p><div class="save-controls"><button id="manual-save">Save game</button><button id="export-save">Export save</button><button id="import-save">Import save</button><button id="return-title">Return to title</button></div><input id="save-file" type="file" accept=".json,application/json" hidden><section id="cloud-panel" aria-labelledby="cloud-title"><h3 id="cloud-title">Cloud save</h3><p id="cloud-text"></p><div id="cloud-signed-out">'+googleButton('cloud-signin')+'</div><div id="cloud-actions" class="save-controls" hidden><button id="cloud-upload">Save to cloud now</button><button id="cloud-load">Load cloud save</button><button id="cloud-signout">Sign out</button></div><div id="cloud-choice" hidden><p>This device and your Google account have different saves. Pick the one to keep; the other is set aside as a backup in your account.</p><div class="cloud-pick"><div><b>This device</b><span id="choice-local"></span><button id="keep-local">Keep this device</button></div><div><b>Google account</b><span id="choice-cloud"></span><button id="keep-cloud">Keep cloud save</button></div></div></div></section><section id="save-confirm" hidden><p></p><button id="confirm-save-action">Confirm</button><button id="cancel-save-action">Cancel</button></section><div id="save-records"></div><p class="save-note">Saved on this device. Sign in with Google to carry your journey to other devices, or export a file for a backup. Unfinished casts resume with your line put away.</p>';
 document.body.append(dialog);
 const q=id=>dialog.querySelector('#'+id),store=new IndexedSaveStore();let records=null,busy=false,confirmAction=null,status=null;
 const manager=new SaveManager(store,value=>{status=value;badge.textContent=value.text;badge.classList.toggle('save-error',value.kind==='error');badge.hidden=!getWorld()?.adventure||value.kind!=='error';q('save-message').textContent=value.kind==='saved'?`Saved ${new Date(value.at).toLocaleTimeString()}`:value.text;});
 const continueButton=document.createElement('button');continueButton.id='continue-journey';continueButton.textContent='Continue';continueButton.disabled=true;
 document.querySelector('.lobby-actions').prepend(continueButton);
 const account=document.createElement('div');account.id='title-account';document.querySelector('.lobby-actions').after(account);
 const cloud=new CloudSync({backend:firebaseBackend(),onChange:()=>renderCloud()});let choice=null;
 manager.onSaved=save=>{cloud.queue(save,save.reason==='manual').catch(()=>{});};
 async function refresh(){
  try{records=await store.read();continueButton.disabled=!findUsableSave(records);}
  catch(error){continueButton.disabled=true;q('save-message').textContent=`Could not read saved progress: ${error.message}`;}
 }
 function showError(error){q('save-message').textContent=error.message||'Action failed. Existing saves were not changed.';}
 async function run(action){if(busy)return;busy=true;try{await action();await refresh();await renderRecords();}catch(error){showError(error);}finally{busy=false;renderCloud();}}
 function ask(text,action){confirmAction=action;q('save-confirm').hidden=false;q('save-confirm').querySelector('p').textContent=text;q('confirm-save-action').focus();}
 const newestLocal=async()=>saveCandidates(await store.read())[0]||null;
 const cloudLine=()=>({'signed-out':'Not signed in.','signing-in':'Signing in...',checking:'Checking your Google account...',syncing:'Saving to your Google account...',synced:cloud.cloud?`In your Google account: ${describeSave(cloud.cloud.save)}${cloud.cloud.device?` (${cloud.cloud.device})`:''}`:'Signed in. Your next save goes to your Google account.',offline:'Cloud save is waiting for a connection.',unavailable:'Cloud saves are unavailable right now.'})[cloud.state]||'';
 function renderCloud(){
  const signedIn=!!cloud.user;
  q('cloud-text').textContent=cloud.error||cloudLine();
  q('cloud-signed-out').hidden=signedIn;q('cloud-actions').hidden=!signedIn||!!choice;q('cloud-choice').hidden=!choice;
  q('cloud-upload').disabled=!getWorld()?.adventure&&!records?.current;q('cloud-load').disabled=!cloud.cloud;
  if(signedIn){
   const name=cloud.user.name.split(' ')[0],syncText=cloud.state==='synced'?'☁ Synced':cloud.state==='offline'?'☁ Offline':'☁ Syncing...';
   account.innerHTML='<span class="account-avatar"></span><span class="account-who">Signed in as <b></b><small></small></span><button id="title-signout" type="button">Sign out</button>';
   const avatar=account.querySelector('.account-avatar');if(cloud.user.photo){const img=document.createElement('img');img.src=cloud.user.photo;img.alt='';img.referrerPolicy='no-referrer';avatar.append(img);}else avatar.textContent=name[0]||'?';
   account.querySelector('b').textContent=name;account.querySelector('small').textContent=syncText;
   account.querySelector('#title-signout').onclick=()=>cloud.signOut().catch(showError);
  }else{
   account.innerHTML=googleButton('title-signin')+'<small class="account-hint"></small>';
   account.querySelector('small').textContent=cloud.error||'Optional · keeps your journey on every device';
   account.querySelector('#title-signin').onclick=signIn;
  }
  account.hidden=cloud.state==='unavailable';
 }
 function signIn(){cloud.signIn().catch(()=>{});}
 // Keep the cloud journey: set the local one aside in the account, then make the cloud save current here.
 async function useCloud(save,local){
  await cloud.keepAside(local);
  await store.update(root=>({journeyId:save.journeyId,writerId:manager.writerId,current:save,backups:root?.journeyId===save.journeyId?[root.current,...(root.backups||[])].filter(Boolean).slice(0,3):[],manual:root?.journeyId===save.journeyId?root.manual:null}));
  if(getWorld()?.adventure){const restored=await manager.restore(save);onLoad(restored);}
  q('save-message').textContent='Loaded your journey from your Google account.';
 }
 cloud.onSignedIn=async()=>{
  try{
   const remote=await cloud.fetch(),local=getWorld()?.adventure?captureSave(getWorld(),'sync'):await newestLocal(),plan=planSync(local,remote?.save);
   if(plan==='upload')await cloud.queue(local,true);
   else if(plan==='download')await run(()=>useCloud(remote.save,null));
   else if(plan==='choose'){choice={local,remote:remote.save};q('choice-local').textContent=describeSave(local);q('choice-cloud').textContent=describeSave(remote.save)+(remote.device?` (${remote.device})`:'');if(!dialog.open)show();}
   if(plan!=='upload')cloud.set('synced');
  }catch(error){cloud.set('offline',`Could not reach your Google account: ${error.message||error}`);}
  renderCloud();
 };
 function close(){dialog.close();}
 function show(){onOpen();q('save-confirm').hidden=true;confirmAction=null;dialog.showModal();q('manual-save').disabled=!getWorld()?.adventure;q('return-title').hidden=!getWorld()?.adventure;refresh().then(renderRecords).then(renderCloud);}
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
 q('cloud-signin').onclick=signIn;q('cloud-signout').onclick=()=>run(()=>cloud.signOut());
 q('cloud-upload').onclick=()=>run(async()=>{if(getWorld()?.adventure)await manager.request('auto',true);const save=await newestLocal();if(!save)throw Error('No journey to save yet.');if(!await cloud.queue(save,true))throw Error(cloud.error||'Cloud save failed.');q('save-message').textContent='Saved to your Google account.';});
 q('cloud-load').onclick=()=>run(async()=>{const remote=await cloud.fetch();if(!remote)throw Error('No journey in your Google account yet.');ask('Load the journey from your Google account? It replaces the journey on this device, which is set aside as a backup in your account.',async()=>useCloud(remote.save,getWorld()?.adventure?captureSave(getWorld(),'sync'):await newestLocal()));});
 q('keep-local').onclick=()=>run(async()=>{const {local}=choice;choice=null;if(!await cloud.queue(local,true))throw Error(cloud.error||'Cloud save failed.');q('save-message').textContent='Kept this device\'s journey and saved it to your Google account.';});
 q('keep-cloud').onclick=()=>run(async()=>{const {local,remote}=choice;choice=null;await useCloud(remote,local);});
 globalThis.addEventListener?.('visibilitychange',()=>{if(document.visibilityState==='hidden')cloud.flush().catch(()=>{});});

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
 refresh();cloud.start();renderCloud();
 return {
  get open(){return dialog.open;},manager,cloud,
  newGame(){
   const start=async()=>{const world=onNew();try{await manager.begin(world);}catch(error){manager.attach(world);showError(error);}if(dialog.open)close();};
   store.read().then(root=>{if(root||getWorld()?.adventure){show();ask('Start a new journey? This replaces the current local journey and its saves. Export first if you want to keep them.',start);}else run(start);}).catch(()=>{show();ask('Saved progress could not be checked. Start a new journey and replace any existing local saves?',start);});
  },
  update(){const active=!!getWorld()?.adventure;button.hidden=!active;badge.hidden=!active||status?.kind!=='error';manager.observe();},
  flush(){if(manager.world)manager.request('auto').catch(()=>{});},
  close,show
 };
}
