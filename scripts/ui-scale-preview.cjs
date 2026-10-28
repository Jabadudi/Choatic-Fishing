// Local integration preview of the UI size setting: the HUD and touch controls at the smallest, default and largest sizes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const PHONE={viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'};
const SE={...PHONE,viewport:{width:667,height:375}};
(async()=>{
 process.env.PORT='5197';await import('../server.mjs');
 const out=process.env.OUT||'screenshots',errors=[];
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 async function open(options,name,uiScale){
  const page=await (await browser.newContext(options)).newPage();
  await page.addInitScript(s=>localStorage.setItem('the-wilds-settings-v1',JSON.stringify({uiScale:s})),uiScale);
  page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},get touch(){return touchState;}};'});});
  await page.goto('http://127.0.0.1:5197');await page.locator('#explore-world').click();await page.locator('#story-scene[open]').waitFor();
  const scene=await page.evaluate(()=>__qa.world.story.scene);
  for(let i=0;i<60&&await page.evaluate(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
  await page.evaluate(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch5-morning';v.story.scene=null;v.story.lureSeen=v.story.photoSeen=true;v.areaId='village';v.npcs=createStoryNpcs(v.story,v.elapsed);Object.assign(v.player,{x:900,y:700});v.well.awake=true;v.inventory.marks=37;
   for(const name of ['Hunting Bow','Hunting Knife','Healing Salve']){v.inventory.receive({name});v.itemsFound.add(name);}v.inventory.slots[0]=v.inventory.storedItems[0];v.inventory.slots[1]=v.inventory.storedItems[1];v.inventory.slots[2]=v.inventory.storedItems[2];});
  await page.waitForTimeout(700);return page;
 }
 // No two HUD pieces may cover each other.
 async function noOverlap(page,label){
  const ids=['#hud-menu','#hud-map','#hud-tracker','#hud-icons','.hotbar','#hud-vitals','.radio-chip','#touch-use','#touch-examine','#touch-stick','.hud-act.tidal','.hud-act.whirlpool','.hud-act.dash','.hud-act.use','.hud-act.talk'];
  const boxes=[];for(const id of ids){const l=page.locator(id).first();if(await l.count()&&await l.isVisible())boxes.push([id,await l.boundingBox()]);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const [a,A]=boxes[i],[b,B]=boxes[j];if(A.x<B.x+B.width-1&&B.x<A.x+A.width-1&&A.y<B.y+B.height-1&&B.y<A.y+A.height-1&&!(a==='#hud-actions'||b==='#hud-actions'))errors.push(`${label}: ${a} overlaps ${b}`);}
  // Every hotbar slot lines up on the same right edge, whichever stylesheet built it.
  const edges=await page.$$eval('.hotbar .slot',slots=>slots.filter(s=>s.offsetParent).map(s=>Math.round(s.querySelector('.slot-icon').getBoundingClientRect().right)));
  if(new Set(edges).size>1)errors.push(`${label}: hotbar slots are not aligned (${edges.join(', ')})`);
 const vw=page.viewportSize();for(const [id,B] of boxes)if(B.x<0||B.y<0||B.x+B.width>vw.width+1||B.y+B.height>vw.height+1)errors.push(`${label}: ${id} is off screen`);
 }
 const TABLET={viewport:{width:1180,height:820},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:PHONE.userAgent};
 const screens=[[PHONE,'phone'],[SE,'iphone-se'],[TABLET,'tablet'],[{viewport:{width:1366,height:768}},'desktop'],[{viewport:{width:1920,height:1080}},'desktop-hd'],[{viewport:{width:1024,height:640}},'laptop']];
 for(const [options,device] of screens)for(const scale of (process.env.SCALES||'.7,1,1.5').split(',').map(Number)){
  const label=`${device}-${Math.round(scale*100)}`,page=await open(options,label,scale);
  // The HUD draws at the saved size, or the largest this screen fits.
  const [zoom,cap,base]=await page.evaluate(async s=>{const {uiScaleLimit}=await import('/src/preferences.js');const big=innerHeight>=600&&innerWidth>=900;return [parseFloat(getComputedStyle(document.querySelector('#hud-shell')).zoom),uiScaleLimit(innerWidth,innerHeight),big?1.3:1];},scale);
  if(Math.abs(zoom-base*Math.min(scale,cap))>.01)errors.push(`${label}: HUD zoom is ${zoom}, cap ${cap}`);
  console.log(label,'cap',cap,'zoom',zoom);
  await noOverlap(page,label);await page.screenshot({path:`${out}/ui-scale-${label}.png`});
  if(device==='phone'||device==='tablet'){
   // The stick still reaches full tilt at the edge of its ring, whatever the size.
   const b=await page.locator('#touch-stick').boundingBox(),cx=b.x+b.width/2,cy=b.y+b.height/2;
   const cdp=await page.context().newCDPSession(page),touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
   await touch('touchStart',cx,cy);await touch('touchMove',cx+b.width*.46,cy);await page.waitForTimeout(50);
   const x=await page.evaluate(()=>__qa.touch?.x);await touch('touchEnd');
   if(x!==undefined&&x<.95)errors.push(`${label}: stick only reached ${x}`);
  }
  await page.context().close();
 }
 const desk=await open({viewport:{width:1366,height:768}},'settings',1);
 await desk.keyboard.press('F10');await desk.locator('#settings-display-tab').click();await desk.locator('#settings-ui-bigger').click();await desk.locator('#settings-ui-bigger').click();
 if(await desk.locator('#settings-ui-scale-value').innerText()!=='110%')errors.push('settings: A+ did not step to 110%');
 const zoom=await desk.$eval('#hud-shell',el=>parseFloat(getComputedStyle(el).zoom));if(Math.abs(zoom-1.43)>.01)errors.push(`settings: live zoom is ${zoom}`);
 await desk.screenshot({path:`${out}/ui-scale-settings.png`});
 console.log(errors.join('\n')||'UI scale preview passed.');await browser.close();process.exit(errors.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
