// Local preview of the level-up burst over Eli: main level, then a skill level on its own, then on a phone.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5187';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5187');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const finish=async()=>{const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}};
 const shot=name=>page.screenshot({path:`${out}/${name}.png`});
 await finish();await page.waitForTimeout(400);
 const level=()=>w(async()=>{const {practise}=await import('/src/skills.js');const v=__qa.world;return practise(v,v.player,'fishing',Math.max(1,v.progression.xpToNextLevel+5)).levels;});
 assert.ok(await level()>0);
 assert.ok(await w(()=>__qa.world.effects.some(e=>e.burst==='level')));
 // Hold the burst at chosen moments: life ignores the game's countdown while each frame is captured.
 const hold=async(age,name)=>{await w(a=>{const e=__qa.world.effects.find(e=>e.burst);Object.defineProperty(e,'life',{configurable:true,get:()=>e.duration-a,set(){}});},age);await page.waitForTimeout(150);await shot(name);};
 for(const [age,name] of [[.1,'01-burst-pop'],[.45,'02-burst-pillar'],[1.2,'03-burst-sparks'],[2.2,'04-burst-settle']])await hold(age,name);
 await w(()=>{const e=__qa.world.effects.find(e=>e.burst);Object.defineProperty(e,'life',{configurable:true,writable:true,value:.01});});
 await page.waitForTimeout(200);
 // A skill level without a main level: give the main bar plenty of room first.
 const skill=await w(async()=>{const {practise,skillXpToNext}=await import('/src/skills.js');const v=__qa.world,p=v.progression;
  p.xp=0;const s=p.skills.cooking;s.xp=skillXpToNext(s.level)-1;const r=practise(v,v.player,'cooking',1);return {levels:r.levels,skillLevels:r.skillLevels};});
 await hold(.6,'05-skill-up');
 assert.deepEqual(skill,{levels:0,skillLevels:1});
 await w(()=>{for(const e of __qa.world.effects)if(e.burst)Object.defineProperty(e,'life',{configurable:true,writable:true,value:.01});});
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(300);
 await w(()=>{for(const e of __qa.world.effects)if(e.burst)Object.defineProperty(e,'life',{configurable:true,writable:true,value:.01});});await page.waitForTimeout(100);
 await level();await hold(.6,'06-phone-landscape');
 assert.deepEqual(errors,[]);console.log('Level-up preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
