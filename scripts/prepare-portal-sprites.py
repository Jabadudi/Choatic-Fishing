#!/usr/bin/env python3
"""Cut Netanel's 4x4 portal sheet (art/sprites/props/portal-sheet.png, 16 frames of the swirling arch, read left to
right, top to bottom) into assets/props/portal/portal-<i>.webp. Every frame is cropped to the same box (the union of
all painted pixels, relative to its cell) so the arch never shifts between frames.
Run: python3 scripts/prepare-portal-sprites.py"""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
src=Image.open(ROOT/'art/sprites/props/portal-sheet.png').convert('RGBA')
cw,ch=src.width//4,src.height//4
cells=[src.crop((c*cw,r*ch,(c+1)*cw,(r+1)*ch)) for r in range(4) for c in range(4)]
boxes=[c.split()[3].point(lambda a:255 if a>20 else 0).getbbox() for c in cells]
box=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes))
out=ROOT/'assets/props/portal';out.mkdir(parents=True,exist_ok=True)
for i,c in enumerate(cells):c.crop(box).save(out/f'portal-{i}.webp',lossless=True)
print('frames',len(cells),'box',box)
