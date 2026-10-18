// Interpolate only the rendered view. Combat and catches stay host-authoritative.
export class Presentation {
 constructor(){this.positions=new Map();this.started=0;}
 capture(world,now){
  const current=this.view(world,now);this.positions=new Map(current.actors.map(a=>[a.id,{x:a.x,y:a.y,angle:a.angle}]));this.started=now;
 }
 view(world,now){
  const t=Math.min(1,Math.max(0,(now-this.started)/50));
  const actors=world.actors.map(a=>{const old=this.positions.get(a.id);if(!old||a.health<=0||Math.hypot(old.x-a.x,old.y-a.y)>180)return a;const angle=old.angle+Math.atan2(Math.sin(a.angle-old.angle),Math.cos(a.angle-old.angle))*t;return {...a,x:old.x+(a.x-old.x)*t,y:old.y+(a.y-old.y)*t,angle};});
  const display=Object.create(world);display.actors=actors;display.player=actors.find(a=>a.id===world.player.id);return display;
 }
}
