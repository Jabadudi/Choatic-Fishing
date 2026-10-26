const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5186';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message,e.stack);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5186');
 await page.evaluate(async()=>{
  const {World}=await import('/src/world.js'),{captureSave}=await import('/src/save-format.js'),{createStoryNpcs}=await import('/src/story.js'),{MARA_SPOT,CHIEF_HOUSE}=await import('/src/chief-house.js'),{IndexedSaveStore}=await import('/src/save-store.js');
  const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='chapter5-browser';w.areaId=CHIEF_HOUSE.id;
  w.story={stage:'ch4-complete',lureSeen:true,photoSeen:true,scene:null,page:0,guide:{...MARA_SPOT,waypoint:0,areaId:CHIEF_HOUSE.id}};
  w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:MARA_SPOT.x,y:MARA_SPOT.y+40});w.inventory.receive({name:'Region Core',category:'quest-items'});
  await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:captureSave(w),writerId:null,manual:null,backups:[]}));
 });
 const resume=async()=>{await page.reload();await page.locator('#continue-journey:not([disabled])').waitFor();await page.locator('#continue-journey').click();await page.waitForFunction(()=>window.__storyQA.world.journeyId==='chapter5-browser');};
 const stage=()=>page.evaluate(()=>window.__storyQA.world.story.stage);
 const next=async()=>{await page.locator('#story-next:not([disabled])').waitFor();await page.locator('#story-next').click();await page.waitForTimeout(80);};
 const until=async(text,max=40)=>{for(let i=0;i<max;i++){await page.locator('#story-next:not([disabled])').waitFor();if((await page.locator('#story-title').innerText()).includes(text))return page.waitForTimeout(300);await next();}throw Error('Never reached '+text);};
 const stand=(x,y)=>page.evaluate(([x,y])=>Object.assign(window.__storyQA.world.player,{x,y}),[x,y]);
 await resume();await page.waitForTimeout(400);
 await page.keyboard.press('KeyG');await until('The guest lodge');assert.match(await page.locator('#story-chapter').innerText(),/CHAPTER 5/);
 await until('Bed. Window.');assert.equal(await page.locator('#story-name').innerText(),'Mara');await page.screenshot({path:'screenshots/chapter5-tour.png'});
 while(await stage()==='ch5-tour')await next();
 await page.waitForTimeout(400);await page.screenshot({path:'screenshots/chapter5-room-night.png'});
 await stand(172,235);await page.waitForTimeout(200);await page.keyboard.press('KeyG');
 await until('Counting sheep');await page.screenshot({path:'screenshots/chapter5-sheep.png'});
 for(let i=0;i<30&&!(await page.locator('.cutscene-video:not([hidden])').count());i++)await next();
 // The vision plays full screen with the dialogue hidden, and the music steps aside.
 await page.waitForFunction(()=>{const v=document.querySelector('#story-video');return v.currentTime>1&&!v.paused;},null,{timeout:15000});
 assert.equal(await page.locator('#story-scene .dialogue-box').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 await page.screenshot({path:'screenshots/chapter5-vision.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await page.screenshot({path:'screenshots/chapter5-vision-mobile.png'});
 const skip=await page.locator('#story-video-skip').boundingBox();assert.ok(skip.x>=0&&skip.x+skip.width<=390&&skip.y+skip.height<=844);
 await page.setViewportSize({width:1365,height:900});
 // Settings pauses the video.
 await page.locator('#story-settings').click();await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.querySelector('#story-video').paused),true);
 await page.keyboard.press('Escape');await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.querySelector('#story-video').paused),false);
 // The page turns by itself when the video ends.
 await page.evaluate(()=>{const v=document.querySelector('#story-video');v.currentTime=v.duration-.5;});
 await page.locator('#story-title').filter({hasText:'Bang. Bang. Bang.'}).waitFor({timeout:10000});
 assert.equal(await page.locator('.cutscene-video').isHidden(),true);
 await until('Bang. Bang. Bang.');while(!(await page.locator('#story-text').innerText()).includes('Wake up'))await next();
 await page.screenshot({path:'screenshots/chapter5-knock.png'});
 while(await stage()==='ch5-sleep')await next();
 await page.waitForTimeout(400);await page.screenshot({path:'screenshots/chapter5-room-morning.png'});
 assert.equal(await stage(),'ch5-morning');
 await resume();assert.equal(await stage(),'ch5-morning');
 await stand(280,380);await page.keyboard.down('KeyS');await page.waitForFunction(()=>window.__storyQA.world.areaId==='village',null,{timeout:5000});await page.keyboard.up('KeyS');
 const mara=await page.evaluate(()=>{const n=window.__storyQA.world.npcs.find(n=>n.id==='mara');return {x:n.x,y:n.y,area:n.areaId};});assert.equal(mara.area,'village');
 await stand(mara.x-30,mara.y+20);await page.waitForTimeout(300);await page.keyboard.press('KeyG');await page.waitForTimeout(500);
 assert.match(await page.locator('#story-text').innerText(),/sleepyhead/);await page.screenshot({path:'screenshots/chapter5-mara-outside.png'});
 assert.deepEqual(errors,[]);console.log('Chapter 5 browser preview passed: lodge tour, night room, sleep, full-screen vision video (settings pause, auto-advance), Mara knocking, morning resume and Mara outside.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
