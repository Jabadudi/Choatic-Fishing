// Local preview of the field combo: a pack of shadow walkers on Reedwater Landing, Eli chaining 3-hit combos with real
// clicks, the knockdown on the finisher and the combo counter. OUT=<folder> sets where the screenshots go.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5183';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const run=async(viewport,prefix)=>{
  const page=await browser.newPage({viewport}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},view};'});});
  await page.route('**/src/spawns.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__createCreature=createCreature;'});});
  await page.goto('http://127.0.0.1:5183');await page.locator('#explore-world').click();
  await page.waitForFunction(()=>window.__qa?.world);
  const w=(fn,arg)=>page.evaluate(fn,arg);
  await w(()=>{const v=__qa.world;v.skipStory?.();});
  await page.waitForTimeout(400);
  for(let i=0;i<5;i++)if(await page.locator('#story-scene[open]').count())await page.keyboard.press('Escape');
  // A pack of four shadow walkers with plenty of health, in a ring east of Eli.
  await w(async()=>{
   const v=__qa.world,{SLOTS}=await import('/src/spawn-tables.js'),{createCreature}=await import('/src/spawns.js');
   v.areaId='landing';Object.assign(v.player,{x:1500,y:1700,vx:0,vy:0,health:v.progression.maxHealth});v.spawns=null;
   v.wildlife=[0,1,2,3].map(i=>{const a=createCreature(SLOTS['landing-east'],'shadow-walker',{id:'qa-walker-'+i});a.areaId='landing';a.x=1575+(i%2)*30;a.y=1660+i*28;a.home={x:a.x,y:a.y};a.health=a.maxHealth=4000;return a;});
   v.inventory.receive({name:'Reed Spear',uses:999});const item=v.inventory.allItems.at(-1);item.uses=999;v.inventory.assignHotbar(item.id,2);v.equip(2);
  });
  await page.waitForTimeout(300);
  const click=async()=>{const p=await w(()=>{const v=__qa.world,r=document.querySelector('#arena').getBoundingClientRect();return {x:r.left+__qa.view.x+(v.player.x+80)*__qa.view.scale,y:r.top+__qa.view.y+(v.player.y-10)*__qa.view.scale};});await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.up();};
  const shot=name=>page.screenshot({path:`${out}/${prefix}-${name}.png`});
  let took={};
  for(let i=0;i<14;i++){
   await w(()=>{const v=__qa.world;v.player.health=v.progression.maxHealth;});
   await click();await page.waitForTimeout(30);
   const s=await w(()=>({step:__qa.world.player.comboStep,count:__qa.world.combo?.count||0,down:__qa.world.wildlife.some(a=>a.downRemaining>0)}));
   if(s.step===3&&s.down&&!took.down){await shot('01-finisher-knockdown');took.down=true;}
   if(s.count>=10&&!took.ten){await page.waitForTimeout(80);await shot('02-ten-hit-combo');took.ten=true;}
   const cd=await w(()=>__qa.world.player.cooldown);await page.waitForTimeout(Math.max(20,cd*1000+30));
  }
  const best=await w(()=>__qa.world.combo?.best||0);
  assert.ok(best>=10,`best combo ${best}`);assert.ok(took.down,'a finisher knocked a walker down');
  assert.deepEqual(errors,[]);await page.close();
 };
 await run({width:1365,height:900},'desktop');
 await run({width:844,height:390},'phone');
 console.log('Combo preview passed.');await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
