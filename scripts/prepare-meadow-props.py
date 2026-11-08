"""Cut the meadow prop sheet (art/sprites/props/atlas/meadow-props.png, 4 x 4 props in 128 px cells on a transparent
background, from Netanel) into single props in assets/props/atlas/: grass tufts, wildflowers, rocks and bushes.

Soft alpha is snapped so the pixel-art edges stay crisp. Props keep the sheet's size (it is already drawn small).

Run from the repository root: python3 scripts/prepare-meadow-props.py
Requires Pillow and NumPy.
"""
import numpy as np
from PIL import Image

SRC='art/sprites/props/atlas/meadow-props.png';OUT='assets/props/atlas/';CELL=128
NAMES=[['grass-tuft','grass-clump','grass-sprigs','grass-tall'],['white-flowers','yellow-flowers','lavender','pink-flowers'],
 ['grey-rock','pebbles','sandstone-rock','mossy-rock'],['leafy-bush','dark-bush','small-bush','berry-bush']]
a=np.array(Image.open(SRC).convert('RGBA')).astype(int)
alpha=a[...,3];a[...,3]=np.where(alpha<90,0,np.where(alpha>170,255,alpha))
for j,row in enumerate(NAMES):
  for i,name in enumerate(row):
    img=Image.fromarray(a[j*CELL:(j+1)*CELL,i*CELL:(i+1)*CELL].astype(np.uint8),'RGBA');img=img.crop(img.getbbox())
    img.save(f'{OUT}{name}.webp',lossless=True);print(name,img.size)
