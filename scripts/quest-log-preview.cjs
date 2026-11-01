// Browser preview of the quest log, the journal drawer and Show on map, mid-way through the Chapter 7 dawn run,
// on a desktop window and a phone held sideways. SHOTS=<dir> for screenshots.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const out=process.env.SHOTS||'screenshots';
(async()=>{
 process.env.PORT='5191';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const errors=[];
 for(const [name,options] of [['desktop',{viewport:{width:1365,height:900}}],['phone',{viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true}]]){
  const context=await browser.newContext(options),page=await context.newPage();
  page.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message);});
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
  await page.goto('http://127.0.0.1:5191');
  // One post into the dawn run, with two side missions under way and one handed in.
  await page.evaluate(async()=>{
   const {World}=await import('/src/world.js'),{captureSave}=await import('/src/save-format.js'),{createStoryNpcs}=await import('/src/story.js'),{MARA_SPOT,CHIEF_HOUSE}=await import('/src/chief-house.js'),{IndexedSaveStore}=await import('/src/save-store.js');
   const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='quest-log-browser';w.areaId='village';
   w.story={stage:'ch7-run',run:1,lureSeen:true,photoSeen:true,scene:null,page:0,rod:true,bow:true,coreIngested:true,callAwakened:true,guide:{...MARA_SPOT,waypoint:0,areaId:CHIEF_HOUSE.id}};
   w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:330,y:390});
   Object.assign(w.quests['garden-raiders'],{status:'active',acceptedAt:0,since:{rabbit:0}});Object.assign(w.quests['harness-hides'],{status:'active',acceptedAt:0});w.quests['lucky-foot'].status='complete';
   await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:captureSave(w),writerId:null,manual:null,backups:[]}));
  });
  await page.reload();await page.locator('#continue-journey:not([disabled])').waitFor();await page.locator('#continue-journey').click();
  await page.waitForFunction(()=>window.__qa?.world?.journeyId==='quest-log-browser');await page.waitForTimeout(1500);
  const shot=file=>page.screenshot({path:`${out}/${name}-${file}.png`});
  const tracker=page.locator('#hud-tracker .hud-quest.story');
  assert.match(await tracker.innerText(),/The dawn run \(1\/8\)\. Next: the west lanes/);
  await shot('01-tracker');
  // The tracker opens the drawer beside the game.
  await tracker.click();await page.locator('#quest-drawer[open]').waitFor();await page.waitForTimeout(400);
  assert.match(await page.locator('#quest-drawer .quest-now h4').innerText(),/The dawn run/);
  await shot('02-drawer');
  await page.locator('#quest-drawer .quest-drawer-tabs button',{hasText:'Side'}).click();await page.waitForTimeout(150);
  assert.equal(await page.locator('#quest-drawer .quest-entry').count(),2);await shot('03-drawer-side');
  // The full log from the drawer.
  await page.locator('#quest-drawer .quest-drawer-full').click();await page.locator('#quest-sheet[open]').waitFor();await page.waitForTimeout(300);
  assert.equal(await page.locator('#quest-sheet').getAttribute('data-mode'),'log');
  await shot('04-log-side');
  await page.locator('.quest-tab',{hasText:'Story'}).click();await page.waitForTimeout(200);
  assert.equal(await page.locator('.quest-banner h3').innerText(),'Legs');await shot('05-log-story');
  await page.locator('.quest-tab',{hasText:'Done'}).click();await page.waitForTimeout(200);await shot('06-log-done');
  await page.locator('.quest-tab',{hasText:'Story'}).click();await page.waitForTimeout(200);
  // Show on map: the area map opens with the posts and the next one marked.
  await page.locator('#quest-sheet .quest-map').click();await page.locator('#world-atlas:not([hidden])').waitFor();await page.waitForTimeout(700);
  await shot('07-show-on-map');
  await page.locator('#close-atlas').click();await page.waitForTimeout(200);
  assert.equal(await page.locator('#world-atlas').isHidden(),true);
  // Breakfast: from the village, the target is the chief's house door.
  await page.evaluate(()=>{const w=window.__qa.world;w.story.stage='ch7-breakfast';delete w.story.run;Object.assign(w.player,{x:520,y:600});});await page.waitForTimeout(400);
  assert.match(await tracker.innerText(),/Breakfast with Mara\. Next: the chief’s house door/);await shot('08-tracker-breakfast');
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log('Quest log preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
