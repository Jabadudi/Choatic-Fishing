const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5184';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5184');
 await page.evaluate(async()=>{
  const {World}=await import('/src/world.js'),{captureSave}=await import('/src/save-format.js'),{GUIDE_ROUTE,createStoryNpcs}=await import('/src/story.js'),{IndexedSaveStore}=await import('/src/save-store.js');
  const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='chapter3-browser';
  w.story={stage:'ch2-complete',lureSeen:true,photoSeen:true,scene:null,page:0,guide:{...GUIDE_ROUTE.at(-1),waypoint:GUIDE_ROUTE.length}};
  w.npcs=createStoryNpcs(w.story);Object.assign(w.player,{x:1390,y:1450});w.inventory.receive({name:'Mysterious Lure',category:'quest-items'});
  const save=captureSave(w);save.version=3;await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:save,writerId:null,manual:null,backups:[]}));
 });
 const resume=async()=>{await page.reload();await page.locator('#continue-journey:not([disabled])').waitFor();await page.locator('#continue-journey').click();await page.waitForFunction(()=>window.__storyQA.world.journeyId==='chapter3-browser');};
 const next=async(n=1)=>{for(let i=0;i<n;i++)await page.locator('#story-next').click();};
 // Scenes have one page per speaker, so finish them by state rather than by click count.
 const finish=async()=>{const scene=await page.evaluate(()=>window.__storyQA.world.story.scene);for(let i=0;i<60&&await page.evaluate(k=>window.__storyQA.world.story.scene===k,scene);i++){await next();await page.waitForTimeout(40);}};
 const inspect=async()=>{await page.keyboard.press('KeyG');await page.waitForTimeout(250);};
 const follow=async()=>{await page.evaluate(async()=>{const w=window.__storyQA.world,{neutralInput}=await import('/src/protocol.js'),{chapter3Route}=await import('/src/chapter3.js');let i=0;while(!w.story.scene&&w.story.guide.waypoint<chapter3Route(w.story).length&&i++<10000){const n=w.npcs.find(n=>n.id==='mara');Object.assign(w.player,{x:n.x,y:n.y+20});w.update(1/30,neutralInput());}w.update(1/30,neutralInput());if(i>=10000)throw Error('Guide route did not finish');});await page.waitForTimeout(300);};
 await resume();await inspect();assert.match(await page.locator('#story-chapter').innerText(),/CHAPTER 3/);await next();await follow();
 await page.locator('#story-title').filter({hasText:'Three hollow notes'}).waitFor();await page.screenshot({path:'screenshots/chapter3-chimes.png'});await finish();
 for(const area of ['landing','windchime','crossroads']){
  await follow();await page.evaluate(area=>{const w=window.__storyQA.world;if(area==='crossroads'){Object.assign(w.player,{x:1,y:460});w.move(-8,0,false);}else{Object.assign(w.player,{x:area==='landing'?1400:600,y:1});w.move(0,-8,false);}},area);
  await page.waitForTimeout(400);
  if(area==='landing'){await page.screenshot({path:'screenshots/chapter3-forest.png'});await resume();assert.equal(await page.evaluate(()=>window.__storyQA.world.story.guide.areaId),'windchime');}
 }
 await follow();await page.locator('#story-title').filter({hasText:'Willowback Village'}).waitFor();await page.screenshot({path:'screenshots/chapter3-arrival.png'});await finish();await follow();
 await page.screenshot({path:'screenshots/chapter3-creatures-in-world.png'});await inspect();await page.locator('#story-title').filter({hasText:'The guardian at the door'}).waitFor();await page.waitForTimeout(450);await page.screenshot({path:'screenshots/chapter3-rimejaw.png'});
 await next();await page.waitForTimeout(400);await page.screenshot({path:'screenshots/chapter3-flitlynx.png'});await page.waitForTimeout(400);await resume();await page.locator('#story-title').filter({hasText:'Something on the roof'}).waitFor();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'screenshots/chapter3-mobile.png'});const button=await page.locator('#story-next').boundingBox();assert.ok(button.x>=0&&button.x+button.width<=390&&button.y+button.height<=844);
 await page.setViewportSize({width:1365,height:900});await finish();await inspect();await next();await page.screenshot({path:'screenshots/chapter3-history.png'});await finish();await follow();await page.locator('#story-title').filter({hasText:'The red house'}).waitFor();await finish();await page.waitForTimeout(300);
 assert.equal(await page.evaluate(()=>window.__storyQA.world.story.stage),'ch3-complete');assert.equal(await page.evaluate(()=>window.__storyQA.world.npcs.length),9);
 await page.screenshot({path:'screenshots/chapter3-chief-house.png'});await page.keyboard.press('KeyM');await page.waitForTimeout(300);await page.screenshot({path:'screenshots/chapter3-map.png'});
 assert.deepEqual(errors,[]);console.log('Chapter 3 browser preview passed: version 3 Continue, guide across three exits, forest resume, village, sprite artwork, mobile, creature-page resume, lore and chief’s house.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
