// Local preview of hold-to-attack: Eli holds the left mouse button with his Iron Sword beside a pack of shadow walkers and the
// sword keeps swinging through the 3-hit combo until the button comes up; then the same with the Hunting Bow. OUT=<folder> sets where screenshots go.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5184';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},view};'});});
 await page.goto('http://127.0.0.1:5184');await page.locator('#explore-world').click();
 await page.waitForFunction(()=>window.__qa?.world);
 const w=(fn,arg)=>page.evaluate(fn,arg);
 await w(()=>__qa.world.skipStory?.());await page.waitForTimeout(400);
 for(let i=0;i<5;i++)if(await page.locator('#story-scene[open]').count())await page.keyboard.press('Escape');
 await w(async()=>{
  const v=__qa.world,{SLOTS}=await import('/src/spawn-tables.js'),{createCreature}=await import('/src/spawns.js');
  v.areaId='landing';Object.assign(v.player,{x:1500,y:1700,vx:0,vy:0});v.spawns=null;
  v.wildlife=[0,1,2].map(i=>{const a=createCreature(SLOTS['landing-east'],'shadow-walker',{id:'qa-walker-'+i});a.areaId='landing';a.x=1575;a.y=1670+i*28;a.home={x:a.x,y:a.y};a.health=a.maxHealth=40000;a.attackCooldown=99;return a;});
 });
 const target=()=>w(()=>{const v=__qa.world,r=document.querySelector('#arena').getBoundingClientRect();return {x:r.left+__qa.view.x+(v.player.x+80)*__qa.view.scale,y:r.top+__qa.view.y+(v.player.y-10)*__qa.view.scale};});
 const heal=()=>w(()=>{const v=__qa.world;v.player.health=v.progression.maxHealth;});
 // The find pop-up near Eli would catch the press; it is not what this preview checks.
 await page.addStyleTag({content:'#hud-found{display:none!important}'});
 // Wait until nothing covers the field where Eli aims.
 const clear=async()=>{for(let i=0;i<20;i++){const p=await target();if(await w(p=>document.elementFromPoint(p.x,p.y)?.id==='arena',p))return;await page.keyboard.press('Escape');await page.waitForTimeout(250);}throw Error('field stays covered');};
 await page.waitForTimeout(800);await clear();
 // Sword: one press, held for three seconds.
 let p=await target();await page.mouse.move(p.x,p.y);await page.mouse.down();
 const steps=new Set();let shot=false;
 for(let t=0;t<30;t++){await page.waitForTimeout(100);await heal();const s=await w(()=>__qa.world.player.comboStep);steps.add(s);if(s===3&&!shot){await page.screenshot({path:`${out}/hold-01-sword-finisher.png`});shot=true;}}
 await page.mouse.up();
 const swung=await w(()=>({best:__qa.world.combo?.best||0,hp:__qa.world.wildlife.reduce((t,a)=>t+a.health,0)}));
 assert.deepEqual([...steps].filter(Boolean).sort(),[1,2,3],'held sword ran the whole combo');
 await page.waitForTimeout(1500);
 const after=await w(()=>__qa.world.wildlife.reduce((t,a)=>t+a.health,0));
 assert.equal(after,swung.hp,'swinging stops when the button comes up');
 // Bow: hand Eli the Hunting Bow and hold again.
 await w(()=>{const v=__qa.world,inv=v.inventory;inv.receive({name:'Hunting Bow'});inv.assignHotbar(inv.allItems.at(-1).id,3);v.equip(3);});
 await clear();p=await target();await page.mouse.move(p.x,p.y);
 let arrows=0,last=0;await page.mouse.down();
 for(let t=0;t<50;t++){await page.waitForTimeout(50);await heal();// Every arrow loosed puts the bow back on cooldown, so a jump up in cooldown is one shot.
  const cd=await w(()=>__qa.world.player.cooldown);if(cd>last+.05)arrows++;last=cd;if(t===16)await page.screenshot({path:`${out}/hold-02-bow.png`});}
 await page.mouse.up();
 assert.ok(arrows>=3,`held bow kept firing (${arrows} arrows)`);
 assert.deepEqual(errors,[]);
 console.log('Hold attack preview passed.',JSON.stringify({best:swung.best,arrows}));await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
