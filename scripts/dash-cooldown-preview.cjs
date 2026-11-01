// Local preview: the dash button's cooldown sweep right after a dash, halfway through the recharge, and ready again.
const {chromium}=require('playwright');
const OUT=process.env.OUT||'previews/dash-cooldown';
const SIZES={phone:{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2},desktop:{viewport:{width:1280,height:720}}};
(async()=>{
 process.env.PORT='5196';await import('../server.mjs');require('node:fs').mkdirSync(OUT,{recursive:true});
 const errors=[];const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 for(const [name,size] of Object.entries(SIZES)){
  const context=await browser.newContext(size),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
  await page.goto('http://127.0.0.1:5196');await page.locator('#explore-world').click();await page.locator('#story-scene[open]').waitFor();
  const scene=await page.evaluate(()=>__qa.world.story.scene);
  for(let i=0;i<60&&await page.evaluate(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
  await page.evaluate(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch5-morning';v.story.scene=null;v.areaId='village';v.npcs=createStoryNpcs(v.story,v.elapsed);Object.assign(v.player,{x:900,y:700});});
  await page.waitForTimeout(400);
  const shot=async(tag,set)=>{await page.evaluate(set);await page.waitForTimeout(120);const b=await page.locator('#hud-actions').boundingBox();await page.screenshot({path:`${OUT}/${name}-${tag}.png`,clip:{x:b.x-20,y:b.y-20,width:b.width+40,height:b.height+40}});};
  await shot('1-just-dashed',()=>{const v=__qa.world;v.player.dashCharges=0;v.dashRemaining=0;v.dashCooldown=1.9;});
  await shot('2-halfway',()=>{const v=__qa.world;v.player.dashCharges=0;v.dashRemaining=0;v.dashCooldown=1;});
  await shot('3-two-charges-one-back',()=>{const v=__qa.world;v.progression.upgrades.dash=1;v.player.dashCharges=1;v.dashRemaining=0;v.dashCooldown=.7;});
  await shot('4-ready',()=>{const v=__qa.world;v.progression.upgrades.dash=0;v.player.dashCharges=1;v.dashRemaining=0;v.dashCooldown=0;});
  const waiting=await page.evaluate(()=>{const v=__qa.world;v.player.dashCharges=0;v.dashCooldown=1;return new Promise(r=>setTimeout(()=>r(document.querySelector('.hud-act.dash').classList.contains('waiting')),120));});
  if(!waiting)errors.push(`${name}: dash button not dimmed while recharging`);
  await context.close();
 }
 console.log(errors.join('\n')||'Dash cooldown preview saved.');await browser.close();process.exit(errors.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
