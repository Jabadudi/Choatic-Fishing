// Local integration preview of the creature index and the per-animal loot tables.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5183';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},view,get codex(){return codexUI;}};'});});
 await page.goto('http://127.0.0.1:5183');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const finish=async()=>{const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}};
 const shot=name=>page.screenshot({path:`${out}/${name}.png`});
 await finish();
 // A new journey: everything is a question mark until Eli meets it or the story names it.
 await w(()=>{const v=__qa.world;v.areaId='cabin';Object.assign(v.player,{x:320,y:300});});await page.waitForTimeout(150);
 await page.keyboard.press('KeyI');await page.locator('#codex-sheet[open]').waitFor();await page.waitForTimeout(400);await shot('00-index-undiscovered');
 assert.equal(await page.locator('.codex-entry.locked').count(),17-await w(()=>__qa.world.codex.size));
 assert.ok(await page.locator('.codex-entry.locked').count()>=15);
 await page.keyboard.press('KeyI');await page.waitForTimeout(200);
 // Hunt one rabbit and the turtle so their own loot tables drop.
 await w(()=>{const v=__qa.world;v.areaId='landing';for(const a of [v.rabbits[0],v.wildlife.find(x=>x.species==='turtle')]){Object.assign(v.player,{x:a.x-60,y:a.y});a.health=1;}});
 await w(async()=>{const {damageAnimal}=await import('/src/wildlife.js');const v=__qa.world;for(const a of [v.rabbits[0],v.wildlife.find(x=>x.species==='turtle')]){v.player.x=a.x-60;v.player.y=a.y;damageAnimal(v,a,50,v.player,0);}});
 const drops=await w(()=>__qa.world.drops.map(d=>d.item.name));
 assert.ok(drops.includes('Rabbit Meat')&&drops.includes('Turtle Meat'),drops.join());
 const turtleDrops=await w(async()=>{const {walkable}=await import('/src/wilds.js');return __qa.world.drops.filter(d=>/Turtle|Pearl/.test(d.item.name)).every(d=>walkable(d.x,d.y,d.areaId));});
 assert.ok(turtleDrops,'turtle loot lands on walkable ground');
 await page.waitForTimeout(200);
 await page.keyboard.press('KeyI');await page.locator('#codex-sheet[open]').waitFor();await page.waitForTimeout(500);await shot('01-index-rabbit');
 assert.equal(await page.locator('.codex-entry[data-id="rabbit"].locked, .codex-entry[data-id="turtle"].locked').count(),0);
 assert.equal(await page.locator('.codex-entry[data-id="croshelda"].locked').count(),1);
 await page.locator('.codex-entry[data-id="croshelda"]').click();await page.waitForTimeout(300);await shot('01b-index-locked-entry');
 // Reveal the rest to check every page renders.
 await w(()=>{for(const id of ['deer','eel','shadow-walker','croshelda','moonfang','rimejaw','flitlynx','elk-spirit','ocelot','mara','emilia','drayfus','blacksmith','fisher','gardener'])__qa.world.codex.add(id);});
 for(const [id,name] of [['deer','02-index-deer'],['eel','03-index-eel'],['shadow-walker','04-index-shadow-walker'],['croshelda','05-index-croshelda'],['rimejaw','06-index-rimejaw'],['blacksmith','07-index-blacksmith'],['mara','08-index-mara']]){
  await page.locator(`.codex-entry[data-id="${id}"]`).click();await page.waitForTimeout(350);await shot(name);
 }
 assert.equal(await page.locator('.codex-entry').count(),17);
 await page.keyboard.press('KeyI');await page.waitForTimeout(200);assert.equal(await w(()=>__qa.codex.open),false);
 await page.waitForTimeout(200);await shot('09-index-button');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 await page.keyboard.press('KeyI');await page.waitForTimeout(300);await page.locator('.codex-entry[data-id="deer"]').click();await page.waitForTimeout(400);await shot('10-index-mobile');
 await page.locator('.codex-detail').evaluate(e=>e.scrollTop=e.scrollHeight);await page.waitForTimeout(200);await shot('11-index-mobile-loot');
 await page.keyboard.press('KeyI');await page.waitForTimeout(300);await shot('12-mobile-buttons');
 assert.deepEqual(errors,[]);console.log('Index preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
