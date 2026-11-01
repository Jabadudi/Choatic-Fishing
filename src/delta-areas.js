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

// 19.1 Upper Braids: where the marsh water splits toward the sea. Wooded islands, the Rush (a wide channel down the
// middle), Egret Bar where the great egret stands, and Long Spit with a driftwood camp. Fords join them.
area({id:'upper-braids',num:'19.1',name:'Upper Braids',frame:[390,560,266,342],size:[3000,1300],base:'water',ground:'forest',
 shapes:[
  ['land',[[396,290],[420,284],[434,288],[444,300],[444,312],[434,330],[410,336],[398,322]]],
  ['land',[[428,272],[452,268],[466,276],[460,292],[442,294],[430,288]]],
  ['land',[[494,310],[510,304],[528,316],[520,330],[500,334],[490,324]],{zone:'sand'}],
  ['land',[[506,282],[530,276],[560,288],[560,342],[540,342],[530,320],[512,302]]],
  ['land',[[466,282],[476,280],[482,292],[474,300],[464,296]],{zone:'sand'}],
  ['land',[[470,266],[486,266],[484,272],[472,274]],{zone:'sand'}]
 ],
 roads:[[[397,293],[412,300],[426,312],[426,330]],[[412,300],[430,292],[446,284]]],
 fords:[[[390,293],[397,293]],[[431,293],[437,285]],[[476,266],[476,274],[474,282]],[[460,288],[466,289]],[[480,296],[494,312]],[[526,312],[534,312]],[[426,330],[426,342]],[[498,332],[496,342]]],
 props:[{kind:'heron',at:[474,290]},{kind:'logs',at:[506,320]},{kind:'tent',at:[514,316]},{kind:'dock',at:[476,262]}],
 places:[
  {id:'egret-bar',name:'Egret Bar',at:[474,292],text:'A bare sandbar in the middle of the braids. The great egret stands here on one leg and does not care about you at all.'},
  {id:'westbraid-isle',name:'Westbraid Isle',at:[418,306],text:'The biggest of the wooded islands. Fords lead off it to the south and over the rapids to the west.'},
  {id:'long-spit',name:'Long Spit',at:[508,324],text:'A long sand spit with a driftwood camp: a ring of stones, cold ashes, a lean-to of sticks.'},
  {id:'the-rush',name:'The Rush',at:[486,300],text:'The widest channel in the braids. The water runs fast and clear here, and the fish run with it.'}
 ],
 exits:[
  {edge:'west',from:288,to:298,target:'chimewood',label:'Chimewood'},
  {edge:'north',from:472,to:482,target:'stilt-reach',label:'Stilt Reach'},
  {edge:'east',from:296,to:330,target:'heron-islands',label:'Heron Islands'},
  {edge:'south',from:421,to:431,target:'delta-mouth',label:'Delta Mouth (west ford)',back:'Upper Braids (west ford)'},
  {edge:'south',from:492,to:502,target:'delta-mouth',label:'Delta Mouth (spit ford)',back:'Upper Braids (spit ford)'}
 ]});

// 19.2 Delta Mouth: where the river meets the sea. Mouth Isle with Crescent Beach and its tide pools, Pelican Spit,
// Gull Rocks in the deep channel, and an old upturned boat that rows over to Seal Skerries.
area({id:'delta-mouth',num:'19.2',name:'Delta Mouth',frame:[390,562,328,404],size:[2800,1400],base:'water',ground:'forest',
 shapes:[
  ['land',[[390,344],[404,344],[412,360],[408,384],[392,388]]],
  ['land',[[482,336],[504,334],[520,346],[524,368],[518,388],[496,398],[470,396],[464,380],[472,360]]],
  ['land',[[424,338],[436,336],[470,352],[470,366],[458,374],[440,362],[426,348]],{zone:'sand'}],
  ['land',[[531,353],[540,352],[546,360],[540,370],[532,368]],{zone:'rock'}]
 ],
 zones:[['sand',[[464,380],[476,374],[496,376],[518,380],[518,388],[496,398],[470,396]]]],
 roads:[[[494,332],[492,350],[494,364],[496,380],[492,392]],[[471,370],[480,382],[492,392]]],
 fords:[[[426,328],[427,340]],[[494,328],[494,338]],[[466,368],[474,374]],[[522,362],[533,360]],[[486,394],[484,404]]],
 props:[{kind:'boat',at:[471,388],angle:.3},{kind:'stone',at:[536,358],solid:14},{kind:'nest',at:[540,364]}],
 places:[
  {id:'crescent-beach',name:'Crescent Beach',at:[498,392],text:'A curve of white sand with tide pools full of crabs. Surf rolls in from the open sea.'},
  {id:'pelican-spit',name:'Pelican Spit',at:[446,352],text:'A long, bare sandbar. Pelicans rest here in rows and watch the fish.'},
  {id:'gull-rocks',name:'Gull Rocks',at:[538,362],text:'Bare rocks in the deep channel, white with gulls. The water around them is deep and cold.'},
  {id:'old-boat',name:'Old Boat',at:[471,384],text:'An old rowing boat, upturned on the sand. It still floats. Eli rows west across the bay',travel:{target:'seal-skerries',entry:[383,398]}}
 ],
 exits:[
  {edge:'north',from:421,to:431,target:'upper-braids',label:'Upper Braids (west ford)',back:'Delta Mouth (west ford)'},
  {edge:'north',from:489,to:499,target:'upper-braids',label:'Upper Braids (spit ford)',back:'Delta Mouth (spit ford)'},
  {edge:'south',from:479,to:489,target:'sandbar-spits',label:'Sandbar Spits',entry:[485,404]}
 ]});

// 23 Seal Skerries: a calm pocket of sea off the Chimewood shore. West Holm with its seal-watcher hut and jetty, the
// Great Skerry where the seals haul out, Reed Islet and Seal Sand.
area({id:'seal-skerries',num:'23',name:'Seal Skerries',frame:[296,456,346,438],size:[2500,1440],base:'water',sea:true,ground:'forest',
 shapes:[
  ['land',[[296,346],[392,346],[388,352],[372,364],[350,374],[330,378],[310,380],[296,386]]],
  ['land',[[356,384],[364,372],[378,366],[392,368],[400,378],[398,390],[386,396],[368,396]]],
  ['land',[[356,398],[366,394],[378,398],[382,406],[374,412],[360,410]],{zone:'rock'}],
  ['land',[[336,398],[344,396],[347,402],[340,406]],{zone:'rock'}],
  ['land',[[386,399],[392,398],[393,403],[387,404]],{zone:'rock'}],
  ['land',[[400,388],[408,384],[414,390],[408,398],[400,396]]],
  ['land',[[410,408],[424,402],[440,400],[446,406],[436,414],[418,418],[410,414]],{zone:'sand'}]
 ],
 zones:[['sand',[[296,372],[330,368],[350,364],[372,358],[388,352],[372,364],[350,374],[330,378],[310,380],[296,386]]],['clear',[[372,374],[386,374],[386,384],[372,384]]]],
 roads:[[[340,350],[342,368],[342,382]],[[358,383],[368,382],[378,380],[384,386],[383,394]]],
 fords:[[[340,375],[346,382],[358,383]],[[370,395],[368,399]],[[398,386],[402,388]],[[408,397],[414,405]]],
 walks:[[[383,394],[383,402]]],
 props:[{kind:'hut',at:[378,376]},{kind:'boat',at:[386,404],angle:-.2}],
 places:[
  {id:'seal-watcher-hut',name:'Seal-watcher Hut',at:[378,382],text:'An old hut with a bench outside and a spyglass nailed to the wall. Someone counted seals here for years.'},
  {id:'great-skerry',name:'Great Skerry',at:[368,404],text:'Bare rock and seals, dozens of them. Step softly: when they slide into the water, the fish go too.'},
  {id:'seal-sand',name:'Seal Sand',at:[428,408],text:'A long sandbar where more seals rest in the sun. The open sea starts just past it.'},
  {id:'skerry-jetty',name:'The Jetty',at:[383,400],text:'A little plank jetty with a rowing boat tied to it. Eli rows east to the Delta Mouth',travel:{target:'delta-mouth',entry:[474,382]}}
 ],
 exits:[{edge:'north',from:336,to:348,target:'chimewood',label:'Chimewood'}]});

// 24 Sandbar Spits: where the delta ends and the open sea begins. The Tide Shelf under Crescent Beach, the Shoal (a
// sandbar just under the surface), Breaker Rock in the surf, Long Bar, Tern Bar and Rock Tail.
area({id:'sandbar-spits',num:'24',name:'Sandbar Spits',frame:[446,598,346,438],size:[2400,1450],spawn:[486,407],base:'water',sea:true,ground:'sand',
 shapes:[
  ['land',[[466,402],[480,400],[498,402],[502,410],[490,414],[472,412]],{zone:'rock'}],
  ['land',[[503,413],[511,412],[516,417],[510,421],[502,419]],{zone:'rock'}],
  ['land',[[546,372],[556,368],[562,374],[560,384],[550,384]]],
  ['land',[[544,392],[560,386],[580,384],[590,388],[588,396],[570,400],[552,400]]],
  ['land',[[552,400],[562,400],[564,408],[556,410],[550,406]],{zone:'rock'}]
 ],
 zones:[['meadow',[[550,374],[556,371],[559,377],[553,380]]]],
 roads:[],
 fords:[[[498,408],[512,406],[528,402],[546,394]],[[510,407],[508,413]],[[556,383],[556,388]],[[586,393],[598,399]],[[584,386],[590,376],[596,370]]],
 props:[{kind:'sign',at:[568,392]},{kind:'nest',at:[554,376]}],
 places:[
  {id:'tide-shelf',name:'Tide Shelf',at:[484,408],text:'A rocky ledge below Crescent Beach, full of tide pools: crabs, anemones, a starfish the size of a hand.'},
  {id:'breaker-rock',name:'Breaker Rock',at:[509,416],text:'A lone rock out in the surf. Waves break over its back; deep water all around it.'},
  {id:'long-bar',name:'Long Bar',at:[568,394],text:'The biggest sand island, with a driftwood pole someone stuck in the middle as a marker.'},
  {id:'tern-bar',name:'Tern Bar',at:[555,378],text:'A small sandbar with a tuft of grass. The terns nesting here scream at anyone who comes close.'}
 ],
 portals:[{at:[484,401],r:34,target:'delta-mouth',label:'Delta Mouth',entry:[487,390]}],
 exits:[
  {edge:'north',from:590,to:598,target:'tidecave-coast',label:'Tidecave Coast'},
  {edge:'east',from:394,to:404,target:'heron-point',label:'Heron Point'}
 ]});

// 13.2 Stilt Reach: reedy islets east of the built marsh, joined by plank walks from a central platform. Netter's Hut
// and the East Hut stand on stilts, Willow Mound is wooded, and Old Shellback, a living giant turtle, rests in a pool.
area({id:'stilt-reach',num:'13.2',name:'Stilt Reach',frame:[414,508,148,282],size:[1800,2400],base:'water',ground:'marsh',
 shapes:[
  ['land',[[424,160],[440,152],[458,156],[456,170],[436,174],[424,168]]],
  ['land',[[462,166],[482,160],[498,170],[496,186],[476,190],[462,182]],{zone:'forest'}],
  ['land',[[418,206],[440,200],[462,208],[458,220],[436,224],[418,218]]],
  ['land',[[476,210],[496,206],[506,218],[502,236],[484,240],[474,228]]],
  ['land',[[436,262],[460,258],[478,266],[474,280],[446,282],[434,274]]],
  ['land',[[414,180],[424,182],[426,196],[414,198]]]
 ],
 walks:[[[414,248],[422,244],[430,236]],[[431,233],[432,218],[436,200],[440,184],[442,172]],[[446,158],[456,156],[466,152],[472,148]],[[431,233],[440,230],[450,228],[464,226],[478,226]],[[500,224],[508,226]],[[431,236],[440,252],[448,262],[458,268]],[[468,276],[478,282]],{pts:[[427,234],[436,234]],width:5},[[440,172],[446,160]]],
 props:[{kind:'stilt-hut',at:[442,163]},{kind:'stilt-hut',at:[490,220]},{kind:'shell',at:[452,250],solid:0},{kind:'lantern',at:[428,232]}],
 places:[
  {id:'netters-hut',name:'Netter’s Hut',at:[442,168],text:'A hut on stilts hung with nets. Someone mends them here every day and leaves the door open.'},
  {id:'east-hut',name:'East Hut',at:[490,226],text:'A second stilt hut at the edge of the deep channel. The planks creak when the water moves.'},
  {id:'old-shellback',name:'Old Shellback',at:[446,256],text:'A giant turtle, alive, its shell as wide as a cart. It opens one eye, decides you are not interesting, and closes it again.'},
  {id:'stilt-platform',name:'The Platform',at:[431,238],text:'A wide plank platform where all the walks meet. Lanterns, a bench, and four directions to choose from.'}
 ],
 exits:[
  {edge:'west',from:243,to:253,target:'marsh',label:'Shellback Marsh'},
  {edge:'north',from:467,to:477,target:'egret-isles',label:'Egret Isles'},
  {edge:'east',from:221,to:231,target:'heron-islands',label:'Heron Islands'},
  {edge:'south',from:473,to:483,target:'upper-braids',label:'Upper Braids'}
 ]});

// 9.1 Falls Channels: three sluice falls drop from the aqueduct ruins along a cliff in the north; the Silverfall
// crashes into a deep pool in the north-east. Fast channels below, crossed by the Old Dyke, a paved causeway.
area({id:'falls-channels',num:'9.1',name:'Falls Channels',frame:[284,436,86,150],size:[2800,1100],base:'land',ground:'meadow',
 shapes:[
  ['water',[[300,150],[320,138],[350,134],[380,136],[410,132],[436,128],[436,150]]],
  ['water',[[406,118],[420,114],[436,116],[436,132],[418,134],[406,128]]],
  ['water','line',[[284,108],[298,112],[312,118],[326,126],[334,136],[338,150]],3.4],
  ['water','line',[[342,98],[342,108],[346,120],[352,132],[356,142]],2.2],
  ['water','line',[[372,98],[370,108],[366,120],[366,136]],2.2],
  ['water','line',[[406,98],[402,108],[396,120],[392,134]],2.2]
 ],
 cliffs:[[[284,86],[436,86],[436,100],[420,97],[400,100],[370,100],[340,100],[326,97],[284,96]],[[408,86],[436,86],[436,114],[426,112],[410,104]]],
 bridges:[[[304,104],[318,112],[332,120],[346,128],[360,134],[372,142],[380,150]],[[397,103],[410,106]]],
 walks:[[[398,100],[386,108],[376,116],[364,124],[356,130]],[[284,124],[296,122],[306,118],[318,114]]],
 roads:[[[398,86],[398,101]],[[399,102],[414,106],[428,108],[434,98],[434,86]]],
 props:[{kind:'wheel',at:[368,114],still:true},{kind:'ruin',at:[316,104]}],
 places:[
  {id:'silverfall-pool',name:'Silverfall Pool',at:[426,110],text:'The Silverfall drops off the cliff into a deep, cold pool. The roar fills your chest. Big fish hold in the dark water under the spray.'},
  {id:'old-dyke',name:'The Old Dyke',at:[332,124],text:'A paved causeway, older than the village, laid straight across the channels. The stones are worn smooth in the middle.'},
  {id:'old-waterwheel',name:'Old Waterwheel',at:[372,122],text:'A broken waterwheel jammed in the middle channel. It has not turned in years.'},
  {id:'sluice-falls',name:'Sluice Falls',at:[356,104],text:'Three thin falls pour out of square openings in the cliff: the old sluices of the aqueduct above.'}
 ],
 exits:[
  {edge:'north',from:394,to:402,target:'aqueduct-ruins',label:'Aqueduct Ruins'},
  {edge:'north',from:430,to:436,target:'great-bridge',label:'The Great Bridge'},
  {edge:'west',from:118,to:130,target:'stone-clearing',label:'Stone Clearing'},
  {edge:'south',from:375,to:385,target:'long-boardwalk',label:'Long Boardwalk'}
 ]});

// 9.2 Long Boardwalk: a calm maze of grassy islands and reeds. The North Walk runs east to Egret Shallows; the Long
// Boardwalk winds south-west on posts past Stilt Rest, a roofed platform, down to Shellback Marsh.
area({id:'long-boardwalk',num:'9.2',name:'Long Boardwalk',frame:[288,438,136,206],size:[2600,1100],base:'water',ground:'marsh',
 shapes:[
  ['land',[[318,152],[340,146],[366,148],[384,156],[380,168],[356,172],[330,170],[318,162]],{zone:'meadow'}],
  ['land',[[288,164],[304,160],[316,172],[318,190],[306,204],[288,206]]],
  ['land',[[392,162],[404,160],[410,168],[400,172]]],
  ['land',[[340,178],[356,176],[362,184],[348,190],[336,186]]],
  ['land',[[410,186],[426,182],[434,190],[420,198],[406,194]]],
  ['land',[[288,136],[330,136],[340,144],[318,148],[298,150],[288,150]]],
  ['land',[[380,190],[394,192],[398,202],[384,204]]]
 ],
 walks:[[[378,136],[386,146],[400,152],[418,154],[438,150]],{pts:[[330,206],[342,199],[358,192],[376,186],[394,180],[410,172],[420,162],[416,154]],width:3},[[386,146],[376,152],[368,156]],[[376,186],[372,178],[368,170]]],
 props:[{kind:'stilt-hut',at:[376,188],roof:'#7a5a3a'},{kind:'heron',at:[352,183]}],
 places:[
  {id:'stilt-rest',name:'Stilt Rest',at:[377,188],text:'A roofed platform on posts halfway along the boardwalk. A good place to sit out the rain with a line in the water.'},
  {id:'long-isle',name:'Long Isle',at:[350,160],text:'A long grassy island in the reeds. Frogs, dragonflies, and the odd heron standing very still.'},
  {id:'north-walk',name:'North Walk',at:[404,154],text:'The boardwalk runs east from the Old Dyke toward Egret Shallows, over open water the colour of tea.'}
 ],
 exits:[
  {edge:'north',from:373,to:383,target:'falls-channels',label:'Falls Channels'},
  {edge:'east',from:145,to:155,target:'north-shallows',label:'North Shallows'},
  {edge:'south',from:325,to:335,target:'marsh',label:'Shellback Marsh'}
 ]});

export const DELTA_DEFS=DEFS;
export const DELTA=Object.fromEntries(DEFS.map(def=>[def.id,defineArea(def)]));
