const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5191';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5191');
 await page.evaluate(async()=>{
  const {World}=await import('/src/world.js'),{captureSave}=await import('/src/save-format.js'),{createStoryNpcs}=await import('/src/story.js'),{IndexedSaveStore}=await import('/src/save-store.js');
  const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='cutscene-once';
  w.story={stage:'complete',lureSeen:true,photoSeen:true,scene:null,page:0,guide:null,rod:true,bow:true};
  w.npcs=createStoryNpcs(w.story);const girl=w.npcs.find(n=>n.id==='mara');Object.assign(w.player,{x:girl.x,y:girl.y+30});w.inventory.receive({name:'Mysterious Lure',category:'quest-items'});
  await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:captureSave(w),writerId:null,manual:null,backups:[]}));
 });
 await page.reload();await page.locator('#continue-journey:not([disabled])').waitFor();await page.locator('#continue-journey').click();
 await page.waitForFunction(()=>window.__storyQA.world.journeyId==='cutscene-once');
 const shot=name=>page.screenshot({path:`screenshots/cutscene-once-${name}.png`});
 const visible=id=>page.locator('#'+id).isVisible();
 const talk=async()=>{await page.keyboard.press('KeyG');await page.waitForTimeout(300);};
 // First conversation: the campfire artwork plays as a cutscene.
 await talk();await page.waitForTimeout(2000);await shot('01-first-talk-art');
 assert.ok(await visible('story-skip'));assert.ok(!await visible('story-admire'));
 await page.locator('#story-skip').click();await page.waitForTimeout(600);await shot('02-dialogue-with-admire');assert.ok(await visible('story-admire'));
 const scene=await page.evaluate(()=>window.__storyQA.world.story.scene);
 for(let i=0;i<40&&await page.evaluate(k=>window.__storyQA.world.story.scene===k,scene);i++){await page.locator('#story-next').click();await page.waitForTimeout(60);}
 // Second conversation: straight to the dialogue box.
 await talk();await page.waitForTimeout(300);await shot('03-second-talk-dialogue');
 assert.ok(!await visible('story-skip'));assert.ok(await visible('story-admire'));assert.ok(await page.locator('#story-scene .dialogue-box').isVisible());
 assert.equal(await page.locator('#story-scene .cutscene-picture').evaluate(e=>e.hidden||getComputedStyle(e).opacity==='0'),true);
 await page.locator('#story-admire').click();await page.waitForTimeout(2000);await shot('04-admire-art');assert.ok(await visible('story-skip'));
 await page.locator('#story-skip').click();await page.waitForTimeout(600);
 // Chapter 3 creatures: each illustration shows once, then the dialogue box.
 await page.evaluate(async()=>{const {drawEntitySprite}=await import('/src/sprites.js'),c=document.createElement('canvas').getContext('2d');for(let i=0;i<100&&!['rimejaw-illustration','flitlynx-illustration'].every(id=>drawEntitySprite(c,id));i++)await new Promise(r=>setTimeout(r,100));});
 await page.evaluate(()=>{const w=window.__storyQA.world;w.story.scene='ch3-beasts';w.story.page=0;w.storySuspended=false;});
 await page.locator('#story-title').filter({hasText:'The guardian at the door'}).waitFor({state:'attached'});await page.locator('#story-skip').waitFor();await page.waitForTimeout(1500);await shot('05-rimejaw-first');
 await page.locator('#story-skip').click();await page.waitForTimeout(600);await page.locator('#story-next').click();await page.locator('#story-skip').waitFor();await page.waitForTimeout(1500);await shot('06-flitlynx-first');
 await page.locator('#story-skip').click();await page.waitForTimeout(600);await page.locator('#story-next').click();await page.waitForTimeout(400);
 await shot('07-rimejaw-again-dialogue');assert.ok(!await visible('story-skip'));assert.ok(await visible('story-admire'));
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(300);await shot('08-phone-landscape');
 assert.deepEqual(errors,[]);console.log('Cutscene-once preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
