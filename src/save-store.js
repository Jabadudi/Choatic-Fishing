import {captureSave,restoreSave,importantProgress,SAVE_VERSION} from './save-format.js';
export class IndexedSaveStore{
 constructor(indexedDB=globalThis.indexedDB){this.indexedDB=indexedDB;}
 open(){
  if(!this.promise)this.promise=new Promise((resolve,reject)=>{
   if(!this.indexedDB){reject(Error('Browser storage is unavailable. Export your save to keep a backup.'));return;}
   const request=this.indexedDB.open('the-wilds-progress',1);
   request.onupgradeneeded=()=>request.result.createObjectStore('profiles');
   request.onerror=()=>{this.promise=null;reject(request.error||Error('Could not open save storage.'));};
   request.onblocked=()=>{this.promise=null;reject(Error('Close other game tabs and try again.'));};
   request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();this.promise=null;};resolve(db);};
  });return this.promise;
 }
 async read(){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction('profiles','readonly'),request=tx.objectStore('profiles').get('journey');tx.oncomplete=()=>resolve(request.result||null);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Read interrupted.'));});}
 async update(change){const db=await this.open();return new Promise((resolve,reject)=>{
  const tx=db.transaction('profiles','readwrite'),store=tx.objectStore('profiles'),request=store.get('journey');let result,error;
  request.onsuccess=()=>{try{result=change(request.result||null);store.put(result,'journey');}catch(e){error=e;tx.abort();}};
  tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(error||tx.error||Error('Save was interrupted.'));tx.onerror=()=>{};
 });}
}
export const saveCandidates=root=>root?[root.current,root.manual,...(root.backups||[])].filter(Boolean).sort((a,b)=>b.savedAt-a.savedAt):[];
export function findUsableSave(root){
 const candidates=saveCandidates(root);let lastError;
 if(candidates[0]?.version>SAVE_VERSION)throw Error('This journey was saved by a newer game version. Update the game before continuing.');
 for(let index=0;index<candidates.length;index++)try{return {save:candidates[index],world:restoreSave(candidates[index]),recovered:index>0};}catch(error){lastError=error;}
 if(lastError)throw lastError;return null;
}
export class SaveManager{
 constructor(store=new IndexedSaveStore(),onStatus=()=>{},now=()=>Date.now()){
  this.store=store;this.onStatus=onStatus;this.now=now;this.queue=Promise.resolve();this.writerId=globalThis.crypto?.randomUUID?.()||`tab-${now()}-${Math.random()}`;this.world=null;this.lastCheck=0;this.lastPeriodic=0;this.retryAfter=0;
 }
 attach(world){this.world=world;this.lastHealth=world.player.health;this.lastImportant=importantProgress(world);this.lastPeriodic=this.now();this.lastSavedFingerprint=null;}
 async begin(world,imported=null){
  world.journeyId=imported?.journeyId||globalThis.crypto?.randomUUID?.()||`journey-${this.now()}-${Math.random()}`;
  const save=captureSave(world,imported?'import':'new-game',this.now());
  return this.enqueue(async()=>{await this.store.update(()=>({journeyId:world.journeyId,writerId:this.writerId,current:save,backups:[],manual:null}));this.attach(world);this.saved(save);return true;});
 }
 saved(save){this.lastPeriodic=this.now();this.lastSavedFingerprint=JSON.stringify(save.state);this.onStatus({kind:'saved',text:'Saved',at:save.savedAt});}
 enqueue(work){const pending=this.queue.then(work);this.queue=pending.catch(()=>{});return pending.catch(error=>{this.retryAfter=this.now()+5000;this.lastImportant=null;this.onStatus({kind:'error',text:`Save failed: ${error.message||'Storage unavailable'}. Export a backup.`,error});throw error;});}
 request(kind='auto',force=false){
  const world=this.world;if(!world?.adventure)return Promise.resolve(false);
  const save=captureSave(world,kind,this.now()),fingerprint=JSON.stringify(save.state);
  if(!force&&kind!=='manual'&&fingerprint===this.lastSavedFingerprint)return Promise.resolve(false);
  this.lastImportant=importantProgress(world);
  return this.enqueue(async()=>{
   if(this.world!==world)return false;
   this.onStatus({kind:'saving',text:'Saving...'});
   await this.store.update(root=>{
    if(root?.writerId&&root.writerId!==this.writerId)throw Error('This journey is open in another tab. Reload before saving');
    if(root&&root.journeyId!==world.journeyId)throw Error('Another journey was saved in a different tab. Reload before saving');
    const next=root||{journeyId:world.journeyId,writerId:this.writerId,backups:[],manual:null};
    if(kind==='manual')return {...next,manual:save};
    return {...next,current:save,backups:[next.current,...(next.backups||[])].filter(Boolean).slice(0,3)};
   });
   this.saved(save);return true;
  });
 }
 observe(){
  const now=this.now();if(!this.world||now-this.lastCheck<200||now<this.retryAfter)return;this.lastCheck=now;
  const important=importantProgress(this.world);
  const injured=this.world.player.health<this.lastHealth-.01;this.lastHealth=this.world.player.health;
  if(important!==this.lastImportant||injured){this.lastImportant=important;this.request('auto',true).catch(()=>{this.lastImportant=null;});}
  else if(now-this.lastPeriodic>=30000){this.lastPeriodic=now;this.request('auto').catch(()=>{this.lastPeriodic=0;});}
 }
 async restore(save){
  const world=restoreSave(save),checkpoint=captureSave(world,'restore',this.now());
  return this.enqueue(async()=>{
   await this.store.update(root=>{if(!root||root.journeyId!==world.journeyId)throw Error('The saved journey changed. Reopen the save menu.');return {...root,writerId:this.writerId,current:checkpoint,backups:[root.current,...(root.backups||[])].filter(Boolean).slice(0,3)};});
   this.attach(world);this.saved(checkpoint);return world;
  });
 }
}
