// Local integration preview of side missions: markers over villagers, the offer, progress on the HUD, handing in and the quest log.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5188';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},get quests(){return questUI;},get trade(){return tradeUI;}};'});});
 await page.goto('http://127.0.0.1:5188');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const shot=name=>page.screenshot({path:`${out}/${name}.png`});
 const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
 // Jump to Willowback after Chapter 4, when every villager is about, and stand by the gardener.
 const goTo=id=>w(id=>{const v=__qa.world,n=v.npcs.find(n=>n.id===id);v.areaId='village';Object.assign(v.player,{x:n.x+40,y:n.y+10});},id);
 const hunt=(species,times)=>w(async([species,times])=>{const {damageAnimal}=await import('/src/wildlife.js');const v=__qa.world;for(let i=0;i<times;i++){const a=v.animals.find(a=>a.species===species);Object.assign(a,{health:a.maxHealth,state:'idle'});v.areaId=a.areaId;damageAnimal(v,a,9999,v.player,0);}v.drops=[];},[species,times]);
 await w(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch4-complete';v.story.scene=null;v.areaId='village';v.npcs=createStoryNpcs(v.story,v.elapsed);v.inventory.receive({name:'Hunting Bow',category:'weapons'});v.inventory.marks=7;});
 await goTo('basket-carrier');await page.waitForTimeout(500);
 assert.equal(await page.locator('#open-quests').isVisible(),true);
 await shot('01-markers-in-village');
 await w(()=>__qa.world.inspect());await page.locator('#quest-sheet[open]').waitFor();await page.waitForTimeout(300);
 assert.equal(await page.locator('#quest-title').textContent(),'Basket carrier');
 await shot('02-gardener-offer');
 await page.locator('.quest-action.primary').click();await page.waitForTimeout(200);
 assert.equal(await w(()=>__qa.world.quests['garden-raiders'].status),'active');await shot('03-accepted');
 await page.keyboard.press('Escape');await page.waitForTimeout(200);
 await hunt('rabbit',2);await goTo('basket-carrier');await page.waitForTimeout(400);
 assert.match(await page.locator('#side-objective').textContent(),/Hunt Rabbits 2\/4/);await shot('04-hud-progress');
 await hunt('rabbit',2);await goTo('basket-carrier');await page.waitForTimeout(400);
 await shot('05-ready-marker');
 await w(()=>__qa.world.inspect());await page.locator('#quest-sheet[open]').waitFor();await page.waitForTimeout(300);await shot('06-ready-to-claim');
 await page.locator('.quest-action.primary').click();await page.waitForTimeout(300);
 assert.equal(await w(()=>__qa.world.inventory.countOf('Willow Apples')),4);assert.equal(await w(()=>__qa.world.inventory.marks),17);
 await shot('07-complete-and-next-offer');
 await page.keyboard.press('Escape');await page.waitForTimeout(200);
 // Take on two more and look at the log.
 await goTo('village-smith');await w(()=>__qa.world.inspect());await page.locator('#quest-sheet[open]').waitFor();await page.waitForTimeout(200);await shot('08-blacksmith-offer');
 await page.locator('.quest-action.primary').click();await page.keyboard.press('Escape');await page.waitForTimeout(200);
 await w(()=>__qa.world.inventory.receive({name:'Deer Hide'}));
 await goTo('child-one');await w(()=>__qa.world.inspect());await page.locator('#quest-sheet[open]').waitFor();await page.locator('.quest-action.primary').click();await page.keyboard.press('Escape');await page.waitForTimeout(200);
 await page.keyboard.press('KeyJ');await page.locator('#quest-sheet[open]').waitFor();await page.waitForTimeout(300);
 assert.equal(await page.locator('#quest-sheet .quest-card').count(),2);await shot('09-quest-log');
 await page.keyboard.press('Escape');await page.waitForTimeout(200);
 // A phone held sideways: the HUD line, the Quests button with its count, and the log.
 const phone=await (await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'})).newPage();
 phone.on('pageerror',e=>errors.push(e.message));
 await phone.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
 await phone.goto('http://127.0.0.1:5188');await phone.locator('#explore-world').click();await phone.locator('#story-scene[open]').waitFor();
 for(let i=0;i<60&&await phone.evaluate(()=>!!__qa.world.story.scene);i++){await phone.locator('#story-next').click();await phone.waitForTimeout(40);}
 await phone.evaluate(async()=>{const {createStoryNpcs}=await import('/src/story.js');const {acceptQuest}=await import('/src/side-quests.js');const v=__qa.world;v.story.stage='ch4-complete';v.story.scene=null;v.areaId='village';v.npcs=createStoryNpcs(v.story,v.elapsed);
  for(const [id,quest] of [['village-smith','harness-hides'],['basket-carrier','garden-raiders']]){const n=v.npcs.find(n=>n.id===id);Object.assign(v.player,{x:n.x+40,y:n.y+10});acceptQuest(v,quest);}
  v.inventory.receive({name:'Deer Hide'});});
 await phone.waitForTimeout(600);await phone.screenshot({path:`${out}/10-phone-hud.png`});
 await phone.locator('#open-quests').click();await phone.locator('#quest-sheet[open]').waitFor();await phone.waitForTimeout(300);await phone.screenshot({path:`${out}/11-phone-log.png`});
 assert.deepEqual(errors,[]);console.log('Quests preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
