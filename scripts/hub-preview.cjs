// Local integration preview of the shared world: two browsers, two accounts, one village.
// Needs the Realtime Database emulator on 127.0.0.1:9000 (java -jar firebase-database-emulator-*.jar --port 9000)
// and FAKE_SDK pointing at a stand-in for vendor/firebase-*.js that signs each page in as ?as=<uid> and talks to the emulator.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 process.env.PORT='5189';await import('../server.mjs');
 const out=process.env.OUT||'screenshots',sdk=fs.readFileSync(process.env.FAKE_SDK,'utf8');
 const rules=fs.readFileSync('database.rules.json','utf8');
 await fetch('http://127.0.0.1:9000/.settings/rules.json?ns=demo-wilds-preview',{method:'PUT',headers:{Authorization:'Bearer owner'},body:rules});
 await fetch('http://127.0.0.1:9000/.json?ns=demo-wilds-preview',{method:'PUT',headers:{Authorization:'Bearer owner'},body:'null'});
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const errors=[];
 async function player(uid,contextOptions={viewport:{width:1365,height:900}}){
  const page=await (await browser.newContext(contextOptions)).newPage();
  page.on('pageerror',e=>errors.push(`${uid}: ${e.message}`));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},get hub(){return hubUI.hub;}};'});});
  await page.route('**/vendor/firebase-*.js',route=>route.fulfill({contentType:'text/javascript',body:sdk}));
  await page.goto(`http://127.0.0.1:5189/?as=${uid}`);await page.locator('#explore-world').click();
  await page.locator('#story-scene[open]').waitFor();
  const w=(fn,arg)=>page.evaluate(fn,arg);
  const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
  await w(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch4-complete';v.story.scene=null;v.areaId='village';v.npcs=createStoryNpcs(v.story,v.elapsed);});
  return {page,w,shot:name=>page.screenshot({path:`${out}/${name}.png`})};
 }
 const stand=(p,dx,dy,facing='down')=>p.w(([dx,dy,facing])=>{const v=__qa.world,n=v.npcs.find(n=>n.id==='basket-carrier');Object.assign(v.player,{x:n.x+dx,y:n.y+dy,facing});},[dx,dy,facing]);
 async function goOnline(p,nick){
  await p.page.locator('#open-players').click();await p.page.locator('#players-sheet[open]').waitFor();
  await p.page.locator('#players-nick-input').waitFor({state:'visible'});
  return async()=>{await p.page.locator('#players-nick-input').fill(nick);await p.page.locator('.players-nick button').click();
   await p.page.waitForFunction(()=>__qa.hub.state==='offline');await p.page.locator('.players-online').click();await p.page.waitForFunction(()=>__qa.hub.state==='online');};
 }
 const a=await player('ua');await stand(a,-60,90,'right');
 const finishA=await goOnline(a,'Reedling');await a.page.waitForTimeout(200);await a.shot('01-pick-nickname');
 // The reserved and taken names are refused before anything is shared.
 await a.page.locator('#players-nick-input').fill('Eli');await a.page.locator('.players-nick button').click();await a.page.waitForTimeout(150);
 assert.match(await a.page.locator('.players-note').textContent(),/reserved/);
 await finishA();await a.page.waitForTimeout(300);await a.shot('02-online-alone');
 await a.page.keyboard.press('Escape');

 const b=await player('ub');await stand(b,40,70,'left');
 const finishB=await goOnline(b,'Kestrel');
 await b.page.locator('#players-nick-input').fill('reedling');await b.page.locator('.players-nick button').click();await b.page.waitForTimeout(400);
 assert.match(await b.page.locator('.players-note').textContent(),/taken/);
 await finishB();await b.page.keyboard.press('Escape');
 await a.page.waitForFunction(()=>__qa.hub.others(__qa.world).length===1);await a.page.waitForTimeout(500);
 await a.shot('03-kestrel-arrives');
 // Kestrel walks over; Reedling's screen follows smoothly.
 await b.page.keyboard.down('KeyS');await b.page.waitForTimeout(250);await b.page.keyboard.up('KeyS');await b.page.keyboard.down('KeyA');await b.page.waitForTimeout(350);
 await a.page.waitForTimeout(150);await a.shot('04-kestrel-walking');await b.page.keyboard.up('KeyA');
 const seen=await a.w(()=>__qa.hub.others(__qa.world)[0]),there=await b.w(()=>({x:__qa.world.player.x,y:__qa.world.player.y}));
 await a.page.waitForTimeout(600);const settled=await a.w(()=>__qa.hub.others(__qa.world)[0]);
 assert.ok(Math.abs(settled.x-there.x)<2&&Math.abs(settled.y-there.y)<2,`remote position settles on the sender's (${JSON.stringify(settled)} vs ${JSON.stringify(there)}, mid-walk ${JSON.stringify(seen)})`);
 await a.page.locator('#open-players').click();await a.page.locator('#players-sheet[open]').waitFor();await a.page.waitForTimeout(200);
 assert.equal(await a.page.locator('.players-row').count(),2);await a.shot('05-players-list');
 await a.page.keyboard.press('Escape');
 await b.page.locator('#open-players').click();await b.page.locator('.players-afk').click();await b.page.keyboard.press('Escape');
 await a.page.waitForFunction(()=>__qa.hub.others(__qa.world)[0]?.afk===true);await a.page.waitForTimeout(200);await a.shot('06-kestrel-away');
 // Kestrel walks into the marsh: gone from the village, still on the list.
 await b.w(()=>{const v=__qa.world;v.areaId='marsh';Object.assign(v.player,{x:600,y:600});});
 await a.page.waitForFunction(()=>__qa.hub.others(__qa.world).length===0);
 await a.page.locator('#open-players').click();await a.page.waitForTimeout(250);
 assert.match(await a.page.locator('.players-list').textContent(),/Kestrel.*Shellback Marsh/);await a.shot('07-kestrel-in-marsh');
 await a.page.keyboard.press('Escape');
 // A phone held sideways sees the same world.
 const phone=await player('uc',{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'});
 await stand(phone,0,150,'up');const finishC=await goOnline(phone,'Wren');await finishC();await phone.page.waitForTimeout(400);await phone.shot('08-phone-players');
 await phone.page.locator('#players-sheet .backpack-close').click();
 await phone.page.waitForFunction(()=>__qa.hub.others(__qa.world).length===1);await phone.page.waitForTimeout(400);await phone.shot('09-phone-world');
 // Going offline removes the player for everyone straight away.
 await a.page.locator('#open-players').click();await a.page.locator('.players-online').click();await a.page.waitForFunction(()=>__qa.hub.state==='offline');
 await phone.page.waitForFunction(()=>__qa.hub.others(__qa.world).length===0);
 assert.deepEqual(errors,[]);
 console.log('Hub preview passed');await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
