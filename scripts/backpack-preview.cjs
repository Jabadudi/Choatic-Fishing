// Backpack in the Genshin-style layout: icon rail, card grid with sorting, detail panel. Checks desktop, laptop and phones.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5186';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const errors=[];
 async function openBackpack(page){
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__storyQA={get world(){return world;}};'});});
  await page.goto('http://127.0.0.1:5186');
  await page.evaluate(async()=>{const {World}=await import('/src/world.js'),{captureSave}=await import('/src/save-format.js'),{IndexedSaveStore}=await import('/src/save-store.js'),{artifactItem,slotArtifact}=await import('/src/artifacts.js'),{LOOT_ITEMS}=await import('/src/loot.js');
   const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='backpack-browser';w.story.scene=null;w.inventory.marks=37;
   w.inventory.receive({name:'Hunting Bow',category:'weapons',description:'Grandpa’s recurve bow.'});
   w.inventory.receive({name:'Region Core',category:'quest-items',description:'The Region Core of Reedwater. It pulses in time with Eli’s heartbeat. To take its power, he would have to eat it.'});
   for(const name of ['Deer Meat','Deer Hide','Deer Antlers'])for(let i=0;i<5;i++)w.inventory.receive(LOOT_ITEMS[name]);
   for(const name of ['Sardine','Sardine','Reed Spear','Old Boot','Treasure Key','Crab Maul','Grappling Squid'])w.inventory.receive({name});
   for(const [id,rarity,count] of [['lodestone','uncommon',1],['lodestone','common',3],['stag-crown','rare',1],['stag-crown','common',2],['rabbits-foot','epic',1]])for(let i=0;i<count;i++)w.inventory.receive(artifactItem(id,rarity));
   slotArtifact(w.inventory,w.inventory.allItems.find(item=>item.artifact==='stag-crown'&&item.rarity==='rare'));
   const save=captureSave(w);await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:save,writerId:null,manual:null,backups:[]}));});
  await page.reload();await page.locator('#continue-journey:not([disabled])').click();await page.waitForFunction(()=>window.__storyQA?.world?.adventure);
  await page.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();});
  await page.locator('#open-backpack:not([hidden])').waitFor();await page.locator('#open-backpack').click();await page.locator('#backpack[open]').waitFor();await page.waitForTimeout(300);
 }
 // Desktop: layout, sorting, New tags, hotbar, category filter.
 const page=await browser.newPage({viewport:{width:1448,height:1086}});page.on('pageerror',e=>errors.push(e.message));
 await openBackpack(page);
 const names=()=>page.locator('#backpack .backpack-items > .backpack-item').evaluateAll(cards=>cards.map(card=>card.title));
 assert.equal((await names()).length,16);
 assert.equal(await page.locator('.backpack-items > .backpack-item').first().getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.backpack-kind').innerText(),'Epic artifact');
 await page.locator('.backpack-sort select').selectOption('name');assert.deepEqual((await names()).slice(0,3),['Crab Maul','Deer Antlers','Deer Hide']);
 await page.locator('.backpack-order').click();assert.equal((await names())[0],'Treasure Key');await page.locator('.backpack-order').click();
 await page.locator('.backpack-sort select').selectOption('quality');assert.deepEqual((await names()).slice(0,2),['Epic Rabbit’s Foot','Rare Stag Crown']);
 await page.locator('.backpack-items > .backpack-item[title="Rare Stag Crown"] .backpack-tag').waitFor();assert.equal(await page.locator('.backpack-items > .backpack-item[title="Rare Stag Crown"] .backpack-tag').innerText(),'In slot');
 await page.locator('.backpack-items > .backpack-item[title="Common Lodestone"]').click();assert.equal(await page.locator('.backpack-stars').innerText(),'★');
 await page.screenshot({path:`${out}/backpack-01-desktop-quality.png`});
 await page.locator('.backpack-sort select').selectOption('newest');
 await page.evaluate(async()=>{const {LOOT_ITEMS}=await import('/src/loot.js');window.__storyQA.world.inventory.receive(LOOT_ITEMS['Deer Meat']);window.__storyQA.world.inventory.receive({name:'Shell Sling'});});
 await page.locator('.backpack-filters button',{hasText:'Weapons'}).click();await page.waitForTimeout(150);
 assert.equal(await page.locator('.backpack-items > .backpack-item[title="Shell Sling"] .backpack-tag').innerText(),'New');
 assert.equal(await page.locator('.backpack-crumb').innerText(),'Weapons');
 await page.locator('.backpack-items > .backpack-item[title="Reed Spear"]').click();await page.locator('.backpack-action-row button',{hasText:'Add to hotbar'}).click();await page.locator('.backpack-slot-choices button').nth(1).click();
 await page.waitForTimeout(150);assert.equal(await page.locator('.backpack-equip').innerText(),'Hotbar 3');
 await page.screenshot({path:`${out}/backpack-02-desktop-weapons.png`});
 await page.locator('.backpack-filters button',{hasText:'Artifacts'}).click();await page.waitForTimeout(150);await page.screenshot({path:`${out}/backpack-03-desktop-artifacts.png`});
 await page.locator('.backpack-filters button',{hasText:'All items'}).click();
 await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(200);await page.screenshot({path:`${out}/backpack-04-laptop.png`});
 await page.locator('#backpack .backpack-close').click();assert.equal(await page.locator('#backpack[open]').count(),0);await page.close();
 // Phones: everything fits inside the window, cards keep their tags clear of each other.
 for(const size of [{name:'iphone-landscape',width:874,height:402},{name:'iphone-se-landscape',width:667,height:375}]){
  const phone=await browser.newPage({viewport:{width:size.width,height:size.height},hasTouch:true,isMobile:true,deviceScaleFactor:2});phone.on('pageerror',e=>errors.push(e.message));
  await openBackpack(phone);
  const box=await phone.locator('#backpack').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=size.width&&box.y>=0&&box.y+box.height<=size.height,`${size.name} fits`);
  const cards=await phone.locator('#backpack .backpack-items > .backpack-item').evaluateAll(cards=>cards.map(card=>card.getBoundingClientRect().width));
  assert.ok(Math.min(...cards)>=55,`${size.name} cards are at least 60px wide: ${Math.min(...cards)}`);
  await phone.screenshot({path:`${out}/backpack-${size.name}.png`});
  await phone.locator('.backpack-items > .backpack-item[title="Common Lodestone"]').click();await phone.waitForTimeout(250);await phone.screenshot({path:`${out}/backpack-${size.name}-artifact.png`});
  await phone.close();
 }
 assert.deepEqual(errors,[]);console.log('Backpack browser checks passed: Genshin layout, sorting, New and slot tags, hotbar, category filter, phones, close.');await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
