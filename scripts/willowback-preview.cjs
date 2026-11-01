// Browser preview of the four Willowback areas and Windchime Path v2. SHOTS=<dir> for screenshots.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const out=process.env.SHOTS||'screenshots';
(async()=>{
 process.env.PORT='5191';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message,e.stack);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5191');
 // A journey at the end of Chapter 6, so every Willowback area is open and the villagers are out.
 await page.evaluate(async()=>{
  const {World}=await import('/src/world.js'),{captureSave}=await import('/src/save-format.js'),{createStoryNpcs}=await import('/src/story.js'),{MARA_SPOT,CHIEF_HOUSE}=await import('/src/chief-house.js'),{IndexedSaveStore}=await import('/src/save-store.js');
  const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='willowback-browser';w.areaId='village';
  w.story={stage:'ch6-complete',lureSeen:true,photoSeen:true,scene:null,page:0,rod:true,bow:true,coreIngested:true,callAwakened:true,guide:{...MARA_SPOT,waypoint:0,areaId:CHIEF_HOUSE.id}};
  w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:1300,y:800});
  await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:captureSave(w),writerId:null,manual:null,backups:[]}));
 });
 await page.reload();await page.locator('#continue-journey:not([disabled])').waitFor();await page.locator('#continue-journey').click();await page.waitForFunction(()=>window.__storyQA.world.journeyId==='willowback-browser');
 const go=(areaId,x,y)=>page.evaluate(([areaId,x,y])=>{const w=window.__storyQA.world;w.areaId=areaId;Object.assign(w.player,{x,y,vx:0,vy:0});},[areaId,x,y]);
 const shots=[['village',1300,760,'square-commons'],['village',450,760,'square-lodge-tower'],['village-port',870,300,'port-deck'],['village-port',870,560,'port-stairs'],['village-port',800,800,'port-pier'],
  ['village-market',770,600,'market-lantern-square'],['village-market',1400,520,'market-gate-smithy'],['village-farm',700,600,'farm-mill'],['village-farm',1200,900,'farm-fields-barn'],['village-farm',1400,1700,'farm-training-yard'],
  ['windchime',350,1000,'windchime-arch'],['windchime',1110,720,'windchime-glade'],['windchime',640,450,'windchime-fork']];
 for(const [a,x,y,name] of shots){await go(a,x,y);await page.waitForTimeout(450);await page.screenshot({path:`${out}/wb-${name}.png`});}
 await page.setViewportSize({width:390,height:844});await go('village-port',870,300);await page.waitForTimeout(400);await page.screenshot({path:`${out}/wb-port-phone.png`});
 assert.deepEqual(errors,[]);console.log('Willowback browser preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
