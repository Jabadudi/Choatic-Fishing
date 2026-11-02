// Local preview of the Region Core skills menu: tiers, a skill's numbers, Learn, Equip, the wheel slots and SP Reset.
const {chromium}=require('playwright');
const PHONE={viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'};
(async()=>{
 process.env.PORT='5196';await import('../server.mjs');
 const out=process.env.OUT||'screenshots',errors=[];
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 async function open(options,name){
  const page=await (await browser.newContext(options)).newPage();
  page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
  await page.goto('http://127.0.0.1:5196');await page.locator('#explore-world').click();await page.locator('#story-scene[open]').waitFor();
  const scene=await page.evaluate(()=>__qa.world.story.scene);
  for(let i=0;i<60&&await page.evaluate(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
  await page.evaluate(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch5-morning';v.story.scene=null;v.story.lureSeen=v.story.photoSeen=true;v.areaId='landing';v.npcs=createStoryNpcs(v.story,v.elapsed);
   v.story.coreIngested=v.story.callAwakened=true;v.progression.level=34;v.message='';});
  await page.waitForTimeout(500);return page;
 }
 const desk=await open({viewport:{width:1366,height:768}},'desktop');
 await desk.evaluate(()=>document.querySelector('#open-skills').click());await desk.locator('#skills-sheet[open]').waitFor();
 await desk.locator('[data-skill="core"]').click();await desk.locator('[data-core-skill="still-water"]').click();
 for(let i=0;i<3;i++)await desk.locator('[data-core-learn]').click();
 await desk.screenshot({path:`${out}/01-core-tier1.png`});
 if(await desk.evaluate(async()=>{const {coreSkillLevel}=await import('/src/core-skills.js');return coreSkillLevel(__qa.world,'still-water');})!==4)errors.push('Learn did not raise Still Water');
 await desk.locator('[data-core-equip="1"]').click();
 await desk.locator('[data-core-skill="steady-heart"]').click();await desk.locator('[data-core-learn]').click();
 await desk.screenshot({path:`${out}/02-core-equip-passive.png`});
 await desk.locator('[data-core-tier="2"]').click();await desk.locator('[data-core-skill="undertow"]').click();
 await desk.screenshot({path:`${out}/03-core-tier2.png`});
 await desk.locator('[data-core-tier="4"]').click();await desk.screenshot({path:`${out}/04-core-tier4-closed.png`});
 await desk.locator('[data-core-remove="0"]').click();await desk.locator('.core-reset').click();await desk.screenshot({path:`${out}/05-core-reset-confirm.png`});
 await desk.keyboard.press('Escape');await desk.waitForTimeout(300);await desk.screenshot({path:`${out}/06-wheel-empty-slot.png`});
 const phone=await open(PHONE,'phone');
 await phone.evaluate(()=>document.querySelector('#open-skills').click());await phone.locator('#skills-sheet[open]').waitFor();
 await phone.locator('[data-skill="core"]').tap();await phone.locator('[data-core-skill="reeds-call"]').tap();
 await phone.locator('[data-core-skill="reeds-call"]').scrollIntoViewIfNeeded();await phone.screenshot({path:`${out}/07-phone-core.png`});
 // The whole window fits a phone screen held sideways: no page scroll in either direction.
 for(const [label,size] of [['pixel',{width:844,height:390}],['iphone-se',{width:667,height:375}]]){
  await phone.setViewportSize(size);await phone.waitForTimeout(250);
  const fit=await phone.evaluate(()=>{const d=document.querySelector('#skills-sheet'),r=d.getBoundingClientRect();return {tall:d.scrollHeight>d.clientHeight+1,out:r.bottom>innerHeight+1||r.top<-1};});
  if(fit.tall||fit.out)errors.push(`${label}: skill window does not fit one screen`);
  await phone.screenshot({path:`${out}/08-phone-fit-${label}.png`});
 }
 const wide=await phone.evaluate(()=>document.querySelector('#skills-sheet').scrollWidth>document.querySelector('#skills-sheet').clientWidth+1);if(wide)errors.push('phone menu scrolls sideways');
 console.log(errors.join('\n')||'Core skills preview passed.');await browser.close();process.exit(errors.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
