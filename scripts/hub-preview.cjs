// Local integration preview of the shared world: several browsers and accounts in one village; only friends see each other.
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
 const openSheet=async p=>{await p.page.locator('#open-players').click();await p.page.locator('#players-sheet[open]').waitFor();};
 async function name(p,nick){await openSheet(p);await p.page.locator('#players-nick-input').waitFor({state:'visible'});await p.page.locator('#players-nick-input').fill(nick);await p.page.locator('.players-nick button').click();await p.page.waitForFunction(()=>__qa.hub.state==='offline');}
 const online=async p=>{await p.page.locator('.players-online').click();await p.page.waitForFunction(()=>__qa.hub.state==='online');};
 const a=await player('ua');await stand(a,-60,90,'right');
 await openSheet(a);await a.page.locator('#players-nick-input').waitFor({state:'visible'});await a.page.waitForTimeout(150);await a.shot('01-pick-nickname');
 // The reserved names are refused before anything is shared.
 await a.page.locator('#players-nick-input').fill('Eli');await a.page.locator('.players-nick button').click();await a.page.waitForTimeout(150);
 assert.match(await a.page.locator('.players-note').textContent(),/reserved/);
 await a.page.locator('#players-nick-input').fill('Reedling');await a.page.locator('.players-nick button').click();await a.page.waitForFunction(()=>__qa.hub.state==='offline');
 await online(a);await a.page.waitForTimeout(200);await a.shot('02-no-friends-yet');await a.page.keyboard.press('Escape');

 const b=await player('ub');await stand(b,40,70,'left');await name(b,'Kestrel');await online(b);
 // A stranger stands right beside them and is never shown to either.
 const c=await player('uc');await stand(c,0,40,'up');await name(c,'Stranger');await online(c);await c.page.keyboard.press('Escape');
 await openSheet(a);await a.page.locator('#players-add-input').fill('Kestrel');await a.page.locator('.players-add button').click();
 await a.page.waitForFunction(()=>/Request sent/.test(document.querySelector('.players-note').textContent));await a.page.waitForTimeout(150);await a.shot('03-request-sent');await a.page.keyboard.press('Escape');
 await b.page.waitForFunction(()=>__qa.hub.requests.size===1);await b.page.waitForTimeout(200);await b.shot('04-request-received');
 await b.page.locator('.players-accept').click();await b.page.waitForFunction(()=>__qa.hub.friends.size===1);await b.page.keyboard.press('Escape');
 await a.page.waitForFunction(()=>__qa.hub.others(__qa.world).length===1);await a.page.waitForTimeout(500);
 assert.deepEqual(await a.w(()=>__qa.hub.others(__qa.world).map(o=>o.name)),['Kestrel']);
 assert.deepEqual(await c.w(()=>__qa.hub.others(__qa.world).length),0);
 await a.shot('05-friend-arrives');
 // Kestrel walks over; Reedling's screen follows smoothly.
 await b.page.keyboard.down('KeyS');await b.page.waitForTimeout(250);await b.page.keyboard.up('KeyS');await b.page.keyboard.down('KeyA');await b.page.waitForTimeout(350);
 await a.page.waitForTimeout(150);await a.shot('06-friend-walking');await b.page.keyboard.up('KeyA');
 const there=await b.w(()=>({x:__qa.world.player.x,y:__qa.world.player.y}));
 await a.page.waitForTimeout(700);const settled=await a.w(()=>__qa.hub.others(__qa.world)[0]);
 assert.ok(Math.abs(settled.x-there.x)<2&&Math.abs(settled.y-there.y)<2,`remote position settles on the sender's (${JSON.stringify(settled)} vs ${JSON.stringify(there)})`);
 await b.page.locator('#open-players').click();await b.page.locator('.players-afk').click();await b.page.keyboard.press('Escape');
 await a.page.waitForFunction(()=>__qa.hub.others(__qa.world)[0]?.afk===true);await a.page.waitForTimeout(200);await a.shot('07-friend-away');
 // Kestrel walks into the marsh: gone from the village, still on the list.
 await b.w(()=>{const v=__qa.world;v.areaId='marsh';Object.assign(v.player,{x:600,y:600});});
 await a.page.waitForFunction(()=>__qa.hub.others(__qa.world).length===0);
 await openSheet(a);await a.page.waitForTimeout(250);
 assert.match(await a.page.locator('.players-friends').textContent(),/Kestrel.*Shellback Marsh/);
 assert.doesNotMatch(await a.page.locator('.players-friends').textContent(),/Stranger/);await a.shot('08-friends-list');
 await a.page.keyboard.press('Escape');
 // A phone held sideways, as Kestrel's second device would be: requests and the list fit.
 const phone=await player('ud',{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'});
 await stand(phone,0,150,'up');await name(phone,'Wren');await online(phone);
 await phone.page.locator('#players-add-input').fill('Reedling');await phone.page.locator('.players-add button').click();
 await a.page.waitForFunction(()=>__qa.hub.requests.size===1);await openSheet(a);await a.page.locator('.players-accept').click();await a.page.keyboard.press('Escape');
 await phone.page.waitForFunction(()=>__qa.hub.friends.size===1);await phone.page.waitForTimeout(300);await phone.shot('09-phone-friends');
 await phone.page.locator('#players-sheet .backpack-close').click();
 await phone.page.waitForFunction(()=>__qa.hub.others(__qa.world).length===1);await phone.page.waitForTimeout(400);await phone.shot('10-phone-world');
 // Chat: Enter opens the box; plain text reaches every online friend, /msg one friend, and strangers hear nothing.
 await a.page.locator('canvas#arena').focus();await a.page.keyboard.press('Enter');await a.page.locator('#chat-input').waitFor({state:'visible'});
 await a.page.keyboard.type('Anyone up for fishing at the landing?');await a.page.keyboard.press('Enter');
 await b.page.waitForFunction(()=>__qa.hub.log.some(l=>l.text==='Anyone up for fishing at the landing?'));
 await phone.page.waitForFunction(()=>__qa.hub.log.some(l=>l.text==='Anyone up for fishing at the landing?'));
 assert.equal(await c.w(()=>__qa.hub.log.length),0,'the stranger hears nothing');
 await b.page.waitForTimeout(900);await b.page.locator('canvas#arena').focus();await b.page.keyboard.press('Slash');await b.page.locator('#chat-input').waitFor({state:'visible'});
 assert.equal(await b.page.locator('#chat-input').inputValue(),'/');
 await b.page.keyboard.type('msg Reedling give me a minute, finishing a quest');await b.page.keyboard.press('Enter');
 await a.page.waitForFunction(()=>__qa.hub.log.some(l=>l.kind==='from'));
 await a.page.waitForTimeout(900);await a.page.keyboard.type('/list');await a.page.keyboard.press('Enter');await a.page.waitForTimeout(300);
 await a.shot('11-chat-open');
 await a.page.keyboard.press('Escape');await a.page.waitForTimeout(300);await a.shot('12-chat-closed');
 await phone.page.waitForTimeout(900);await phone.page.locator('#open-chat').tap();await phone.page.locator('#chat-input').waitFor({state:'visible'});
 await phone.page.locator('#chat-input').fill('on my way!');await phone.page.locator('.chat-send').tap();
 await a.page.waitForFunction(()=>__qa.hub.log.some(l=>l.text==='on my way!'));await phone.page.waitForTimeout(300);await phone.shot('13-phone-chat');
 await phone.page.locator('#chat-input').press('Escape');
 // Going offline removes the player for friends straight away.
 await openSheet(a);await a.page.locator('.players-online').click();await a.page.waitForFunction(()=>__qa.hub.state==='offline');
 await phone.page.waitForFunction(()=>__qa.hub.others(__qa.world).length===0);
 assert.deepEqual(errors,[]);
 console.log('Hub preview passed');await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
