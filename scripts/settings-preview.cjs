const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5185';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5185');await page.locator('#open-settings').click();
 await page.locator('#settings-music-volume').fill('17');await page.locator('#settings-sfx-volume').fill('64');
 assert.equal(await page.evaluate(async()=> (await import('/src/music.js')).musicState().volume),.17);
 await page.locator('#settings-dialogue-tab').click();
 for(const id of ['hearthwood','mossy-stone','field-journal','lantern-night','meadow-banner','quiet-hud']){await page.locator(`[data-theme="${id}"]`).click();assert.equal(await page.locator('html').getAttribute('data-dialogue-theme'),id);}
 await page.locator('[data-theme="hearthwood"]').click();await page.screenshot({path:'screenshots/settings-dialogue.png'});
 await page.setViewportSize({width:390,height:844});
 for(const id of ['hearthwood','mossy-stone','field-journal','lantern-night','meadow-banner','quiet-hud']){await page.locator(`[data-theme="${id}"]`).click();await page.locator('#settings-preview-next').scrollIntoViewIfNeeded();const b=await page.locator('#settings-preview-next').boundingBox();assert.ok(b.x>=0&&b.x+b.width<=390,`${id} mobile width`);}
 await page.screenshot({path:'screenshots/settings-mobile.png'});await page.reload();assert.equal(await page.locator('html').getAttribute('data-dialogue-theme'),'quiet-hud');
 await page.setViewportSize({width:1365,height:900});
 await page.evaluate(async()=>{const {World}=await import('/src/world.js'),{captureSave}=await import('/src/save-format.js'),{IndexedSaveStore}=await import('/src/save-store.js');const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='settings-browser';w.story.scene='photo';w.story.page=0;const save=captureSave(w);await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:save,writerId:null,manual:null,backups:[]}));});
 await page.reload();await page.locator('#continue-journey:not([disabled])').click();await page.waitForFunction(()=>document.querySelector('#story-scene')?.dataset.phase==='art');
 assert.equal(await page.locator('#story-next').isDisabled(),true);await page.screenshot({path:'screenshots/cutscene-fullscreen.png'});
 await page.waitForFunction(()=>document.querySelector('#story-scene')?.dataset.phase==='dialogue');await page.locator('#story-next:not([disabled])').waitFor();
 await page.locator('#story-settings').click();await page.locator('#settings-dialogue-tab').click();await page.locator('[data-theme="lantern-night"]').click();await page.locator('#close-settings').click();await page.screenshot({path:'screenshots/dialogue-lantern.png'});
 await page.locator('#story-next').click();assert.equal(await page.evaluate(()=>window.__storyQA.world.story.page),1);await page.locator('#story-previous').click();assert.equal(await page.evaluate(()=>window.__storyQA.world.story.page),1);assert.equal(await page.locator('#story-page').innerText(),'1 / 2');
 await page.locator('#story-close').click();assert.equal(await page.evaluate(()=>window.__storyQA.world.storySuspended),true);await page.keyboard.press('KeyG');await page.locator('#story-scene[open]').waitFor();await page.waitForFunction(()=>document.querySelector('#story-page').textContent==='2 / 2');
 await page.locator('#story-skip').click();await page.keyboard.press('F10');await page.locator('#settings-menu[open]').waitFor();await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);console.log('Settings browser checks passed: six skins, audio separation, persistence, mobile, cutscene timing, live switching, previous and resume.');await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});

