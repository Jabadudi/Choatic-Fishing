import {SPRITES,PROPS} from './sprite-definitions.js';
// Explicit artwork categories. No effects, projectiles, pickups, portraits or weapon attack sheets.
const excluded=new Set(['pickup','ash-arrow','eli-sabre','eli-spear','moonfang-charge']);
const entityAssets=Object.entries(SPRITES).filter(([id,s])=>s.asset&&!excluded.has(id)&&!id.startsWith('core.')&&!id.startsWith('projectile.')&&!id.endsWith('-portrait')&&!id.endsWith('-illustration')).map(([,s])=>s.asset);
const groundNames=['quarry-bedrock-v2','quarry-cliff-v2','earth-cliff','forest-floor','beach-sand','rocky-ground','marsh-ground','packed-dirt','moss-carpet','leaf-litter','river-pebbles','harbor-deck','cliff-top','old-road','drowned-road','shallow-water','river-water','open-sea'];
export const TEXTURE_PACK_ASSETS=Object.freeze([...new Set([...entityAssets,...Object.values(PROPS),...groundNames.map(n=>`ground/${n}.webp`),...['plateau-top','cliff-wall','sand','dirt-path','water'].map(n=>`ground/dual/${n}.png`)])]);
const allowed=new Set(TEXTURE_PACK_ASSETS);
// Texture packs contain artwork only. World geometry, collision and saves remain independent.
const listeners=new Set();let active=null;
const pathOK=s=>typeof s==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_./ -]*$/.test(s)&&!s.split('/').includes('..')&&!s.includes('//');
export function validateTexturePack(input){
 if(!input||input.format!=='the-wilds-texture-pack'||input.version!==1||typeof input.name!=='string'||!input.name.trim()||input.name.length>80)throw Error('Invalid texture pack header.');
 if(Object.keys(input).some(key=>!['format','version','name','assets'].includes(key)))throw Error('Packs may only replace artwork; animation and gameplay settings are not supported.');
 if(!input.assets||typeof input.assets!=='object'||Array.isArray(input.assets))throw Error('The pack needs an assets map.');
 const assets=Object.create(null),entries=Object.entries(input.assets);if(entries.length>512)throw Error('A pack can replace up to 512 assets.');let size=0;
 for(const [path,data] of entries){if(!allowed.has(path))throw Error('This asset is not packable entity, terrain, structure or furniture artwork: '+path);if(!pathOK(path)||!/^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(data))throw Error('Use local PNG, WebP or JPEG images with safe relative asset paths.');size+=data.length;if(data.length>12e6||size>64e6)throw Error('Texture pack is too large.');assets[path]=data;}
 return {format:input.format,version:1,name:input.name.trim(),assets};
}
export const texturePackName=()=>active?.name||'Default artwork';
export const textureAsset=(path,fallback)=>allowed.has(path)?active?.assets[path]||fallback:fallback;
export const onTexturePackChange=fn=>{listeners.add(fn);return ()=>listeners.delete(fn);};
function activate(pack){active=pack;for(const fn of listeners)fn();}
function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open('the-wilds-texture-packs',1);r.onupgradeneeded=()=>r.result.createObjectStore('packs');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function persist(pack){const db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction('packs','readwrite');tx.objectStore('packs').put(pack,'active');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Could not save texture pack.'));});}finally{db.close();}}
export async function installTexturePack(input){const pack=validateTexturePack(input);
 // Decode every image before replacing the active pack. Failed files cannot strand the player with missing artwork.
 for(const [path,data] of Object.entries(pack.assets)){const img=new Image();img.src=data;await img.decode();if(!img.naturalWidth||img.naturalWidth>8192||img.naturalHeight>8192||img.naturalWidth*img.naturalHeight>32e6)throw Error('An image exceeds the supported dimensions.');const original=new Image();original.src=new URL('../assets/'+path,import.meta.url).href;await original.decode();if(img.naturalWidth!==original.naturalWidth||img.naturalHeight!==original.naturalHeight)throw Error('Replacement dimensions must match the original artwork: '+path);}
 await persist(pack);activate(pack);return pack.name;
}
export async function resetTexturePack(){await persist(null);activate(null);}
export async function restoreTexturePack(){const db=await database();try{const value=await new Promise((resolve,reject)=>{const r=db.transaction('packs').objectStore('packs').get('active');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(value)activate(validateTexturePack(value));}finally{db.close();}}
export function mountTexturePackControls(parent){const section=document.createElement('section');section.innerHTML='<h3>Texture pack</h3><p data-pack-name></p><label>Install texture pack <input type="file" accept=".json,application/json"></label><button type="button">Use default artwork</button><p role="status"></p>';parent.append(section);const status=section.querySelector('[role="status"]'),input=section.querySelector('input'),button=section.querySelector('button');const refresh=()=>section.querySelector('[data-pack-name]').textContent=texturePackName();onTexturePackChange(refresh);refresh();
 async function run(fn){input.disabled=button.disabled=true;status.textContent='Loading artwork…';try{await fn();status.textContent='Artwork applied.';}catch(e){status.textContent=e.message;}finally{input.disabled=button.disabled=false;input.value='';}}
 input.onchange=()=>{const f=input.files[0];if(f)run(async()=>{if(f.size>64e6)throw Error('Texture pack is too large.');await installTexturePack(JSON.parse(await f.text()));});};button.onclick=()=>run(resetTexturePack);
 restoreTexturePack().catch(()=>{status.textContent='Saved artwork could not be loaded. Using default artwork.';});
}
