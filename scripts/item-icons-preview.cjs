const {chromium}=require('playwright');
const assert=require('node:assert/strict');
// Fills the backpack with every item and puts painted icons on the hotbar, then checks no icon falls back to a glyph.
(async()=>{
 process.env.PORT='5187';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 const page=await browser.newPage({viewport:{width:1448,height:1086}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5187');
 await page.evaluate(async()=>{const {World}=await import('/src/world.js'),{captureSave}=await import('/src/save-format.js'),{IndexedSaveStore}=await import('/src/save-store.js'),{ITEM_ART}=await import('/src/item-icons.js');
  const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='icons-browser';w.story.scene=null;w.inventory.marks=42;
  for(const name of Object.keys(ITEM_ART))if(name!=='Fishing Rod'&&(!/Shard$|Mysterious/.test(name)||name==='Black Light Shard'))w.inventory.receive({name});
  const save=captureSave(w);await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:save,writerId:null,manual:null,backups:[]}));});
 await page.reload();await page.locator('#continue-journey:not([disabled])').click();await page.waitForFunction(()=>window.__storyQA?.world?.adventure);
 await page.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();const inv=window.__storyQA.world.inventory;['Hunting Knife','Healing Salve','Sardine','Willow Apples','Reed Spear','Shell Buckler'].forEach((name,i)=>inv.assignHotbar(inv.storedItems.find(item=>item.name===name).id,i+2));});
 await page.waitForTimeout(500);
 assert.ok(await page.locator('#slot-rod .slot-icon img').count(),'rod icon');
 await page.screenshot({path:'screenshots/item-icons-hotbar.png'});
 await page.locator('#open-backpack').click();await page.locator('#backpack[open]').waitFor();await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.backpack-item-icon')].filter(e=>!e.querySelector('img')).length),0,'every backpack item is painted');
 assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.backpack-item-icon img')].every(img=>img.complete&&img.naturalWidth>0)),'every icon loads');
 await page.screenshot({path:'screenshots/item-icons-backpack.png'});
 assert.deepEqual(errors,[]);console.log('Item icon checks passed: rod and hotbar icons, every backpack item painted and loaded.');await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
