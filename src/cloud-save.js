import {parseSave} from './save-format.js';
// Public web identifiers for the Firebase project; access is enforced by firestore.rules.
export const FIREBASE_CONFIG={apiKey:'AIzaSyA-yPYfwn-f0Wlh0X0iCRxI-mSEvSQ5t2U',authDomain:'the-wilds-ce2d5.firebaseapp.com',projectId:'the-wilds-ce2d5',storageBucket:'the-wilds-ce2d5.firebasestorage.app',messagingSenderId:'222729712969',appId:'1:222729712969:web:7de395a77e9d83bf381698'};
export const CLOUD_UPLOAD_INTERVAL=60000;

// Decide what to do when a signed-in player has a local and/or cloud journey.
export function planSync(local,cloud){
 if(!cloud)return local?'upload':'none';
 if(!local)return 'download';
 if(JSON.stringify(local.state)===JSON.stringify(cloud.state))return 'none';
 if(local.journeyId===cloud.journeyId&&local.savedAt>=cloud.savedAt)return 'upload';
 return 'choose';
}
export function describeSave(save){
 const s=save?.state||{},minutes=Math.floor((s.elapsed||0)/60),level=s.progression?.level;
 const played=minutes>=60?`${Math.floor(minutes/60)}h ${minutes%60}m`:`${minutes}m`;
 return `${level?`Level ${level} · `:''}${played} played · saved ${new Date(save.savedAt).toLocaleString()}`;
}
export function deviceLabel(nav=globalThis.navigator){
 const ua=nav?.userAgent||'';
 const os=/iPhone/.test(ua)?'iPhone':/iPad/.test(ua)?'iPad':/Android/.test(ua)?'Android':/Windows/.test(ua)?'Windows':/Mac/.test(ua)?'Mac':/Linux/.test(ua)?'Linux':'Browser';
 const browser=/Edg\//.test(ua)?'Edge':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'';
 return browser?`${os} · ${browser}`:os;
}

// Firebase Auth with Google, and one Firestore document per player at saves/{uid}.
export async function firebaseBackend(config=FIREBASE_CONFIG){
 const fb=await import(new URL('../vendor/firebase.js',import.meta.url));
 const app=fb.initializeApp(config),auth=fb.getAuth(app),db=fb.getFirestore(app),provider=new fb.GoogleAuthProvider();
 fb.getRedirectResult(auth).catch(()=>{});
 const ref=uid=>fb.doc(db,'saves',uid);
 return {
  onUser(callback){return fb.onAuthStateChanged(auth,user=>callback(user?{uid:user.uid,name:user.displayName||user.email||'Player',photo:user.photoURL||''}:null));},
  async signIn(){
   try{await fb.signInWithPopup(auth,provider);}
   catch(error){
    if(error?.code==='auth/popup-blocked'||error?.code==='auth/operation-not-supported-in-this-environment'){await fb.signInWithRedirect(auth,provider);return;}
    if(error?.code==='auth/popup-closed-by-user'||error?.code==='auth/cancelled-popup-request')return;
    throw error;
   }
  },
  signOut(){return fb.signOut(auth);},
  async read(uid){const snap=await fb.getDoc(ref(uid));return snap.exists()?snap.data():null;},
  write(uid,data){return fb.setDoc(ref(uid),data,{merge:true});}
 };
}

export class CloudSync{
 constructor({backend,onChange=()=>{},now=()=>Date.now(),device=deviceLabel()}={}){
  this.backendPromise=backend;this.onChange=onChange;this.now=now;this.device=device;
  this.user=null;this.state='signed-out';this.error='';this.cloud=null;this.pending=null;this.lastUpload=0;this.timer=null;this.uploading=null;
 }
 async start(){
  try{this.backend=await this.backendPromise;}catch(error){this.set('unavailable',`Cloud saves could not load: ${error.message||error}`);return;}
  this.backend.onUser(user=>{this.user=user;this.cloud=null;if(!user){this.pending=null;this.set('signed-out');}else{this.set('checking');this.onSignedIn?.(user);}});
 }
 set(state,error=''){this.state=state;this.error=error;this.onChange(this);}
 async signIn(){if(!this.backend)throw Error(this.error||'Cloud saves are still loading. Try again in a moment.');this.set('signing-in');try{await this.backend.signIn();if(!this.user)this.set('signed-out');}catch(error){this.set('signed-out',`Sign-in failed: ${error.message||error}`);throw error;}}
 async signOut(){await this.flush();await this.backend?.signOut();}
 // The cloud copy of the newest save, validated before it is offered for loading.
 async fetch(){
  if(!this.user)return null;
  const data=await this.backend.read(this.user.uid);
  if(!data?.current){this.cloud=null;return null;}
  const save=parseSave(data.current);
  this.cloud={save,device:data.device||'',savedAt:save.savedAt};return this.cloud;
 }
 // Queue a save for upload; uploads run at most once a minute unless forced.
 queue(save,force=false){
  if(!this.user||!save)return Promise.resolve(false);
  this.pending=save;
  const wait=this.lastUpload+CLOUD_UPLOAD_INTERVAL-this.now();
  if(force||wait<=0)return this.flush();
  if(!this.timer)this.timer=setTimeout(()=>{this.timer=null;this.flush().catch(()=>{});},wait);
  return Promise.resolve(false);
 }
 // Set a journey aside in the account before the player replaces it with another one.
 async keepAside(save){if(this.user&&save)await this.backend.write(this.user.uid,{previous:JSON.stringify(save)});}
 async flush(){
  if(this.timer){clearTimeout(this.timer);this.timer=null;}
  if(this.uploading)await this.uploading.catch(()=>{});
  const save=this.pending,user=this.user;if(!save||!user)return false;
  this.pending=null;this.set('syncing');
  this.uploading=(async()=>{
   const previous=this.cloud?.save&&this.cloud.save.journeyId!==save.journeyId?JSON.stringify(this.cloud.save):undefined;
   const data={current:JSON.stringify(save),journeyId:save.journeyId||'',savedAt:save.savedAt,device:this.device,updatedAt:this.now()};
   if(previous)data.previous=previous;
   await this.backend.write(user.uid,data);
   this.cloud={save,device:this.device,savedAt:save.savedAt};this.lastUpload=this.now();
  })();
  try{await this.uploading;if(this.user===user)this.set('synced');return true;}
  catch(error){if(!this.pending)this.pending=save;this.set('offline',`Cloud save failed: ${error.message||error}. It will retry on the next save.`);return false;}
  finally{this.uploading=null;}
 }
}
