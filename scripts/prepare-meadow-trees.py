"""Cut the meadow tree sheet (art/sprites/props/atlas/meadow-trees.png, 2 x 2 trees in 384 px cells on a transparent
background, from Netanel) into single props in assets/props/atlas/meadow-oak-1.webp to meadow-oak-4.webp.

Soft alpha is snapped so the pixel-art edges stay crisp; trees are saved at half the sheet's size.

Run from the repository root: python3 scripts/prepare-meadow-trees.py
Requires Pillow and NumPy.
"""
import numpy as np
from PIL import Image

SRC='art/sprites/props/atlas/meadow-trees.png';OUT='assets/props/atlas/';CELL=384
a=np.array(Image.open(SRC).convert('RGBA')).astype(int)
alpha=a[...,3];a[...,3]=np.where(alpha<90,0,np.where(alpha>170,255,alpha))
for j in range(2):
  for i in range(2):
    img=Image.fromarray(a[j*CELL:(j+1)*CELL,i*CELL:(i+1)*CELL].astype(np.uint8),'RGBA');img=img.crop(img.getbbox())
    img=img.resize((img.width//2,img.height//2),Image.LANCZOS)
    img.save(f'{OUT}meadow-oak-{j*2+i+1}.webp',lossless=True);print(f'meadow-oak-{j*2+i+1}',img.size)
