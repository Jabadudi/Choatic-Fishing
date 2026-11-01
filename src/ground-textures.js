// The Reedwater Delta ground and water textures (assets/ground/, cut by scripts/prepare-ground-textures.py), as repeating
// canvas patterns for the terrain painter. A texture returns null until its image has loaded; the caller then paints
// flat colour and invalidate() repaints the cached terrain once it arrives.
export const GROUND_TEXTURES=Object.freeze({forest:'forest-floor',sand:'beach-sand',rock:'rocky-ground',marsh:'marsh-ground',dirt:'packed-dirt',
 cliff:'cliff-top',road:'old-road',drowned:'drowned-road',shallow:'shallow-water',river:'river-water',sea:'open-sea'});
const images=new Map();
export function groundPattern(ctx,kind,invalidate){
 const name=GROUND_TEXTURES[kind];if(!name||typeof Image==='undefined')return null;
 let entry=images.get(name);
 if(!entry){
  entry={image:new Image(),ready:false};images.set(name,entry);
  entry.image.onload=()=>{entry.ready=true;invalidate();};
  entry.image.src=new URL(`../assets/ground/${name}.webp`,import.meta.url).href;
 }
 if(!entry.ready)return null;
 // Patterns belong to one context; each terrain chunk has its own.
 entry.patterns??=new WeakMap();let pattern=entry.patterns.get(ctx);
 if(!pattern){pattern=ctx.createPattern(entry.image,'repeat');if(pattern)entry.patterns.set(ctx,pattern);}
 return pattern;
}
// Which texture paints a spot in an atlas area: water by depth (the Drowned Road's street under its shallows, open sea
// off the coast, river water elsewhere), the old paved roads, and the ground zones. Meadow and clearings keep the grass.
const SEA_AREAS=new Set(['outer-shallows','seal-skerries','sandbar-spits','tidecave-coast','delta-mouth','arrival-bay','heron-point']);
const PAVED_AREAS=new Set(['old-roads','great-bridge','aqueduct-ruins','drowned-road']);
export function groundKind(id,{water,path,sand,zone,wet,r}){
 if(water)return id==='drowned-road'&&wet> -160?'drowned':wet> -38+r*12?'shallow':SEA_AREAS.has(id)?'sea':'river';
 if(path)return PAVED_AREAS.has(id)?'road':null;
 if(sand)return 'sand';
 return zone in GROUND_TEXTURES?zone:null;
}
