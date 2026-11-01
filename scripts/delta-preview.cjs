// Browser preview of the atlas-built Reedwater Delta areas. AREAS=id,id… picks areas (default: all of them);
// each gets a shot at its spawn and one per landmark, plus the area map. SHOTS=<dir> for screenshots.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const out=process.env.SHOTS||'screenshots';
(async()=>{
 process.env.PORT='5191';await import('../server.mjs');
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message,e.stack);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;},toggleAtlas};'});});
 await page.goto('http://127.0.0.1:5191');
 await page.evaluate(async()=>{
  const {World}=await import('/src/world.js'),{MARA_SPOT,CHIEF_HOUSE}=await import('/src/chief-house.js'),{captureSave}=await import('/src/save-format.js'),{createStoryNpcs}=await import('/src/story.js'),{IndexedSaveStore}=await import('/src/save-store.js');
  const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='delta-browser';w.areaId='windchime';
  w.story={stage:'ch7-complete',lureSeen:true,photoSeen:true,scene:null,page:0,rod:true,bow:true,coreIngested:true,callAwakened:true,guide:{...MARA_SPOT,waypoint:0,areaId:CHIEF_HOUSE.id}};
  w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:800,y:600});
  await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:captureSave(w),writerId:null,manual:null,backups:[]}));
 });
 await page.reload();await page.locator('#continue-journey:not([disabled])').waitFor();await page.locator('#continue-journey').click();await page.waitForFunction(()=>window.__storyQA.world.journeyId==='delta-browser');
 const ids=process.env.AREAS?process.env.AREAS.split(','):await page.evaluate(async()=>Object.keys((await import('/src/delta-areas.js')).DELTA));
 for(const id of ids){
  const spots=await page.evaluate(async id=>{const {AREAS,placesFor}=await import('/src/wilds.js');const a=AREAS[id];return [{name:'spawn',...a.spawn},...placesFor(id).map(p=>({name:p.id,x:p.x,y:p.y+60}))];},id);
  for(const s of spots.slice(0,process.env.ALL?99:3)){
   await page.evaluate(([a,x,y])=>{const w=window.__storyQA.world;w.areaId=a;Object.assign(w.player,{x,y,vx:0,vy:0});},[id,s.x,s.y]);
   await page.waitForTimeout(700);await page.screenshot({path:`${out}/${id}-${s.name}.png`});
  }
  await page.evaluate(()=>window.__storyQA.toggleAtlas(true));await page.waitForTimeout(300);await page.screenshot({path:`${out}/${id}-map.png`});await page.evaluate(()=>window.__storyQA.toggleAtlas(false));
 }
 assert.deepEqual(errors,[]);console.log('Delta browser preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
