// Browser preview of Chapter 7: the wake-up call, the dawn run past the guard posts, sunrise at the watchtower,
// breakfast, the squat in the training circle, the second run and the grass behind the lodge. SHOTS=<dir> for screenshots.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const out=process.env.SHOTS||'screenshots';
(async()=>{
 process.env.PORT='5188';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message,e.stack);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5188');
 // A journey at the end of Chapter 6, standing by the bed.
 await page.evaluate(async()=>{
  const {World}=await import('/src/world.js'),{captureSave}=await import('/src/save-format.js'),{createStoryNpcs}=await import('/src/story.js'),{GUEST_LODGE,LODGE_BED}=await import('/src/guest-lodge.js'),{MARA_SPOT,CHIEF_HOUSE}=await import('/src/chief-house.js'),{IndexedSaveStore}=await import('/src/save-store.js');
  const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='chapter7-browser';w.areaId=GUEST_LODGE.id;
  w.story={stage:'ch6-complete',lureSeen:true,photoSeen:true,scene:null,page:0,rod:true,bow:true,coreIngested:true,callAwakened:true,guide:{...MARA_SPOT,waypoint:0,areaId:CHIEF_HOUSE.id}};
  w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:LODGE_BED.x+76,y:LODGE_BED.y+30});
  await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:captureSave(w),writerId:null,manual:null,backups:[]}));
 });
 await page.reload();await page.locator('#continue-journey:not([disabled])').waitFor();await page.locator('#continue-journey').click();await page.waitForFunction(()=>window.__storyQA.world.journeyId==='chapter7-browser');
 const q=(fn,arg)=>page.evaluate(fn,arg);
 const stage=()=>q(()=>window.__storyQA.world.story.stage);
 const next=async()=>{await page.locator('#story-next:not([disabled])').waitFor();await page.locator('#story-next').click();await page.waitForTimeout(60);};
 const until=async(test,max=60)=>{for(let i=0;i<max;i++){await page.locator('#story-next:not([disabled])').waitFor();const t=(await page.locator('#story-title').innerText())+' | '+(await page.locator('#story-text').innerText());if(test.test(t))return page.waitForTimeout(250);await next();}throw Error('Never reached '+test);};
 const finishScene=async()=>{const s=await q(()=>window.__storyQA.world.story.scene);while(await q(()=>window.__storyQA.world.story.scene)===s)await next();await page.waitForTimeout(300);};
 const stand=(x,y)=>q(([x,y])=>Object.assign(window.__storyQA.world.player,{x,y,vx:0,vy:0}),[x,y]);
 const {PERIMETER,REST_SPOT}=await q(async()=>{const m=await import('/src/chapter7.js');return {PERIMETER:m.PERIMETER,REST_SPOT:m.REST_SPOT};});
 const post=(i,dx=0,dy=0)=>q(([p,dx,dy])=>{const w=window.__storyQA.world;w.areaId=p.areaId;Object.assign(w.player,{x:p.x+dx,y:p.y+dy,vx:0,vy:0});},[PERIMETER[i],dx,dy]);
 await page.waitForTimeout(500);
 await page.keyboard.press('Space');await until(/\| Up\./);assert.equal(await page.locator('#story-name').innerText(),'Drayfus');await page.screenshot({path:`${out}/01-up.png`});
 await until(/Reserves: recovering/);await page.waitForTimeout(800);await page.screenshot({path:`${out}/02-reserves.png`});
 await finishScene();assert.equal(await stage(),'ch7-run');assert.equal(await q(()=>window.__storyQA.world.areaId),'village');
 await page.waitForTimeout(400);await page.screenshot({path:`${out}/03-dark-start.png`});
 await post(0);await page.waitForTimeout(400);await page.screenshot({path:`${out}/04-first-guard.png`});
 for(let i=1;i<6;i++){await post(i);await page.waitForTimeout(200);}
 await post(6);await page.waitForTimeout(300);
 await post(7,-90+120,20);await page.waitForTimeout(500);await page.screenshot({path:`${out}/05-watchtower.png`});
 await post(7);await until(/Did you throw up\?/);await page.screenshot({path:`${out}/06-sunrise-mara.png`});
 await finishScene();assert.equal(await stage(),'ch7-breakfast');
 // Breakfast in the chief's kitchen.
 await q(async()=>{const {CHIEF_HOUSE}=await import('/src/chief-house.js');const w=window.__storyQA.world;w.areaId=CHIEF_HOUSE.id;const m=w.npcs.find(n=>n.id==='mara');Object.assign(w.player,{x:m.x,y:m.y+30});});
 await page.waitForTimeout(300);await page.keyboard.press('Space');await until(/You’re a mess/);await page.screenshot({path:`${out}/07-breakfast.png`});
 await finishScene();assert.equal(await stage(),'ch7-squat');
 await q(async()=>{const {TRAINING_GROUND,DRAYFUS_SPOT}=await import('/src/training-ground.js');const w=window.__storyQA.world;w.areaId=TRAINING_GROUND.id;Object.assign(w.player,{x:DRAYFUS_SPOT.x,y:DRAYFUS_SPOT.y+50});});
 await page.waitForTimeout(300);await page.keyboard.press('Space');await finishScene();assert.equal(await stage(),'ch7-hold');
 await page.waitForTimeout(8000);await page.screenshot({path:`${out}/08-holding-squat.png`});
 assert.ok(await q(()=>window.__storyQA.world.story.hold)>6);
 await page.waitForFunction(()=>window.__storyQA.world.story.scene==='ch7-cat',null,{timeout:20000});
 await until(/my grandmother/);await page.screenshot({path:`${out}/09-grandmother.png`});
 await finishScene();assert.equal(await stage(),'ch7-laps');
 for(let i=0;i<8;i++){await post(i);await page.waitForTimeout(200);}
 assert.equal(await stage(),'ch7-rest');
 await q(()=>{window.__storyQA.world.areaId='village';});await stand(REST_SPOT.x,REST_SPOT.y);await page.waitForTimeout(300);await page.screenshot({path:`${out}/10-grass.png`});
 await page.keyboard.press('Space');await until(/Then who\?/);await page.screenshot({path:`${out}/11-then-who.png`});
 await until(/Still Water/);await page.waitForTimeout(800);await page.screenshot({path:`${out}/12-still-water.png`});
 await finishScene();assert.equal(await stage(),'ch7-complete');await page.screenshot({path:`${out}/13-complete.png`});
 assert.deepEqual(errors,[]);console.log('Chapter 7 browser preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
