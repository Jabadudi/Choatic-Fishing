"""Turn the world bosses' art into game-ready sheets in assets/, their Index portraits, and Eli's two boss weapon sheets.

Source art lives in art/sprites/mobs/<id>/ (column-layout walk sets and action columns of 8 frames, as in
prepare-shadow-walker-sprites.py) and art/sprites/characters/eli/ (two columns of 8 frames facing right).

  drowned-captain-sheet.png  rows 0-3 walk, 4 rising from the shallows (toward the camera), 5 sabre sweep, 6 tide lunge,
                             7 call the drowned (toward the camera), 8 hurt (48... see below) and breaking into water and smoke
  greyhorn-sheet.png         rows 0-3 walk (7 frames each; the 8th cell is empty), 4 antler charge, 5 hoof stomp,
                             6 hollow bellow (toward the camera), 7 shadow antlers, 8 hurt and freed
  story/eli-sabre-sheet.png  row 0 the Captain's Sabre sweep, row 1 the tide lunge
  story/eli-spear-sheet.png  row 0 the Greyhorn Spear thrust, row 1 the antler charge
  codex/drowned-captain.png, codex/greyhorn.png   Index portraits

Run from the repository root: python3 scripts/prepare-boss-sprites.py
Requires Pillow and NumPy.
"""
import importlib.util
import numpy as np
from PIL import Image

def module(name,path):
  spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
ch6=module('ch6','scripts/prepare-chapter6-sprites.py');ch6.OUT='assets/'
animals=module('animals','scripts/prepare-animal-sprites.py')
shadow=module('shadow','scripts/prepare-shadow-walker-sprites.py')
SRC='art/sprites/mobs/'
ELI='art/sprites/characters/eli/'

def tall(frames):
  """Median height from the top drawn row to the baseline. Plumes, antlers and smoke count, the same in every row."""
  return np.median([base-np.nonzero((np.asarray(img)[...,3]>0).any(1))[0][0] for img,_,base in [f for f in frames if f]])

def boss(id,size,actions,counts=(8,8,8,8),line=False,anchor='body',side_fit=1):
  """size: game pixels tall walking side-on, to the top of the plume or antlers. actions: (name, frame, facing). Each
  strip is scaled so that frame stands as tall as the walk row that faces the same way (side or toward the camera).
  side_fit shrinks the side-on strips for art whose action columns draw a bigger body under the same antlers."""
  d=SRC+id+'/'
  frames=ch6.walk(d+f'{id}_walk-sheet.png',counts,'columns',anchor,line)
  side,front=tall(frames[:8]),tall(frames[16:24]);k=size*2/side
  groups=[(frames,k)]
  for name,i,facing in actions:
    strip=shadow.even_column(d+f'{id}_{name}-column.png')
    groups.append((strip,k*(front if facing=='front' else side*side_fit)/tall(strip[i:i+1] if i!=-1 else strip[-1:])))
  return ch6.pack(f'{id}-sheet.png',groups)

def eli(name,src):
  """Two columns of 8 frames facing right, each scaled so Eli stands as tall as on his walk sheet (about 55 px).
  The spear's tips reach across into the other column, so the sheet is split at its emptiest column between the two."""
  im,mask=ch6.load(ELI+src);w=mask.shape[1];prof=mask.sum(0)
  cut=w//3+int(np.argmin(prof[w//3:2*w//3]))
  frames=[]
  for a,b in ((0,cut),(cut,w)):
    half=Image.open(ELI+src).convert('RGB').crop((a,0,b,mask.shape[0]));path=f'/tmp/{name}-{a}.png';half.save(path)
    frames+=ch6.walk(path,(8,),'columns','head')
  ch6.OUT='assets/story/';ch6.pack(name,[(frames,55*2/ch6.height(frames[:1]))]);ch6.OUT='assets/'

def portrait(sheet,cell,frame,out,size=256):
  """An Index portrait from one frame of a game sheet, scaled up with hard pixels."""
  img=Image.open('assets/'+sheet);cw,ch=cell;x,y=(frame%8)*cw,(frame//8)*ch
  f=img.crop((x,y,x+cw,y+ch));f=f.crop(f.getbbox())
  k=(size-16)/max(f.size);f=f.resize((max(1,round(f.width*k)),max(1,round(f.height*k))),Image.NEAREST)
  sheet=Image.new('RGBA',(size,size),(0,0,0,0));sheet.alpha_composite(f,((size-f.width)//2,(size-f.height)//2))
  sheet.save('assets/'+out,optimize=True);print('assets/'+out)

if __name__=='__main__':
  # The Drowned Captain stands a head taller than a Drowned Soldier, about 72 px. The rise starts as a ripple and the
  # call faces the camera, so they are matched by their last frame (standing, sabre down).
  cell=boss('drowned-captain',72,[('rise',-1,'front'),('sweep',0,'side'),('lunge',0,'side'),('call',0,'front'),('hurt',0,'side')],line=True,anchor='head')
  portrait('drowned-captain-sheet.png',cell,16,'codex/drowned-captain.png')
  # Greyhorn is far bigger than a horse: about 112 px to the antler tips side-on. His action columns draw a body a third
  # longer under the same rack than his walk set does, so side-on strips are fitted down to the walk's body.
  cell=boss('greyhorn',112,[('charge',0,'side'),('stomp',0,'side'),('bellow',0,'front'),('antlers',0,'side'),('hurt',0,'side')],counts=(7,7,7,7),side_fit=.8)
  portrait('greyhorn-sheet.png',cell,0,'codex/greyhorn.png')
  eli('eli-sabre-sheet.png','eli_sabre-moves.png')
  eli('eli-spear-sheet.png','eli_spear-moves.png')
