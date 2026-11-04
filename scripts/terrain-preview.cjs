// Visual regression checks for ground materials, chunk seams and mobile blur fallback.
// Requires Playwright and Chrome. SHOTS overrides the output directory.
const {chromium}=require('playwright');
const {mkdirSync,writeFileSync}=require('node:fs');
const assert=require('node:assert/strict');
const out=process.env.SHOTS||'screenshots/terrain';
(async()=>{
 mkdirSync(out,{recursive:true});process.env.PORT='5216';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,executablePath:process.env.EDITOR_TEST_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1046,height:540}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/wilds.js',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:await r.text()+'\nexport {paintBlendedTerrain};'});});
 await page.goto('http://127.0.0.1:5216/manifest.webmanifest');
 const report=await page.evaluate(async()=>{
  const W=await import('/src/wilds.js'),{World}=await import('/src/world.js'),{blurMask}=await import('/src/terrain-blend.js');
  const world=new World(()=>.2,{adventure:true});world.elapsed=5;world.npcs=[];world.wildlife=[];world.rabbits=[];
  const c=document.createElement('canvas');c.width=1046;c.height=540;const ctx=c.getContext('2d');
  world.areaId='forest-edge';const hut=W.placesFor(world.areaId).find(p=>p.id==='woodcutters-hut');
  Object.assign(world.player,{x:hut.x+95,y:hut.y+85,spriteId:'eli',facing:'down'});
  const view={left:hut.x-260,top:hut.y-115,right:hut.x-260+1046,bottom:hut.y-115+540};
  const draw=()=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);ctx.translate(-view.left,-view.top);W.drawWilds(ctx,world,view,{still:true});W.drawDepthSorted(ctx,world,view,[{y:world.player.y,ref:world.player}],(c,p)=>W.drawExplorer(c,p,5),{still:true});W.drawWildsLabels(ctx,world,view);};
  draw();await new Promise(r=>setTimeout(r,1800));draw();await new Promise(r=>setTimeout(r,400));draw();
  const preview=c.toDataURL(),geometry=JSON.stringify({player:world.player,areas:W.AREAS}),rng=world.rng;
  // Compare one continuous terrain render against independently cached chunk-sized tiles.
  const surface=()=>{const c=document.createElement('canvas');c.width=768;c.height=512;return c;};
  const a=surface(),b=surface(),ac=a.getContext('2d'),bc=b.getContext('2d');ac.translate(-600,-350);bc.translate(-600,-350);
  W.paintBlendedTerrain(ac,600,350,768,512,'forest-edge');
  for(let y=350;y<862;y+=256)for(let x=600;x<1368;x+=256)W.paintBlendedTerrain(bc,x,y,256,256,'forest-edge');
  const ap=ac.getImageData(0,0,768,512).data,bp=bc.getImageData(0,0,768,512).data;let maxDifference=0;
  for(let i=0;i<ap.length;i++)maxDifference=Math.max(maxDifference,Math.abs(ap[i]-bp[i]));
  if(maxDifference>2)throw Error('Chunk seam mismatch: '+maxDifference);
  // Force the software path even on browsers that implement canvas filters.
  const mask=document.createElement('canvas');mask.width=80;mask.height=40;const mc=mask.getContext('2d');mc.fillStyle='white';mc.fillRect(0,0,40,40);
  const software=document.createElement('canvas');software.width=80;software.height=40;const sc=software.getContext('2d');
  blurMask(mask,{clearRect:sc.clearRect.bind(sc),putImageData:sc.putImageData.bind(sc)},3.5);
  const alpha=sc.getImageData(0,0,80,40).data;if(!(alpha[(20*80+39)*4+3]>0&&alpha[(20*80+40)*4+3]<255))throw Error('Software blend missing');
  // Exercise the software path in actual terrain rendering, as on older iPads.
  const descriptor=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'filter');
  if(descriptor)delete CanvasRenderingContext2D.prototype.filter;draw();const mobilePreview=c.toDataURL();
  if(descriptor)Object.defineProperty(CanvasRenderingContext2D.prototype,'filter',descriptor);
  const times=[];
  for(const area of Object.values(W.AREAS).filter(a=>!W.INTERIOR_AREAS.includes(a.id))){
   world.areaId=area.id;const x=area.spawn.x-160,y=area.spawn.y-120,v={left:x,top:y,right:x+320,bottom:y+240};
   ctx.setTransform(1,0,0,1,-x,-y);const t=performance.now();W.drawWilds(ctx,world,v,{still:true});times.push({area:area.id,ms:Math.round(performance.now()-t)});
  }
  if(JSON.stringify({player:world.player,areas:W.AREAS})!==geometry||world.rng!==rng)throw Error('Rendering changed gameplay state');
  world.areaId='forest-edge';W.clearTerrainCache();ctx.setTransform(1,0,0,1,-view.left,-view.top);
  for(let i=0;i<3;i++){W.drawWilds(ctx,world,view);await new Promise(r=>setTimeout(r,700));}
  const start=performance.now();for(let i=0;i<10;i++)W.drawWilds(ctx,world,view);const warmMs=(performance.now()-start)/10;
  return {preview,mobilePreview,maxDifference,times,warmMs};
 });
 for(const key of ['preview','mobilePreview']){writeFileSync(`${out}/${key}.png`,Buffer.from(report[key].split(',')[1],'base64'));delete report[key];}
 writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));assert.deepEqual(errors,[]);console.log(JSON.stringify(report));await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
