// Browser preview of Willowback's three areas with their people: the commons, the Upper Lanes and Millside.
// SHOTS=<dir> for screenshots.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const out=process.env.SHOTS||'screenshots';
(async()=>{
 process.env.PORT='5190';await import('../server.mjs');
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message,e.stack);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5190');
 await page.evaluate(async()=>{
  const {World}=await import('/src/world.js'),{MARA_SPOT,CHIEF_HOUSE}=await import('/src/chief-house.js'),{captureSave}=await import('/src/save-format.js'),{createStoryNpcs}=await import('/src/story.js'),{IndexedSaveStore}=await import('/src/save-store.js');
  const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='districts-browser';w.areaId='village';
  w.story={stage:'ch7-complete',lureSeen:true,photoSeen:true,scene:null,page:0,rod:true,bow:true,coreIngested:true,callAwakened:true,guide:{...MARA_SPOT,waypoint:0,areaId:CHIEF_HOUSE.id}};
  w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:1560,y:300});
  await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:captureSave(w),writerId:null,manual:null,backups:[]}));
 });
 await page.reload();await page.locator('#continue-journey:not([disabled])').waitFor();await page.locator('#continue-journey').click();await page.waitForFunction(()=>window.__storyQA.world.journeyId==='districts-browser');
 const go=(areaId,x,y)=>page.evaluate(([a,x,y])=>{const w=window.__storyQA.world;w.areaId=a;Object.assign(w.player,{x,y,vx:0,vy:0});},[areaId,x,y]);
 await page.waitForTimeout(800);await page.screenshot({path:`${out}/01-commons-north-path.png`});
 // Walk up the path into the Upper Lanes.
 await go('village',1560,30);await page.keyboard.down('w');await page.waitForFunction(()=>window.__storyQA.world.areaId==='village-north');await page.keyboard.up('w');
 await go('village-north',800,760);await page.waitForTimeout(800);await page.screenshot({path:`${out}/02-lantern-square.png`});
 await go('village-north',600,450);await page.waitForTimeout(600);await page.screenshot({path:`${out}/03-upper-lanes-bakery.png`});
 await go('village-north',800,1000);await page.waitForTimeout(600);await page.screenshot({path:`${out}/04-upper-lanes-south.png`});
 await go('village-mill',800,640);await page.waitForTimeout(800);await page.screenshot({path:`${out}/05-millside.png`});
 await go('village-mill',1050,700);await page.waitForTimeout(600);await page.screenshot({path:`${out}/06-watermill-bridge.png`});
 await go('village',1000,800);await page.waitForTimeout(600);await page.screenshot({path:`${out}/07-commons.png`});
 assert.deepEqual(errors,[]);console.log('Village districts browser preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
