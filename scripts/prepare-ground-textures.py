"""Shrink the Reedwater Delta ground textures in art/ground/ to game tiles in assets/ground/.

Each source is a square seamless tile made from the atlas areas art prompt file (section 1). The game draws them at
about the same pixel size as the meadow grass (reedwater-grass.png), so each becomes a 384 px square. The
edges are blended so the repeat shows no seam even where the generated art does not quite wrap.

Run from the repository root: python3 scripts/prepare-ground-textures.py
Requires Pillow.
"""
import os
import numpy as np
from PIL import Image

NAMES=['forest-floor','beach-sand','rocky-ground','marsh-ground','packed-dirt','cliff-top','old-road','drowned-road',
       'shallow-water','river-water','open-sea']
def wrap_ratio(a,axis):
  """How much the step across the wrap stands out against the tile's ordinary neighbour-to-neighbour steps."""
  a=np.moveaxis(a,axis,0);return np.abs(a[0]-a[-1]).mean()/np.abs(a[1:]-a[:-1]).mean()

def seamless(im,band=40):
  """Hide a seam where the tile wraps badly: within `band` px of that edge, fade to the tile shifted by half its size,
  whose edges are the original's (continuous) middle. Edges that already wrap well are left alone."""
  a=np.asarray(im).astype(float);n=a.shape[0]
  d=np.minimum(np.arange(n),n-1-np.arange(n));w=np.clip(1-d/band,0,1)**2
  for axis in (0,1):
    if wrap_ratio(a,axis)<1.6:continue
    shifted=np.roll(a,n//2,axis=axis);m=(w[:,None] if axis==0 else w[None,:])[...,None]
    a=a*(1-m)+shifted*m
  return Image.fromarray(a.round().astype(np.uint8))
os.makedirs('assets/ground',exist_ok=True)
for name in NAMES:
  im=Image.open(f'art/ground/{name}.png').convert('RGB').resize((384,384),Image.BOX)
  im=seamless(im)
  im.save(f'assets/ground/{name}.webp',quality=90,method=6)
  print(f'assets/ground/{name}.webp')
