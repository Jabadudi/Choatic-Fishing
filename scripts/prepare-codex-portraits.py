"""Build the small square portraits shown in the creature index (assets/codex/).

Green-matte poses are keyed to transparency and trimmed; reference sheets are cropped to the face panel;
pixel sprite sheets are cut to one frame and scaled up without smoothing. Run from the repository root:
    python3 scripts/prepare-codex-portraits.py
Requires Pillow and NumPy.
"""
import os
from PIL import Image
import numpy as np
SIZE=256
OUT='assets/codex'
def keyed(path):
  im=Image.open(path).convert('RGBA');a=np.asarray(im).copy()
  r,g,b=a[...,0].astype(int),a[...,1].astype(int),a[...,2].astype(int)
  matte=(g>100)&(g>r*1.45)&(g>b*1.35)
  a[...,3]=np.where(matte,0,255)
  # Soften the green spill left on edge pixels.
  spill=(g>r)&(g>b)&~matte;a[...,1]=np.where(spill,np.maximum(r,b),g)
  im=Image.fromarray(a);return im.crop(im.getbbox())
def fit(im,pixel=False,pad=14):
  box=SIZE-pad*2;scale=min(box/im.width,box/im.height)
  im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.NEAREST if pixel else Image.LANCZOS)
  out=Image.new('RGBA',(SIZE,SIZE),(0,0,0,0));out.paste(im,((SIZE-im.width)//2,SIZE-pad-im.height),im);return out
def face(path,box):
  return Image.open(path).convert('RGBA').crop(box).resize((SIZE,SIZE),Image.LANCZOS)
def frame(path,box):
  im=Image.open(path).convert('RGBA').crop(box);return im.crop(im.getbbox())
PORTRAITS={
 'rabbit':lambda:fit(frame('assets/bunny-sheet.png',(15,14,48,68)),True),
 'deer':lambda:fit(frame('assets/deer-sheet.png',(0,0,64,64)),True),
 'turtle':lambda:fit(frame('assets/turtle-sheet.png',(0,0,96,64)),True),
 'shadow-walker':lambda:fit(keyed('art/sprites/mobs/nightwalker/nightwalker_pose.png')),
 'rimejaw':lambda:fit(keyed('art/sprites/creatures/rimejaw/rimejaw_pose.png')),
 'flitlynx':lambda:fit(keyed('art/sprites/creatures/flitlynx/flitlynx_pose.png')),
 'moonfang':lambda:fit(keyed('art/sprites/creatures/moonfang/moonfang_pose.png')),
 'drayfus':lambda:fit(keyed('art/sprites/characters/drayfus/drayfus_pose.png')),
 'croshelda':lambda:face('art/characters/croshelda/croshelda_reference-sheet.png',(900,40,1440,580)),
 'mara':lambda:face('assets/story/mara.png',(880,110,1420,650)),
 'emilia':lambda:face('assets/story/emilia.png',(950,60,1500,610))
}
os.makedirs(OUT,exist_ok=True)
for name,make in PORTRAITS.items():
  make().save(f'{OUT}/{name}.png',optimize=True)
  print(name,os.path.getsize(f'{OUT}/{name}.png'))
# Index minimaps: the regional and continental atlases, small enough to load with the dialog.
for name in ['reedwater-delta-map','world-map']:
  im=Image.open(f'art/references/{name}.png').convert('RGB');im.thumbnail((720,480),Image.LANCZOS)
  im.save(f'{OUT}/{name}.jpg',quality=82,optimize=True,progressive=True);print(name,os.path.getsize(f'{OUT}/{name}.jpg'))
