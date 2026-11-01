"""Turn the new animals' art into game-ready sheets in assets/, and their poses into Index portraits in assets/codex/.

Each animal's source art lives in art/sprites/creatures/<id>/, made from the prompts in the project's
new-animals art prompt file: a column-layout walk set (4 columns: right, left, toward the camera, away; 8 frames
top to bottom) and action columns of 8 frames facing right. The cutting helpers are shared with
prepare-chapter6-sprites.py, so every sheet follows the house row layout: rows 0-3 walk, then one row per action.

  fox-sheet.png   rows 0-3 walk, row 4 the flee run, row 5 sitting and sniffing (idle), row 6 hurt (frames 0-1)
                  and defeat (frames 2-7).
  boar-sheet.png  rows 0-3 walk (7 frames each; the 8th cell is empty), row 4 the charge, row 5 hurt (frames 0-2) and
                  defeat (frames 3-7).
  elk-sheet.png   rows 0-3 walk, row 4 the antler swing, row 5 grazing (idle), row 6 hurt (frames 0-1) and defeat (2-7).

Run from the repository root: python3 scripts/prepare-animal-sprites.py
Requires Pillow and NumPy.
"""
import importlib.util
import numpy as np
from PIL import Image

spec=importlib.util.spec_from_file_location('ch6','scripts/prepare-chapter6-sprites.py')
ch6=importlib.util.module_from_spec(spec);spec.loader.exec_module(ch6)
ch6.OUT='assets/'
SRC='art/sprites/creatures/'

def portrait(path,out,size=256):
  """The pose on a transparent square, centred, for the Index."""
  im,mask=ch6.load(path);ys,xs=np.nonzero(mask);t,b,l,r=ys.min(),ys.max()+1,xs.min(),xs.max()+1
  rgb=im[t:b,l:r].copy();m=mask[t:b,l:r]
  g=rgb[...,1];lim=np.maximum(rgb[...,0],rgb[...,2]);rgb[...,1]=np.where(g>lim*1.1,lim*1.1,g).astype(int)
  img=Image.fromarray(np.dstack([rgb.clip(0,255).astype(np.uint8),(m*255).astype(np.uint8)]),'RGBA')
  k=(size-16)/max(img.size);img=img.resize((max(1,round(img.width*k)),max(1,round(img.height*k))),Image.LANCZOS)
  sheet=Image.new('RGBA',(size,size),(0,0,0,0));sheet.alpha_composite(img,((size-img.width)//2,(size-img.height)//2))
  sheet.save(out,optimize=True);print(out)

def width(frames):
  """Median nose-to-tail length of the drawn figures (column strips share one crop box, so the image width won't do)."""
  return np.median([np.ptp(np.nonzero(np.asarray(img)[...,3].any(0))[0])+1 for img,_,_ in [f for f in frames if f]])

if __name__=='__main__':
  # The fox: a little bigger than a rabbit, about 26 px tall to the ear tips walking side-on (Eli is about 55).
  d=SRC+'fox/'
  frames=ch6.walk(d+'fox_walk-sheet.png',(8,8,8,8),'columns','body');k=26*2/ch6.height(frames[:8])
  run=ch6.strip_column(d+'fox_run-column.png');idle=ch6.strip_column(d+'fox_idle-column.png');hurt=ch6.strip_column(d+'fox_hurt-column.png')
  # The run is stretched out, so it is matched by length: a galloping fox is about a fifth longer than a walking one.
  # The hurt strip starts standing, like the walk, and the idle strip stands to sniff in frame 7, so both are matched by
  # nose-to-tail length, which holds better than height while the head moves.
  side=width(frames[:8])
  ch6.pack('fox-sheet.png',[(frames,k),(run,k*side*1.2/width(run)),(idle,k*side/width(idle[6:7])),(hurt,k*side/width(hurt[:1]))])
  portrait(d+'fox_pose.png','assets/codex/fox.png')
  # The boar: waist-high to Eli and heavy, about 30 px tall at the bristles walking side-on. Its walk set has 7 frames a side.
  d=SRC+'boar/'
  frames=ch6.walk(d+'boar_walk-sheet.png',(7,7,7,7),'columns','body');k=30*2/ch6.height(frames[:7]);side=width(frames[:7])
  charge=ch6.strip_column(d+'boar_charge-column.png');hurt=ch6.strip_column(d+'boar_hurt-column.png')
  # Both strips start standing side-on, so their first frames are matched to the walk's length (the charge's dust aside).
  ch6.pack('boar-sheet.png',[(frames,k),(charge,k*side/width(charge[:1])),(hurt,k*side/width(hurt[:1]))])
  portrait(d+'boar_pose.png','assets/codex/boar.png')
  # The elk: taller than Eli at the shoulder, about 72 px to the antler tips walking side-on.
  # Every strip starts standing side-on, so each is matched to the walk by its first frame's length.
  d=SRC+'elk/'
  frames=ch6.walk(d+'elk_walk-sheet.png',(8,8,8,8),'columns','body');k=72*2/ch6.height(frames[:8]);side=width(frames[:8])
  strips=[ch6.strip_column(d+f'elk_{name}-column.png') for name in ('antler-swing','graze','hurt')]
  # The generated walk shrinks a little down each column. Each frame is pulled halfway back to the median height on its
  # own: all the way would blow up the long, low strides, which are shorter for a reason.
  mid=ch6.height(frames)
  ch6.pack('elk-sheet.png',[([f],72*2/np.sqrt(ch6.height([f])*mid)) for f in frames]+[(s,k*side/width(s[:1])) for s in strips])
  portrait(d+'elk_pose.png','assets/codex/elk.png')
