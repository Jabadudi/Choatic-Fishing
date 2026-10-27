// Local integration preview of area spawns, shiny creatures, the gold familiar and the index columns.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5186';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},view,get codex(){return codexUI;}};'});});
 await page.goto('http://127.0.0.1:5186');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const finish=async()=>{const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}};
 const shot=name=>page.screenshot({path:`${out}/${name}.png`});
 await finish();
 // A shiny deer and a shiny rabbit beside an ordinary deer in the meadow.
 await w(async()=>{const {createCreature,makeShiny}=await import('/src/spawns.js');const {SLOTS}=await import('/src/spawn-tables.js');const v=__qa.world;
  v.areaId='landing';Object.assign(v.player,{x:1180,y:1180,angle:0});
  const deer=makeShiny(createCreature({...SLOTS['landing-east'],x:1300,y:1150},'deer',{id:'qa-shiny-deer',seed:11}));v.wildlife.push(deer);
  const rabbit=makeShiny(createCreature({...SLOTS['landing-east'],x:1250,y:1260},'rabbit',{id:'qa-shiny-rabbit',seed:12}));v.rabbits.push(rabbit);
  const plain=v.wildlife.find(a=>a.id==='deer-meadow');Object.assign(plain,{x:1080,y:1120});});
 await page.waitForTimeout(700);await shot('01-shiny-deer-and-rabbit');
 assert.equal(await w(()=>__qa.world.hunting.shiny.seen.deer),1);
 // Walking into Windchime Path with a shiny inside chimes.
 await w(async()=>{const {createCreature,makeShiny}=await import('/src/spawns.js');const {SLOTS}=await import('/src/spawn-tables.js');const v=__qa.world;
  v.wildlife.push(makeShiny(createCreature(SLOTS['windchime-glade'],'deer',{id:'qa-windchime',seed:13})));v.story.stage='ch2-complete';
  v.areaId='windchime';Object.assign(v.player,{x:600,y:1510});v.elapsed+=40;});
 await page.waitForTimeout(400);
 assert.match(await w(()=>__qa.world.message),/Something glimmers in Windchime Path/);await shot('02-glimmer-message');
 // Hunt the meadow shiny with a deer familiar following.
 await w(async()=>{const {absorbShard}=await import('/src/familiars.js');const {damageAnimal}=await import('/src/wildlife.js');const v=__qa.world;
  for(let i=0;i<5;i++)absorbShard(v,'deer');v.familiarAction('deer','combine');
  v.areaId='landing';const a=v.wildlife.find(x=>x.id==='qa-shiny-deer');Object.assign(v.player,{x:a.x-70,y:a.y,angle:0});damageAnimal(v,a,1e4,v.player,0);});
 await page.waitForTimeout(500);
 assert.match(await w(()=>__qa.world.message),/Shiny Deer hunted · \+50 Hunting XP/);assert.equal(await w(()=>__qa.world.companion.shiny),true);
 await shot('03-shiny-hunted-gold-familiar');
 await page.keyboard.press('KeyI');await page.locator('#codex-sheet[open]').waitFor();
 await page.locator('.codex-entry[data-id="deer"]').click();await page.waitForTimeout(400);await shot('04-index-deer-shiny');
 await page.locator('.codex-loot').scrollIntoViewIfNeeded();await page.waitForTimeout(200);await shot('05-index-deer-loot');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 await page.locator('.codex-loot').scrollIntoViewIfNeeded();await page.waitForTimeout(200);await shot('06-index-mobile-shiny');
 assert.deepEqual(errors,[]);console.log('Shiny preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
