// Local integration preview of the exploring HUD: phone held sideways, desktop, the menu, pickups, a first find, reeling, and a region banner.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const PHONE={viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'};
const SE={...PHONE,viewport:{width:667,height:375}};
(async()=>{
 process.env.PORT='5194';await import('../server.mjs');
 const out=process.env.OUT||'screenshots',errors=[];
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 async function open(options,name){
  const page=await (await browser.newContext(options)).newPage();
  page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
  await page.goto('http://127.0.0.1:5194');await page.locator('#explore-world').click();await page.locator('#story-scene[open]').waitFor();
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
  const vw=page.viewportSize();for(const [id,B] of boxes)if(B.x<0||B.y<0||B.x+B.width>vw.width+1||B.y+B.height>vw.height+1)errors.push(`${label}: ${id} is off screen`);
 }
 const phone=await open(PHONE,'phone');
 await noOverlap(phone,'phone');await phone.screenshot({path:`${out}/01-phone-explore.png`});
 // Pickups slide in on the left; the first one ever found gets a card.
 await phone.evaluate(()=>{__qa.world.inventory.receive({name:'River Pearl',description:'A small pearl, faintly warm, found under the shell.'});__qa.world.inventory.receive({name:'Sardine'});});
 await phone.waitForTimeout(400);assert.equal(await phone.locator('#hud-found').isVisible(),true);assert.match(await phone.locator('.hud-found-card b').textContent(),/River Pearl|Sardine/);
 assert.ok(await phone.locator('.hud-got').count()>=1);await phone.screenshot({path:`${out}/02-phone-first-find.png`});
 await phone.locator('#hud-found').tap();await phone.waitForTimeout(300);
 if(await phone.locator('#hud-found').isVisible()){await phone.locator('#hud-found').tap();await phone.waitForTimeout(200);}
 await phone.locator('#hud-menu').tap();await phone.locator('#hud-menu-sheet[open]').waitFor();await phone.waitForTimeout(200);await phone.screenshot({path:`${out}/03-phone-menu.png`});
 await phone.locator('.hud-sheet-item',{hasText:'Backpack'}).tap();await phone.locator('#backpack-sheet[open], dialog[open]').first().waitFor();await phone.waitForTimeout(200);
 await phone.keyboard.press('Escape');await phone.waitForTimeout(300);
 // Hotbar pages on a phone.
 await phone.locator('#hotbar-pager').tap();await phone.waitForTimeout(200);assert.equal(await phone.locator('#slot-5').isVisible(),true);assert.equal(await phone.locator('#slot-rod').isVisible(),false);
 await phone.locator('#hotbar-pager').tap();
 // Walking into another region shows its name.
 await phone.evaluate(()=>{Object.assign(__qa.world.player,{x:1500,y:400});});await phone.waitForTimeout(500);await phone.screenshot({path:`${out}/04-phone-region.png`});
 await phone.evaluate(()=>{__qa.world.fishing.state='reeling';});await phone.waitForTimeout(300);await phone.screenshot({path:`${out}/05-phone-reeling.png`});await phone.evaluate(()=>{__qa.world.fishing.state='idle';});
 const se=await open(SE,'iphone-se');await noOverlap(se,'iphone-se');await se.screenshot({path:`${out}/06-iphone-se.png`});
 const desk=await open({viewport:{width:1366,height:768}},'desktop');await noOverlap(desk,'desktop');await desk.screenshot({path:`${out}/07-desktop.png`});
 await desk.locator('#hud-menu').click();await desk.waitForTimeout(200);await desk.screenshot({path:`${out}/08-desktop-menu.png`});await desk.keyboard.press('Escape');
 await desk.evaluate(()=>{__qa.world.fishing.state='reeling';});await desk.waitForTimeout(300);await desk.screenshot({path:`${out}/10-desktop-reeling.png`});await desk.evaluate(()=>{__qa.world.fishing.state='idle';});
 const small=await open({viewport:{width:1024,height:640}},'laptop');await noOverlap(small,'laptop');await small.screenshot({path:`${out}/09-laptop.png`});
 console.log(errors.join('\n')||'HUD preview passed.');await browser.close();process.exit(errors.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
