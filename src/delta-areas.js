// The Reedwater Delta areas built from the atlas sheets (see atlas-area.js for the format). Coordinates are atlas
// pixels on the 720 × 480 regional atlas; each area's frame is the piece of the atlas it covers.
// Exits name their target area; an exit whose target is not built yet is left out until it is.
import {defineArea} from './atlas-area.js';
const DEFS=[];
const area=def=>DEFS.push(def);

// 18.3 Chimewood: the wooded headland east of Windchime Path. A trail from the Windchime spur winds through chime
// trees to a lookout over the rapids, then down past the Hollow Rock grotto to Chime Beach.
area({id:'chimewood',num:'18.3',name:'Chimewood',frame:[330,405,248,376],size:[1200,2000],base:'water',ground:'forest',
 shapes:[
  ['land',[[330,248],[356,248],[356,262],[360,276],[368,290],[376,302],[384,314],[388,326],[396,340],[390,356],[372,366],[350,372],[330,374]]],
  ['land',[[394,280],[405,276],[405,318],[398,314]]],
  ['water',[[352,248],[366,248],[368,262],[372,280],[366,288],[358,282],[353,268]]]
 ],
 zones:[['sand',[[330,346],[350,343],[366,342],[380,334],[388,324],[396,340],[390,356],[372,366],[350,372],[330,374]]],['rock',[[350,322],[368,320],[376,330],[374,344],[358,346],[348,338]]],['clear',[[336,282],[352,280],[358,296],[346,300],[336,296]]]],
 roads:[[[330,256],[338,262],[346,272],[350,284],[360,292],[370,296]],[[350,284],[344,298],[340,312],[342,326],[346,338],[350,350],[352,368]]],
 fords:[[[372,294],[380,293],[388,293],[397,292]],[[350,366],[351,376]]],
 props:[{kind:'cave',at:[362,338]},{kind:'lantern',at:[356,288]},{kind:'lantern',at:[364,301]},{kind:'lantern',at:[347,276]},{kind:'bench',at:[368,300]}],
 places:[
  {id:'chimewood-lookout',name:'Rapids Lookout',at:[369,302],kind:'chimes',text:'The trees open over white water. Chimes hang in every branch here, and they ring out of time with the wind.'},
  {id:'hollow-rock',name:'Hollow Rock',at:[360,346],text:'A grotto in a heap of boulders. The chimes are loudest here, as if the sound comes from inside the rock.'},
  {id:'chime-beach',name:'Chime Beach',at:[345,358],text:'A quiet strip of sand facing south. Out on the water, West Holm and its seals.'}
 ],
 exits:[
  {edge:'west',from:252,to:262,target:'windchime',label:'Windchime Path'},
  {edge:'east',from:286,to:300,target:'upper-braids',label:'Upper Braids'},
  {edge:'south',from:346,to:356,target:'seal-skerries',label:'Seal Skerries'}
 ]});

// 26 Stonefall Creek: a quiet clearing with a spring-fed pond. The creek runs west over a boulder field and drops off
// the cliff as a waterfall. The trail comes in from Windchime Path's west fork.
area({id:'stonefall',num:'26',name:'Stonefall Creek',frame:[200,304,220,290],size:[1500,1000],base:'land',ground:'meadow',
 shapes:[
  ['water',[[200,262],[208,264],[218,270],[226,279],[232,290],[200,290]]],
  ['water','ellipse',[260,247],6.6,4.1],
  ['water','line',[[255,248],[248,252],[240,254],[232,256],[224,256],[216,258],[211,261],[205,263]],1.6]
 ],
 zones:[['rock',[[214,246],[232,242],[250,248],[254,262],[246,276],[232,280],[222,268],[214,258]]],['forest',[[256,256],[304,258],[304,290],[250,290],[254,272]]],['forest',[[268,226],[304,226],[304,244],[272,244]]],['forest',[[200,226],[214,232],[214,246],[200,252]]],['clear',[[250,238],[272,238],[274,256],[250,256]]]],
 roads:[[[228,234],[242,238],[252,242]],[[268,249],[280,251],[292,252],[304,253]],[[252,242],[258,241],[266,244],[268,249]]],
 fords:[[[236,251],[237,255],[238,259]]],
 props:[{kind:'bench',at:[268,253]},{kind:'stone',at:[228,247]},{kind:'stone',at:[244,268]},{kind:'cairn',at:[236,262]}],
 places:[
  {id:'stonefall-pond',name:'Stonefall Pond',at:[262,253],text:'A spring-fed pond ringed with reeds. Frogs, dragonflies, and a heron that pretends you are not there.'},
  {id:'the-stonefall',name:'The Stonefall',at:[232,250],text:'A field of tumbled boulders, some as big as a house. The creek threads between them toward the cliff.'},
  {id:'stonefall-falls',name:'The Falls',at:[216,266],text:'The creek pours off the cliff edge into the sea below. Spray hangs in the air.'}
 ],
 exits:[{edge:'east',from:249,to:258,target:'windchime',label:'Windchime Path'}]});

export const DELTA_DEFS=DEFS;
export const DELTA=Object.fromEntries(DEFS.map(def=>[def.id,defineArea(def)]));
