// Local integration preview of a shadow walker fight: notice, chase, windup, the hit on Eli, fighting back, the kill, and Eli's fall and wake-up.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5187';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},view};'});});
 await page.goto('http://127.0.0.1:5187');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const finish=async()=>{const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}};
 const until=async(fn,ms=6000)=>{for(let t=0;t<ms;t+=30){if(await w(fn))return true;await page.waitForTimeout(30);}return false;};
 const shot=name=>page.screenshot({path:`${out}/${name}.png`});
 await finish();
 // After the storm: one shadow walker roaming the Reedwater Landing meadow.
 await w(async()=>{const {createCreature}=await import('/src/spawns.js');const {SLOTS}=await import('/src/spawn-tables.js');const v=__qa.world;
  v.story.stage='ch2-complete';v.areaId='landing';v.spawns=null;v.rabbits=[];
  v.wildlife=[createCreature({...SLOTS['landing-east'],x:1420,y:1150},'shadow-walker',{id:'qa-walker',seed:21})];
  const a=v.wildlife[0];Object.assign(v.player,{x:a.x-380,y:a.y+20,angle:0});});
 await page.waitForTimeout(800);await shot('01-walker-roaming');
 await w(()=>{const v=__qa.world,a=v.wildlife[0];Object.assign(v.player,{x:a.x-210,y:a.y+10});});
 assert.ok(await until(()=>__qa.world.wildlife[0].state==='notice'));await page.waitForTimeout(120);
 assert.match(await w(()=>__qa.world.message),/Shadow Walker has seen you/);await shot('02-walker-notices');
 const before=await w(()=>__qa.world.player.health);
 assert.ok(await until(()=>__qa.world.wildlife[0].state==='attack'));await page.waitForTimeout(200);await shot('03-axe-raised');
 assert.ok(await until(()=>__qa.world.wildlife[0].state==='strike'));await page.waitForTimeout(80);
 assert.ok(await w(()=>__qa.world.player.health)<before);await shot('04-eli-hit');
 // Eli fights back with the hunting knife.
 await w(async()=>{const {attack}=await import('/src/combat.js');const v=__qa.world,a=v.wildlife[0];v.player.angle=Math.atan2(a.y-v.player.y,a.x-v.player.x);attack(v,v.player,{name:'Hunting Knife'});});
 await page.waitForTimeout(150);await shot('05-eli-strikes-back');
 await w(async()=>{const {attack}=await import('/src/combat.js');const v=__qa.world,a=v.wildlife[0];v.player.health=v.progression.maxHealth;for(let i=0;i<4&&a.health>0;i++){v.player.angle=Math.atan2(a.y-v.player.y,a.x-v.player.x);attack(v,v.player,{name:'Anchor'});}});
 await page.waitForTimeout(500);
 assert.match(await w(()=>__qa.world.message),/Shadow Walker defeated/);await shot('06-walker-defeated');
 // A second walker brings Eli down; he wakes at the landing's dock.
 await w(async()=>{const {createCreature}=await import('/src/spawns.js');const {SLOTS}=await import('/src/spawn-tables.js');const v=__qa.world;
  v.drops=[];const a=createCreature({...SLOTS['landing-east'],x:1500,y:1000},'shadow-walker',{id:'qa-walker-2',seed:22});v.wildlife.push(a);Object.assign(v.player,{x:a.x-45,y:a.y,health:4});});
 assert.ok(await until(()=>!!__qa.world.defeat));await page.waitForTimeout(1300);await shot('07-eli-collapses');
 assert.ok(await until(()=>!__qa.world.defeat));await page.waitForTimeout(200);
 assert.match(await w(()=>__qa.world.message),/wakes up at Reedwater Landing/);await shot('08-eli-wakes');
 await page.keyboard.press('KeyI');await page.locator('#codex-sheet[open]').waitFor();
 await page.locator('.codex-entry[data-id="shadow-walker"]').click();await page.waitForTimeout(400);await shot('09-index-shadow-walker');
 await page.keyboard.press('Escape');await page.waitForTimeout(200);
 // Phone landscape: a walker mid-chase.
 await page.setViewportSize({width:844,height:390});
 await w(()=>{const v=__qa.world,a=v.wildlife.find(x=>x.id==='qa-walker-2');v.respawnGrace=0;Object.assign(a,{x:v.player.x+170,y:v.player.y-20,home:{x:v.player.x+170,y:v.player.y-20},state:'idle',time:0});});
 assert.ok(await until(()=>['chase','attack'].includes(__qa.world.wildlife.find(x=>x.id==='qa-walker-2').state)));await page.waitForTimeout(250);await shot('10-mobile-chase');
 assert.deepEqual(errors,[]);console.log('Nightwalker preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
