export const XP=Object.freeze({catch:30,elimination:90});
export const BUFFS=Object.freeze([
 {id:'speed',name:'Fleet Footed',description:'+5% movement speed'},
 {id:'power',name:'Heavy Hitter',description:'+8% damage'},
 {id:'vitality',name:'Hardy',description:'+10 maximum health'},
 {id:'armor',name:'Tough Scales',description:'More damage resistance'}
]);
export class Progression {
 constructor(){this.upgradeRemaining=30;this.pendingUpgrades=0;this.upgrades={hermes:0,dash:0,health:0};this.level=1;this.xp=0;this.totalXp=0;this.pendingChoices=0;this.ranks={speed:0,power:0,vitality:0,armor:0};this.specials={tidal:0,whirlpool:0};this.eliminations=new Set();this.lastBuff=null;}
 get maxDashes(){return 1+this.upgrades.dash;}
 tickUpgrades(dt){this.upgradeRemaining-=dt;while(this.upgradeRemaining<1e-9){this.pendingUpgrades++;this.upgradeRemaining+=30;}}
 chooseUpgrade(kind){if(!this.pendingUpgrades||!Object.hasOwn(this.upgrades,kind))return false;this.upgrades[kind]++;this.pendingUpgrades--;return true;}
 get xpToNextLevel(){return 90+(this.level-1)*45;}
 get speedMultiplier(){return 1+this.ranks.speed*.05+this.upgrades.hermes*.15;}
 get damageMultiplier(){return 1+this.ranks.power*.08;}
 get maxHealth(){return 100+this.ranks.vitality*10+this.upgrades.health*20;}
 get damageReduction(){return .5*(1-Math.pow(.9,this.ranks.armor));}
 get specialCharges(){return this.specials.tidal+this.specials.whirlpool;}
 grantCatchBuff(random=Math.random){const buff=BUFFS[Math.min(BUFFS.length-1,Math.floor(random()*BUFFS.length))];this.ranks[buff.id]++;this.lastBuff=buff;return buff;}
 award(amount){if(!Number.isSafeInteger(amount)||amount<=0)return 0;this.xp+=amount;this.totalXp+=amount;let levels=0;while(this.xp>=this.xpToNextLevel){this.xp-=this.xpToNextLevel;this.level++;this.pendingChoices++;levels++;}return levels;}
 recordElimination(victimId){if(typeof victimId!=='string'||!victimId.trim()||this.eliminations.has(victimId))return false;this.eliminations.add(victimId);this.award(XP.elimination);return true;}
 choose(reward){if(!this.pendingChoices||!Object.hasOwn(this.specials,reward))return false;this.specials[reward]++;this.pendingChoices--;return true;}
}
