// Height queries are independent of rendering/story modules to avoid initialization cycles.
import {DELTA} from './delta-areas.js';
export const elevationFor=id=>DELTA[id]?.elevation||null;
export const heightAt=(x,y,id='landing')=>elevationFor(id)?.heightAt(x,y)||0;
export const canTraverse=(ax,ay,bx,by,id='landing')=>elevationFor(id)?.canTraverse(ax,ay,bx,by)??true;
export const canReach=(a,b,id='landing')=>elevationFor(id)?.canReach(a,b)??true;
export const projectGround=(x,y,id='landing')=>elevationFor(id)?.project(x,y)||{x,y};
export const unprojectGround=(x,y,id='landing')=>elevationFor(id)?.unproject(x,y)||{x,y};
