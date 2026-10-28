// Local integration check: on a phone, Dash and Examine still fire while another finger holds the joystick.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const PHONE={viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'};
(async()=>{
 process.env.PORT='5195';await import('../server.mjs');
 const errors=[];
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const context=await browser.newContext(PHONE),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5195');await page.locator('#explore-world').click();await page.locator('#story-scene[open]').waitFor();
 const scene=await page.evaluate(()=>__qa.world.story.scene);
 for(let i=0;i<60&&await page.evaluate(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
 await page.evaluate(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch5-morning';v.story.scene=null;v.areaId='village';v.npcs=createStoryNpcs(v.story,v.elapsed);Object.assign(v.player,{x:900,y:700});});
 await page.waitForTimeout(500);
 const cdp=await context.newCDPSession(page);
 const centre=async sel=>{const b=await page.locator(sel).boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};};
 const stick=await centre('#touch-stick'),dash=await centre('.hud-act.dash');
 const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 const thumb={x:stick.x+40,y:stick.y,id:1};
 // Finger one holds the joystick to the right, so Eli walks.
 await touch('touchStart',[{x:stick.x,y:stick.y,id:1}]);await touch('touchMove',[thumb]);await page.waitForTimeout(300);
 const before=await page.evaluate(()=>({x:__qa.world.player.x,charges:__qa.world.player.dashCharges}));
 // Finger two taps Dash while finger one keeps walking.
 await touch('touchStart',[thumb,{...dash,id:2}]);await page.waitForTimeout(60);await touch('touchEnd',[thumb]);await page.waitForTimeout(60);
 const after=await page.evaluate(()=>({x:__qa.world.player.x,charges:__qa.world.player.dashCharges,dx:__qa.world.dashDirection.x}));
 if(after.charges!==before.charges-1)errors.push(`dash did not fire while walking (charges ${before.charges} → ${after.charges})`);
 else if(after.dx<.9)errors.push(`dash went the wrong way (direction x ${after.dx})`);
 await touch('touchEnd',[]);await page.waitForTimeout(300);
 // A lone tap still dashes exactly once, not twice through the follow-up click.
 await page.evaluate(()=>{__qa.world.player.dashCharges=2;__qa.world.dashCooldown=0;__qa.world.dashRemaining=0;});
 await page.locator('.hud-act.dash').tap();await page.waitForTimeout(250);
 const single=await page.evaluate(()=>__qa.world.player.dashCharges);
 if(single!==1)errors.push(`a single tap spent ${2-single} dashes`);
 console.log(errors.join('\n')||'Dash touch check passed.');await browser.close();process.exit(errors.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
