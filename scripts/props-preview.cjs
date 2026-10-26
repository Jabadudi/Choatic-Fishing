const {chromium}=require('playwright');
const assert=require('node:assert/strict');
// Screenshots each place that draws furniture sprites, and checks every prop image loads.
(async()=>{
 process.env.PORT='5187';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/props/')&&r.status()>=400)missing.push(r.url());});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5187');
 await page.evaluate(async()=>{
  const {World}=await import('/src/world.js'),{captureSave}=await import('/src/save-format.js'),{createStoryNpcs}=await import('/src/story.js'),{MARA_SPOT}=await import('/src/chief-house.js'),{IndexedSaveStore}=await import('/src/save-store.js');
  const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='props-browser';w.areaId='chief-house';
  w.story={stage:'ch4-complete',lureSeen:true,photoSeen:true,scene:null,page:0,guide:{...MARA_SPOT,waypoint:0,areaId:'chief-house'}};
  w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:320,y:410});w.inventory.receive({name:'Region Core',category:'quest-items'});
  await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:captureSave(w),writerId:null,manual:null,backups:[]}));
 });
 await page.reload();await page.locator('#continue-journey:not([disabled])').waitFor();await page.locator('#continue-journey').click();
 await page.waitForFunction(()=>window.__storyQA?.world?.journeyId==='props-browser');
 const shots=[['chief-house',320,410],['cabin',320,395],['guest-lodge',280,330],['village',1000,800],['village',1500,900],['village',700,1150],['crossroads',600,820],['crossroads',1300,900],['landing',1630,1700],['marsh',1530,1200]];
 for(const [area,x,y] of shots){
  await page.evaluate(([area,x,y])=>{const w=window.__storyQA.world;w.areaId=area;Object.assign(w.player,{x,y});},[area,x,y]);
  await page.waitForTimeout(1500);await page.screenshot({path:`screenshots/props-${area}-${x}.png`});
 }
 assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);console.log('Props preview passed: rooms, village and crossroads drew without missing images or errors.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
