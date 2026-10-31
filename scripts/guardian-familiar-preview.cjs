// Local integration preview of the Moonfang, Rimejaw and Flitlynx familiars: well-only shards, the index panel and the followers.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5185';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5185');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const shot=name=>page.screenshot({path:`${out}/${name}.png`});
 // The morning after Chapter 5 on Willow Commons, beside the well, with the three guardians met.
 await w(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch5-morning';v.story.scene=null;v.story.lureSeen=v.story.photoSeen=true;v.areaId='village';v.npcs=createStoryNpcs(v.story,v.elapsed);
  for(const id of ['moonfang','rimejaw','flitlynx'])v.codex.add(id);Object.assign(v.player,{x:1000,y:628});});
 await page.waitForTimeout(500);await w(()=>{__qa.world.well.stones=10;});
 await w(()=>__qa.world.inspect());await page.locator('#well-sheet[open]').waitFor();
 await page.locator('.well-tab[data-pool="familiars"]').click();await page.locator('.well-details-toggle').click();await page.locator('.well-details:not([hidden])').waitFor();
 const details=await page.locator('.well-details').textContent();for(const name of ['Moonfang','Rimejaw','Flitlynx'])assert.match(details,new RegExp(name));
 await shot('01-well-familiar-pool');
 await page.locator('.well-details-toggle').click();await page.locator('.well-draw[data-count="10"]').click();
 await page.locator('.well-summon:not([hidden])').waitFor();await page.locator('.well-skip').click();await page.waitForTimeout(700);
 await shot('02-well-guardian-shards');
 const drawn=await w(()=>({...__qa.world.familiars.shards}));assert.ok(['moonfang','rimejaw','flitlynx'].some(id=>drawn[id]>0),JSON.stringify(drawn));
 await page.keyboard.press('Escape');await page.waitForTimeout(200);
 // Top every guardian up to five and look at the index panel.
 await w(async()=>{const {absorbShard}=await import('/src/familiars.js');for(const id of ['moonfang','rimejaw','flitlynx'])while((__qa.world.familiars.shards[id]||0)<5)absorbShard(__qa.world,id);});
 await page.keyboard.press('KeyI');await page.locator('#codex-sheet[open]').waitFor();
 await page.locator('.codex-entry[data-id="rimejaw"]').click();await page.waitForTimeout(400);
 assert.match(await page.locator('.codex-familiar').textContent(),/Wishing Well/);
 await page.locator('.codex-familiar').scrollIntoViewIfNeeded();await page.waitForTimeout(200);await shot('03-index-rimejaw-ready');
 await page.locator('.codex-familiar-button').click();await page.waitForTimeout(300);
 assert.equal(await w(()=>__qa.world.familiars.active),'rimejaw');
 await page.keyboard.press('KeyI');await page.waitForTimeout(200);
 for(const id of ['rimejaw','moonfang','flitlynx']){
  if(id!=='rimejaw')await w(id=>__qa.world.familiarAction(id,'combine'),id);
  await w(()=>Object.assign(__qa.world.player,{x:1000,y:700}));await page.waitForTimeout(900);await shot(`04-${id}-idle`);
  await page.keyboard.down('KeyD');await page.waitForTimeout(700);await shot(`05-${id}-running`);await page.keyboard.up('KeyD');
  // Left standing still, Brume lies down and sleeps.
  if(id==='moonfang'){await page.waitForTimeout(400);await w(()=>{__qa.world.companion.time=20;});await page.waitForTimeout(300);await shot('06-moonfang-asleep');}
  const gap=await w(()=>Math.hypot(__qa.world.companion.x-__qa.world.player.x,__qa.world.companion.y-__qa.world.player.y));
  assert.ok(gap<120,`${id} keeps up (${gap})`);assert.equal(await w(()=>__qa.world.companion.id),id);
 }
 assert.deepEqual(errors,[]);console.log('Guardian familiar preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
