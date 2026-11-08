#!/usr/bin/env python3
"""Cut Netanel's stump sheet (art/sprites/creatures/stump-sheet.png) into its 4x4 poses.
Rows: walk, hit, die, attack; four frames each. Stray specks (blobs under 400 px) are dropped. Every frame is put on the
same 300x300 canvas with the cell's centre on the canvas centre and the lowest painted row on the bottom edge, so feet
stay put from frame to frame. Saved as assets/creatures/stump/stump-<row>-<frame>.webp.
Run: python3 scripts/prepare-stump-sprites.py"""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
ROWS=['walk','hit','die','attack'];SIZE=300
src=Image.open(ROOT/'art/sprites/creatures/stump-sheet.png').convert('RGBA')
W,H=src.size;cw,ch=W/4,H/4
out=ROOT/'assets/creatures/stump';out.mkdir(parents=True,exist_ok=True)
def clean(cell):
  w,h=cell.size;a=cell.split()[3].load();keep=Image.new('L',(w,h),0);k=keep.load();seen=set()
  for y in range(h):
    for x in range(w):
      if a[x,y]>30 and (x,y) not in seen:
        st=[(x,y)];seen.add((x,y));blob=[]
        while st:
          px,py=st.pop();blob.append((px,py))
          for nx,ny in ((px+1,py),(px-1,py),(px,py+1),(px,py-1)):
            if 0<=nx<w and 0<=ny<h and (nx,ny) not in seen and a[nx,ny]>30:seen.add((nx,ny));st.append((nx,ny))
        if len(blob)>=400:
          for p in blob:k[p]=255
  # Grow the kept mask a little so soft edge pixels next to the body stay.
  from PIL import ImageFilter
  keep=keep.filter(ImageFilter.MaxFilter(5))
  r,g,b,al=cell.split();from PIL import ImageChops
  return Image.merge('RGBA',(r,g,b,ImageChops.multiply(al,keep)))
for r,name in enumerate(ROWS):
  for f in range(4):
    cell=clean(src.crop((round(f*cw),round(r*ch),round((f+1)*cw),round((r+1)*ch))))
    bb=cell.split()[3].point(lambda v:255 if v>30 else 0).getbbox()
    canvas=Image.new('RGBA',(SIZE,SIZE),(0,0,0,0))
    canvas.paste(cell,(round(SIZE/2-cell.width/2),SIZE-bb[3]),cell)
    canvas.save(out/f'stump-{name}-{f}.webp',lossless=True);print(name,f,bb)
