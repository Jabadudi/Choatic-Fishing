// Local preview of the player plate (level, name, HP, MP) and the three EXP looks, each with its hover card showing the exact EXP.
// OUT=<folder> sets where the screenshots go.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5198';await import('../server.mjs');
 const out=process.env.OUT||'screenshots',errors=[];
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const open=async(options,name)=>{
  const page=await (await browser.newContext(options)).newPage();
  page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
  await page.goto('http://127.0.0.1:5198');await page.locator('#explore-world').click();await page.waitForFunction(()=>window.__qa?.world);
  await page.evaluate(()=>__qa.world.skipStory?.());await page.waitForTimeout(400);
  for(let i=0;i<5;i++)if(await page.locator('#story-scene[open]').count())await page.keyboard.press('Escape');
  // Level 4 with 137 of 225 EXP, a little hurt, some reserves spent.
  await page.evaluate(()=>{const v=__qa.world,p=v.progression;p.level=4;p.xp=137;v.player.health=Math.round(p.maxHealth*.72);if(v.core)v.core.reserves=58;});
  await page.waitForTimeout(500);return page;
 };
 const pick=(page,look)=>page.evaluate(l=>{document.getElementById('hud-shell').dataset.exp=l;},look);
 const looks=[['plate','#hud-xp'],['edge','#hud-exp-edge'],['ring','#hud-menu']];
 const desk=await open({viewport:{width:1366,height:768},deviceScaleFactor:2},'desktop');
 assert.match(await desk.locator('#player-hp-text').innerText(),/\d+ \/ \d+/);assert.equal(await desk.locator('#hud-level').innerText(),'Lv.4');
 for(const [i,[look,target]] of looks.entries()){
  await pick(desk,look);await desk.mouse.move(10,400);await desk.waitForTimeout(200);
  const box=await desk.locator(target).boundingBox();await desk.mouse.move(box.x+box.width*.6,box.y+box.height/2);await desk.waitForTimeout(250);
  assert.equal(await desk.locator('#hud-exp-tip').isVisible(),true,`${look}: hover card shows`);
  assert.equal(await desk.locator('#hud-exp-tip b').innerText(),'EXP 137 / 225 (60.8%)');assert.equal(await desk.locator('#hud-exp-tip span').innerText(),'88 more to reach Lv. 5');
  await desk.screenshot({path:`${out}/0${i+1}-option-${look}-desktop.png`});
  const clip=look==='ring'?{x:0,y:0,width:330,height:140}:{x:420,y:look==='edge'?640:660,width:526,height:128};
  await desk.screenshot({path:`${out}/0${i+1}-option-${look}-closeup.png`,clip});
 }
 const phone=await open({viewport:{width:844,height:390},isMobile:true,hasTouch:true},'phone');
 for(const [i,[look,target]] of looks.entries()){
  await pick(phone,look);await phone.waitForTimeout(150);if(look!=='ring')await phone.locator(target).tap();await phone.waitForTimeout(200);
  await phone.screenshot({path:`${out}/0${i+4}-option-${look}-phone.png`});
 }
 console.log(errors.join('\n')||'Player plate preview passed.');await browser.close();process.exit(errors.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
