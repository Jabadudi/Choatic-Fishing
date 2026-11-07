"""Cut the layered-world prop sheet (art/sprites/props/atlas/layered-world-props.png, 3 x 3 props on a transparent
background) into single props in assets/props/atlas/.

The sheet's cut-out leaves a faint reddish halo and soft alpha around each prop: the halo is dropped and the alpha is
snapped so the pixel-art edges stay crisp. Props are saved at half the sheet's size, like the other atlas props.

Run from the repository root: python3 scripts/prepare-layered-props.py
Requires Pillow and NumPy.
"""
import numpy as np
from PIL import Image

SRC='art/sprites/props/atlas/layered-world-props.png';OUT='assets/props/atlas/'
NAMES=[['log-cabin','round-oak','round-bush'],['daisies','cattails','water-lily'],['grass-rock','log-pile','wood-barrel']]

def runs(profile):
  out,start=[],None
  for i,v in enumerate(profile>0):
    if v and start is None:start=i
    if not v and start is not None:out.append((start,i));start=None
  if start is not None:out.append((start,len(profile)))
  return out

a=np.array(Image.open(SRC).convert('RGBA')).astype(int)
alpha=a[...,3];r,g,b=a[...,0],a[...,1],a[...,2]
alpha=np.where((alpha<200)&(r>g+60)&(r>b+60),0,alpha)
alpha=np.where(alpha<90,0,np.where(alpha>170,255,alpha));a[...,3]=alpha
solid=alpha>200;cols,rows=runs(solid.sum(0)),runs(solid.sum(1))
assert len(cols)==3 and len(rows)==3,(cols,rows)
for j,(y0,y1) in enumerate(rows):
  for i,(x0,x1) in enumerate(cols):
    img=Image.fromarray(a[max(0,y0-12):y1+12,max(0,x0-12):x1+12].astype(np.uint8),'RGBA');img=img.crop(img.getbbox())
    img=img.resize((img.width//2,img.height//2),Image.LANCZOS)
    img.save(f'{OUT}{NAMES[j][i]}.webp',lossless=True);print(NAMES[j][i],img.size)
