import {GROUND_TEXTURE_SCALE} from './terrain-style.js';
// The Reedwater Delta ground and water textures (assets/ground/, cut by scripts/prepare-ground-textures.py), as repeating
// canvas patterns for the terrain painter. A texture returns null until its image has loaded; the caller then paints
// flat colour and invalidate() repaints the cached terrain once it arrives.
export const GROUND_TEXTURES=Object.freeze({forest:'forest-floor',sand:'beach-sand',rock:'rocky-ground',marsh:'marsh-ground',dirt:'packed-dirt',
 moss:'moss-carpet',leaves:'leaf-litter',pebbles:'river-pebbles',decking:'harbor-deck',cliff:'cliff-top',road:'old-road',drowned:'drowned-road',shallow:'shallow-water',river:'river-water',sea:'open-sea'});
const images=new Map();
// scale shrinks or grows the texture (an atlas area's land can set one per ground, e.g. smaller forest leaves).
export function groundPattern(ctx,kind,invalidate,scale=1){
 scale*=GROUND_TEXTURE_SCALE[kind]??1;
 const name=GROUND_TEXTURES[kind];if(!name||typeof Image==='undefined')return null;
 let entry=images.get(name);
 if(!entry){
  entry={image:new Image(),ready:false};images.set(name,entry);
  entry.image.onload=()=>{entry.ready=true;invalidate();};
  entry.image.src=new URL(`../assets/ground/${name}.webp`,import.meta.url).href;
 }
 if(!entry.ready)return null;
 // Patterns belong to one context; each terrain chunk has its own.
 entry.patterns??=new WeakMap();let byScale=entry.patterns.get(ctx);if(!byScale){byScale=new Map();entry.patterns.set(ctx,byScale);}
 let pattern=byScale.get(scale);
 if(!pattern){pattern=ctx.createPattern(entry.image,'repeat');
  if(pattern&&scale!==1&&typeof DOMMatrix!=='undefined'&&pattern.setTransform)pattern.setTransform(new DOMMatrix().scaleSelf(scale,scale));
  if(pattern)byScale.set(scale,pattern);}
 return pattern;
}
// Which texture paints a spot in an atlas area: water by depth (the Drowned Road's street under its shallows, open sea
// off the coast, river water elsewhere), the old paved roads, and the ground zones. Meadow and clearings keep the grass.
const SEA_AREAS=new Set(["village-port",'outer-shallows','seal-skerries','sandbar-spits','tidecave-coast','delta-mouth','arrival-bay','heron-point']);
const PAVED_AREAS=new Set(['old-roads','great-bridge','aqueduct-ruins','drowned-road']);
// Trail surfaces the land editor can pick per trail. 'dirt' is the classic sandy trail (no texture, the path painter's
// own dirt); the rest are ground textures. A trail without one is stone in the old paved areas and dirt elsewhere.
export const TRAIL_STYLES=Object.freeze({dirt:null,stone:'road',packed:'dirt',sand:'sand'});
export const defaultTrail=id=>PAVED_AREAS.has(id)?'stone':'dirt';
export function groundKind(id,{water,path,sand,zone,wet,r,trail}){
 if(water)return id==='drowned-road'&&wet> -160?'drowned':wet> -38+r*12?'shallow':SEA_AREAS.has(id)?'sea':'river';
 if(path)return TRAIL_STYLES[trail||defaultTrail(id)]??null;
 if(sand)return 'sand';
 return zone==='paving'?'road':zone in GROUND_TEXTURES?zone:null;
}
