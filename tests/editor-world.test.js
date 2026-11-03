import test from 'node:test';
import assert from 'node:assert/strict';
import {editorWorld} from '../scripts/editor-world.mjs';
import {fromEditor as landFrom,formatLandData} from '../scripts/land-editor.mjs';
import {fromEditor as worldFrom,formatWorldData} from '../scripts/world-editor.mjs';
import {fromEditor as questFrom,formatQuestData,gameLists} from '../scripts/quest-editor.mjs';
import {fromEditor as storyFrom,formatStoryEdits,baseStory} from '../scripts/story-editor.mjs';
import {AREAS,INTERIOR_AREAS} from '../src/wilds.js';
import {LAND_DATA} from '../src/land-data.js';
import {WORLD_DATA} from '../src/world-data.js';
import {QUEST_DATA} from '../src/quest-data.js';
import {STORY_EDITS} from '../src/story-edits.js';

test('published editor documents round-trip all deployed design data through game exporters',async()=>{
 const world=await editorWorld({commit:'a'.repeat(40),meta:{areas:[],grids:{},cell:40}}),c=world.collections,rows=col=>Object.values(c[col]),notes=[];
 const areas=Object.fromEntries(Object.entries(AREAS).filter(([id])=>!INTERIOR_AREAS.includes(id)));
 assert.equal(formatLandData(landFrom(rows('land'),notes)),formatLandData(LAND_DATA));
 assert.equal(formatWorldData(worldFrom(Object.fromEntries(['spawnAreas','spawnSlots','npcs','bosses'].map(col=>[col,rows(col)])),areas,notes)),formatWorldData(WORLD_DATA));
 assert.equal(formatQuestData(questFrom(rows('quests'),await gameLists(),notes)),formatQuestData(QUEST_DATA));
 assert.equal(formatStoryEdits(storyFrom(rows('story'),await baseStory(),notes)),formatStoryEdits(STORY_EDITS));
 assert.deepEqual(notes,[]);
 assert.deepEqual(Object.keys(c).sort(),['bosses','land','npcs','quests','spawnAreas','spawnSlots','story']);
 assert.ok(!JSON.stringify(world).includes('updatedBy'));
});
