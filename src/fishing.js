export const ITEMS = Object.freeze([
  {name:'Frying Pan',description:'Quick swings. Strong knockback. Breakfast is served.'},
  {name:'Swordfish',description:'A fish with a point. Long-reaching melee weapon.'},
  {name:'Harpoon Gun',description:'A ranged weapon, freshly dredged from the deep.'},
  {name:'Anchor',description:'Heavy, slow, and exceptionally persuasive.'},
  {name:'Pufferfish Bomb',description:'Handle with care. Throwable explosive.'},
  {name:'Grappling Squid',description:'Eight arms. One excellent escape plan.'},
  {name:'Sardine',description:'A small snack. Restores 35 health.'},
  {name:'Old Boot',description:'You risked it all for someone else’s shoe.'},
  {name:'Reed Spear',description:'Five quick thrusts with extra reach. 22 damage.'},
  {name:'Crab Maul',description:'Three heavy blows. 52 damage and crushing knockback.'},
  {name:'Shell Sling',description:'Six fast shell shots. 18 damage each.'}
]);
export const KEY={name:'Treasure Key',description:'Rare key. Equip near a chest and press F to restore full health.'};
// Temporary: every successful catch lands a Sardine. Flip to false to restore the full loot table (and the Treasure Key).
export const SARDINES_ONLY = true;
export const SARDINE = ITEMS.find(item=>item.name==='Sardine');
export class Fishing {
  constructor(random = Math.random, {sardinesOnly=SARDINES_ONLY}={}) { this.random=random; this.sardinesOnly=sardinesOnly; this.state='idle'; this.result=null; }
  cast() {
    if(this.state!=='idle') return false;
    this.state='waiting'; this.wait=1.5+this.random()*1.5; this.result=null; return true;
  }
  cancel() { if(this.state==='idle') return false; this.state='idle'; this.result=null; return true; }
  // perks: passive fractions from Progression ('reel' speeds the meter on the fish, 'slack' slows its drain off it).
  update(dt,held,{reel=0,slack=0}={}) {
    if(this.state==='waiting') {
      this.wait-=dt;
      if(this.wait<=0){this.state='reeling';this.time=0;this.bar=.23;this.velocity=0;this.target=.34;this.progress=.3;this.grace=.9;}
      return;
    }
    if(this.state!=='reeling')return;
    this.time+=dt;
    // A consistent, smooth trajectory. No item, enemy, or UI data enters physics.
    this.target=.5+.25*Math.sin(this.time*.85)+.08*Math.sin(this.time*1.7);
    this.velocity+=(held?1.7:-1.5)*dt;
    this.velocity*=Math.exp(-2.8*dt);
    this.bar+=this.velocity*dt;
    if(this.bar<0){this.bar=0;this.velocity=Math.max(0,this.velocity)*.2;}
    if(this.bar>.73){this.bar=.73;this.velocity=Math.min(0,this.velocity)*.2;}
    const contact=this.target>=this.bar && this.target<=this.bar+.27;
    this.grace=Math.max(0,this.grace-dt);
    this.progress=Math.max(0,Math.min(1,this.progress+(contact?.16*(1+reel):(this.grace>0?0:-.105*(1-slack)))*dt));
    if(this.progress>=1){const roll=this.random();this.result=this.sardinesOnly?SARDINE:roll<.06?KEY:ITEMS[Math.min(ITEMS.length-1,Math.floor((roll-.06)/.94*ITEMS.length))];this.state='caught';}
    else if(this.progress<=0)this.state='escaped';
  }
}

