import {DEFAULT_BINDINGS,normalizeBindings} from './input-bindings.js';
// Device preferences are independent of journey saves and release fingerprints.
export const SETTINGS_KEY='the-wilds-settings-v1';
export const DIALOGUE_THEMES=[
 {id:'hearthwood',name:'Hearthwood',description:'Warm parchment in a stepped wooden frame.'},
 {id:'mossy-stone',name:'Mossy Stone',description:'A carved stone panel edged with moss.'},
 {id:'field-journal',name:'Field Journal',description:'Ruled paper, a taped portrait, and handwritten notes.'},
 {id:'lantern-night',name:'Lantern Night',description:'Dusky plum with warm lantern accents.'},
 {id:'meadow-banner',name:'Meadow Banner',description:'An open cream panel with a raised portrait and ribbon.'},
 {id:'quiet-hud',name:'Quiet HUD',description:'A compact, translucent panel with subtle key hints.'}
];
export const DEFAULT_PREFERENCES=Object.freeze({musicVolume:.3,sfxVolume:.7,musicMuted:false,sfxMuted:false,dialogueTheme:'hearthwood',hubOnline:false,keybinds:DEFAULT_BINDINGS});
export function normalizePreferences(value){
 const v=value&&typeof value==='object'?value:{},out={...DEFAULT_PREFERENCES};
 for(const key of ['musicVolume','sfxVolume'])if(typeof v[key]==='number'&&Number.isFinite(v[key]))out[key]=Math.max(0,Math.min(1,v[key]));
 for(const key of ['musicMuted','sfxMuted','hubOnline'])if(typeof v[key]==='boolean')out[key]=v[key];
 if(DIALOGUE_THEMES.some(t=>t.id===v.dialogueTheme))out.dialogueTheme=v.dialogueTheme;
 out.keybinds=normalizeBindings(v.keybinds);return Object.freeze(out);
}
export function createPreferenceStore(storage){
 let preferences=DEFAULT_PREFERENCES,error=null;const listeners=new Set();
 try{const saved=storage?.getItem(SETTINGS_KEY);if(saved)preferences=normalizePreferences(JSON.parse(saved));}catch{error='Preferences could not be read. Defaults are active.';}
 return {
  get value(){return preferences;},get error(){return error;},
  set(patch){preferences=normalizePreferences({...preferences,...patch});error=null;try{storage?.setItem(SETTINGS_KEY,JSON.stringify(preferences));}catch{error='Preferences apply for this session. Browser storage could not save them.';}
   for(const fn of listeners)fn(preferences);return preferences;},
  subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);}
 };
}
let storage;try{storage=globalThis.localStorage;}catch{}
export const preferences=createPreferenceStore(storage);
export const channelVolume=(p,channel)=>p[channel+'Muted']?0:p[channel+'Volume'];

