"""Turn the green-matte source sheets in art/sprites/ into game-ready cutscene sheets in assets/story/.

Frames are separated by connected regions, the matte and green spill are removed, and every frame is
placed in a uniform grid cell with its feet on a shared baseline. Run from the repository root:
    python3 scripts/prepare-cutscene-sprites.py
Requires Pillow and NumPy.
"""
import json
from collections import deque
from PIL import Image
import numpy as np
def load(path):
  im=np.asarray(Image.open(path).convert('RGB')).astype(int)
  r,g,b=im[...,0],im[...,1],im[...,2]
  return im,~((g>100)&(g>r*1.45)&(g>b*1.35))
def label(mask):
  H,W=mask.shape;lab=np.zeros((H,W),np.int32);n=0
  ys,xs=np.nonzero(mask)
  for y0,x0 in zip(ys,xs):
    if lab[y0,x0]:continue
    n+=1;lab[y0,x0]=n;q=deque([(y0,x0)])
    while q:
      y,x=q.popleft()
      for dy in(-1,0,1):
        for dx in(-1,0,1):
          yy,xx=y+dy,x+dx
          if 0<=yy<H and 0<=xx<W and mask[yy,xx] and not lab[yy,xx]:
            lab[yy,xx]=n;q.append((yy,xx))
  return lab,n
def frames(path,layout):
  im,mask=load(path);lab,n=label(mask)
  out=[]
  idx=np.arange(1,n+1)
  ys,xs=np.nonzero(lab);ls=lab[ys,xs]
  cx=np.bincount(ls,weights=xs,minlength=n+1)/np.maximum(1,np.bincount(ls,minlength=n+1))
  cy=np.bincount(ls,weights=ys,minlength=n+1)/np.maximum(1,np.bincount(ls,minlength=n+1))
  for (s,e,cuts) in layout:
    for a,b in zip(cuts[:-1],cuts[1:]):
      comps=[i for i in range(1,n+1) if s<=cy[i]<e and a<=cx[i]<b]
      fm=np.isin(lab,comps)
      yy,xx=np.nonzero(fm)
      out.append((fm,int(xx.min()),int(yy.min()),int(xx.max())+1,int(yy.max())+1))
  return im,out

# layout: [top, bottom, [column cuts]] per source row. anchor: per-frame foot x where an axe or smoke skews the estimate.
SHEETS=[
 {
  "src": "art/sprites/mobs/nightwalker/nightwalker_sheet.png",
  "out": "assets/story/nightwalker-sheet.png",
  "mode": "feet",
  "columns": 6,
  "scale": 0.5,
  "layout": [
   [
    16,
    257,
    [
     180,
     465,
     760,
     1045,
     1320
    ]
   ],
   [
    266,
    503,
    [
     28,
     290,
     536,
     781,
     1021,
     1255,
     1494
    ]
   ],
   [
    510,
    753,
    [
     110,
     405,
     750,
     1086,
     1450
    ]
   ],
   [
    767,
    994,
    [
     30,
     338,
     698,
     1055,
     1505
    ]
   ]
  ],
  "anchor": {
   "13": 1215,
   "16": 880,
   "17": 1180
  }
 },
 {
  "src": "art/sprites/creatures/moonfang/moonfang_sheet.png",
  "out": "assets/story/moonfang-charge.png",
  "mode": "center",
  "columns": 6,
  "scale": 0.5,
  "layout": [
   [
    20,
    254,
    [
     150,
     457,
     760,
     1068,
     1370
    ]
   ],
   [
    300,
    467,
    [
     15,
     264,
     509,
     746,
     998,
     1264,
     1520
    ]
   ],
   [
    493,
    698,
    [
     20,
     380,
     755,
     1155,
     1520
    ]
   ],
   [
    707,
    983,
    [
     240,
     585,
     930,
     1265
    ]
   ]
  ]
 }
]

def build(cfg):
 im,fr=frames(cfg['src'],cfg['layout'])
 info=[]
 for i,(fm,x0,y0,x1,y1) in enumerate(fr):
   ov=cfg.get('anchor',{}).get(str(i))
   if ov is not None: fx=ov
   elif cfg['mode']=='feet':
     yy,xx=np.nonzero(fm[y1-cfg.get('footRows',14):y1]);fx=float(xx.mean())
   else: fx=(x0+x1)/2
   info.append((fx,y1))
   pass
 left=max(fx-f[1] for (fx,_),f in zip(info,fr));right=max(f[3]-fx for (fx,_),f in zip(info,fr));up=max(fy-f[2] for (_,fy),f in zip(info,fr))
 half=int(np.ceil(max(left,right)))+4;cw=half*2;ch=int(np.ceil(up))+6;ch+=ch%2
 cols=cfg['columns'];rows=(len(fr)+cols-1)//cols
 sheet=Image.new('RGBA',(cw*cols,ch*rows),(0,0,0,0))
 for i,((fm,x0,y0,x1,y1),(fx,fy)) in enumerate(zip(fr,info)):
   rgb=im[y0:y1,x0:x1].copy();m=fm[y0:y1,x0:x1]
   # despill: no channel-dominant green on kept edge pixels
   g=rgb[...,1];lim=np.maximum(rgb[...,0],rgb[...,2]);rgb[...,1]=np.where(g>lim*1.1,lim*1.1,g).astype(int)
   a=(m*255).astype(np.uint8)
   tile=Image.fromarray(np.dstack([rgb.clip(0,255).astype(np.uint8),a]),'RGBA')
   cx,cy=(i%cols)*cw,(i//cols)*ch
   sheet.paste(tile,(int(round(cx+half-(fx-x0))),int(round(cy+ch-2-(fy-y0)))),tile)
 s=cfg['scale'];out=sheet.resize((round(sheet.width*s),round(sheet.height*s)),Image.LANCZOS)
 out.save(cfg['out'],optimize=True)
 print(cfg['out'],'cell',int(cw*s),'x',int(ch*s))

if __name__=='__main__':
 for cfg in SHEETS:build(cfg)
