// Local integration preview of reed marks: the purse on the backpack, a merchant stall, buying and selling.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5187';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},get trade(){return tradeUI;}};'});});
 await page.goto('http://127.0.0.1:5187');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const shot=name=>page.screenshot({path:`${out}/${name}.png`});
 const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
 // Jump to Willowback after Chapter 4, when the merchants are about, with a pack of hunting goods.
 await w(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch4-complete';v.story.scene=null;v.areaId='village';v.npcs=createStoryNpcs(v.story,v.elapsed);
  for(const name of ['Deer Hide','Deer Hide','Deer Antlers','Rabbit Pelt','Turtle Shell','River Pearl'])v.inventory.receive({name});v.inventory.receive({name:'Hunting Bow',category:'weapons'});v.inventory.marks=7;
  const smith=v.npcs.find(n=>n.id==='village-smith');Object.assign(v.player,{x:smith.x+30,y:smith.y+20});});
 await page.waitForTimeout(400);
 assert.equal(await page.locator('#purse-hud span').textContent(),'7 marks');await shot('00-hud-purse');
 await page.locator('#open-backpack').click();await page.locator('#backpack[open]').waitFor();await page.waitForTimeout(300);
 assert.equal(await page.locator('.backpack-marks span').textContent(),'7 marks');await shot('01-backpack-purse');
 await page.locator('#backpack .backpack-close').click();await page.waitForTimeout(200);
 await w(()=>__qa.world.inspect());await page.locator('#trade-sheet[open]').waitFor();await page.waitForTimeout(300);
 assert.equal(await page.locator('#trade-title').textContent(),'The Blacksmith');
 assert.equal(await page.locator('.trade-wares .trade-action:disabled').count(),4);
 assert.equal(await page.locator('.trade-pack .trade-row').count(),5,'the hides stack and the bow is not offered');await shot('02-blacksmith-stall');
 for(let i=0;i<3;i++){await page.locator('.trade-pack .trade-row').first().locator('.trade-action').first().click();await page.waitForTimeout(80);}
 assert.equal(await w(()=>__qa.world.inventory.marks),7+5+5+8);await shot('03-after-selling');
 await page.locator('.trade-wares .trade-action').first().click();await page.waitForTimeout(150);
 assert.equal(await w(()=>__qa.world.inventory.marks),5);assert.ok(await w(()=>__qa.world.inventory.allItems.some(i=>i.name==='Hunting Knife')));
 await shot('04-bought-knife');
 await page.keyboard.press('Escape');await page.waitForTimeout(200);assert.equal(await w(()=>__qa.trade.open),false);
  // The index now lists coin prices.
 await w(()=>__qa.world.codex.add('fisher'));await page.locator('#open-codex').click();await page.locator('#codex-sheet[open]').waitFor();
 await page.locator('.codex-entry[data-id="fisher"]').click();await page.waitForTimeout(400);
 await page.locator('.codex-loot').scrollIntoViewIfNeeded();await shot('05-index-fisher-prices');await page.locator('#codex-sheet .backpack-close').click();await page.waitForTimeout(200);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 await w(async()=>{const v=__qa.world;const f=v.npcs.find(n=>n.id==='village-fisher');Object.assign(v.player,{x:f.x+30,y:f.y});v.inspect();});
 await page.locator('#trade-sheet[open]').waitFor();await page.waitForTimeout(400);await shot('06-fisher-stall-mobile');
 assert.deepEqual(errors,[]);console.log('Trade preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
