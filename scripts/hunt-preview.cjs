// Local integration preview of the Chapter 1 supper: weapon rack, two Sardines, three deer, skills and cooking.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5182';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},view};'});});
 await page.goto('http://127.0.0.1:5182');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const finish=async()=>{const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}};
 const go=(areaId,x,y)=>page.evaluate(([areaId,x,y])=>{const v=__qa.world;v.areaId=areaId;Object.assign(v.player,{x,y,vx:0,vy:0});},[areaId,x,y]);
 const inspect=async()=>{await page.keyboard.press('KeyG');await page.waitForTimeout(250);};
 const shot=name=>page.screenshot({path:`${out}/${name}.png`});
 await finish();await go('cabin',320,160);await page.waitForTimeout(250);
 await go('cabin',520,150);await inspect();await finish();await go('cabin',110,270);await inspect();await finish();
 await go('cabin',320,100);await page.waitForTimeout(300);await shot('01-weapon-rack');
 assert.equal(await page.locator('#status').innerText().then(t=>t.length>0),true);
 await inspect();await page.locator('#story-scene[open]').waitFor();await page.waitForTimeout(300);await shot('02-rack-rod-scene');await finish();
 // Two real casts, each landed by completing the reel.
 await go('landing',1250,1850);
 for(let i=0;i<2;i++){await w(()=>{const v=__qa.world;v.cast({x:1250,y:2000});if(v.fishing.state!=='waiting')throw Error(v.message);v.fishing.state='caught';v.fishing.result={name:'Sardine'};});await page.waitForTimeout(400);}
 assert.equal(await w(()=>__qa.world.inventory.allItems.filter(i=>i.name==='Sardine').length),2);
 await page.waitForTimeout(200);await shot('03-two-sardines');
 await go('cabin',320,100);await inspect();await page.locator('#story-scene[open]').waitFor();await page.waitForTimeout(300);await shot('04-rack-bow-scene');await finish();
 await page.waitForTimeout(250);await shot('05-bow-taken');
 // Hunt each landing deer with real clicks: stand beside it, aim with the mouse and fire.
 const deer=await w(()=>__qa.world.wildlife.filter(a=>a.id.startsWith('deer-meadow')).map(a=>a.id));
 let shotTaken=false;
 for(const id of deer){
  for(let i=0;i<40;i++){
   const state=await w(id=>{const v=__qa.world,a=v.wildlife.find(x=>x.id===id);if(a.health<=0)return null;v.areaId='landing';v.player.x=a.x-170;v.player.y=a.y;v.player.health=v.progression.maxHealth;return {x:a.x,y:a.y};},id);
   if(!state)break;
   await page.waitForTimeout(60);
   const point=await w(([x,y])=>{const r=document.querySelector('#arena').getBoundingClientRect();return {x:r.left+__qa.view.x+x*__qa.view.scale,y:r.top+__qa.view.y+y*__qa.view.scale};},[state.x,state.y]);
   await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.up();
   if(!shotTaken){await page.waitForTimeout(90);await shot('06-arrow-in-flight');shotTaken=true;}
   await page.waitForTimeout(800);
  }
  await page.waitForTimeout(150);
  if(id===deer[0])await shot('07-first-deer-loot');
 }
 assert.equal(await w(()=>__qa.world.hunting.bySpecies.deer),3);
 // Collect every drop with the examine key.
 for(let i=0;i<12;i++){const d=await w(()=>__qa.world.drops[0]);if(!d)break;await go(d.areaId,d.x,d.y+12);await inspect();}
 assert.equal(await w(()=>__qa.world.inventory.allItems.filter(i=>i.name==='Deer Meat').length),3);
 await page.keyboard.press('KeyB');await page.waitForTimeout(300);await shot('08-backpack-loot');await page.keyboard.press('KeyB');
 await page.keyboard.press('KeyK');await page.waitForTimeout(300);await shot('09-skills-sheet');await page.keyboard.press('KeyK');
 await go('cabin',100,140);await page.waitForTimeout(200);await inspect();await page.locator('#story-scene[open]').waitFor();await page.waitForTimeout(300);await shot('10-dinner');await finish();
 await page.waitForTimeout(300);await shot('11-after-dinner');
 assert.equal(await w(()=>__qa.world.story.stage),'rest');
 await page.setViewportSize({width:390,height:844});await page.keyboard.press('KeyK');await page.waitForTimeout(300);await shot('12-skills-mobile');
 assert.deepEqual(errors,[]);console.log('Hunting preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
