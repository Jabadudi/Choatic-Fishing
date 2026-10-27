// Local integration preview of the Portable Radio: adding song files, playing, the mini player, the radio beside Eli while fishing, and phone layouts.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
// A short generated tone stands in for a song file.
function tone(seconds=6,rate=8000){
 const n=seconds*rate,data=Buffer.alloc(44+n*2);data.write('RIFF',0);data.writeUInt32LE(36+n*2,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(n*2,40);
 for(let i=0;i<n;i++)data.writeInt16LE(Math.round(Math.sin(i/rate*2*Math.PI*440)*3000),44+i*2);return data;
}
(async()=>{
 process.env.PORT='5192';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required'],...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!/youtube/.test(r.url()))errors.push(`${r.status()} ${r.url()}`);});
 await page.route(/youtube\.com/,route=>route.abort());
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},get radio(){return radioUI;}};'});});
 await page.goto('http://127.0.0.1:5192');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const shot=name=>page.screenshot({path:`${out}/${name}.png`});
 const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
 await w(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch5-morning';v.story.scene=null;v.story.lureSeen=v.story.photoSeen=true;v.areaId='village';v.npcs=createStoryNpcs(v.story,v.elapsed);Object.assign(v.player,{x:900,y:700});});
 await page.waitForTimeout(400);
 assert.equal(await page.locator('.radio-chip.empty').isVisible(),true);await shot('00-radio-chip-empty');await page.locator('.radio-chip-open').click();await page.locator('#radio-sheet[open]').waitFor();await page.keyboard.press('KeyO');await page.waitForTimeout(150);assert.equal(await w(()=>__qa.radio.open),false);
 await page.keyboard.press('KeyO');await page.locator('#radio-sheet[open]').waitFor();await page.waitForTimeout(200);
 assert.match(await page.locator('.radio-songs').textContent(),/Add songs you have/);await shot('01-radio-empty');
 await page.locator('.radio-files').setInputFiles([{name:'Test Tone - Sine 440.wav',mimeType:'audio/wav',buffer:tone()},{name:'Second Tone.wav',mimeType:'audio/wav',buffer:tone(4)},{name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('hi')}]);
 await page.waitForTimeout(400);
 assert.equal(await page.locator('.radio-song').count(),2);assert.match(await page.locator('.radio-note').textContent(),/2 songs added.*notes\.txt is not a song file/);
 await page.locator('.radio-song-play').first().click();await page.waitForTimeout(1200);
 assert.equal(await w(()=>__qa.radio.playing),true);assert.match(await page.locator('.radio-lcd-title').textContent(),/SINE 440/);
 assert.match(await page.locator('#music-status').textContent(),/Paused while the radio plays/);
 await shot('02-radio-playing');
 await page.locator('.radio-tab[data-kind="youtube"]').click();await page.locator('.radio-url').fill('https://open.spotify.com/track/1');await page.locator('.radio-paste button').click();await page.waitForTimeout(200);
 assert.match(await page.locator('.radio-note').textContent(),/doesn’t look like a YouTube link/);
 await page.locator('.radio-url').fill('https://youtu.be/dQw4w9WgXcQ');await page.locator('.radio-paste button').click();await page.waitForTimeout(400);
 assert.equal(await page.locator('.radio-song').count(),1);await shot('03-radio-youtube-tab');
 await page.locator('.radio-tab[data-kind="file"]').click();
 await page.keyboard.press('Escape');await page.waitForTimeout(300);assert.equal(await w(()=>__qa.radio.open),false);
 assert.equal(await w(()=>__qa.radio.playing),true);assert.equal(await page.locator('.radio-chip').isVisible(),true);
 // Eli sets the radio down beside him while he fishes.
 await w(()=>{__qa.world.fishing.state='waiting';});await page.waitForTimeout(300);await shot('04-mini-player-and-fishing');
 await w(()=>{__qa.world.fishing.state='idle';});
 await page.locator('.radio-chip-play').click();await page.waitForTimeout(200);assert.equal(await w(()=>__qa.radio.playing),false);
 await page.locator('.radio-chip-next').click();await page.waitForTimeout(600);assert.equal(await w(()=>__qa.radio.playing),true);assert.match(await page.locator('.radio-chip-text b').textContent(),/Second Tone/);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
 await w(()=>__qa.radio.show());await page.waitForTimeout(300);await shot('05-radio-phone');
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(300);
 await w(()=>__qa.radio.show());await page.waitForTimeout(300);await shot('07-radio-phone-landscape');
 await w(()=>__qa.radio.close());await page.waitForTimeout(300);await shot('08-phone-landscape-explore');
 // The playlist survives a reload.
 await page.reload();await page.locator('#explore-world').waitFor();
 const saved=await page.evaluate(async()=>{const {RadioStore}=await import('/src/radio-store.js');const r=await new RadioStore().load();return r.tracks.map(t=>t.title);});
 assert.deepEqual(saved,['Sine 440','Second Tone','YouTube song']);

 // A real phone held sideways: touch layout, with the mini player clear of the other buttons.
 const phone=await (await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'})).newPage();
 phone.on('pageerror',e=>errors.push(e.message));await phone.route(/youtube\.com/,route=>route.abort());
 await phone.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},get radio(){return radioUI;}};'});});
 await phone.goto('http://127.0.0.1:5192');await phone.locator('#explore-world').click();await phone.locator('#story-scene[open]').waitFor();
 await phone.evaluate(async()=>{const {createStoryNpcs}=await import('/src/story.js');const v=__qa.world;v.story.stage='ch5-morning';v.story.scene=null;v.story.lureSeen=v.story.photoSeen=true;v.areaId='village';v.npcs=createStoryNpcs(v.story,v.elapsed);Object.assign(v.player,{x:900,y:700});});
 await phone.waitForTimeout(600);await phone.screenshot({path:`${out}/09-touch-landscape-explore.png`});
 const chipBox=await phone.locator('.radio-chip').boundingBox();assert.ok(chipBox);
 for(const other of ['#open-atlas','#open-quests','#open-codex','#touch-settings','#settings-open','.hotbar']){const l=phone.locator(other).first();if(await l.count()&&await l.isVisible()){const b=await l.boundingBox();assert.ok(!(b.x<chipBox.x+chipBox.width&&chipBox.x<b.x+b.width&&b.y<chipBox.y+chipBox.height&&chipBox.y<b.y+b.height),`radio chip overlaps ${other}`);}}
 await phone.locator('.radio-chip-open').tap();await phone.locator('#radio-sheet[open]').waitFor();await phone.waitForTimeout(300);await phone.screenshot({path:`${out}/10-touch-landscape-radio.png`});
 assert.deepEqual(errors,[]);console.log('Radio preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
