"""Turn the eight new shadow walker kinds' art into game-ready sheets in assets/, and their poses into Index portraits.

Source art lives in art/sprites/mobs/<id>/, made from the shadow walker kinds art prompt file: a column-layout walk set
(4 columns: right, left, toward the camera, away; 8 frames top to bottom) and action columns of 8 frames facing right.
Every sheet follows the house row layout: rows 0-3 walk, then one row per action column, in the order listed here.

  hollow-stag-sheet.png      walk, antler swing, gallop, hurt and defeat
  gloam-boar-sheet.png       walk, gore charge, hurt and defeat
  stoneshade-sheet.png       walk, ground slam, hurt and defeat
  whisperer-sheet.png        walk, fade out and in, lunge, hurt and defeat
  mire-walker-sheet.png      walk, rising from the water, grab, hurt and defeat
  drowned-soldier-sheet.png  walk, rows 4-7 the wading walk, sword swing, hurt and defeat
  ash-archer-sheet.png       walk, shoot, step back, hurt and defeat; ash-arrow.png the arrow's 4 flight frames in a row
  inkeel-sheet.png           swim (its walk set, inkeel_walk-sheet.png), the strike from under the water, hurt and defeat

The defeat strips break up into ash and the fade, rise and strike strips start or end nearly empty, so action columns
are cut into eight equal bands rather than at the gaps between figures, and every frame keeps the strip's shared
baseline instead of standing on its own lowest pixels.

Run from the repository root: python3 scripts/prepare-shadow-walker-sprites.py
Requires Pillow and NumPy.
"""
import importlib.util
import numpy as np
from PIL import Image

spec=importlib.util.spec_from_file_location('ch6','scripts/prepare-chapter6-sprites.py')
ch6=importlib.util.module_from_spec(spec);spec.loader.exec_module(ch6)
ch6.OUT='assets/'
spec=importlib.util.spec_from_file_location('animals','scripts/prepare-animal-sprites.py')
animals=importlib.util.module_from_spec(spec);spec.loader.exec_module(animals)
SRC='art/sprites/mobs/'

def frame_bands(mask,n):
  """n bands covering the column. Start from the runs of drawn rows; a tiny run (ash, a fleck) joins its nearer
  neighbour, and while there are too few runs the tallest is split in half. Band edges sit midway between runs."""
  occ=mask.any(1);rows=np.nonzero(occ)[0];runs=[]
  for y in rows:
    if runs and y-runs[-1][1]<=2:runs[-1][1]=y+1
    else:runs.append([y,y+1])
  while len(runs)>n or (len(runs)>1 and min(b-a for a,b in runs)<.25*np.median([b-a for a,b in runs])):
    i=min(range(len(runs)),key=lambda i:runs[i][1]-runs[i][0])
    j=i-1 if i==len(runs)-1 or (i>0 and runs[i][0]-runs[i-1][1]<runs[i+1][0]-runs[i][1]) else i+1
    a,b=sorted((i,j));runs[a:b+1]=[[runs[a][0],runs[b][1]]]
    if len(runs)<=n and all(b-a>=.25*np.median([b-a for a,b in runs]) for a,b in runs):break
  while len(runs)<n:
    i=max(range(len(runs)),key=lambda i:runs[i][1]-runs[i][0]);a,b=runs[i]
    seg=mask[a:b].sum(1);m=(b-a)//2;w=(b-a)//5;c=a+m-w+int(np.argmin(seg[m-w:m+w]))
    runs[i:i+1]=[[a,c],[c,b]]
  edges=[0]+[(runs[i][1]+runs[i+1][0])//2 for i in range(n-1)]+[mask.shape[0]]
  return list(zip(edges[:-1],edges[1:]))

def even_column(path,n=8,drop=()):
  """One column of n frames in equal bands. Each frame is cropped from its band's top content row down to the strip's
  shared baseline (the median of the full frames' lowest rows), and anchored on frame 1's body centre."""
  im,mask=ch6.load(path);xs=np.nonzero(mask.any(0))[0];l,r=xs.min(),xs.max()+1
  bands=frame_bands(mask[:,l:r],n)

  sizes=[mask[a:b,l:r].sum() for a,b in bands];big=max(sizes)
  bottoms=[np.nonzero(mask[a:b,l:r].any(1))[0].max()+1 for (a,b),s in zip(bands,sizes) if s>big*.35]
  base=int(np.median(bottoms));ax=None;out=[]
  for (a,b),s in zip(bands,sizes):
    sub=mask[a:b,l:r];rows=np.nonzero(sub.any(1))[0]
    if not len(rows):out.append((Image.new('RGBA',(r-l,1)),ax or (r-l)/2,1));continue
    t=min(rows.min(),base-1);bottom=max(base,rows.max()+1)
    if ax is None:ax=np.nonzero(sub[t:base])[1].mean()
    # The baseline can sit a row or two past a short band; those rows stay empty.
    m=np.zeros((bottom-t,r-l),bool);m[:min(bottom,b-a)-t]=sub[t:min(bottom,b-a)]
    rgb=np.zeros((bottom-t,r-l,3),int);rgb[:min(bottom,b-a)-t]=im[a+t:a+min(bottom,b-a),l:r]
    g=rgb[...,1];lim=np.maximum(rgb[...,0],rgb[...,2]);rgb[...,1]=np.where(g>lim*1.1,lim*1.1,g).astype(int)
    out.append((Image.fromarray(np.dstack([rgb.clip(0,255).astype(np.uint8),(m*255).astype(np.uint8)]),'RGBA'),ax,base-t))
  # A few columns came out with 9 frames; drop the near-repeat so the action fills one 8-frame row.
  return [f for i,f in enumerate(out) if i not in drop]

width=animals.width
# Columns drawn with 9 frames: (bands, frames to leave out).
# Strips that start nearly empty (a puddle) are matched to the walk by a later, full frame instead.
SCALE_FRAME={'mire-walker_rise':-1,'inkeel_strike':-1}
NINE={'mire-walker_rise':(9,(5,)),'inkeel_hurt':(9,(3,))}

def kind(id,size,actions,by='height',extra=None):
  """size: game pixels tall (or long, by='width') walking side-on. Each action strip is matched to the walk by its first
  frame, which always starts in the walk's stance."""
  d=SRC+id+'/'
  frames=ch6.walk(d+f'{id}_walk-sheet.png',(8,8,8,8),'columns','body')
  measure=(lambda f:ch6.height(f)) if by=='height' else width
  k=size*2/measure(frames[:8]);ref=measure(frames[:8])
  groups=[(frames,k)]+(extra(d,k,ref,measure) if extra else [])
  for name in actions:
    n,drop=NINE.get(f'{id}_{name}',(8,()))
    strip=even_column(d+f'{id}_{name}-column.png',n,drop)
    i=SCALE_FRAME.get(f'{id}_{name}',0)
    groups.append((strip,k*ref/measure(strip[i:i+1] if i!=-1 else strip[-1:])))
  ch6.pack(f'{id}-sheet.png',groups)
  animals.portrait(d+f'{id}_pose.png',f'assets/codex/{id}.png')

def wade(d,k,ref,measure):
  frames=ch6.walk(d+'drowned-soldier_wade-sheet.png',(8,8,8,8),'columns','body')
  return [(frames,k*ref/measure(frames[:8]))]

def arrow():
  im,mask=ch6.load(SRC+'ash-archer/ash-archer_arrow-strip.png')
  edges=np.linspace(0,mask.shape[1],5).astype(int);cells=[]
  for a,b in zip(edges[:-1],edges[1:]):
    sub=mask[:,a:b];ys,xs=np.nonzero(sub);cells.append((im[ys.min():ys.max()+1,a+xs.min():a+xs.max()+1],sub[ys.min():ys.max()+1,xs.min():xs.max()+1]))
  # About 26 px long in game, drawn at half scale like the sheets.
  k=52/max(m.shape[1] for _,m in cells);cw=max(round(m.shape[1]*k) for _,m in cells)+4;ch=max(round(m.shape[0]*k) for _,m in cells)+4
  sheet=Image.new('RGBA',(cw*4,ch),(0,0,0,0))
  for i,(rgb,m) in enumerate(cells):
    rgb=rgb.copy();g=rgb[...,1];lim=np.maximum(rgb[...,0],rgb[...,2]);rgb[...,1]=np.where(g>lim*1.1,lim*1.1,g)
    img=Image.fromarray(np.dstack([rgb.clip(0,255).astype(np.uint8),(m*255).astype(np.uint8)]),'RGBA')
    img=img.resize((round(img.width*k),round(img.height*k)),Image.LANCZOS)
    sheet.alpha_composite(img,(cw*i+cw-2-img.width,(ch-img.height)//2))
  sheet.save('assets/ash-arrow.png',optimize=True);print(f'assets/ash-arrow.png: frameSize [{cw},{ch}]')

if __name__=='__main__':
  # The Hollow Stag stands taller than Eli at the shoulder, about 78 px to the antler tips.
  kind('hollow-stag',78,['antler-swing','run','hurt'])
  kind('gloam-boar',34,['charge','hurt'])
  # The Stoneshade is half again Eli's height; the Whisperer a head taller than him.
  kind('stoneshade',82,['slam','hurt'])
  kind('whisperer',66,['fade','lunge','hurt'])
  kind('mire-walker',55,['rise','grab','hurt'])
  kind('drowned-soldier',56,['swing','hurt'],extra=wade)
  kind('ash-archer',54,['shoot','step-back','hurt'])
  arrow()
  # The Inkeel's swim set is seen side-on at the surface; about 110 px long.
  kind('inkeel',110,['strike','hurt'],by='width')
