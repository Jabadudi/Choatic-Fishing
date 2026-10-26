import {preferences} from './preferences.js';
import {keyLabel} from './input-bindings.js';
export const matchesBinding=(action,code)=>preferences.value.keybinds[action]===code;
export const bindingLabel=action=>keyLabel(preferences.value.keybinds[action]);
