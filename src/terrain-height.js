// Height queries are independent of rendering/story modules to avoid initialization cycles.
import {DELTA} from './delta-areas.js';
import {ELEVATION_STEP} from './elevation.js';
export const elevationFor=id=>DELTA[id]?.elevation||null;
export const heightAt=(x,y,id='landing')=>elevationFor(id)?.heightAt(x,y)||0;
export const canTraverse=(ax,ay,bx,by,id='landing')=>elevationFor(id)?.canTraverse(ax,ay,bx,by)??true;
export const canReach=(a,b,id='landing')=>elevationFor(id)?.canReach(a,b)??true;
export const projectGround=(x,y,id='landing')=>elevationFor(id)?.project(x,y)||{x,y};
export const unprojectGround=(x,y,id='landing')=>elevationFor(id)?.unproject(x,y)||{x,y};
// A spot on a level that no ramp or stairs reach, other than the level Eli arrives on: the cliff tops that border
// a field map. Old saves from before a map grew its cliffs can stand there; they are sent back to the arrival spot.
export function stranded(x,y,id,spawn){
 const e=elevationFor(id);if(!e)return false;
 const z=e.heightAt(x,y);if(spawn&&z===e.heightAt(spawn.x,spawn.y))return false;
 return !e.ramps.some(r=>[r.fromHeight,r.toHeight].some(h=>h*ELEVATION_STEP===z));
}
