// Local integration preview; the QA bridge exists only in the intercepted browser response.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5181';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5181');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const next=async()=>{await page.locator('#story-next').click();};
 const go=async(areaId,x,y)=>{await page.evaluate(({areaId,x,y})=>{const w=window.__storyQA.world;w.areaId=areaId;Object.assign(w.player,{x,y});},{areaId,x,y});};
 const inspect=async()=>{await page.keyboard.press('KeyG');await page.waitForTimeout(300);};
 await page.screenshot({path:'screenshots/chapter1-arrival.png'});await next();await next();
 await go('landing',1630,1560);await page.waitForTimeout(300);await page.screenshot({path:'screenshots/chapter1-cabin.png'});await inspect();
 assert.equal(await page.evaluate(()=>window.__storyQA.world.areaId),'cabin');
 await page.screenshot({path:'screenshots/chapter1-interior.png'});
 await go('cabin',520,150);await inspect();await page.locator('#story-image').evaluate(img=>img.decode());
 await page.screenshot({path:'screenshots/chapter1-lure.png'});await next();await next();
 await go('cabin',110,270);await inspect();await next();await next();
 // Exercise actual casting and catch completion, without waiting for a manual reel.
 await go('landing',1250,1850);
 await page.evaluate(()=>{const w=window.__storyQA.world;w.cast({x:1250,y:2000});w.fishing.state='caught';w.fishing.result={name:'Old Boot'};w.advanceFishing(w.player,0,false);});
 await go('cabin',100,120);await inspect();await next();await go('cabin',435,330);await inspect();
 await next();await next();await next();await next();
 await page.locator('#story-image').evaluate(img=>img.decode());await page.waitForTimeout(250);
 await page.screenshot({path:'screenshots/chapter1-rescue.png'});
 // Resume the middle of a cutscene via the normal Continue button.
 await page.waitForTimeout(500);await page.reload();await page.locator('#continue-journey:not([disabled])').waitFor();await page.locator('#continue-journey').click();
 await page.locator('#story-title').filter({hasText:'Out of the darkness'}).waitFor();
 await next();await next();await page.locator('#story-image').evaluate(img=>img.decode());
 await page.screenshot({path:'screenshots/chapter1-awakening.png'});await next();await next();
 assert.equal(await page.evaluate(()=>window.__storyQA.world.story.stage),'complete');await page.waitForTimeout(300);
 await page.screenshot({path:'screenshots/chapter1-aftermath.png'});await page.keyboard.press('KeyM');await page.screenshot({path:'screenshots/chapter1-map.png'});await page.keyboard.press('KeyM');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{const w=window.__storyQA.world;w.story.scene='awakening';w.story.page=0;});
 await page.locator('#story-scene[open]').waitFor();await page.screenshot({path:'screenshots/chapter1-mobile.png'});
 const box=await page.locator('#story-next').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390&&box.y+box.height<=844);
 assert.deepEqual(errors,[]);console.log('Chapter 1 browser preview passed: scenes, images, cooking, resume, aftermath, map, mobile.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
