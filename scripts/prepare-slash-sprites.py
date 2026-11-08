#!/usr/bin/env python3
"""Cut Netanel's combo slash sheet (art/sprites/effects/combo-slash-sheet.png: 3 rows, one per hit of the 3-hit combo,
each 4 frames read left to right) into assets/effects/slash/slash-<hit>-<frame>.webp. The near-invisible fringe
(alpha under 24) is cleared. Every frame of a row is cropped to the same box (the union of its painted pixels, relative
to its cell) so the slash never jumps between frames, and scaled down to at most 256 px on its long side.
Run: python3 scripts/prepare-slash-sprites.py"""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
src=Image.open(ROOT/'art/sprites/effects/combo-slash-sheet.png').convert('RGBA')
r,g,b,a=src.split();a=a.point(lambda v:0 if v<24 else v);src=Image.merge('RGBA',(r,g,b,a))
cw,ch=src.width//4,src.height//3
out=ROOT/'assets/effects/slash';out.mkdir(parents=True,exist_ok=True)
for row in range(3):
 cells=[src.crop((c*cw,row*ch,(c+1)*cw,(row+1)*ch)) for c in range(4)]
 boxes=[b for b in (c.split()[3].getbbox() for c in cells) if b]
 box=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes))
 k=min(1,256/max(box[2]-box[0],box[3]-box[1]))
 for i,c in enumerate(cells):
  f=c.crop(box)
  if k<1:f=f.resize((round(f.width*k),round(f.height*k)),Image.LANCZOS)
  f.save(out/f'slash-{row+1}-{i}.webp',lossless=True)
 print('hit',row+1,'box',box,'size',f.size)
