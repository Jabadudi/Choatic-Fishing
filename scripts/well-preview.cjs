// Local integration preview of the Wishing Well: waking after Chapter 5, both pools, buying a stone and the phone layout.
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
 // Jump to the morning after Chapter 5 on Willow Commons, beside the well, having met a deer and an eel.
 await w(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch5-morning';v.story.scene=null;v.story.lureSeen=v.story.photoSeen=true;v.areaId='village';v.npcs=createStoryNpcs(v.story,v.elapsed);
  v.codex.add('deer');v.codex.add('eel');v.inventory.marks=95;Object.assign(v.player,{x:1000,y:628});});
 await page.waitForTimeout(500);
 assert.equal(await w(()=>__qa.world.well.awake),true);assert.equal(await w(()=>__qa.world.well.stones),10);
 assert.match(await page.locator('#inspect-place').textContent(),/Look into the Wishing Well/);await shot('00-well-prompt');
 await w(()=>__qa.world.inspect());await page.locator('#well-sheet[open]').waitFor();await page.waitForTimeout(300);
 assert.equal(await page.locator('.well-tab[aria-selected="true"]').textContent(),'Artifact pool');await shot('01-well-open');
 await page.locator('.well-draw[data-count="10"]').click();await page.waitForTimeout(700);
 assert.equal(await page.locator('.well-card').count(),10);assert.equal(await w(()=>__qa.world.well.stones),0);
 assert.ok(await page.locator('.well-card[data-rarity="rare"],.well-card[data-rarity="epic"],.well-card[data-rarity="legendary"]').count()>=1);
 await shot('02-artifact-ten-draw');
 await page.locator('.well-buy').click();await page.locator('.well-buy').click();await page.waitForTimeout(150);
 assert.equal(await w(()=>__qa.world.well.stones),2);assert.equal(await w(()=>__qa.world.inventory.marks),15);
 assert.equal(await page.locator('.well-buy').isDisabled(),true);
 await page.locator('.well-tab[data-pool="familiars"]').click();await page.waitForTimeout(150);
 assert.equal(await page.locator('.well-card').count(),0);
 await page.locator('.well-draw[data-count="1"]').click();await page.locator('.well-draw[data-count="1"]').click();await page.waitForTimeout(600);
 assert.equal(await page.locator('.well-card').count(),1);
 const shards=await w(()=>Object.values(__qa.world.familiars.shards).reduce((a,b)=>a+b,0));assert.ok(shards>=2);
 await shot('03-familiar-draw');
 await page.keyboard.press('Escape');await page.waitForTimeout(200);assert.equal(await w(()=>__qa.well.open),false);
 await page.locator('#open-backpack').click();await page.locator('#backpack[open]').waitFor();await page.waitForTimeout(200);
 await page.locator('#backpack .backpack-close').click();await page.waitForTimeout(200);
 await w(()=>{__qa.world.well.stones=10;});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 await w(()=>__qa.world.inspect());await page.locator('#well-sheet[open]').waitFor();await page.locator('.well-draw[data-count="10"]').click();await page.waitForTimeout(700);await shot('04-well-mobile');
 await page.keyboard.press('Escape');await page.waitForTimeout(200);
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(300);
 await w(()=>{__qa.world.well.stones=1;__qa.world.inspect();});await page.locator('#well-sheet[open]').waitFor();await page.waitForTimeout(300);await shot('05-well-phone-landscape');
 assert.deepEqual(errors,[]);console.log('Well preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
