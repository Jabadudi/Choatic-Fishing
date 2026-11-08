// Local preview of the player plate (HP, Eli's portrait with the level, mana, XP) and the XP hover card showing the exact EXP.
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
  // Level 4 with 1,137 of 1,920 EXP, a little hurt, some reserves spent.
  await page.evaluate(()=>{const v=__qa.world,p=v.progression;p.level=4;p.xp=1137;v.player.health=Math.round(p.maxHealth*.72);if(v.core)v.core.reserves=58;});
  await page.waitForTimeout(500);return page;
 };
 const desk=await open({viewport:{width:1366,height:768},deviceScaleFactor:2},'desktop');
 assert.match(await desk.locator('#player-hp-text').innerText(),/\d+ \/ \d+/);assert.equal(await desk.locator('#hud-level').innerText(),'Lv. 4');
 assert.equal(await desk.locator('#hud-xp .plate-text').innerText(),'1,137 / 1,920');assert.equal(await desk.locator('#hud-mp .plate-text').innerText(),'58 / 100');
 await desk.screenshot({path:`${out}/01-desktop.png`});
 const box=await desk.locator('#hud-xp').boundingBox();await desk.mouse.move(box.x+box.width*.35,box.y+box.height-3);await desk.waitForTimeout(250);
 assert.equal(await desk.locator('#hud-exp-tip').isVisible(),true,'hover card shows');
 assert.equal(await desk.locator('#hud-exp-tip b').innerText(),'EXP 1,137 / 1,920 (59.2%)');assert.equal(await desk.locator('#hud-exp-tip span').innerText(),'783 more to reach Lv. 5');
 await desk.screenshot({path:`${out}/02-desktop-xp-hover.png`});
 await desk.screenshot({path:`${out}/03-closeup.png`,clip:{x:383,y:580,width:600,height:188}});
 // The portrait still opens the menu.
 await desk.mouse.move(10,300);await desk.locator('#hud-menu').click();await desk.locator('#hud-menu-sheet[open]').waitFor();await desk.keyboard.press('Escape');
 const phone=await open({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2},'phone');
 await phone.screenshot({path:`${out}/04-phone.png`});await phone.locator('#hud-xp').tap();await phone.waitForTimeout(200);await phone.screenshot({path:`${out}/05-phone-xp-tap.png`});
 console.log(errors.join('\n')||'Player plate preview passed.');await browser.close();process.exit(errors.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
