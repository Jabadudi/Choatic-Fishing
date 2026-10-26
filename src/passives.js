// Passive effects add up by key, whatever grants them: skill trees now, familiars or gear later.
// A source is a plain {key:amount} object. Gameplay reads totals through Progression#passive(key), never a source directly.
export const PASSIVES=Object.freeze({
 'fishing.biteTime':'Shorter wait for a bite (fraction)',
 'fishing.reel':'Faster catch meter while on the fish (fraction)',
 'fishing.slack':'Slower catch meter drain off the fish (fraction)',
 'fishing.doubleCatch':'Chance a landed fish brings a second one',
 'hunting.damage':'Extra damage to animals (fraction)',
 'hunting.loot':'Better odds on uncertain animal drops (fraction)',
 'hunting.hide':'Less damage taken from animals (fraction)',
 'hunting.heal':'Health restored on each successful hunt',
 'food.heal':'Food restores more health (fraction)',
 'health.max':'Extra maximum health',
 'health.regen':'Faster natural health regeneration (fraction)',
 'skillXp.fishing':'Extra Fishing XP (fraction)',
 'skillXp.hunting':'Extra Hunting XP (fraction)',
 'skillXp.cooking':'Extra Cooking XP (fraction)'
});
// Fractional reductions stop here, so stacking sources never removes a wait or all incoming damage.
export const PASSIVE_CAPS=Object.freeze({'fishing.biteTime':.6,'fishing.slack':.8,'hunting.hide':.6,'fishing.doubleCatch':1});
export function sumPassives(sources){
 const total={};
 for(const source of sources)for(const [key,amount] of Object.entries(source||{}))if(Object.hasOwn(PASSIVES,key)&&Number.isFinite(amount))total[key]=(total[key]||0)+amount;
 for(const [key,cap] of Object.entries(PASSIVE_CAPS))if(total[key]>cap)total[key]=cap;
 return total;
}
