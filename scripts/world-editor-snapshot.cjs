// Pictures and ground maps of every outdoor area for the world editor in the Reedwater Delta Atlas.
// Each area is drawn whole with the game's own terrain and scenery, so editor points sit where they will in the game.
// Also writes world-editor.json: the areas, the creatures that can spawn, the villager sprites, and a coarse ground
// grid per area (1 = land a creature can stand on, 2 = water deep enough for a swimmer, 0 = neither) for live warnings,
// and land.json: the atlas areas' terrain for the land editor.
//   OUT=<dir> node scripts/world-editor-snapshot.cjs
const {chromium}=require('playwright');
const {mkdirSync,writeFileSync}=require('node:fs');
const out=process.env.OUT||'world-editor-snapshot';
const MAX=Number(process.env.MAX)||1600,CELL=40;
// Hand-built areas have no atlas number of their own; these are their entries on the atlas.
const ATLAS_NUM={windchime:'18.1',crossroads:'18.2','village-port':'12.1',village:'12.2','village-market':'12.3','village-farm':'12.4',marsh:'13.1'};
(async()=>{
 mkdirSync(`${out}/areas`,{recursive:true});
 process.env.PORT='5197';await import('../server.mjs');
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:800,height:600}});
 page.on('pageerror',e=>console.error('PAGEERROR',e.message));
 await page.goto('http://127.0.0.1:5197/manifest.webmanifest');
 const meta=await page.evaluate(async({CELL,ATLAS_NUM})=>{
  const {AREAS,INTERIOR_AREAS,placesFor}=await import('/src/wilds.js'),{ANIMAL_TYPES,animalTraits}=await import('/src/entities.js'),{animalGround}=await import('/src/wildlife.js'),{SPRITES}=await import('/src/sprite-definitions.js'),{VILLAGE_AREAS}=await import('/src/village-districts.js');
  const areas=Object.values(AREAS).filter(a=>!INTERIOR_AREAS.includes(a.id));
  const land={...animalTraits('deer'),areaId:''},water={...animalTraits('eel'),areaId:''};
  const grids={};
  for(const a of areas){land.areaId=water.areaId=a.id;let g='';
   for(let y=CELL/2;y<a.height;y+=CELL)for(let x=CELL/2;x<a.width;x+=CELL)g+=animalGround(land,x,y)?'1':animalGround(water,x,y)?'2':'0';
   grids[a.id]=g;}
  return {cell:CELL,areas:areas.map(a=>({id:a.id,name:a.name,num:a.num||ATLAS_NUM[a.id]||null,width:a.width,height:a.height,willowback:VILLAGE_AREAS.includes(a.id),sea:!!a.sea,places:placesFor(a.id).map(p=>({name:p.name,x:Math.round(p.x),y:Math.round(p.y)})),exits:a.exits.map(e=>({edge:e.edge,from:e.from,to:e.to,label:e.label}))})),
   species:Object.entries(ANIMAL_TYPES).map(([id,t])=>({id,name:t.name,habitat:t.habitat,behavior:t.behavior})),
   villagerSprites:Object.keys(SPRITES).filter(k=>k.startsWith('villager-')),grids};
 },{CELL,ATLAS_NUM});
 writeFileSync(`${out}/world-editor.json`,JSON.stringify(meta));
 // The land editor starts from the shipped terrain of every atlas area.
 const {shippedLand}=await import('./land-editor.mjs');writeFileSync(`${out}/land.json`,JSON.stringify(shippedLand()));
 for(const a of meta.areas){
  const s=Math.min(1,MAX/Math.max(a.width,a.height)),w=Math.round(a.width*s),h=Math.round(a.height*s);
  await page.setViewportSize({width:w,height:h});
  const data=await page.evaluate(async({id,s,w,h})=>{
   const {World}=await import('/src/world.js'),Wilds=await import('/src/wilds.js');
   const world=new World(()=>.2,{adventure:true});world.areaId=id;world.npcs=[];world.rabbits=[];world.wildlife=[];
   const area=Wilds.AREAS[id];Object.assign(world.player,{x:-9999,y:-9999});
   const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
   const view={left:0,right:area.width,top:0,bottom:area.height};
   const draw=()=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.scale(s,s);Wilds.drawWilds(ctx,world,view);Wilds.drawDepthSorted(ctx,world,view,[],()=>{});};
   // Scenery and canopies load their art lazily; draw again once it has arrived.
   draw();await new Promise(r=>setTimeout(r,700));Wilds.clearTerrainCache?.();world.elapsed=5;draw();
   return c.toDataURL('image/jpeg',.78);
  },{id:a.id,s,w,h});
  writeFileSync(`${out}/areas/${a.id}.jpg`,Buffer.from(data.split(',')[1],'base64'));
  console.log(a.id,w,h);
 }
 await browser.close();process.exit(0);
})();
