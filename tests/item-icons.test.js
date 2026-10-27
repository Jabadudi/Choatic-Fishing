import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {ICONS,ITEM_ART,MARK_ART} from '../src/item-icons.js';
import {LOOT_ITEMS} from '../src/loot.js';
import {WARES} from '../src/trade.js';

test('every item the game can hand out has painted art on disk',()=>{
 const names=new Set([...Object.keys(ICONS),...Object.keys(LOOT_ITEMS),...Object.values(WARES).flat().map(ware=>ware.item),'Region Core','Mysterious Lure']);
 for(const name of names)assert.ok(ITEM_ART[name],`${name} has no icon`);
 for(const url of [...Object.values(ITEM_ART),MARK_ART])assert.ok(existsSync(url),`${url} is missing`);
});
