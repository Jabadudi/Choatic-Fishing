"""Turn Eli's green-matte source sheets in art/sprites/characters/eli/ into one game-ready sheet, assets/story/eli-sheet.png.

eli_walk_sheet.png is the house standard for every moving entity: 4 rows (right, left, toward the camera,
away from the camera) of 8 walk frames each. eli_throw_sheet.png is one row of 6 throw frames.
Each frame is cut by its connected regions, the matte and green spill are removed, and it is placed in a
uniform cell with its feet on a shared baseline and its head and torso centred. The throw row is scaled
so a standing throw frame is as tall as a standing walk frame. Run from the repository root:
    python3 scripts/prepare-eli-sprites.py
Requires Pillow and NumPy.
"""
from collections import deque
from PIL import Image
import numpy as np

SRC='art/sprites/characters/eli/'
# Walk figures are about 215 px tall in the source. Halving keeps detail for high-density screens; the game draws at ~.5.
WALK_SCALE=.5
# Cell height in output pixels.
CELL_HEIGHT=120

def load(path):
  im=np.asarray(Image.open(path).convert('RGB')).astype(int)
  r,g,b=im[...,0],im[...,1],im[...,2]
  return im,~((g>100)&(g>r*1.45)&(g>b*1.35))

def components(mask,minimum=12):
  H,W=mask.shape;seen=np.zeros((H,W),bool);out=[]
  ys,xs=np.nonzero(mask)
  for y0,x0 in zip(ys,xs):
    if seen[y0,x0]:continue
    seen[y0,x0]=True;q=deque([(y0,x0)]);pts=[]
    while q:
      y,x=q.popleft();pts.append((y,x))
      for dy in(-1,0,1):
        for dx in(-1,0,1):
          yy,xx=y+dy,x+dx
          if 0<=yy<H and 0<=xx<W and mask[yy,xx] and not seen[yy,xx]:
            seen[yy,xx]=True;q.append((yy,xx))
    if len(pts)>=minimum:
      p=np.array(pts);out.append((p,p[:,1].mean(),p[:,0].mean()))
  return out

def group(mask,assign,count):
  """assign(cx,cy) -> frame index or None. Returns one boolean mask per frame."""
  frames=[np.zeros(mask.shape,bool) for _ in range(count)]
  for p,cx,cy in components(mask):
    i=assign(cx,cy)
    if i is not None:frames[i][p[:,0],p[:,1]]=True
  return frames

def tile(im,fm):
  yy,xx=np.nonzero(fm);x0,y0,x1,y1=xx.min(),yy.min(),xx.max()+1,yy.max()+1
  rgb=im[y0:y1,x0:x1].copy();m=fm[y0:y1,x0:x1]
  # Despill: no channel-dominant green on kept edge pixels.
  g=rgb[...,1];lim=np.maximum(rgb[...,0],rgb[...,2]);rgb[...,1]=np.where(g>lim*1.1,lim*1.1,g).astype(int)
  img=Image.fromarray(np.dstack([rgb.clip(0,255).astype(np.uint8),(m*255).astype(np.uint8)]),'RGBA')
  # Anchor: centre of the head and torso (top 45%), so a stride does not slide the body sideways.
  top=m[:max(1,int(m.shape[0]*.45))];cx=np.nonzero(top)[1].mean()
  return img,cx,y1-y0

def place(tiles,columns):
  """tiles: (image, anchor x, height, scale) in sheet order. One cell size fits every frame."""
  # Wide enough for the farthest reach on either side of the anchor.
  cw=2*(int(np.ceil(max(max(cx,img.width-cx)*k for img,cx,_,k in tiles)))+2);ch=CELL_HEIGHT
  rows=(len(tiles)+columns-1)//columns
  sheet=Image.new('RGBA',(cw*columns,ch*rows),(0,0,0,0))
  for i,(img,cx,_,k) in enumerate(tiles):
    w,hh=max(1,round(img.width*k)),max(1,round(img.height*k))
    small=img.resize((w,hh),Image.LANCZOS)
    # Hard alpha keeps the pixel-art outline crisp after resampling.
    a=np.asarray(small)[...,3];small.putalpha(Image.fromarray(np.where(a>110,255,0).astype(np.uint8)))
    x=(i%columns)*cw+round(cw/2-cx*k);y=(i//columns)*ch+ch-2-hh
    if y<(i//columns)*ch:print('warning: frame',i,'is taller than the cell')
    sheet.alpha_composite(small,(x,max(0,y)))
  print('assets/story/eli-sheet.png cell',cw,'x',ch)
  return sheet

def walk():
  im,mask=load(SRC+'eli_walk_sheet.png');H,W=mask.shape;cw,ch=W/8,H/4
  frames=group(mask,lambda cx,cy:int(cy//ch)*8+int(cx//cw),32)
  return [(*tile(im,f),WALK_SCALE) for f in frames]

def throw(standing):
  im,mask=load(SRC+'eli_throw_sheet.png')
  cuts=[0,300,690,1060,1450,1910,2172]
  # The pebble trail of the release frame floats above the next figure's head.
  frames=group(mask,lambda cx,cy:3 if cy<150 and cx>1450 else next(i for i in range(6) if cuts[i]<=cx<cuts[i+1]),6)
  tiles=[tile(im,f) for f in frames]
  k=standing/tiles[0][2]
  return [(*t,k) for t in tiles]

if __name__=='__main__':
  walking=walk()
  # A standing throw frame matches the tallest toward-camera walk frame.
  standing=max(h*k for _,_,h,k in walking[16:24])
  # Rows 0-3: walk right, left, toward the camera, away. Row 4: the throw, facing right.
  place(walking+throw(standing),8).save('assets/story/eli-sheet.png',optimize=True)
