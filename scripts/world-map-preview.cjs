// Browser preview of the world map: the minimap (no zoom button), and the map's Reedwater Delta tab.
// SHOTS=<dir> for screenshots.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const out=process.env.SHOTS||'screenshots';
(async()=>{
 process.env.PORT='5192';await import('../server.mjs');
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message,e.stack);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5192');
 await page.evaluate(async()=>{
  const {World}=await import('/src/world.js'),{MARA_SPOT,CHIEF_HOUSE}=await import('/src/chief-house.js'),{captureSave}=await import('/src/save-format.js'),{createStoryNpcs}=await import('/src/story.js'),{IndexedSaveStore}=await import('/src/save-store.js');
  const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='world-map-browser';w.areaId='crossroads';
  w.story={stage:'ch7-complete',lureSeen:true,photoSeen:true,scene:null,page:0,rod:true,bow:true,coreIngested:true,callAwakened:true,guide:{...MARA_SPOT,waypoint:0,areaId:CHIEF_HOUSE.id}};
  w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:800,y:700});
  await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:captureSave(w),writerId:null,manual:null,backups:[]}));
 });
 await page.reload();await page.locator('#continue-journey:not([disabled])').waitFor();await page.locator('#continue-journey').click();await page.waitForFunction(()=>window.__storyQA.world.journeyId==='world-map-browser');
 await page.waitForTimeout(800);assert.equal(await page.locator('#minimap-zoom').count(),0);
 await page.screenshot({path:`${out}/minimap.png`,clip:{x:0,y:0,width:420,height:260}});
 await page.keyboard.press('m');await page.waitForTimeout(300);await page.locator('#atlas-tab-world').click();await page.waitForTimeout(800);
 await page.screenshot({path:`${out}/world-map.png`});
 await page.locator('#atlas-tab-area').click();await page.waitForTimeout(300);await page.screenshot({path:`${out}/area-map.png`});
 assert.deepEqual(errors,[]);console.log('World map browser preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
