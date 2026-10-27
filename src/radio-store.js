import {normalizeRadio,createRadio} from './radio.js';
// The radio keeps its playlist and song files in their own browser database, apart from journey saves,
// so songs stay on this device and never go into an exported save.
export class RadioStore{
 constructor(indexedDB=globalThis.indexedDB){this.indexedDB=indexedDB;this.memory=new Map();}
 open(){
  if(!this.promise)this.promise=new Promise((resolve,reject)=>{
   if(!this.indexedDB){reject(Error('Browser storage is unavailable.'));return;}
   const request=this.indexedDB.open('the-wilds-radio',1);
   request.onupgradeneeded=()=>{request.result.createObjectStore('songs');request.result.createObjectStore('state');};
   request.onerror=()=>{this.promise=null;reject(request.error||Error('Could not open radio storage.'));};
   request.onblocked=()=>{this.promise=null;reject(Error('Close other game tabs and try again.'));};
   request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();this.promise=null;};resolve(db);};
  });return this.promise;
 }
 async run(storeName,mode,work){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,mode),request=work(tx.objectStore(storeName));tx.oncomplete=()=>resolve(request?.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Radio storage was interrupted.'));});}
 // Without browser storage the radio still plays for this visit from memory.
 async load(){try{return normalizeRadio(await this.run('state','readonly',store=>store.get('radio')));}catch{return createRadio();}}
 async save(radio){try{await this.run('state','readwrite',store=>store.put(JSON.parse(JSON.stringify(radio)),'radio'));return true;}catch{return false;}}
 async putSong(id,blob){this.memory.set(id,blob);try{await this.run('songs','readwrite',store=>store.put(blob,id));return true;}catch{return false;}}
 async getSong(id){if(this.memory.has(id))return this.memory.get(id);try{return await this.run('songs','readonly',store=>store.get(id))||null;}catch{return null;}}
 async deleteSong(id){this.memory.delete(id);try{await this.run('songs','readwrite',store=>store.delete(id));}catch{}}
}
