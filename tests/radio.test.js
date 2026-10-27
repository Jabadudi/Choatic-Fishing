import test from 'node:test';
import assert from 'node:assert/strict';
import {parseYouTube,songFromFileName,formatTime,normalizeRadio,nextIndex,previousIndex,addTrack,removeTrack,createRadio} from '../src/radio.js';
import {BINDING_ACTIONS,DEFAULT_BINDINGS} from '../src/input-bindings.js';

test('YouTube links of every common shape give a video or playlist id',()=>{
 assert.deepEqual(parseYouTube('https://youtu.be/dQw4w9WgXcQ?si=abc'),{videoId:'dQw4w9WgXcQ',listId:null});
 assert.deepEqual(parseYouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG'),{videoId:'dQw4w9WgXcQ',listId:'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG'});
 assert.deepEqual(parseYouTube('https://m.youtube.com/shorts/dQw4w9WgXcQ'),{videoId:'dQw4w9WgXcQ',listId:null});
 assert.deepEqual(parseYouTube('https://music.youtube.com/playlist?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG'),{videoId:null,listId:'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG'});
 assert.equal(parseYouTube('https://open.spotify.com/track/abc'),null);
 assert.equal(parseYouTube('not a link'),null);
 assert.equal(parseYouTube('https://youtube.com/watch?v=<script>'),null);
});

test('song names come from the file name',()=>{
 assert.deepEqual(songFromFileName('Adele - Set Fire to the Rain.mp3'),{artist:'Adele',title:'Set Fire to the Rain'});
 assert.deepEqual(songFromFileName('billionaire_ft_bruno_mars.m4a'),{artist:'',title:'billionaire ft bruno mars'});
 assert.equal(formatTime(242.9),'4:02');assert.equal(formatTime(NaN),'0:00');
});

test('the playlist moves forward, wraps with repeat and stops without it',()=>{
 const radio=createRadio();for(const title of ['A','B','C'])addTrack(radio,{kind:'file',title});
 assert.equal(nextIndex(radio),1);radio.index=2;assert.equal(nextIndex(radio),0);
 radio.repeat=false;assert.equal(nextIndex(radio),null);assert.equal(previousIndex(radio),1);
 radio.shuffle=true;for(let i=0;i<20;i++)assert.notEqual(nextIndex(radio,()=>i/20),2);
});

test('removing a song keeps the current song selected',()=>{
 const radio=createRadio();const [a,b,c]=['A','B','C'].map(title=>addTrack(radio,{kind:'file',title}));
 radio.index=2;removeTrack(radio,a.id);assert.equal(radio.tracks[radio.index].id,c.id);
 removeTrack(radio,c.id);assert.equal(radio.index,0);assert.equal(radio.tracks[0].id,b.id);
});

test('stored radio state is checked before use',()=>{
 const radio=normalizeRadio({tracks:[{id:'a',kind:'file',title:'Song'},{id:'b',kind:'youtube',title:'Bad',videoId:'x'},{id:'c',kind:'youtube',title:'Ok',videoId:'dQw4w9WgXcQ'}],index:9,volume:3,repeat:false});
 assert.deepEqual(radio.tracks.map(t=>t.id),['a','c']);assert.equal(radio.index,0);assert.equal(radio.volume,1);assert.equal(radio.repeat,false);
 assert.deepEqual(normalizeRadio('junk'),createRadio());
});

test('the radio has its own key, O by default',()=>{
 assert.ok(BINDING_ACTIONS.some(([id])=>id==='radio'));assert.equal(DEFAULT_BINDINGS.radio,'KeyO');
});
