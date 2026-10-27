// Keyboard actions are device preferences, independent of simulation and saved journeys.
export const BINDING_ACTIONS=[['left','Move left','KeyA'],['right','Move right','KeyD'],['up','Move up','KeyW'],['down','Move down','KeyS'],['reel','Hold to reel','Space'],['fish','Cast / fishing toggle','KeyE'],['inspect','Talk / examine','KeyG'],['dash','Dash','ShiftLeft'],['backpack','Backpack','KeyB'],['skills','Skills','KeyK'],['codex','Creature index','KeyI'],['quests','Quest log','KeyJ'],['map','World atlas','KeyM'],['use','Use equipped item','KeyF'],['tidal','Tidal cannon','KeyR'],['whirlpool','Whirlpool','KeyT'],['cancel','Cancel action','KeyQ'],...Array.from({length:7},(_,i)=>['slot'+(i+1),'Hotbar slot '+(i+1),'Digit'+(i+1)])];
export const DEFAULT_BINDINGS=Object.freeze(Object.fromEntries(BINDING_ACTIONS.map(([id,,code])=>[id,code])));
export const validBinding=code=>typeof code==='string'&&/^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Space|Shift(Left|Right)|Bracket(Left|Right)|Semicolon|Quote|Comma|Period|Slash|Backslash|Minus|Equal|Backquote)$/.test(code);
export function rebind(bindings,action,code){
 if(!Object.hasOwn(DEFAULT_BINDINGS,action)||!validBinding(code))return bindings;
 const next={...bindings},other=Object.keys(next).find(id=>id!==action&&next[id]===code);
 if(other)next[other]=next[action];next[action]=code;return next;
}
export function normalizeBindings(value){let result={...DEFAULT_BINDINGS};if(value&&typeof value==='object')for(const [id]of BINDING_ACTIONS)if(validBinding(value[id]))result=rebind(result,id,value[id]);return Object.freeze(result);}
export const keyLabel=code=>code?.replace(/^Key/,'').replace(/^Digit/,'').replace('ShiftLeft','Left Shift').replace('ShiftRight','Right Shift').replace('Arrow','')||'';
