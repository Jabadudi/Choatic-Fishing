// Local integration preview of the Wishing Well: open from the start, both pools, buying a stone and the phone layout.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5191';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},get well(){return wellUI;}};'});});
 await page.goto('http://127.0.0.1:5191');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const shot=name=>page.screenshot({path:`${out}/${name}.png`});
 const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
 // The well is open from the very start of a new journey, with its starting stones and its HUD button.
 await page.waitForTimeout(300);
 assert.equal(await w(()=>__qa.world.well.awake),true);assert.equal(await w(()=>__qa.world.well.stones),38);
 assert.equal(await page.locator('#hud-well').isVisible(),true);await shot('00a-well-from-start');
 // Jump to the morning after Chapter 5 on Willow Commons, beside the well, having met a deer and an eel.
 await w(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch5-morning';v.story.scene=null;v.story.lureSeen=v.story.photoSeen=true;v.areaId='village';v.npcs=createStoryNpcs(v.story,v.elapsed);
  v.codex.add('deer');v.codex.add('eel');v.inventory.marks=95;Object.assign(v.player,{x:1000,y:628});});
 await page.waitForTimeout(500);
 // Jumping ahead pays for the finished chapters; start the draws from a round ten.
 assert.ok(await w(()=>__qa.world.well.stones)>38);await w(()=>{__qa.world.well.stones=10;});
 assert.match(await page.locator('#inspect-place').textContent(),/Look into the Wishing Well/);await shot('00-well-prompt');
 await w(()=>__qa.world.inspect());await page.locator('#well-sheet[open]').waitFor();await page.waitForTimeout(300);
 assert.equal(await page.locator('.well-tab[aria-selected="true"]').textContent(),'Artifact pool');await shot('01-well-open');
 // The details page: odds per rarity, every prize with its own chance, and the pity rules, for each pool.
 await page.locator('.well-details-toggle').click();await page.locator('.well-details:not([hidden])').waitFor();
 assert.equal(await page.locator('.well-details tbody tr').count(),10);assert.match(await page.locator('.well-details').textContent(),/0\.2%.*draw 70 is always Legendary/s);
 await shot('01a-well-rates-artifacts');
 await page.locator('.well-tab[data-pool="familiars"]').click();await page.waitForTimeout(150);assert.match(await page.locator('.well-details').textContent(),/Not met yet/);await shot('01b-well-rates-familiars');
 await page.locator('.well-tab[data-pool="artifacts"]').click();await page.locator('.well-details-toggle').click();assert.equal(await page.locator('.well-details').isHidden(),true);
 await page.locator('.well-draw[data-count="10"]').click();
 // The summon plays first: Eli at the well, then the cavern with fish, and the cards only after it ends or is skipped.
 await page.locator('.well-summon:not([hidden])').waitFor();assert.equal(await page.locator('.well-card').count(),0);
 await page.waitForTimeout(900);await shot('02a-summon-throw');await page.waitForTimeout(4200);await shot('02b-summon-fish');
 await page.locator('.well-skip').click();await page.waitForTimeout(700);
 assert.equal(await page.locator('.well-summon').isHidden(),true);
 assert.equal(await page.locator('.well-card').count(),10);assert.equal(await w(()=>__qa.world.well.stones),0);
 assert.ok(await page.locator('.well-card[data-rarity="rare"],.well-card[data-rarity="epic"],.well-card[data-rarity="legendary"]').count()>=1);
 await shot('02-artifact-ten-draw');
 await page.locator('.well-buy').click();await page.locator('.well-buy').click();await page.waitForTimeout(150);
 assert.equal(await w(()=>__qa.world.well.stones),2);assert.equal(await w(()=>__qa.world.inventory.marks),15);
 assert.equal(await page.locator('.well-buy').isDisabled(),true);
 await page.locator('.well-tab[data-pool="familiars"]').click();await page.waitForTimeout(150);
 assert.equal(await page.locator('.well-card').count(),0);
 for(let i=0;i<2;i++){await page.locator('.well-draw[data-count="1"]').click();await page.waitForTimeout(300);await page.locator('.well-skip').click();await page.waitForTimeout(300);}
 assert.equal(await page.locator('.well-card').count(),1);
 const shards=await w(()=>Object.values(__qa.world.familiars.shards).reduce((a,b)=>a+b,0));assert.ok(shards>=2);
 await shot('03-familiar-draw');
 await page.keyboard.press('Escape');await page.waitForTimeout(200);assert.equal(await w(()=>__qa.well.open),false);
 await page.locator('#open-backpack').click();await page.locator('#backpack[open]').waitFor();await page.waitForTimeout(200);
 await page.locator('#backpack .backpack-close').click();await page.waitForTimeout(200);
 await w(()=>{__qa.world.well.stones=10;});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 await w(()=>__qa.world.inspect());await page.locator('#well-sheet[open]').waitFor();await page.locator('.well-draw[data-count="10"]').click();await page.waitForTimeout(6000);await shot('04a-summon-mobile');await page.locator('.well-skip').click();await page.waitForTimeout(700);await shot('04-well-mobile');
 await page.locator('.well-details-toggle').click();await page.waitForTimeout(150);await page.locator('.well-details h3').nth(2).scrollIntoViewIfNeeded();await shot('04b-well-rates-mobile');
 await page.keyboard.press('Escape');await page.waitForTimeout(200);
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(300);
 await w(()=>{__qa.world.well.stones=1;__qa.world.inspect();});await page.locator('#well-sheet[open]').waitFor();await page.waitForTimeout(300);await shot('05-well-phone-landscape');
 await page.locator('.well-tab[data-pool="artifacts"]').click();await page.locator('.well-draw[data-count="1"]').click();await page.waitForTimeout(1000);await shot('05a-summon-phone-landscape');
 // Closing the window mid-summon stops it; the stone is already spent and the artifact already in the backpack.
 await page.keyboard.press('Escape');await page.waitForTimeout(200);assert.equal(await w(()=>__qa.well.summoning),false);assert.equal(await w(()=>__qa.world.well.stones),0);
 assert.deepEqual(errors,[]);console.log('Well preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
