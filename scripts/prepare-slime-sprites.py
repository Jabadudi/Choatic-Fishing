#!/usr/bin/env python3
"""Cut Netanel's slime sheet (art/sprites/creatures/slime-sheet.png) into one frame per pose.
Frames are found as connected blobs (transparent background), ordered row by row, trimmed and saved to
assets/creatures/slime/slime-<n>.webp. Run: python3 scripts/prepare-slime-sprites.py"""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
src=Image.open(ROOT/'art/sprites/creatures/slime-sheet.png').convert('RGBA')
w,h=src.size;a=src.split()[3].load();seen=set();boxes=[]
for y in range(h):
  for x in range(w):
    if a[x,y]>20 and (x,y) not in seen:
      st=[(x,y)];seen.add((x,y));x0=x1=x;y0=y1=y;n=0
      while st:
        px,py=st.pop();n+=1;x0=min(x0,px);x1=max(x1,px);y0=min(y0,py);y1=max(y1,py)
        for nx,ny in ((px+1,py),(px-1,py),(px,py+1),(px,py-1)):
          if 0<=nx<w and 0<=ny<h and (nx,ny) not in seen and a[nx,ny]>20:seen.add((nx,ny));st.append((nx,ny))
      if n>200:boxes.append((x0,y0,x1+1,y1+1))
boxes.sort(key=lambda b:(b[1]>h*.5,b[0]))
out=ROOT/'assets/creatures/slime';out.mkdir(parents=True,exist_ok=True)
for i,b in enumerate(boxes):
  f=src.crop(b);f.save(out/f'slime-{i}.webp',lossless=True);print(i,b,f.size)
