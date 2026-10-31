// Local preview of the action wheel: the main attack in the corner, the Region Core's powers around it.
// Shots: sealed before the core is eaten, Still Water awake and glowing, Reedwater's Call in flight with the reserves bar, and desktop.
const {chromium}=require('playwright');
const PHONE={viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'};
const SE={...PHONE,viewport:{width:667,height:375}};
(async()=>{
 process.env.PORT='5195';await import('../server.mjs');
 const out=process.env.OUT||'screenshots',errors=[];
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 async function open(options,name){
  const page=await (await browser.newContext(options)).newPage();
  page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
  await page.goto('http://127.0.0.1:5195');await page.locator('#explore-world').click();await page.locator('#story-scene[open]').waitFor();
  const scene=await page.evaluate(()=>__qa.world.story.scene);
  for(let i=0;i<60&&await page.evaluate(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
  await page.evaluate(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch5-morning';v.story.scene=null;v.story.lureSeen=v.story.photoSeen=true;v.areaId='landing';v.npcs=createStoryNpcs(v.story,v.elapsed);
   const deer=v.wildlife.find(a=>a.species==='deer'&&a.areaId==='landing');Object.assign(v.player,{x:deer.x-230,y:deer.y-60,angle:0});v.message='';
   v.inventory.receive({name:'Hunting Knife'});v.inventory.slots[0]=v.inventory.storedItems[0];v.equip(2);});
  await page.waitForTimeout(600);return page;
 }
 const phone=await open(PHONE,'phone');
 await phone.screenshot({path:`${out}/01-phone-sealed.png`});
 await phone.locator('.hud-act[data-core="still-water"]').tap();await phone.waitForTimeout(200);
 if(!/out of reach/.test(await phone.evaluate(()=>__qa.world.message)))errors.push('a sealed power should explain itself');
 await phone.evaluate(()=>{__qa.world.story.coreIngested=true;});await phone.waitForTimeout(200);
 await phone.locator('.hud-act[data-core="still-water"]').tap();await phone.waitForTimeout(700);
 if(!(await phone.evaluate(()=>__qa.world.core.stillWater>0)))errors.push('Still Water did not start');
 await phone.screenshot({path:`${out}/02-phone-still-water.png`});
 await phone.evaluate(()=>{__qa.world.story.callAwakened=true;});await phone.waitForTimeout(200);
 await phone.locator('.hud-act[data-core="reeds-call"]').tap();await phone.waitForTimeout(260);
 if(!(await phone.evaluate(()=>__qa.world.core.reserves<100)))errors.push('Reedwater’s Call did not spend reserves');
 await phone.screenshot({path:`${out}/03-phone-reeds-call.png`});
 const se=await open(SE,'iphone-se');await se.evaluate(()=>{const s=__qa.world.story;s.coreIngested=s.callAwakened=true;__qa.world.core.reserves=60;});await se.waitForTimeout(300);await se.screenshot({path:`${out}/04-iphone-se.png`});
 const desk=await open({viewport:{width:1366,height:768}},'desktop');await desk.evaluate(()=>{const s=__qa.world.story;s.coreIngested=true;});await desk.waitForTimeout(300);
 await desk.keyboard.press('KeyR');await desk.waitForTimeout(1200);await desk.screenshot({path:`${out}/05-desktop.png`});
 if(!(await desk.evaluate(()=>__qa.world.core.cooldowns['still-water']>0)))errors.push('R did not fire Still Water');
 console.log(errors.join('\n')||'Attack wheel preview passed.');await browser.close();process.exit(errors.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
