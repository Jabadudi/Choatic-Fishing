// Browser preview of the world bosses: the Drowned Captain on the Drowned Road and Greyhorn at the Grey Spire, each move
// held for a shot, Eli with the Captain's Sabre and the Greyhorn Spear, the boss loot in the backpack and the Index pages.
// SHOTS=<dir> for screenshots (default screenshots/).
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const out=process.env.SHOTS||'screenshots';
(async()=>{
 process.env.PORT='5193';await import('../server.mjs');
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message,e.stack);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5193');
 // A journey past Chapter 7, so the monsters (and so the bosses) are awake.
 await page.evaluate(async()=>{
  const {World}=await import('/src/world.js'),{MARA_SPOT,CHIEF_HOUSE}=await import('/src/chief-house.js'),{captureSave}=await import('/src/save-format.js'),{createStoryNpcs}=await import('/src/story.js'),{IndexedSaveStore}=await import('/src/save-store.js');
  const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='boss-browser';w.areaId='windchime';
  w.story={stage:'ch7-complete',lureSeen:true,photoSeen:true,scene:null,page:0,rod:true,bow:true,coreIngested:true,callAwakened:true,guide:{...MARA_SPOT,waypoint:0,areaId:CHIEF_HOUSE.id}};
  w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:800,y:600});
  await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:captureSave(w),writerId:null,manual:null,backups:[]}));
 });
 await page.reload();await page.locator('#continue-journey:not([disabled])').waitFor();await page.locator('#continue-journey').click();await page.waitForFunction(()=>window.__qa.world.journeyId==='boss-browser');
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const shot=async name=>{await page.screenshot({path:`${out}/${name}.png`});};
 // Eli on ground beside the boss spot, at distance r and angle k (in 32nds of a turn), kept at full health.
 const place=(id,r,k=0)=>w(async([id,r,k])=>{
  const {BOSS_SPOTS}=await import('/src/bosses.js'),{walkable}=await import('/src/wilds.js'),v=__qa.world,s=BOSS_SPOTS.find(b=>b.id===id);
  v.areaId=s.areaId;v.wildlife=v.wildlife.filter(a=>a.areaId===s.areaId);
  for(let d=r;d<r+400;d+=8)for(let j=0;j<64;j++){const a=(k+j)*Math.PI/32,x=s.x+Math.cos(a)*d,y=s.y+Math.sin(a)*d;if(walkable(x,y,s.areaId)){Object.assign(v.player,{x,y,vx:0,vy:0,health:v.progression.maxHealth});return;}}
 },[id,r,k]);
 const boss=()=>w(()=>{const a=__qa.world.wildlife.find(x=>x.boss);return a&&{state:a.state,health:a.health,max:a.maxHealth,x:a.x,y:a.y};});
 const heal=()=>w(()=>{const v=__qa.world;v.player.health=v.progression.maxHealth;});
 // Holds a boss in one state at a set time into its clip, for a still.
 const pose=(state,time,extra={})=>w(([state,time,extra])=>{const a=__qa.world.wildlife.find(x=>x.boss),p=__qa.world.player;Object.assign(a,{state,time,...extra});const an=Math.atan2(p.y-a.y,p.x-a.x);a.direction={x:Math.cos(an),y:Math.sin(an)};},[state,time,extra]);
 for(const id of ['drowned-captain','greyhorn']){
  await place(id,250,8);await page.waitForTimeout(500);
  assert.ok(await boss(),`${id} rose`);await shot(`${id}-01-rise`);
  await page.waitForTimeout(2200);await heal();await shot(`${id}-02-notice`);
  await place(id,id==='greyhorn'?150:110,8);await pose('attack',.45);await page.waitForTimeout(30);await shot(`${id}-03-windup`);
  await pose('strike',.1);await page.waitForTimeout(40);await shot(`${id}-04-strike`);
  await place(id,260,8);await pose('rush-raise',.4);await page.waitForTimeout(30);await shot(`${id}-05-rush-windup`);
  await pose('rush',.15,{rushAngle:0,rushHit:true});await page.waitForTimeout(40);await shot(`${id}-06-rush`);
  await w(()=>{const a=__qa.world.wildlife.find(x=>x.boss);a.health=a.maxHealth*.6;});await page.waitForTimeout(1300);await heal();await shot(`${id}-07-call`);
  if(id==='greyhorn'){await w(()=>{const a=__qa.world.wildlife.find(x=>x.boss);a.health=a.maxHealth*.45;a.state='chase';});await page.waitForTimeout(900);await shot(`${id}-08-antlers`);}
  // The killing blow, from Eli.
  await w(async()=>{const {damageAnimal}=await import('/src/wildlife.js'),v=__qa.world,a=v.wildlife.find(x=>x.boss);damageAnimal(v,a,1e5,v.player,0);});
  await page.waitForTimeout(700);await shot(`${id}-09-defeat`);
  await page.waitForTimeout(1600);await shot(`${id}-10-defeat-end`);
  const message=await w(()=>__qa.world.message);console.log(id,message);
  assert.ok(/Spear|Sabre/.test(message),'the weapon dropped the first time');
 }
 // Eli with both weapons: pick them up, put them on the hotbar, swing and rush.
 await w(()=>{const v=__qa.world;for(const d of [...v.drops])v.inventory.receive(d.item);v.drops=[];});
 for(const [name,slot] of [['Captain’s Sabre',2],['Greyhorn Spear',3]]){
  // Mid Elk Run, where the camera is not held against the map's edge, with the bosses kept away.
  await w(()=>{const v=__qa.world;v.areaId='elk-run';Object.assign(v.player,{x:800,y:1000,vx:0,vy:0});v.wildlife=[];v.bosses={};});
  await w(([name,slot])=>{const v=__qa.world,item=v.inventory.allItems.find(i=>i.name===name);v.inventory.assignHotbar(item.id,slot);v.equip(slot);},[name,slot]);
  const key=name==='Greyhorn Spear'?'spear':'sabre';
  for(let i=0;i<20&&await page.locator('#hud-found:not([hidden])').count();i++){await page.locator('#hud-found').click();await page.waitForTimeout(80);}
  await w(()=>{const v=__qa.world;v.player.cooldown=0;v.player.angle=0;v.useItem();});await page.waitForTimeout(150);await shot(`eli-${key}-swing`);
  await page.waitForTimeout(500);
  await w(async name=>{const {startRush}=await import('/src/combat.js'),v=__qa.world;v.player.rushCooldown=0;v.player.angle=Math.PI;startRush(v,v.player,name);},name);await page.waitForTimeout(150);await shot(`eli-${key}-rush`);
 }
 await page.waitForTimeout(400);
 await page.keyboard.press('KeyB');await page.waitForTimeout(400);await shot('backpack-boss-loot');await page.keyboard.press('KeyB');
 await page.keyboard.press('KeyI');await page.locator('#codex-sheet[open]').waitFor();
 for(const id of ['drowned-captain','greyhorn']){await page.locator(`.codex-entry[data-id="${id}"]`).click();await page.waitForTimeout(400);await shot(`index-${id}`);}
 assert.deepEqual(errors,[]);console.log('Boss browser preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
