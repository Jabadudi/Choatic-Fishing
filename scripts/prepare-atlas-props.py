"""Cut the Reedwater Delta atlas sheets in art/sprites/props/atlas/ into single props in assets/props/atlas/.

The sheets come from the atlas areas art prompt file (sections 2 to 4): props on flat #00FF00, separate and not
touching. Each drawn blob is found on a coarse grid, and every blob goes to the named prop whose rough centre (in the
1536×1024 sheet) is nearest, so loose bits such as a stepping stone or a falling leaf stay with their prop.
Props are saved at half the sheet's size; the game fits each into a box of its own size.

Run from the repository root: python3 scripts/prepare-atlas-props.py
Requires Pillow and NumPy.
"""
import os
import numpy as np
from PIL import Image

SRC='art/sprites/props/atlas/';OUT='assets/props/atlas/'
SHEETS={
 'special-trees':{'listening-tree':(340,250),'fallen-giant':(1100,240),'hollow-tree':(245,745),'goldleaf-tree':(730,740),'chime-tree':(1250,720)},
 'trees-plants-rocks':{'oak':(240,230),'pine':(630,230),'birch':(950,230),'dead-tree':(1310,230),'bush':(190,610),'fern':(540,630),
  'reeds':(910,610),'marsh-shrub':(1310,630),'mossy-boulder':(170,870),'rock-cluster':(500,880),'mossy-log':(895,870),'sea-rock':(1340,880)},
 'ruins':{'tower':(170,230),'ruin-wall':(500,290),'arch':(860,230),'pillar':(1150,240),'pillar-water':(1390,260),'statue':(210,660),
  'shrine':(560,560),'standing-stone':(860,550),'cairn':(1180,560),'aqueduct':(620,840),'ring-stone':(1140,840)},
 'waterside':{'stilt-hut':(260,180),'fisher-hut':(715,180),'jetty':(1085,190),'raft':(1370,170),'wreck':(450,470),'dinghy':(1110,500),
  'crane':(240,800),'water-wheel':(620,800),'lighthouse':(940,780),'lookout-hut':(1300,780)},
 'camp-and-trail':{'cave':(270,180),'mine':(780,170),'tent':(1270,170),'cart':(310,500),'log-stack':(700,490),'signpost':(970,490),
  'heron-nest':(1320,490),'turtle-shell':(290,830),'gate':(760,840),'chimes-post':(1100,830),'quarry-block':(1380,840)},
 'bridges':{'walk-h':(320,210),'walk-v':(825,215),'walk-platform':(1260,215),'stone-bridge-h':(360,555),'stone-bridge-v':(935,600),
  'stepping-stones':(360,800),'stepping-stone':(355,925),'rope-bridge':(1120,890)},
 'landmarks':{'broken-watch':(270,280),'grey-spire':(720,270),'great-bridge':(1230,300),'spring-pool':(250,770),'hollow-rock':(730,750),
  'drowned-colonnade':(1240,780)},
}

def key(a):
  """The background is pure #00FF00 (green 240 or more above red and blue); leaves stand under 100 above. Alpha fades
  over the edge pixels between, and only those lose their green spill, so foliage keeps its colour."""
  r,g,b=[a[...,i].astype(int) for i in range(3)];m=np.maximum(r,b);gr=g-m
  alpha=np.clip((200-gr)*255/70,0,255)
  out=a.copy();out[...,1]=np.where(alpha<255,np.minimum(g,m+20),g).clip(0,255)
  return np.dstack([out,alpha]).astype(np.uint8)

def blobs(mask,cell=4):
  """Connected blobs on a cell×cell grid (8-neighbour), as label grid and count."""
  h,w=mask.shape;g=mask[:h//cell*cell,:w//cell*cell].reshape(h//cell,cell,w//cell,cell).any((1,3))
  lab=np.zeros(g.shape,int);n=0
  for y,x in zip(*np.nonzero(g)):
    if lab[y,x]:continue
    n+=1;stack=[(y,x)];lab[y,x]=n
    while stack:
      cy,cx=stack.pop()
      for dy in (-1,0,1):
        for dx in (-1,0,1):
          ny,nx=cy+dy,cx+dx
          if 0<=ny<g.shape[0] and 0<=nx<g.shape[1] and g[ny,nx] and not lab[ny,nx]:lab[ny,nx]=n;stack.append((ny,nx))
  return np.kron(lab,np.ones((cell,cell),int)),n

os.makedirs(OUT,exist_ok=True)
for sheet,names in SHEETS.items():
  rgba=key(np.array(Image.open(SRC+sheet+'.png').convert('RGB')));mask=rgba[...,3]>40
  lab,n=blobs(mask);lab=np.pad(lab,((0,mask.shape[0]-lab.shape[0]),(0,mask.shape[1]-lab.shape[1])))
  owner={}
  for i in range(1,n+1):
    ys,xs=np.nonzero(lab==i)
    if len(ys)<64:continue
    cy,cx=ys.mean(),xs.mean()
    owner.setdefault(min(names,key=lambda k:(names[k][0]-cx)**2+(names[k][1]-cy)**2),[]).append(i)
  for name in names:
    keep=np.isin(lab,owner[name])&mask;ys,xs=np.nonzero(keep)
    t,b,l,r=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    crop=rgba[t:b,l:r].copy();crop[...,3]=np.where(keep[t:b,l:r],crop[...,3],0)
    im=Image.fromarray(crop,'RGBA');im=im.resize((max(1,im.width//2),max(1,im.height//2)),Image.LANCZOS)
    im.save(f'{OUT}{name}.webp',quality=92,method=6);print(f'{OUT}{name}.webp',im.size)

# Water motion (section 5): one column of 8 looping frames each, saved as an 8-frame row at half size.
# The shoreline foam strip (shore-waves-strip.png) is kept in art/ for later: it needs straight shores to lie along.
for name in ['waterfall']:
  rgba=key(np.array(Image.open(f'art/sprites/props/water-motion/{name}-strip.png').convert('RGB')));mask=rgba[...,3]>40
  rows=np.nonzero(mask.any(1))[0];runs=[]
  for y in rows:
    if runs and y-runs[-1][1]<=3:runs[-1][1]=y+1
    else:runs.append([y,y+1])
  runs=[r for r in runs if r[1]-r[0]>20];assert len(runs)==8,(name,runs)
  h=max(b-a for a,b in runs);xs=np.nonzero(mask.any(0))[0];l,r=xs.min(),xs.max()+1
  frames=[Image.fromarray(rgba[a:a+h,l:r],'RGBA') for a,b in runs]
  sheet=Image.new('RGBA',((r-l)*8,h))
  for i,f in enumerate(frames):sheet.paste(f,(i*(r-l),0))
  sheet=sheet.resize((sheet.width//2,sheet.height//2),Image.LANCZOS)
  sheet.save(f'assets/{name}-sheet.png',optimize=True);print(f'assets/{name}-sheet.png frameSize [{sheet.width//8},{sheet.height}]')
