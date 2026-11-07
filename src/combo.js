// Field combat feel (Dragon Saga style): a 3-hit melee chain that ends in a knockdown, a combo counter that climbs
// while Eli keeps landing hits, and a short hit-stop on every melee hit. Gameplay only; the renderer reads the state.
// Only Eli in the exploration game uses it, so arena and PvP balance stay as they were.
import {practise} from './skills.js';
export const COMBO=Object.freeze({
 // Seconds after an attack recovers in which the next press continues the chain.
 window:.55,
 // Multipliers per chain step. The first two are quicker; the finisher hits harder, shoves further and knocks down.
 steps:Object.freeze([
  Object.freeze({damage:1,knockback:.6,cooldown:.75}),
  Object.freeze({damage:1.1,knockback:.6,cooldown:.75}),
  Object.freeze({damage:1.6,knockback:1.8,cooldown:1.25,knockdown:.9})
 ]),
 // A knocked-down foe takes this much extra damage.
 downBonus:.25,
 // An elite stays down for this share of the usual time.
 eliteDown:.7,
 // The counter resets this long after the last hit that landed.
 counterSeconds:2.5,
 // Every milestone hits in one combo pays bonus Hunting XP.
 milestone:10,milestoneXp:3,
 // Seconds the world slows to a near stop when a melee hit lands, and how slow it runs meanwhile.
 hitStop:Object.freeze({hit:.045,finisher:.09}),hitStopRate:.1
});
export const comboActive=(world,actor)=>!!world.adventure&&actor===world.player;
// The step this swing is: it continues the chain while the window is open, else starts again at 1.
export function nextStep(world,actor){
 const chained=(actor.comboUntil??-Infinity)>=world.elapsed&&actor.comboStep>0;
 return chained?actor.comboStep%COMBO.steps.length+1:1;
}
export function startSwing(world,actor,cooldown){
 const step=nextStep(world,actor),spec=COMBO.steps[step-1];
 actor.comboStep=step;actor.cooldown=cooldown*spec.cooldown;actor.comboUntil=world.elapsed+actor.cooldown+COMBO.window;
 return {step,...spec,finisher:step===COMBO.steps.length};
}
// A foe that can be knocked down: field wildlife, monsters and elites, never a boss or a rabbit.
export const canKnockDown=(world,target)=>target.entityType==='animal'&&!target.boss&&target.health>0&&(world.wildlife||[]).includes(target);
export const downBonus=target=>target.downRemaining>0?1+COMBO.downBonus:1;
export function knockDown(world,target,seconds){
 if(!canKnockDown(world,target))return false;
 // An elite is only down for a short window: that is when Mudshell's shell is open.
 if(target.elite)seconds*=COMBO.eliteDown;
 target.downRemaining=Math.max(target.downRemaining||0,seconds);target.attackRemaining=0;
 world.effects.push({name:'down',label:'DOWN',x:target.x,y:target.y-48,angle:0,life:.8,duration:.8});
 return true;
}
// One landed hit by Eli: the counter climbs, the hit freezes the world for a moment, milestones pay XP.
export function noteHit(world,actor,{finisher=false,melee=true}={}){
 if(!comboActive(world,actor))return;
 const c=world.combo||(world.combo={count:0,remaining:0,best:0});
 c.count++;c.remaining=COMBO.counterSeconds;c.best=Math.max(c.best,c.count);c.flash=.25;
 if(melee)world.hitStop=Math.max(world.hitStop||0,finisher?COMBO.hitStop.finisher:COMBO.hitStop.hit);
 if(c.count%COMBO.milestone===0){
  const xp=COMBO.milestoneXp*(c.count/COMBO.milestone);
  // The XP floats over Eli as usual; the counter itself pops bigger.
  practise(world,actor,'hunting',xp,{x:actor.x,y:actor.y-60});c.flash=.6;
 }
}
export function updateCombo(world,dt){
 const c=world.combo;if(!c)return;
 c.flash=Math.max(0,(c.flash||0)-dt);
 if(c.remaining>0){c.remaining=Math.max(0,c.remaining-dt);if(c.remaining===0)c.count=0;}
}
// How much simulation time passes this frame: hit-stop slows the world, then it runs on as normal.
export function hitStopDt(world,dt){
 if(!(world.hitStop>0))return dt;
 const frozen=Math.min(dt,world.hitStop);world.hitStop-=frozen;
 return dt-frozen+frozen*COMBO.hitStopRate;
}
// What the combo counter shows: nothing until the second hit.
export function comboDisplay(world){
 const c=world.combo;if(!c||c.count<2)return null;
 return {count:c.count,fade:Math.min(1,c.remaining/.6),flash:c.flash||0};
}
