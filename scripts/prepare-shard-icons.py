"""Cut the new animals' familiar shard sheet (art/sprites/items/new-animal-shards.png, 6 shards on top, 5 below, on
#00FF00) into 128 px WebP icons in assets/items/, in the order the sheet was drawn.

Run from the repository root: python3 scripts/prepare-shard-icons.py
"""
import numpy as np
from PIL import Image

ORDER=['fox','boar','elk','bear','heron','crab','goat','otter','duck','pike','seal']

def spans(counts,gap):
  idx=np.nonzero(counts)[0];out=[];s=p=idx[0]
  for i in idx[1:]:
    if i-p>gap:out.append((s,p+1));s=i
    p=i
  return out+[(s,p+1)]

a=np.asarray(Image.open('art/sprites/items/new-animal-shards.png').convert('RGB')).astype(int)
green=(a[...,1]>120)&(a[...,1]>a[...,0]*1.5)&(a[...,1]>a[...,2]*1.5)
m=~green
blobs=[(t,b,l,r) for t,b in spans(m.sum(1)>20,6) for l,r in spans(m[t:b].sum(0)>20,6)]
assert len(blobs)==len(ORDER),len(blobs)
for name,(t,b,l,r) in zip(ORDER,blobs):
  sub=a[t:b,l:r].copy();mm=m[t:b,l:r]
  g=sub[...,1];lim=np.maximum(sub[...,0],sub[...,2]);sub[...,1]=np.where(g>lim*1.1,lim*1.1,g)
  img=Image.fromarray(np.dstack([sub.clip(0,255),mm*255]).astype(np.uint8),'RGBA')
  img=img.crop(img.getbbox());k=124/max(img.size)
  img=img.resize((max(1,round(img.width*k)),max(1,round(img.height*k))),Image.LANCZOS)
  out=Image.new('RGBA',(128,128),(0,0,0,0));out.alpha_composite(img,((128-img.width)//2,(128-img.height)//2))
  out.save(f'assets/items/shard-{name}.webp',quality=90);print(f'assets/items/shard-{name}.webp')
