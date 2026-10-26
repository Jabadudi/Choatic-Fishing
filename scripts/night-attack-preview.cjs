const {chromium}=require('playwright'),assert=require('node:assert/strict');
// Captures the storm escape, the shadow walker's approach and Moonfang's rescue on the shore.
(async()=>{
 process.env.PORT='5187';await import('../server.mjs');const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5187');
 await page.evaluate(async()=>{const {World}=await import('/src/world.js'),{captureSave}=await import('/src/save-format.js'),{IndexedSaveStore}=await import('/src/save-store.js');const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='night-attack';w.areaId='cabin';Object.assign(w.player,{x:435,y:330});Object.assign(w.story,{stage:'storm',scene:'storm',page:2,lureSeen:true,photoSeen:true});await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:captureSave(w),writerId:null,manual:null,backups:[]}));});
 await page.reload();await page.locator('#continue-journey:not([disabled])').click();
 const shot=async name=>page.screenshot({path:`screenshots/night-attack-${name}.png`});
 await page.waitForFunction(()=>window.__storyQA.world.areaId==='landing');await page.waitForTimeout(250);await shot('1-walker-at-cabin');
 await page.waitForFunction(()=>window.__storyQA.world.story.page===3);await page.waitForTimeout(1500);await shot('2-approach');
 await page.waitForTimeout(1700);await shot('3-axe-raised');
 await page.waitForFunction(()=>window.__storyQA.world.story.page===4);await page.evaluate(async()=>{window.__action=await import('/src/story-action.js');});
 const at=async t=>{await page.waitForFunction(t=>window.__action.storyActionElapsed(window.__storyQA.world)>=t,t);await page.keyboard.press('F10');};
 const resume=()=>page.keyboard.press('F10');
 // Settings pauses the simulation, so each pose is captured at a fixed point on the fight's clock.
 for(const [t,name] of [[.6,'4-moonfang-charge'],[1.2,'5-leap'],[2.2,'6-defeat'],[3.2,'7-howl']]){await at(t);await page.locator('#settings-menu').waitFor();await page.evaluate(()=>document.querySelector('#settings-menu').style.visibility='hidden');await shot(name);await page.evaluate(()=>document.querySelector('#settings-menu').style.visibility='');await resume();}
 assert.equal(await page.locator('#story-scene').isVisible(),false);
 await page.waitForSelector('#story-scene[open]');await page.waitForTimeout(1600);await shot('8-rescue-art');
 await page.waitForFunction(()=>window.__storyQA.world.story.scene==='awakening');
 assert.deepEqual(errors,[]);console.log('Night attack preview captured.');await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
