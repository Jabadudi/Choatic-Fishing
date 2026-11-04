import test from 'node:test';
import assert from 'node:assert/strict';
import {blurMask} from '../src/terrain-blend.js';

function softwareMask(width,height,alpha){
 const data=new Uint8ClampedArray(width*height*4);for(let i=0;i<width*height;i++)data[i*4+3]=alpha(i%width,Math.floor(i/width));
 const mask={width,height,getContext:()=>({getImageData:()=>({data})})};let result;
 blurMask(mask,{clearRect(){},putImageData(image){result=image.data;}},3.5);
 return Array.from({length:width*height},(_,i)=>result[i*4+3]);
}
test('mobile blend preserves uniform opaque and transparent materials',()=>{
 assert.ok(softwareMask(25,21,()=>255).every(a=>a===255));
 assert.ok(softwareMask(25,21,()=>0).every(a=>a===0));
});
test('adjacent material masks remain complementary without dark cracks',()=>{
 const left=softwareMask(40,24,x=>x<20?255:0),right=softwareMask(40,24,x=>x>=20?255:0);
 for(let i=0;i<left.length;i++)assert.ok(Math.abs(left[i]+right[i]-255)<=1);
 const row=left.slice(12*40,13*40);assert.equal(row[0],255);assert.equal(row[39],0);
 assert.ok(row[19]>0&&row[19]<255);for(let x=1;x<40;x++)assert.ok(row[x]<=row[x-1]);
});
