// Bumping into a monster hurts (Netanel, 8 Nov 2026): touching a hostile mob costs Eli a quarter of its attack damage,
// at most once every CONTACT.cooldown seconds, with a small shove away from it. A real swing still hits for the full
// amount. Calm animals, knocked-down monsters and a hidden Mire Walker that has not noticed him do not count, and a
// dash slips through (combat.js damage). Gameplay only.
import {damage} from './combat.js';
import {monsterTarget} from './monsters.js';
export const CONTACT=Object.freeze({share:.25,min:1,cooldown:.8,knockback:90,reach:16});
const AWAKE=['notice','chase','attack','strike'];
export function hostileOnContact(a){
 if(a.entityType!=='animal'||a.health<=0||!(a.attackDamage>0)||a.downRemaining>0)return false;
 if(a.hidden&&!AWAKE.includes(a.state))return false;
 return a.behavior==='aggressive'||(a.behavior==='defensive'&&a.anger>0);
}
export const contactDamage=a=>Math.max(CONTACT.min,Math.round(a.attackDamage*CONTACT.share));
export function updateContact(world,dt){
 if(!world.adventure)return;
 const p=world.player;p.contactCooldown=Math.max(0,(p.contactCooldown||0)-dt);
 if(p.contactCooldown>0||!monsterTarget(world))return;
 for(const a of world.wildlife){
  if(a.areaId!==world.areaId||!hostileOnContact(a))continue;
  const d=Math.hypot(p.x-a.x,p.y-a.y);if(d>(a.radius||12)+CONTACT.reach)continue;
  if(damage(world,p,contactDamage(a),a,Math.atan2(p.y-a.y,p.x-a.x),CONTACT.knockback)){p.contactCooldown=CONTACT.cooldown;return;}
 }
}
