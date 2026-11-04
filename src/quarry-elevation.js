// Quarry design in atlas coordinates. Heights are real gameplay levels, not painted shadows.
export const QUARRY_DEF={id:'abandoned-quarry',num:'8',name:'Abandoned Quarry',frame:[596,716,96,190],size:[2400,1880],base:'land',ground:'meadow',
 shapes:[['water',[[596,176],[630,174],[660,180],[690,176],[716,172],[716,190],[596,190]]],['water','ellipse',[665,148],10,6]],
 zones:[['dirt',[[640,134],[687,134],[694,141],[694,155],[688,160],[641,160],[635,154],[635,140]]],['rock',[[617,109],[701,109],[704,166],[617,166]]],['forest',[[596,96],[608,96],[608,128],[596,128]]],['forest',[[596,165],[614,165],[628,174],[596,176]]]],
 elevation:{base:0,terraces:[
  {id:'work-terrace',height:-1,points:[[620,118],[626,112],[693,112],[700,119],[700,157],[694,164],[627,164],[620,156]]},
  {id:'quarry-floor',height:-2,points:[[640,134],[687,134],[694,141],[694,155],[688,160],[641,160],[635,154],[635,140]]},
  {id:'flooded-pit',height:-3,points:[[655,148],[657,143],[665,142],[673,143],[675,148],[673,153],[665,154],[657,153]]}
 ],ramps:[
  {id:'upper-cart-ramp',from:[613,122],to:[627,122],width:4,fromHeight:0,toHeight:-1,kind:'ramp'},
  {id:'lower-cart-ramp',from:[628,143],to:[642,143],width:4,fromHeight:-1,toHeight:-2,kind:'ramp'},
  {id:'east-stairs',from:[690,127],to:[690,141],width:3,fromHeight:-1,toHeight:-2,kind:'stairs'}
 ]},
 cliffs:[],roads:[[[670,96],[670,105],[612,105],[612,122]],[[670,105],[707,105],[707,170]],[[596,158],[612,158],[612,122],[627,122],[630,130],[628,143],[642,143]],[[642,143],[648,139],[680,139]],[[707,170],[706.2,171.5]]],
 bridges:[[[706.2,171.5],[707,190]]],
 props:[{kind:'crane',at:[650,126]},{kind:'crane',at:[689,153]},{kind:'mine',at:[690,117]},{kind:'cart',at:[672,122]},{kind:'logs',at:[625,153]},{kind:'stone',at:[643,153]},{kind:'stone',at:[680,157]},{kind:'gate',at:[612,158]}],
 places:[{id:'quarry-pit',name:'Flooded Pit',at:[664,139],text:'Three levels below the woodland rim, rain and spring water fill the deepest cut. Submerged ledges disappear into green darkness.'},{id:'old-crane',name:'Old Crane',at:[652,129],text:'The crane stands on the work terrace. Its hook hangs over the abandoned excavation.'},{id:'collapsed-shaft',name:'Collapsed Shaft',at:[690,121],text:'A shaft cut into the terrace wall. Broken timbers and fallen stone seal the way.'},{id:'quarry-gate',name:'Quarry Gate',at:[612,156],text:'The old cart road winds down into the quarry. The rim path continues around it toward the bridge.'}],
 exits:[{edge:'north',from:665,to:675,target:'springmouth-cave',label:'Springmouth Cave'},{edge:'west',from:152,to:164,target:'egret-isles',label:'Egret Isles'},{edge:'south',from:702,to:712,target:'broken-watch',label:'The Broken Watch'}]
};
