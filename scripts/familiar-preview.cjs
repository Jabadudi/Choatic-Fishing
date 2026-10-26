// Local integration preview of familiar shards, combining, the follower and the index panel.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5184';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},view,get codex(){return codexUI;}};'});});
 await page.goto('http://127.0.0.1:5184');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const finish=async()=>{const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}};
 const shot=name=>page.screenshot({path:`${out}/${name}.png`});
 await finish();
 const give=(id,n)=>w(async([id,n])=>{const {absorbShard}=await import('/src/familiars.js');for(let i=0;i<n;i++)absorbShard(__qa.world,id);},[id,n]);
 // A deer shard lying in the meadow beside two ordinary drops, then picked up.
 await w(async()=>{const {LOOT_ITEMS}=await import('/src/loot.js');const v=__qa.world;v.areaId='landing';Object.assign(v.player,{x:1100,y:1000,angle:0});
  for(const [i,name] of ['Deer Familiar Shard','Deer Hide','Deer Meat'].entries())v.drops.push({id:`drop-${900+i}`,entityType:'pickup',spriteId:'pickup',areaId:'landing',x:1150+i*36,y:1000+i*8,item:{...LOOT_ITEMS[name],id:`loot-${900+i}`,uses:1}});});
 await page.waitForTimeout(400);await shot('01-shard-on-ground');
 await w(()=>{const v=__qa.world;Object.assign(v.player,{x:1140,y:1000});v.inspect();});
 assert.equal(await w(()=>__qa.world.familiars.shards.deer),1);
 await page.waitForTimeout(200);await shot('02-shard-picked-up');
 // Four more shards: ready to combine in the index.
 await give('deer',4);
 await page.keyboard.press('KeyI');await page.locator('#codex-sheet[open]').waitFor();
 await page.locator('.codex-entry[data-id="deer"]').click();await page.waitForTimeout(400);
 await page.locator('.codex-familiar').scrollIntoViewIfNeeded();await page.waitForTimeout(200);await shot('03-index-ready-to-combine');
 await page.locator('.codex-familiar-button').click();await page.waitForTimeout(300);
 assert.equal(await w(()=>__qa.world.familiars.active),'deer');
 await page.locator('.codex-familiar').scrollIntoViewIfNeeded();await shot('04-index-deer-summoned');
 await page.keyboard.press('KeyI');await page.waitForTimeout(200);
 // Walk a little so the familiar trails behind.
 await page.keyboard.down('KeyD');await page.waitForTimeout(900);await page.keyboard.up('KeyD');await page.waitForTimeout(500);
 const gap=await w(()=>Math.hypot(__qa.world.companion.x-__qa.world.player.x,__qa.world.companion.y-__qa.world.player.y));
 assert.ok(gap<90,`familiar keeps up (${gap})`);
 await shot('05-deer-familiar-following');
 // Skills sheet lists the familiar bonus.
 await page.keyboard.press('KeyK');await page.waitForTimeout(400);await shot('06-skills-familiar');await page.keyboard.press('KeyK');
 // A fully grown turtle familiar and an untouched shadow walker entry.
 await give('turtle',100);await w(()=>__qa.world.familiarAction('turtle','combine'));
 await page.keyboard.press('KeyI');await page.locator('#codex-sheet[open]').waitFor();
 await page.locator('.codex-entry[data-id="turtle"]').click();await page.waitForTimeout(300);await page.locator('.codex-familiar').scrollIntoViewIfNeeded();await shot('07-index-turtle-max');
 await page.locator('.codex-entry[data-id="rabbit"]').click();await page.waitForTimeout(300);await page.locator('.codex-familiar').scrollIntoViewIfNeeded();await shot('08-index-rabbit-locked');
 await page.keyboard.press('KeyI');await page.waitForTimeout(400);await shot('09-turtle-familiar-following');
 // Rabbit and eel followers.
 for(const id of ['rabbit','eel']){await give(id,5);await w(id=>__qa.world.familiarAction(id,'combine'),id);await page.waitForTimeout(900);await shot(`10-${id}-familiar`);}
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 await page.keyboard.press('KeyI');await page.waitForTimeout(300);await page.locator('.codex-entry[data-id="deer"]').click();await page.waitForTimeout(300);
 await page.locator('.codex-familiar').scrollIntoViewIfNeeded();await page.waitForTimeout(200);await shot('11-index-mobile-familiar');
 assert.deepEqual(errors,[]);console.log('Familiar preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
