// Compare the migrated outdoor maps against a previous checkout, and exercise live geometry edits.
// BASELINE=<checkout> SHOTS=<directory> NODE_PATH=<Playwright modules> node scripts/main-map-preview.cjs
const {chromium}=require('playwright'),{mkdirSync,writeFileSync,readFileSync}=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const out=process.env.SHOTS||'screenshots/main-maps',ids=['windchime','crossroads','village','village-port','village-market','village-farm','marsh'];
(async()=>{
 mkdirSync(out,{recursive:true});process.env.PORT='5220';await import('../server.mjs');
 if(process.env.BASELINE){process.env.PORT='5221';await import(pathToFileURL(path.join(process.env.BASELINE,'server.mjs')).href);}
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[];
 for(const variant of process.env.BASELINE?['before','after']:['after']){
  const page=await browser.newPage({viewport:{width:800,height:800}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+(variant==='before'?5221:5220)+'/manifest.webmanifest');
  for(const id of process.env.CAPTURE_IDS?process.env.CAPTURE_IDS.split(','):ids){
   const data=await page.evaluate(async id=>{
    const W=await import('/src/wilds.js'),{World}=await import('/src/world.js');const a=W.AREAS[id],s=Math.min(800/a.width,800/a.height),c=document.createElement('canvas');c.width=Math.round(a.width*s);c.height=Math.round(a.height*s);const ctx=c.getContext('2d');
    const w=new World(()=>.2,{adventure:true});w.areaId=id;w.elapsed=5;Object.assign(w.player,{x:-9999,y:-9999});w.npcs=[];w.wildlife=[];w.rabbits=[];const view={left:0,top:0,right:a.width,bottom:a.height};
    const draw=()=>{ctx.setTransform(s,0,0,s,0,0);ctx.clearRect(0,0,a.width,a.height);W.drawWilds(ctx,w,view,{still:true});W.drawDepthSorted(ctx,w,view,[],()=>{},{still:true});};
    draw();await new Promise(r=>setTimeout(r,1000));draw();return c.toDataURL();
   },id);writeFileSync(`${out}/${variant}-${id}.png`,Buffer.from(data.split(',')[1],'base64'));console.log(variant,id);
  }await page.close();
 }
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 // New edits must replace old geometry rather than retaining invisible hardcoded decks or water.
 const {LAND_DATA}=await import('../src/land-data.js'),{DELTA_DEFS}=await import('../src/delta-areas.js');const edits={...LAND_DATA};
 for(const id of ids){const d=DELTA_DEFS.find(a=>a.id===id),[x0,x1,y0,y1]=d.frame;edits[id]={...edits[id],shapes:[...(d.shapes||[]),['water','ellipse',[(x0+x1)/2,(y0+y1)/2],4,4]],walks:[],fords:[],bridges:[]};}
 await page.route('**/src/land-data.js',route=>route.fulfill({contentType:'text/javascript',body:'export const LAND_DATA='+JSON.stringify(edits)+';'}));await page.goto('http://127.0.0.1:5220/manifest.webmanifest');
 const result=await page.evaluate(async ids=>{const W=await import('/src/wilds.js'),{DELTA}=await import('/src/delta-areas.js');for(const id of ids){const a=W.AREAS[id];if(W.waterDistance(a.width/2,a.height/2,id)>=0)throw Error('Water edit ignored: '+id);if(DELTA[id].walks.length)throw Error('Deck removal ignored: '+id);}
  if(W.walkable(1050,1570,'marsh'))throw Error('Removed marsh deck is still walkable');if(W.surfaceAt(400,640,'village-port')==='path')throw Error('Removed port deck still counts as a path');return {maps:ids.length,editsApplied:true,removedDecksGone:true};},ids);
 const land=(await import('./land-editor.mjs')).shippedLand();writeFileSync(`${out}/preview-land.json`,JSON.stringify(land));
 if(process.env.BASELINE){
  for(const id of ids){const images=['before','after'].map(v=>'data:image/png;base64,'+readFileSync(`${out}/${v}-${id}.png`).toString('base64'));await page.setViewportSize({width:1640,height:900});await page.setContent(`<style>body{margin:0;background:#142027;color:#f5e8c8;font:22px system-ui}main{display:flex;gap:20px;padding:10px}section{width:800px}img{display:block;max-width:800px;max-height:800px}h2{margin:8px 0 16px}</style><main><section><h2>Before · ${id}</h2><img src="${images[0]}"></section><section><h2>Atlas terrain · ${id}</h2><img src="${images[1]}"></section></main>`);await page.screenshot({path:`${out}/compare-${id}.png`,fullPage:true});}
 }
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(result));await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
