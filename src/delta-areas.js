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
 roads:[[[535,312],[560,313]],[[397,293],[412,300],[426,312],[426,330]],[[412,300],[430,292],[446,284]]],
 fords:[[[390,293],[397,293]],[[431,293],[437,285]],[[476,266],[476,274],[474,282]],[[460,288],[466,289]],[[480,296],[494,312]],[[517,313],[534,312]],[[426,330],[426,342]],[[498,332],[496,342]]],
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
  {id:'skerry-jetty',name:'The Jetty',at:[383,400],text:'A little plank jetty with a rowing boat tied to it. Eli rows east to the Delta Mouth',travel:{target:'delta-mouth',entry:[474,382]}},
  {id:'skerry-rowboat',name:'Rowboat to the Bay',at:[372,382],text:'An old rowboat pulled up on the shingle. Eli rows west across Arrival Bay',travel:{target:'arrival-bay',entry:[262,391]}}
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
 fords:[[[498,408],[512,406],[528,402],[546,394]],[[510,407],[508,413]],[[556,383],[556,388]],[[586,393],[598,399]],[[584,386],[590,376],[596,366],[598,362]]],
 props:[{kind:'sign',at:[568,392]},{kind:'nest',at:[554,376]}],
 places:[
  {id:'tide-shelf',name:'Tide Shelf',at:[484,408],text:'A rocky ledge below Crescent Beach, full of tide pools: crabs, anemones, a starfish the size of a hand.'},
  {id:'breaker-rock',name:'Breaker Rock',at:[509,416],text:'A lone rock out in the surf. Waves break over its back; deep water all around it.'},
  {id:'long-bar',name:'Long Bar',at:[568,394],text:'The biggest sand island, with a driftwood pole someone stuck in the middle as a marker.'},
  {id:'tern-bar',name:'Tern Bar',at:[555,378],text:'A small sandbar with a tuft of grass. The terns nesting here scream at anyone who comes close.'}
 ],
 portals:[{at:[484,401],r:34,target:'delta-mouth',label:'Delta Mouth',entry:[487,390]}],
 exits:[
  {edge:'east',from:356,to:368,target:'tidecave-coast',label:'Tidecave Coast'},
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

// 10.1 North Shallows: below the Great Bridge the river slows around Reed Isle. Stepping stones reach the Bridge Pool
// ledge under the arches; fords hop east to the islets, where the trail from Lookout Heights comes down the bank.
area({id:'north-shallows',num:'10.1',name:'North Shallows',frame:[428,592,86,146],size:[2600,950],base:'water',ground:'meadow',
 shapes:[
  ['land',[[428,86],[472,86],[468,96],[456,104],[440,108],[428,112]],{zone:'forest'}],
  ['land',[[504,86],[592,86],[592,118],[578,116],[560,114],[540,112],[522,104],[508,96]],{zone:'forest'}],
  ['land',[[455,98],[469,98],[469,104],[455,104]],{zone:'rock'}],
  ['land',[[442,124],[450,114],[466,112],[486,114],[500,122],[498,132],[482,138],[460,138],[446,134]],{zone:'sand'}],
  ['land',[[496,100],[506,98],[512,104],[506,110],[496,108]],{zone:'sand'}],
  ['land',[[508,118],[520,112],[536,116],[540,124],[528,130],[512,128]],{zone:'sand'}]
 ],
 zones:[['meadow',[[450,124],[456,117],[470,116],[486,118],[494,124],[484,132],[464,134],[452,130]]],['meadow',[[512,120],[522,116],[534,120],[530,126],[516,126]]]],
 cliffs:[[[540,86],[592,86],[592,100],[560,102],[544,96]]],
 walks:[[[428,130],[436,129],[444,128]]],
 fords:[[[462,113],[462,103]],[[499,123],[509,122]],[[503,109],[510,117]],[[530,115],[532,109]],[[524,129],[524,146]]],
 roads:[[[532,86],[528,94],[534,102],[532,110]]],
 props:[{kind:'arch',at:[474,88]},{kind:'arch',at:[488,88]},{kind:'arch',at:[502,88]},{kind:'heron',at:[468,117]},{kind:'heron',at:[473,119]},{kind:'stone',at:[566,112]}],
 places:[
  {id:'bridge-pool',name:'Bridge Pool',at:[462,101],text:'A stone ledge under the arches of the Great Bridge. The water below is deep and fast, and the big river fish hold in it.'},
  {id:'reed-isle',name:'Reed Isle',at:[472,126],text:'A big islet of reeds and grass in the middle of the river. White birds rest on its tip and do not mind you much.'},
  {id:'north-islet',name:'North Islet',at:[503,104],text:'A small sandy islet, one step off the ford. Good for casting into the current.'},
  {id:'east-islet',name:'East Islet',at:[525,122],text:'A grassy islet where the trail from the heights meets the fords. The middle channel runs south from here.'},
  {id:'creek-mouth',name:'Creek Mouth',at:[562,113],text:'Spring Creek tumbles in from the east, cold and clear from Springmouth Cave. Fish here that live nowhere else in the delta.'}
 ],
 exits:[
  {edge:'north',from:527,to:537,target:'lookout-heights',label:'Lookout Heights'},
  {edge:'west',from:125,to:135,target:'long-boardwalk',label:'Long Boardwalk'},
  {edge:'south',from:519,to:529,target:'egret-isles',label:'Egret Isles'}
 ]});

// 10.2 Egret Isles: calm, warm water around Egret Isle, where the great egret roosts. Wooded isles to the south, the
// main channel bending down the east, and an old boat at a landing where a path leads off toward the quarry.
area({id:'egret-isles',num:'10.2',name:'Egret Isles',frame:[434,586,138,200],size:[2600,1060],base:'water',ground:'meadow',
 shapes:[
  ['land',[[476,148],[500,142],[530,141],[548,148],[552,164],[540,174],[518,172],[496,164],[480,158]]],
  ['land',[[462,170],[478,164],[496,168],[500,186],[488,196],[466,194],[456,182]],{zone:'forest'}],
  ['land',[[434,174],[450,176],[454,190],[440,198],[434,198]],{zone:'forest'}],
  ['land',[[504,182],[516,178],[528,184],[524,198],[506,200]],{zone:'forest'}],
  ['land',[[566,138],[586,138],[586,200],[546,200],[550,188],[560,174],[566,160],[566,148]],{zone:'forest'}],
  ['land',[[434,138],[478,138],[470,144],[446,146],[434,144]],{zone:'sand'}]
 ],
 zones:[['sand',[[476,148],[500,142],[530,141],[548,148],[552,164],[540,174],[518,172],[496,164],[480,158],[484,154],[500,147],[528,146],[544,152],[546,163],[538,169],[520,168],[498,160],[486,156]]]],
 walks:[[[487,159],[485,168]],[[462,184],[451,186]],[[474,190],[472,200]],[[498,184],[507,184]]],
 fords:[[[524,138],[524,146]],[[551,158],[567,156]],[[522,196],[532,200]]],
 roads:[[[566,155],[576,157],[586,160]]],
 props:[{kind:'heron',at:[526,152]},{kind:'nest',at:[530,150]},{kind:'boat',at:[561,150]},{kind:'dock',at:[566,152]}],
 places:[
  {id:'egret-isle',name:'Egret Isle',at:[524,156],text:'The long middle islet. The great egret roosts here, tall and white, and watches the water for hours without moving.'},
  {id:'old-boat-landing',name:'Old Boat Landing',at:[568,156],text:'An old boat tied at a landing on the east bank. A path leads off east toward the quarry.'},
  {id:'wooded-isle',name:'Wooded Isle',at:[480,180],text:'A small isle under alders. Plank walks join it to Egret Isle and to Stilt Reach in the south.'}
 ],
 exits:[
  {edge:'north',from:519,to:529,target:'north-shallows',label:'North Shallows'},
  {edge:'south',from:466,to:478,target:'stilt-reach',label:'Stilt Reach'},
  {edge:'south',from:526,to:536,target:'heron-islands',label:'Heron Islands'},
  {edge:'east',from:154,to:164,target:'abandoned-quarry',label:'Abandoned Quarry'}
 ]});

// 6.1 The Great Bridge: the Silverflow comes down a gorge from the north-west and passes under the Great Bridge's
// arches. A broken older bridge stands upstream; a branch drops off the south-west edge as the Silverfall.
area({id:'great-bridge',num:'6.1',name:'The Great Bridge',frame:[416,506,0,100],size:[1700,1890],base:'land',ground:'meadow',
 shapes:[
  ['water',[[416,8],[428,12],[440,22],[456,30],[468,42],[476,56],[484,68],[500,80],[506,86],[506,100],[476,100],[476,86],[470,76],[462,62],[450,48],[436,38],[424,32],[416,30]]],
  ['water','line',[[476,88],[460,92],[444,95],[430,98],[416,100]],5]
 ],
 zones:[['forest',[[456,0],[506,0],[506,60],[490,56],[478,40],[462,24],[440,8],[440,0]]],['forest',[[416,76],[430,80],[446,84],[470,82],[470,100],[416,100]]],['rock',[[416,30],[424,32],[436,38],[450,48],[462,62],[470,76],[476,86],[466,86],[456,72],[446,60],[434,48],[422,40],[416,40]]]],
 bridges:[{pts:[[424,72],[450,72],[476,73],[500,74],[506,74]],width:4.5},[[422,90],[428,96],[433,100]]],
 roads:[[[416,44],[422,56],[426,66],[424,72]],[[424,72],[422,82],[422,90]]],
 props:[{kind:'arch',at:[466,78]},{kind:'arch',at:[488,80]},{kind:'pillar',at:[442,26]},{kind:'pillar',at:[448,30]},{kind:'ruin',at:[434,18]},{kind:'sign',at:[420,58]}],
 places:[
  {id:'great-bridge-span',name:'The Great Bridge',at:[462,72],text:'A long stone bridge on tall arches, high over the gorge. The Silverflow roars underneath, fast and silver-white.'},
  {id:'broken-bridge',name:'Broken Bridge',at:[430,44],text:'An older, smaller bridge, long since broken. Two pillars still stand in the river where its span used to be.'},
  {id:'silverfall-head',name:'Silverfall Head',at:[426,90],text:'A rock stair winds down beside the Silverfall, where a branch of the river drops off the edge toward the channels.'}
 ],
 exits:[
  {edge:'west',from:38,to:50,target:'old-roads',label:'Old Roads'},
  {edge:'south',from:428,to:438,target:'falls-channels',label:'Falls Channels'},
  {edge:'east',from:68,to:80,target:'lookout-heights',label:'Lookout Heights'}
 ]});

// 6.2 Lookout Heights: high ground east of the river under a ruined lookout tower. The road from the bridge forks
// north-east to Springmouth Cave, and a trail runs south down to the shallows.
area({id:'lookout-heights',num:'6.2',name:'Lookout Heights',frame:[500,586,0,100],size:[1600,1860],base:'land',ground:'meadow',
 shapes:[['water',[[500,80],[506,84],[510,100],[500,100]]]],
 zones:[['forest',[[540,0],[586,0],[586,22],[560,36],[544,46],[540,30]]],['forest',[[550,60],[586,44],[586,100],[540,100],[544,84]]],['rock',[[510,14],[532,12],[536,34],[526,44],[512,40]]],['forest',[[500,0],[530,0],[510,12],[500,30]]],['forest',[[500,40],[512,44],[520,60],[500,64]]]],
 roads:[[[500,74],[518,72],[532,68]],[[532,68],[546,52],[560,40],[574,34],[586,30]],[[532,68],[531,80],[530,90],[532,100]],[[532,68],[528,52],[524,40]]],
 props:[{kind:'tower',at:[521,26]},{kind:'ruin',at:[530,30]},{kind:'sign',at:[536,72]},{kind:'cairn',at:[514,36]}],
 places:[
  {id:'ruined-lookout',name:'Ruined Lookout',at:[522,36],text:'A ruined stone lookout tower. From its foot you can see the whole delta: the bridge, the shallows, and the sea far to the south.'},
  {id:'road-fork',name:'Road Fork',at:[534,70],text:'The bridge road splits here. North-east to Springmouth Cave, south down the trail to the shallows.'}
 ],
 exits:[
  {edge:'west',from:68,to:80,target:'great-bridge',label:'The Great Bridge'},
  {edge:'east',from:24,to:36,target:'springmouth-cave',label:'Springmouth Cave'},
  {edge:'south',from:526,to:536,target:'north-shallows',label:'North Shallows'}
 ]});

// 5.1 Aqueduct Ruins: an old waterworks. The aqueduct's arches cross from south-west to north-east, two of them
// fallen; water spills through the first gap into the Spill Pool. The Sluice Wall sends channels south to 9.
area({id:'aqueduct-ruins',num:'5.1',name:'Aqueduct Ruins',frame:[260,422,40,102],size:[2600,1300],base:'land',ground:'meadow',
 shapes:[
  ['water','line',[[260,60],[272,64],[284,72],[292,78]],2],
  ['water','line',[[272,102],[280,92],[288,82],[292,78]],2],
  ['water','line',[[292,78],[304,78],[318,78],[332,76]],2.6],
  ['water',[[330,70],[346,66],[354,72],[350,80],[334,82],[326,77]]],
  ['water','line',[[338,82],[340,92],[342,102]],2],
  ['water','line',[[366,84],[368,92],[372,102]],2],
  ['water','line',[[352,80],[380,82],[396,86],[404,94],[406,102]],2]
 ],
 zones:[['forest',[[260,40],[300,40],[296,50],[290,60],[272,54],[260,50]]],['forest',[[260,84],[276,86],[270,102],[260,102]]],['forest',[[300,94],[330,96],[336,102],[300,102]]],['forest',[[410,60],[422,58],[422,102],[408,102],[406,90]]],
  ['rock',[[316,74],[372,66],[404,62],[410,80],[380,90],[320,90]]],['dirt',[[298,66],[330,60],[370,52],[408,44],[418,52],[410,58],[372,62],[330,68],[300,72]]]],
 roads:[[[260,56],[272,58],[286,64],[296,72],[304,80]],[[266,102],[270,94],[276,88],[286,84],[296,82],[304,80]],[[304,80],[318,86],[334,88],[352,88],[378,90],[396,92],[400,102]],[[300,74],[298,64],[298,52],[300,40]]],
 bridges:[[[286,80],[290,87]],[[302,74],[305,84]],[[336,88],[344,88]],[[364,90],[372,90]]],
 props:[{kind:'pillar',at:[310,63]},{kind:'pillar',at:[320,61]},{kind:'pillar',at:[329,60]},{kind:'pillar',at:[358,55]},{kind:'pillar',at:[368,53]},{kind:'pillar',at:[387,50]},{kind:'pillar',at:[397,48]},{kind:'pillar',at:[406,47]},{kind:'pillar',at:[416,45]},{kind:'ruin',at:[342,60]},{kind:'ruin',at:[381,53]},{kind:'wheel',at:[340,84]},{kind:'wheel',at:[367,86]},{kind:'wheel',at:[388,84]},{kind:'statue',at:[392,72]},{kind:'pillar',at:[400,68]},{kind:'pillar',at:[322,92],solid:0}],
 places:[
  {id:'the-aqueduct',name:'The Aqueduct',at:[362,62],text:'A long row of stone arches, taller than any house in Willowback. Two have fallen. Water still runs along the top and spills through the first gap.'},
  {id:'spill-pool',name:'Spill Pool',at:[338,64],text:'Water from the broken arch pours into a round pool. Something square and dark lies on the bottom, too regular to be a rock.'},
  {id:'sluice-wall',name:'Sluice Wall',at:[386,89],text:'An old wall with three wooden gates and their wheels. They still send water south toward the channels.'},
  {id:'arch-court',name:'Arch Court',at:[394,66],text:'An old paved yard under the arches, scattered with fallen blocks and lone pillars.'},
  {id:'two-streams',name:'Two Streams',at:[277,62],text:'Elk Brook and the stream from the Stone Clearing meet here and run east together toward the pool.'}
 ],
 exits:[
  {edge:'west',from:51,to:61,target:'elk-run',label:'Elk Run'},
  {edge:'south',from:261,to:271,target:'stone-clearing',label:'Stone Clearing'},
  {edge:'north',from:295,to:305,target:'old-roads',label:'Old Roads'},
  {edge:'south',from:395,to:405,target:'falls-channels',label:'Falls Channels'}
 ]});

// 4.3 Stone Clearing: an open clearing ringed by forest with an old Stone Circle at its heart. Greyback Ridge and
// Echo Rock rise to the north-east; a spring at the ridge's foot runs east, and a branch tumbles south into the river.
area({id:'stone-clearing',num:'4.3',name:'Stone Clearing',frame:[214,292,100,176],size:[1800,1750],base:'land',ground:'forest',
 shapes:[
  ['water',[[250,176],[262,170],[276,166],[292,164],[292,176]]],
  ['water','line',[[266,138],[272,140],[280,142],[286,143],[292,143]],1.6],
  ['water','line',[[280,143],[281,150],[282,158],[283,167]],1.6],
  ['land',[[214,150],[232,138],[248,140],[256,152],[258,166],[244,176],[214,176]],{zone:'meadow'}],
  ['land',[[250,122],[262,118],[276,124],[278,138],[272,152],[258,156],[250,146],[248,132]],{zone:'rock'}],
  ['land',[[268,156],[280,156],[280,164],[268,166]],{zone:'rock'}]
 ],
 roads:[[[214,172],[224,167],[234,161],[242,155],[246,150]],[[246,150],[247,140],[252,130],[260,124],[270,114],[280,106],[290,100]],[[246,150],[258,156],[266,154],[276,150],[286,149],[292,148]],[[266,154],[270,158],[274,160]]],
 bridges:[[[277,150],[285,149]]],
 props:[{kind:'stone',at:[241.0,163.0],solid:14},{kind:'stone',at:[239.8,165.9],solid:14},{kind:'stone',at:[236.9,167.4],solid:14},{kind:'stone',at:[233.5,166.9],solid:14},{kind:'stone',at:[231.3,164.5],solid:14},{kind:'stone',at:[231.3,161.5],solid:14},{kind:'stone',at:[233.5,159.1],solid:14},{kind:'stone',at:[236.9,158.6],solid:14},{kind:'stone',at:[239.8,160.1],solid:14},{kind:'stone',at:[264,131],solid:34,size:2},{kind:'cairn',at:[256,124]}],
 places:[
  {id:'stone-circle',name:'Stone Circle',at:[236,159],text:'Nine standing stones in a ring, older than anyone can say. The grass inside is greener than the grass outside.'},
  {id:'echo-rock',name:'Echo Rock',at:[258,126],text:'A great grey stone split down the middle, on top of Greyback Ridge. Shout into the crack and it shouts back, a little late.'},
  {id:'ridge-spring',name:'The Spring',at:[264,141],text:'A small spring bubbles out at the foot of the ridge and runs off east as a stream.'},
  {id:'rapids-ledge',name:'Rapids Ledge',at:[274,161],text:'A rocky ledge where the stream tumbles into the village river. The water is fast and full of bubbles.'}
 ],
 exits:[
  {edge:'west',from:164,to:175,target:'forest-edge',label:'Forest Edge'},
  {edge:'north',from:283,to:292,target:'aqueduct-ruins',label:'Aqueduct Ruins'},
  {edge:'east',from:143,to:153,target:'falls-channels',label:'Falls Channels'}
 ]});

// 4.1 Forest Edge: the fringe of the forest behind the village fence. The track climbs through the Woodcutters' Glade
// into the Whispering Woods; a side path runs east past Mirror Pond toward the Stone Clearing.
area({id:'forest-edge',num:'4.1',name:'Forest Edge',frame:[128,218,142,194],size:[1900,1100],base:'land',ground:'forest',
 shapes:[
  ['land',[[160,180],[164,166],[176,160],[188,162],[190,176],[176,182]],{zone:'meadow'}],
  ['land',[[184,150],[218,148],[218,170],[188,168]],{zone:'meadow'}],
  ['water',[[192,154],[204,152],[214,155],[215,162],[206,165],[195,163]]]
 ],
 roads:[[[146,194],[150,187],[158,180],[168,174],[176,170],[182,163],[185,155],[186,148],[186,142]],[[180,166],[190,168],[200,170],[210,172],[218,174]]],
 walks:[[[186,158],[195,159]]],
 props:[{kind:'hut',at:[170,157]},{kind:'logs',at:[162,179]},{kind:'sign',at:[181,168]},{kind:'bench',at:[178,172]}],
 places:[
  {id:'woodcutters-glade',name:'Woodcutters’ Glade',at:[174,172],text:'An open clearing of stumps and sawdust. Someone has been cutting here for years and stacking the logs very neatly.'},
  {id:'woodcutters-hut',name:'Woodcutter’s Hut',at:[172,163],text:'A small hut with an axe by the door and smoke from the chimney. Nobody answers, but the kettle is warm.'},
  {id:'mirror-pond',name:'Mirror Pond',at:[194,160],text:'A still pond ringed with reeds and lily pads. On a calm day the trees stand upside down in it.'},
  {id:'berry-bushes',name:'Berry Bushes',at:[156,186],text:'Bramble bushes along the track, heavy with berries. A few are ripe enough to eat.'}
 ],
 exits:[
  {edge:'north',from:181,to:191,target:'whispering-woods',label:'Whispering Woods'},
  {edge:'east',from:169,to:179,target:'stone-clearing',label:'Stone Clearing'}
 ]});

// 4.2 Whispering Woods: a dark, close forest where the wind sounds like voices. Narrow trails open into three
// clearings: the Whispering Hollow at the centre, Fernglade in the west, the Sunspot Glade across Whisper Brook.
area({id:'whispering-woods',num:'4.2',name:'Whispering Woods',frame:[122,222,96,150],size:[2000,1080],base:'land',ground:'forest',
 shapes:[
  ['water','line',[[212,96],[210,104],[206,112],[203,120],[204,130],[206,140],[205,150]],2],
  ['land',[[156,112],[170,110],[178,118],[176,128],[164,131],[154,124]],{zone:'clear'}],
  ['land',[[126,128],[140,126],[150,134],[146,146],[132,148],[124,142]],{zone:'meadow'}],
  ['land',[[196,110],[212,108],[218,118],[210,126],[198,124]],{zone:'meadow'}]
 ],
 roads:[[[186,150],[184,142],[182,134],[180,126],[182,118],[185,108],[186,96]],[[182,130],[172,130],[164,131],[156,134],[146,137],[134,140],[122,140]],[[140,136],[136,126],[132,116],[127,106],[122,100]],[[181,122],[172,121]],[[185,116],[196,116],[201,117]]],
 bridges:[[[200,117],[209,116]]],
 props:[{kind:'big-tree',at:[160,114],glow:'#cfe8ff',solid:26},{kind:'big-tree',at:[174,113],glow:'#cfe8ff',solid:26},{kind:'stone',at:[166,121],solid:12},{kind:'cave',at:[129,131]},{kind:'logs',at:[212,114]}],
 places:[
  {id:'whispering-hollow',name:'Whispering Hollow',at:[168,124],text:'A ring of old hollow trunks around a mossy stump. The whispers are loudest here. If you stand still they almost make words.'},
  {id:'fernglade',name:'Fernglade',at:[137,139],text:'Ferns up to your shoulders and mushrooms that glow faintly blue. Something has made a den under the roots.'},
  {id:'sunspot-glade',name:'Sunspot Glade',at:[206,118],text:'A patch of sunlight around a great fallen tree beside Whisper Brook. Warm, bright, and full of butterflies.'}
 ],
 exits:[
  {edge:'south',from:181,to:191,target:'forest-edge',label:'Forest Edge'},
  {edge:'north',from:181,to:191,target:'listening-glade',label:'The Listening Tree'},
  {edge:'west',from:135,to:145,target:'upper-falls',label:'Glasswater Pools'},
  {edge:'west',from:96,to:105,target:'trailhead',label:'Deepwood Trailhead'}
 ]});

// 2.1 Listening Glade: the end of the Chapter 4 road. A wide, quiet glade of moss, and the Listening Tree filling the
// whole north side, its roots reaching into the glade and a dark doorway in its south face.
area({id:'listening-glade',num:'2.1',name:'Listening Glade',frame:[110,210,0,100],size:[2000,1800],base:'land',ground:'forest',
 shapes:[
  ['land',[[122,62],[140,58],[170,58],[196,54],[206,60],[206,74],[198,86],[188,92],[170,94],[146,92],[128,86],[118,76]],{zone:'meadow'}],
  ['land',[[116,58],[130,48],[150,44],[170,46],[186,52],[196,58],[176,64],[130,66]],{zone:'clear'}],
  ['water',[[176,70],[184,67],[191,70],[190,76],[182,78],[175,75]]]
 ],
 roads:[[[186,100],[186,94],[183,88],[176,82],[166,78],[156,74]],[[110,92],[114,86],[119,80],[125,75],[133,73]],[[186,74],[194,68],[200,64],[206,62],[210,62]]],
 props:[{kind:'big-tree',at:[155,44],scale:3,solid:120,clear:260,glow:'#ffe7a8'},{kind:'logs',at:[134,62],solid:0},{kind:'logs',at:[170,64],solid:0},{kind:'stone',at:[197,68]},{kind:'lantern',at:[150,72]},{kind:'lantern',at:[160,72]}],
 places:[
  {id:'listening-tree',name:'The Listening Tree',at:[155,55],text:'A trunk wider than a house and roots as thick as logs. In its south face is a dark doorway into the hollow. Everything is very quiet here.'},
  {id:'listening-ring',name:'Listening Ring',at:[155,74],text:'A half-circle of glowing mushrooms in front of the door. Stand inside it and the forest seems to hold its breath.'},
  {id:'elk-stone',name:'Elk Stone',at:[195,73],text:'A pale flat rock on the east side of the glade. Hoofprints all around it, and a few white hairs caught on the edge.'},
  {id:'root-pool',name:'Root Pool',at:[183,81],text:'A small still pool caught between two roots. The water is so clear it looks empty.'}
 ],
 exits:[
  {edge:'south',from:181,to:191,target:'whispering-woods',label:'Whispering Woods'},
  {edge:'west',from:87,to:97,target:'trailhead',label:'Deepwood Trailhead'},
  {edge:'east',from:57,to:67,target:'elk-run',label:'Elk Run'}
 ]});

// 2.2 Elk Run: the elk's own woods. The Elk Path winds from the glade up to the Grey Spire; halfway along, a trail
// crosses Elk Brook on a plank bridge and leads down to the Aqueduct Ruins.
area({id:'elk-run',num:'2.2',name:'Elk Run',frame:[204,268,0,100],size:[1600,1800],base:'land',ground:'forest',
 shapes:[
  ['water','line',[[220,0],[223,16],[228,30],[234,42],[242,52],[252,60],[260,64],[268,65]],2],
  ['water',[[240,52],[248,50],[252,56],[246,61],[239,58]]],
  ['land',[[234,68],[248,66],[258,72],[258,84],[246,88],[234,82]],{zone:'clear'}],
  ['land',[[208,76],[220,74],[226,82],[218,90],[208,88]],{zone:'meadow'}],
  ['land',[[254,14],[264,12],[267,24],[262,32],[254,28]],{zone:'rock'}]
 ],
 roads:[[[204,62],[212,58],[222,53],[232,49]],[[241,45],[250,40],[256,32],[259,24]],[[248,42],[253,52],[256,58]],[[260,67],[263,70],[268,73]],[[232,50],[236,60],[240,68]],[[214,57],[214,68],[216,76]]],
 fords:[[[233,49],[241,45]]],
 bridges:[[[256,58],[260,67]]],
 props:[{kind:'pillar',at:[260,26],scale:3,solid:34},{kind:'big-tree',at:[244,78],glow:'#ffd36a',solid:26},{kind:'big-tree',at:[252,74],glow:'#ffd36a',solid:26},{kind:'nest',at:[214,84]},{kind:'nest',at:[219,86]}],
 places:[
  {id:'grey-spire',name:'Grey Spire',at:[256,31],text:'An old weathered standing stone, taller than three men. From its foot you can see over the trees to the river.'},
  {id:'goldleaf-stand',name:'Goldleaf Stand',at:[240,72],text:'A grove of golden trees that stays autumn-coloured all year. The leaves never seem to fall.'},
  {id:'elk-beds',name:'Elk Beds',at:[216,80],text:'A hollow of flattened ferns where the elk herd rests. Still warm.'},
  {id:'brook-pool',name:'Brook Pool',at:[241,63],text:'Elk Brook widens into a clear little pool. Trout hold in the shade of the bank.'}
 ],
 exits:[
  {edge:'west',from:57,to:67,target:'listening-glade',label:'Listening Glade'},
  {edge:'east',from:68,to:78,target:'aqueduct-ruins',label:'Aqueduct Ruins'}
 ]});

// 1.1 Trailhead: a crossroads in the deep woods. Trails meet at the Crossing beside an old woodsman's camp; a path
// runs west past the Mossrock boulders to the Falls Overlook, where rock steps go down to Glasswater.
area({id:'trailhead',num:'1.1',name:'Trailhead',frame:[8,122,36,112],size:[2000,1400],base:'land',ground:'forest',
 shapes:[
  ['water','line',[[22,36],[26,48],[32,62],[36,74],[40,86],[42,98],[42,112]],2.4],
  ['land',[[88,64],[104,62],[110,70],[106,80],[92,84],[84,76]],{zone:'clear'}],
  ['land',[[72,74],[84,72],[88,82],[80,90],[70,86]],{zone:'meadow'}],
  ['land',[[38,94],[56,92],[66,98],[62,108],[44,110],[36,104]],{zone:'rock'}],
  ['land',[[64,84],[80,88],[84,98],[74,104],[64,100]],{zone:'rock'}]
 ],
 roads:[[[84,36],[85,44],[88,52],[94,60],[97,68]],[[104,72],[110,76],[116,80],[122,82]],[[100,78],[106,88],[112,96],[118,104],[122,108]],[[92,74],[84,80],[76,86],[66,90],[56,96],[50,100]],[[50,100],[53,105],[54,112]],[[97,68],[100,78]],[[92,74],[97,68],[104,72]]],
 props:[{kind:'sign',at:[96,70]},{kind:'tent',at:[76,77]},{kind:'logs',at:[82,86]},{kind:'stone',at:[68,94]},{kind:'stone',at:[78,98]},{kind:'stone',at:[72,102]},{kind:'bench',at:[46,98]}],
 places:[
  {id:'the-crossing',name:'The Crossing',at:[99,73],text:'A mossy clearing where three trails meet. An old wooden signpost points to the Listening Tree, Willowback and Deepwood.'},
  {id:'woodsmans-camp',name:'Woodsman’s Camp',at:[80,82],text:'A lean-to, a fire ring with log seats, a chopping block and a woodpile. The ashes are cold, but not very old.'},
  {id:'mossrock',name:'Mossrock Boulders',at:[64,92],text:'Grey boulders furred with moss, some taller than Eli. Something small lives under the biggest one.'},
  {id:'falls-overlook',name:'Falls Overlook',at:[50,101],text:'A rocky ledge with a wooden rail at the lip of the falls. Far below, the Glasswater pools shine turquoise.'}
 ],
 exits:[
  {edge:'north',from:80,to:90,target:'deep-trail',label:'Deep Trail'},
  {edge:'east',from:77,to:87,target:'listening-glade',label:'Listening Glade'},
  {edge:'east',from:102,to:111,target:'whispering-woods',label:'Whispering Woods'},
  {edge:'south',from:49,to:59,target:'upper-falls',label:'Upper Falls'}
 ]});

// 1.2 Deep Trail: the oldest, darkest part of the forest. The Goldleaf Trail climbs north-west to the Fallen Giant,
// a trunk taller than Eli that closes the way deeper into the Whispering Forest for now.
area({id:'deep-trail',num:'1.2',name:'Deep Trail',frame:[2,122,2,92],size:[2000,1600],base:'land',ground:'forest',
 shapes:[
  ['land',[[4,20],[24,17],[30,30],[25,44],[6,44]],{zone:'meadow'}],
  ['water',[[8,26],[18,23],[24,30],[20,38],[10,38]]],
  ['water','line',[[18,36],[20,48],[22,60],[24,74],[26,92]],2],
  ['land',[[34,50],[54,46],[62,56],[52,68],[36,66]],{zone:'marsh'}],
  ['land',[[92,14],[108,12],[114,24],[104,32],[92,28]],{zone:'clear'}]
 ],
 roads:[[[82,92],[82,72],[80,56],[76,46],[68,40],[56,34],[44,29],[34,22],[29,16]],[[66,39],[78,32],[90,26],[98,22]],[[42,28],[34,30],[27,32]],[[56,34],[50,42],[46,48]]],
 props:[{kind:'logs',at:[25,10],scale:3.5,solid:60},{kind:'stilt-hut',at:[104,20]},{kind:'nest',at:[44,58]},{kind:'nest',at:[52,62]},{kind:'big-tree',at:[70,52],glow:'#ffd36a',solid:26},{kind:'big-tree',at:[62,28],glow:'#ffd36a',solid:26}],
 places:[
  {id:'fallen-giant',name:'Fallen Giant',at:[31,19],text:'A tree trunk taller than Eli lies across the trail. Beyond it the forest goes on, deeper and darker. There is no way over it. Not yet.'},
  {id:'spring-pond',name:'Spring Pond',at:[26,33],text:'A small pond fed by a spring. Fallsrun begins here and slips off south through the trees.'},
  {id:'hunters-lookout',name:'Hunter’s Lookout',at:[99,24],text:'An old platform up in a tree, with a ladder. From the top you can see over the whole forest.'},
  {id:'thornbrake',name:'Thornbrake',at:[47,49],text:'A tangle of brambles with dens dug underneath. Something growls, then thinks better of it.'}
 ],
 exits:[{edge:'south',from:77,to:87,target:'trailhead',label:'Trailhead'}]});

// 3.1 Upper Falls: Fallsrun pours over the Top Falls into the Upper Pool, where a heron stands on a rock island.
// Rock steps come down from the overlook; a cascade tumbles south-east toward Glasswater.
area({id:'upper-falls',num:'3.1',name:'Upper Falls',frame:[2,128,100,166],size:[2200,1300],base:'land',ground:'forest',
 shapes:[
  ['water','line',[[43,100],[43,110],[44,120],[46,127]],3],
  ['land',[[40,122],[72,120],[96,128],[96,146],[72,150],[46,146]],{zone:'sand'}],
  ['water',[[46,126],[70,124],[90,130],[88,141],[70,144],[50,140]]],
  ['land',[[60,131],[66,130],[68,135],[62,137]],{zone:'rock'}],
  ['water','line',[[80,141],[80,148],[82,154],[83,160],[83,166]],2],
  ['land',[[84,140],[100,140],[100,166],[76,166]],{zone:'meadow'}]
 ],
 cliffs:[[[2,100],[36,100],[40,112],[38,126],[44,140],[40,152],[30,166],[2,166]]],
 roads:[[[54,100],[57,104],[52,108],[57,112],[52,116],[56,120],[58,124]],[[58,124],[70,122],[86,126],[92,132],[92,140]],[[92,140],[93,148],[92,156],[90,166]],[[92,133],[104,136],[116,138],[128,140]]],
 props:[{kind:'heron',at:[64,133]},{kind:'cave',at:[37,112]},{kind:'bench',at:[78,122]}],
 places:[
  {id:'top-falls',name:'Top Falls',at:[52,111],text:'Fallsrun pours over the lip above into the pool, in a curtain of white water. Behind it, the rock looks darker, almost like an opening.'},
  {id:'upper-pool',name:'Upper Pool',at:[72,123],text:'A clear, deep pool full of mist and rainbows. A heron stands on the rock in the middle, ignoring you completely.'},
  {id:'the-cascade',name:'The Cascade',at:[88,148],text:'The pool spills out of its south-east corner and tumbles down a short rocky cascade toward Glasswater.'}
 ],
 exits:[
  {edge:'north',from:50,to:58,target:'trailhead',label:'Trailhead'},
  {edge:'east',from:135,to:145,target:'whispering-woods',label:'Whispering Woods'},
  {edge:'south',from:85,to:95,target:'glasswater',label:'Glasswater Basin'}
 ]});

// 3.2 Glasswater Basin: the widest, clearest water in the north. The Middle Falls spread into Glasswater, a turquoise
// pool around Willow Isle, with a jetty and an empty fishing hut on the east shore and the Lower Falls in the south.
area({id:'glasswater',num:'3.2',name:'Glasswater Basin',frame:[2,130,158,214],size:[2200,1100],base:'land',ground:'forest',
 shapes:[
  ['land',[[14,176],[50,166],[78,164],[104,168],[116,180],[112,198],[90,208],[60,210],[30,210],[14,204]],{zone:'sand'}],
  ['water',[[20,184],[36,178],[56,172],[74,168],[92,168],[106,176],[108,188],[98,198],[80,202],[62,200],[46,204],[30,204],[20,198]]],
  ['water','line',[[83,158],[83,164],[84,170]],3],
  ['water','line',[[48,203],[50,208],[51,214]],2],
  ['land',[[58,176],[70,175],[72,183],[60,184]],{zone:'meadow'}]
 ],
 cliffs:[[[2,158],[14,158],[16,175],[10,190],[12,214],[2,214]]],
 roads:[[[90,158],[94,164],[98,170]],[[98,170],[108,178],[110,188],[104,198],[90,204],[74,206],[60,206],[56,207]],[[56,207],[57,211],[58,214]]],
 walks:[[[104,190],[98,190]]],
 props:[{kind:'hut',at:[117,183]},{kind:'big-tree',at:[65,180],solid:0},{kind:'dock',at:[100,190]}],
 places:[
  {id:'glasswater-jetty',name:'Glasswater',at:[100,190],text:'A turquoise pool so clear you can see the fish from the jetty. In the west the Clearwater Shallows are sandy and knee-deep.'},
  {id:'fishing-hut',name:'Fishing Hut',at:[112,190],text:'An empty fishing hut. A net on the wall, a stool by the door, and a kettle that someone meant to come back for.'},
  {id:'willow-isle',name:'Willow Isle',at:[96,168],text:'A small isle with a single willow in the middle of Glasswater. You would need a boat to reach it.'},
  {id:'middle-falls',name:'Middle Falls',at:[91,164],text:'The water from the Upper Pool drops in here and spreads out into Glasswater.'},
  {id:'lower-falls',name:'Lower Falls',at:[56,206],text:'At the south end the water slips over the Lower Falls toward Western Falls. A path goes down beside them.'}
 ],
 exits:[
  {edge:'north',from:87,to:95,target:'upper-falls',label:'Upper Falls'},
  {edge:'south',from:53,to:63,target:'western-falls',label:'Western Falls'}
 ]});

// 11 Western Falls: where the Glasswater staircase reaches the lowlands. The Lower Falls and the Veil Falls drop into
// the Plunge Pool; a slow river runs south-east past Fallsfoot, a hamlet of stilt houses, to the Drowned Road.
area({id:'western-falls',num:'11',name:'Western Falls',frame:[0,128,204,320],size:[2200,2000],base:'land',ground:'forest',
 shapes:[
  ['land',[[4,236],[36,226],[60,240],[70,270],[56,300],[30,312],[4,318]],{zone:'sand'}],
  ['land',[[98,214],[118,212],[124,240],[126,262],[110,252],[96,232]],{zone:'forest'}],
  ['water',[[36,224],[70,220],[96,222],[104,240],[116,258],[128,268],[128,320],[60,320],[64,300],[72,276],[64,252],[44,236]]],
  ['water','line',[[52,204],[50,214],[48,226]],3],
  ['water','line',[[86,206],[86,214],[86,224]],2],
  ['land',[[4,300],[30,298],[60,306],[60,320],[4,320]],{zone:'sand'}]
 ],
 cliffs:[[[30,204],[100,204],[100,214],[66,222],[36,222],[26,214]]],
 roads:[[[58,204],[60,212],[58,219]],[[42,238],[40,246],[42,262],[50,276],[46,290],[34,302],[24,312],[14,320]]],
 walks:[[[58,218],[53,228],[43,237]],[[46,240],[56,252],[64,264],[66,280],[62,294]],[[66,268],[80,268]],[[66,286],[82,286]]],
 props:[{kind:'stilt-hut',at:[56,248]},{kind:'stilt-hut',at:[64,261]},{kind:'stilt-hut',at:[69,274],roof:'#7a5a3a'},{kind:'stilt-hut',at:[68,292]},{kind:'boat',at:[86,271]},{kind:'boat',at:[88,289]},{kind:'pillar',at:[100,282]},{kind:'pillar',at:[110,296]},{kind:'pillar',at:[118,276]},{kind:'pillar',at:[96,306]}],
 places:[
  {id:'lower-falls-foot',name:'Lower Falls',at:[59,214],text:'Rock steps come down beside the Lower Falls. The smaller Veil Falls drops off the same ledge a little to the east.'},
  {id:'plunge-pool',name:'Plunge Pool',at:[46,235],text:'Both falls crash into a deep, churning pool. Big fish hang in the white water and wait for whatever comes over the edge.'},
  {id:'fallsfoot',name:'Fallsfoot',at:[52,264],text:'A tiny hamlet of four stilt houses joined by a boardwalk. Nets drying, a cat on a roof, and nobody in a hurry.'},
  {id:'fallsfoot-docks',name:'Fallsfoot Docks',at:[76,268],text:'Two little docks with boats moored to them. Out in the river the first pillars of the drowned road stand in the current.'},
  {id:'river-sandbar',name:'The Sandbar',at:[30,308],text:'A long sandbar at the river mouth. From here you can wade out into the Drowned Road shallows.'}
 ],
 exits:[
  {edge:'north',from:53,to:63,target:'glasswater',label:'Glasswater Basin'},
  {edge:'south',from:8,to:30,target:'drowned-road',label:'The Drowned Road'}
 ]});

// 16 The Drowned Road: wide turquoise shallows over a flooded street. The old road's paving runs just under the
// surface from the Landing north-west past a colonnade of pillars; sandbars link the beaches and the islets.
area({id:'drowned-road',num:'16',name:'The Drowned Road',frame:[0,235,265,395],size:[3000,1700],base:'water',ground:'sand',
 shapes:[
  ['land',[[0,286],[58,294],[64,312],[56,330],[28,336],[0,342]],{zone:'sand'}],
  ['land',[[55,345],[112,344],[122,358],[98,366],[64,362]],{zone:'sand'}],
  ['land',[[140,352],[205,348],[235,346],[235,395],[160,395],[148,374]],{zone:'sand'}],
  ['land',[[24,318],[90,318],[100,342],[62,362],[16,350]],{zone:'sand'}],
  ['land',[[0,265],[62,265],[58,288],[30,290],[0,286]],{zone:'forest'}],
  ['land',[[206,276],[235,272],[235,304],[214,300]],{zone:'forest'}],
  ['land',[[206,334],[235,330],[235,350],[210,352]],{zone:'meadow'}],
  ['land',[[103,348],[136,348],[138,370],[108,372]],{zone:'meadow'}],
  // Sandbars where the beaches and islets touch.
  ['land','line',[[70,352],[100,353]],6],['land','line',[[100,356],[116,358]],6],['land','line',[[30,330],[40,324]],6],['land','line',[[20,282],[26,294]],6]
 ],
 zones:[['forest',[[30,322],[84,322],[92,340],[62,354],[24,346]]]],
 fords:[{pts:[[112,265],[124,280],[140,292],[158,305],[172,320],[186,334],[205,340],[235,341]],width:5},[[118,358],[152,366]],[[200,339],[200,352]]],
 props:[{kind:'pillar',at:[78,282]},{kind:'pillar',at:[86,286]},{kind:'pillar',at:[94,290],scale:.6},{kind:'pillar',at:[102,294]},{kind:'pillar',at:[80,300]},{kind:'pillar',at:[108,306],scale:.6},{kind:'pillar',at:[128,272]},{kind:'pillar',at:[140,276]},{kind:'pillar',at:[166,282],scale:.6},{kind:'pillar',at:[180,294]},{kind:'pillar',at:[150,330]},{kind:'pillar',at:[160,346],scale:.6},{kind:'pillar',at:[192,302]},{kind:'pillar',at:[200,322]},{kind:'pillar',at:[118,318],scale:.6},{kind:'pillar',at:[176,356]},{kind:'arch',at:[84,320]},{kind:'heron',at:[52,334]},{kind:'nest',at:[56,338]},{kind:'stone',at:[20,346],solid:0},{kind:'stone',at:[112,374],solid:0}],
 places:[
  {id:'sunken-doorway',name:'The Sunken Doorway',at:[80,328],text:'A stone arch half under water, with steps going down into the dark. The doorway the old sign at the Landing speaks of.'},
  {id:'colonnade',name:'The Colonnade',at:[121,278],text:'A row of tall pillars, some still standing, some broken off at the knee. The road runs between them under a hand of water.'},
  {id:'eel-shallows',name:'Eel Shallows',at:[178,327],text:'The paving shows clearly here through the warm water. Eels slide between the stones.'},
  {id:'rookery-isle',name:'Rookery Isle',at:[46,340],text:'A wooded islet loud with seabirds. Nests in every crook of every tree.'},
  {id:'beach-skiff',name:'Beach Skiff',at:[22,326],text:'A flat skiff pulled up on the west beach. Eli poles out south to the Outer Shallows',travel:{target:'outer-shallows',entry:[48,414]}},
  {id:'gull-islet',name:'Gull Islet',at:[118,360],text:'A grassy islet where gulls sit in rows and argue about everything.'}
 ],
 exits:[
  {edge:'east',from:335,to:347,target:'landing',label:'Reedwater Landing'},
  {edge:'north',from:8,to:40,target:'western-falls',label:'Western Falls'}
 ]});

// 22 Arrival Bay: a walkable beach along the north (tide pools, driftwood, the wrecked dinghy) and the bay Eli rowed
// across in Chapter 1. The Mistline in the south stops every boat.
area({id:'arrival-bay',num:'22',name:'Arrival Bay',frame:[180,300,385,470],size:[2400,1700],base:'water',ground:'sand',sea:true,spawn:[256,392],
 shapes:[
  ['land',[[180,385],[300,385],[300,398],[284,400],[262,396],[240,401],[214,397],[196,400],[180,397]],{zone:'sand'}],
  ['land',[[180,385],[300,385],[300,387],[180,387]],{zone:'meadow'}],
  ['water','ellipse',[195,391],2.5,1.2],['water','ellipse',[268,390],2.5,1.2],
  ['land','ellipse',[194,414],5,4],['land','ellipse',[286,410],3,4],['land','ellipse',[291,414],2.5,3]
 ],
 zones:[['rock',[[188,410],[200,410],[200,418],[188,418]]],['rock',[[282,405],[295,405],[295,418],[282,418]]]],
 walks:[{pts:[[251,396],[251,412]],width:3.5},{pts:[[245,412],[258,412]],width:3}],
 props:[{kind:'wreck',at:[226,395]},{kind:'logs',at:[208,393],solid:0},{kind:'logs',at:[280,392],solid:0},{kind:'shell',at:[238,393],solid:0},{kind:'raft',at:[262,414]}],
 places:[
  {id:'arrival-pier',name:'The Pier',at:[251,409],text:'The pier where the captain’s boat came in. A rowboat is tied at the end. Eli rows east to the Seal Skerries',travel:{target:'seal-skerries',entry:[371,384]}},
  {id:'wrecked-dinghy',name:'Wrecked Dinghy',at:[228,397],text:'A small boat with its bottom stove in, half buried in the sand. Someone painted a name on it once.'},
  {id:'west-rowboat',name:'West Rowboat',at:[206,394],text:'A rowboat drawn up at the west end of the beach. Eli rows out west to the Outer Shallows',travel:{target:'outer-shallows',entry:[84,412]}},
  {id:'tide-pools',name:'Tide Pools',at:[268,393],text:'Rock pools left by the tide, full of little crabs and anemones that close up when your shadow falls on them.'},
  {id:'mistline',name:'The Mistline',at:[251,412],text:'Far out in the south, a wall of mist lies on the water. Every boat that tries it comes back the same way it went.'}
 ],
 exits:[{edge:'north',from:200,to:290,target:'landing',label:'Reedwater Landing'}]});

// 5.2 Old Roads: open meadow north of the ruins where two old paved roads cross. One runs east to the river and on to
// the Great Bridge; the north edge is the top of the atlas and leads nowhere.
area({id:'old-roads',num:'5.2',name:'Old Roads',frame:[262,422,0,46],size:[2800,900],base:'land',ground:'meadow',
 shapes:[['water',[[398,0],[422,0],[422,30],[412,31],[402,24],[396,10]]]],
 zones:[['forest',[[262,0],[290,0],[286,16],[276,30],[270,46],[262,46]]],['forest',[[310,32],[360,30],[366,46],[306,46]]],['forest',[[330,0],[364,0],[360,12],[334,12]]],['rock',[[384,36],[396,36],[398,46],[384,46]]]],
 roads:[[[262,26],[290,24],[320,20],[350,20],[378,22]],[[370,0],[372,10],[378,22],[381,34],[379,46]],[[378,22],[392,30],[408,36],[422,42]],[[300,46],[302,34],[304,23]]],
 props:[{kind:'sign',at:[382,19]},{kind:'cairn',at:[322,18]},{kind:'ruin',at:[290,14]},{kind:'cart',at:[352,26]},{kind:'stone',at:[396,22]}],
 places:[
  {id:'old-crossroads',name:'Old Crossroads',at:[376,25],text:'Two old paved roads cross here, their stones worn smooth. A leaning signpost points north to somewhere the paint has worn away.'},
  {id:'old-milestone',name:'Old Milestone',at:[322,22],text:'A milestone half sunk in the grass. The numbers on it count down to a town that is not on any map you have seen.'},
  {id:'old-cart',name:'Abandoned Cart',at:[352,23],text:'An old cart with a broken wheel, left where it stopped. Grass grows up through the boards.'},
  {id:'upper-river',name:'Upper Silverflow',at:[402,34],text:'The Silverflow runs fast and clear here, above the gorge. The road follows it east toward the Great Bridge.'}
 ],
 exits:[
  {edge:'south',from:295,to:305,target:'aqueduct-ruins',label:'Aqueduct Ruins'},
  {edge:'east',from:36,to:46,target:'great-bridge',label:'The Great Bridge'}
 ]});

// 7 Springmouth Cave: a cold spring pours out of a cave mouth at the foot of a rock face and runs off south-west as
// Spring Creek. The old road comes in from Lookout Heights and climbs north toward the Crystal Lakes.
area({id:'springmouth-cave',num:'7',name:'Springmouth Cave',frame:[586,710,0,96],size:[2400,1860],base:'land',ground:'forest',
 shapes:[
  ['land',[[600,20],[640,16],[650,30],[620,34],[600,34]],{zone:'meadow'}],
  ['land',[[606,60],[640,64],[668,76],[668,90],[640,92],[606,84]],{zone:'meadow'}],
  ['water','ellipse',[650,72],6,3],
  ['water','line',[[648,74],[642,78],[632,86],[618,94],[612,96]],2.5]
 ],
 cliffs:[[[620,40],[690,36],[704,58],[684,68],[662,62],[640,60],[626,56]]],
 zones:[['rock',[[616,38],[694,32],[708,60],[686,72],[660,66],[638,64],[622,60]]]],
 roads:[[[586,30],[600,28],[616,24],[626,14],[630,0]],[[616,24],[612,40],[618,56],[630,66],[642,68]],[[630,66],[634,71]],[[640,80],[656,88],[670,96]]],
 bridges:[[[633,70],[641,81]]],
 props:[{kind:'cave',at:[652,64],scale:1.6},{kind:'sign',at:[622,22]},{kind:'logs',at:[628,5],solid:40},{kind:'stone',at:[660,74],solid:0},{kind:'lantern',at:[640,66]}],
 places:[
  {id:'springmouth',name:'Springmouth Cave',at:[642,69],text:'Cold air breathes out of a dark cave mouth, and a spring pours from it, clear as glass. The way in is too dark to try. Not yet.'},
  {id:'crystal-lakes-road',name:'Crystal Lakes Road',at:[627,10],text:'The old road climbs north toward the Crystal Lakes. A fallen tree lies across it, and beyond it the forest is thick and dark.'},
  {id:'spring-creek',name:'Spring Creek',at:[640,82],text:'The spring water runs off south-west over little rapids toward the shallows. It is cold enough to make your hand ache.'}
 ],
 exits:[
  {edge:'west',from:24,to:36,target:'lookout-heights',label:'Lookout Heights'},
  {edge:'south',from:665,to:675,target:'abandoned-quarry',label:'Abandoned Quarry'}
 ]});

// 8 Abandoned Quarry: terraced stone pits, old cranes and collapsed shafts, with a flooded pit at the bottom. Roads cross
// the pit floor; the landing path comes in from Egret Isles and a bridge crosses the river south to the Broken Watch.
area({id:'abandoned-quarry',num:'8',name:'Abandoned Quarry',frame:[596,716,96,190],size:[2400,1880],base:'land',ground:'meadow',
 shapes:[
  ['water',[[596,176],[630,174],[660,180],[690,176],[716,172],[716,190],[596,190]]],
  ['land',[[624,104],[700,100],[712,130],[700,165],[640,170],[618,150]],{zone:'rock'}],
  ['water','ellipse',[664,142],7,4]
 ],
 zones:[['dirt',[[640,118],[690,115],[698,140],[680,158],[645,158],[632,140]]],['forest',[[596,96],[620,96],[616,120],[596,124]]],['forest',[[596,164],[618,160],[630,174],[596,176]]]],
 cliffs:[[[686,102],[712,98],[716,124],[702,124]],[[604,110],[620,104],[626,122],[610,128]]],
 roads:[[[670,96],[666,110],[660,124]],[[596,158],[620,156],[640,150],[654,142]],[[630,112],[660,128],[684,140],[700,156]],[[700,112],[680,124],[656,134]],[[650,148],[630,160]],[[700,156],[706,168]]],
 bridges:[[[706,168],[707,190]]],
 props:[{kind:'crane',at:[650,116]},{kind:'crane',at:[694,146]},{kind:'mine',at:[692,116]},{kind:'cart',at:[676,128]},{kind:'logs',at:[626,150]},{kind:'stone',at:[640,138]},{kind:'stone',at:[686,156]},{kind:'gate',at:[618,156]}],
 places:[
  {id:'quarry-pit',name:'Flooded Pit',at:[664,133],text:'The lowest pit has filled with rain and spring water, deep and green. Something big turns over in it now and then.'},
  {id:'old-crane',name:'Old Crane',at:[652,121],text:'A wooden crane with a rusted hook, still pointing at a block it never lifted.'},
  {id:'collapsed-shaft',name:'Collapsed Shaft',at:[690,121],text:'A shaft into the rock, its timbers broken and the way in choked with stone. Cold air seeps between the rocks.'},
  {id:'quarry-gate',name:'Quarry Gate',at:[624,157],text:'Two leaning posts where a gate used to hang. A faded board says the quarry is closed by order of somebody.'}
 ],
 exits:[
  {edge:'north',from:665,to:675,target:'springmouth-cave',label:'Springmouth Cave'},
  {edge:'west',from:152,to:164,target:'egret-isles',label:'Egret Isles'},
  {edge:'south',from:702,to:712,target:'broken-watch',label:'The Broken Watch'}
 ]});

// 14 Heron Islands: wooded islands joined by sandbars, with a heron colony on the biggest. Fords lead north to Egret
// Isles, west to Stilt Reach, south-west to the Upper Braids and east across the channel to the Broken Watch.
area({id:'heron-islands',num:'14',name:'Heron Islands',frame:[508,628,200,330],size:[2400,2600],base:'water',ground:'forest',
 shapes:[
  ['land',[[510,210],[534,204],[548,212],[546,232],[526,236],[510,230]],{zone:'forest'}],
  ['land',[[556,224],[586,218],[600,234],[592,256],[566,258],[552,246]],{zone:'forest'}],
  ['land',[[540,266],[566,268],[582,286],[570,304],[546,306],[532,288]],{zone:'forest'}],
  ['land',[[596,262],[618,256],[628,258],[628,282],[606,286]],{zone:'meadow'}],
  ['land',[[540,312],[566,310],[572,330],[536,330]],{zone:'sand'}]
 ],
 zones:[['sand',[[512,226],[530,230],[546,226],[546,232],[526,236],[510,230]]],['meadow',[[566,232],[584,228],[590,240],[580,248],[566,246]]]],
 fords:[[[530,200],[530,207]],[[508,222],[513,222]],[[546,222],[557,232]],[[567,256],[561,268]],[[595,250],[603,263]],[[556,304],[555,313]]],
 props:[{kind:'heron',at:[572,236]},{kind:'heron',at:[580,240]},{kind:'heron',at:[568,244]},{kind:'nest',at:[576,232]},{kind:'nest',at:[584,236]},{kind:'nest',at:[574,246]},{kind:'big-tree',at:[562,286],solid:26},{kind:'wreck',at:[540,300]}],
 places:[
  {id:'heron-colony',name:'Heron Colony',at:[576,240],text:'Dozens of herons nest in the treetops here, croaking and clattering. The ground below is white with their mess, and smells like it.'},
  {id:'sandbar-crossing',name:'Sandbar Crossing',at:[551,227],text:'A sandbar between the islands, just under the water at high tide. Little crabs scatter as you wade.'},
  {id:'hidden-cove',name:'Hidden Cove',at:[546,296],text:'A tiny cove on the south isle with an old boat rotting in the reeds. Nobody seems to know whose it was.'},
  {id:'east-isle',name:'East Isle',at:[612,272],text:'A grassy isle facing the Broken Watch across the channel. The tower watches back.'}
 ],
 exits:[
  {edge:'north',from:526,to:536,target:'egret-isles',label:'Egret Isles'},
  {edge:'west',from:218,to:228,target:'stilt-reach',label:'Stilt Reach'},
  {edge:'south',from:540,to:556,target:'upper-braids',label:'Upper Braids'},
  {edge:'east',from:262,to:278,target:'broken-watch',label:'The Broken Watch'}
 ]});

// 15 The Broken Watch: a ruined watchtower on the eastern cliffs. Its door is sealed; something still keeps watch.
area({id:'broken-watch',num:'15',name:'The Broken Watch',frame:[620,716,190,310],size:[2000,2500],base:'land',ground:'forest',
 shapes:[
  ['water',[[620,190],[716,190],[716,198],[694,204],[668,208],[644,204],[620,206]]],
  ['water',[[620,226],[628,236],[632,262],[628,290],[624,310],[620,310]]],
  ['land',[[650,218],[680,216],[686,248],[656,252]],{zone:'rock'}]
 ],
 cliffs:[[[700,246],[716,236],[716,310],[694,310],[690,286]]],
 roads:[[[706,206],[696,218],[680,226],[668,236]],[[668,236],[660,258],[650,280],[640,298],[632,310]],[[660,258],[646,264],[634,266]],[[660,258],[676,266],[688,270]]],
 bridges:[[[707,188],[706,208]]],
 fords:[[[620,266],[635,266]]],
 props:[{kind:'tower',at:[666,232],scale:1.4,solid:70},{kind:'ruin',at:[680,240]},{kind:'ruin',at:[652,224]},{kind:'stone',at:[688,276]},{kind:'lantern',at:[662,246]}],
 places:[
  {id:'broken-watch-tower',name:'The Broken Watch',at:[666,245],text:'A ruined watchtower, its top half fallen. The door is sealed with rusted iron. High up, a light flickers for a moment, then is gone.'},
  {id:'cliff-edge',name:'Cliff Edge',at:[688,268],text:'The forest stops at a sheer drop to the sea. Far below, waves boom into a cave.'},
  {id:'watch-ford',name:'Channel Ford',at:[636,266],text:'A shallow ford across the channel to the Heron Islands. Herons stand in it and refuse to move for you.'}
 ],
 exits:[
  {edge:'north',from:702,to:712,target:'abandoned-quarry',label:'Abandoned Quarry'},
  {edge:'west',from:260,to:272,target:'heron-islands',label:'Heron Islands'},
  {edge:'south',from:627,to:637,target:'tidecave-coast',label:'Tidecave Coast'}
 ]});

// 20 Tidecave Coast: a rocky coast below the Broken Watch with a sea cave in the cliff. A tide shelf runs under the cliff
// to the cave mouth; a sandbar in the west wades over to the Sandbar Spits.
area({id:'tidecave-coast',num:'20',name:'Tidecave Coast',frame:[580,720,300,400],size:[2800,2000],base:'water',ground:'forest',sea:true,
 shapes:[
  ['land',[[580,300],[720,300],[720,330],[704,336],[684,332],[664,338],[642,336],[620,342],[600,340],[580,336]],{zone:'forest'}],
  ['land',[[676,328],[708,332],[706,344],[680,344]],{zone:'rock'}],
  ['land',[[580,348],[626,352],[640,362],[616,368],[580,364]],{zone:'sand'}],
  ['land','ellipse',[664,354],4,3],
  ['land','ellipse',[690,362],3,2]
 ],
 zones:[['sand',[[600,334],[642,330],[664,334],[664,338],[642,336],[620,342],[600,340]]],['rock',[[662,350],[668,350],[668,358],[662,358]]]],
 cliffs:[[[672,302],[720,302],[720,330],[704,334],[684,330],[674,318]]],
 roads:[[[632,300],[630,320],[626,336]],[[630,320],[656,326],[678,334],[692,338]]],
 fords:[[[624,338],[624,354]]],
 props:[{kind:'cave',at:[692,332],scale:1.4},{kind:'stone',at:[664,352]},{kind:'stone',at:[690,360],scale:1.4},{kind:'logs',at:[600,356],solid:0},{kind:'shell',at:[610,360],solid:0}],
 places:[
  {id:'sea-cave',name:'Sea Cave',at:[692,340],text:'A dark sea cave under the cliff. The waves fill it with a deep, slow boom. The tide is in; it only opens when the water goes right out.'},
  {id:'tide-shelf',name:'Tide Shelf',at:[682,338],text:'A flat rock shelf under the cliff, slippery with weed and full of pools. Seals bask on the rocks offshore.'},
  {id:'tidecave-sandbar',name:'Tidecave Sandbar',at:[606,358],text:'A long sandbar running west toward the Sandbar Spits. You can wade it at any tide.'}
 ],
 exits:[
  {edge:'north',from:627,to:637,target:'broken-watch',label:'The Broken Watch'},
  {edge:'west',from:348,to:362,target:'sandbar-spits',label:'Sandbar Spits'}
 ]});

// 25 Heron Point: a rocky point in the far south-east where the great heron stands, as on the atlas.
area({id:'heron-point',num:'25',name:'Heron Point',frame:[598,700,390,470],size:[2000,1560],base:'water',ground:'rock',sea:true,
 shapes:[
  ['land',[[598,390],[616,394],[634,408],[648,426],[644,442],[628,446],[612,436],[598,420]],{zone:'rock'}],
  ['land','ellipse',[620,454],3,2]
 ],
 zones:[['sand',[[598,390],[616,394],[624,402],[598,410]]],['meadow',[[602,404],[618,404],[628,418],[614,424],[602,418]]]],
 props:[{kind:'heron',at:[636,430],scale:2.6},{kind:'stone',at:[612,428]},{kind:'shell',at:[606,398],solid:0},{kind:'stone',at:[620,452],scale:1.4}],
 places:[
  {id:'heron-point',name:'Heron Point',at:[626,428],text:'The great heron stands at the end of the point, taller than Eli, grey as the rock. It looks at you for a long time. Then it looks back at the sea.'},
  {id:'point-pools',name:'Point Pools',at:[608,410],text:'Tide pools in the rock, bright with anemones and tiny fish.'}
 ],
 exits:[{edge:'west',from:392,to:406,target:'sandbar-spits',label:'Sandbar Spits'}]});

// 21 Outer Shallows: open water west of the Drowned Road, with sea stacks and one sandy islet. Boat only.
area({id:'outer-shallows',num:'21',name:'Outer Shallows',frame:[0,180,380,480],size:[3000,1670],base:'water',ground:'sand',sea:true,spawn:[62,412],
 shapes:[
  ['land',[[36,404],[76,398],[96,410],[84,424],[50,426],[34,416]],{zone:'sand'}],
  ['land','ellipse',[130,412],4,6],['land','ellipse',[150,440],3,4],['land','ellipse',[20,446],3,3]
 ],
 zones:[['meadow',[[50,406],[72,404],[80,412],[70,418],[52,416]]],['rock',[[124,404],[136,404],[136,420],[124,420]]],['rock',[[146,434],[154,434],[154,446],[146,446]]],['rock',[[16,442],[24,442],[24,450],[16,450]]]],
 props:[{kind:'stone',at:[130,414],scale:2.4,solid:0},{kind:'stone',at:[150,442],scale:1.8,solid:0},{kind:'stone',at:[20,448],scale:1.4,solid:0},{kind:'raft',at:[92,416]},{kind:'raft',at:[40,418]},{kind:'logs',at:[64,422],solid:0}],
 places:[
  {id:'stack-islet',name:'Stack Islet',at:[64,410],text:'A sandy islet in open water, with sea stacks standing around it like old giants. Big fish cruise the drop-off.'},
  {id:'to-arrival-bay',name:'Rowboat East',at:[88,414],text:'Eli rows back east to Arrival Bay',travel:{target:'arrival-bay',entry:[208,392]}},
  {id:'to-drowned-road',name:'Skiff North',at:[44,414],text:'Eli poles north to the Drowned Road',travel:{target:'drowned-road',entry:[24,322]}}
 ]});

export const DELTA_DEFS=DEFS;
export const DELTA=Object.fromEntries(DEFS.map(def=>[def.id,defineArea(def)]));
