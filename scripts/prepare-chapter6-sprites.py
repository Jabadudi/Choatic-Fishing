"""Turn the Chapter 6 character art into game-ready sheets in assets/story/.

Each walk sheet follows the house layout (see prepare-eli-sprites.py): 4 rows (right, left, toward the camera,
away from the camera) of 8 frames on a #00FF00 matte. Frames are found by the empty gaps between them; a gap
bridged by stray glow motes is split at the emptiest column. Each frame is placed in a uniform cell with its feet
on a shared baseline and its head and torso centred, at twice the size the game draws it (definitions use scale .5).

  mara-sheet.png     rows 0-3 walk.
  emilia-sheet.png   rows 0-3 walk.
  drayfus-sheet.png  rows 0-3 walk, row 4 the beckon strip (arms crossed, then a come-here wave).
  ocelot-sheet.png   rows 0-3 walk (the side rows have 7 frames; the 8th cell repeats the 1st),
                     row 4 the dissolve strip (sitting, then breaking into blue motes), kept in place frame to frame.

Run from the repository root: python3 scripts/prepare-chapter6-sprites.py
Requires Pillow and NumPy.
"""
from PIL import Image
import numpy as np

CH='art/sprites/characters/'
CR='art/sprites/creatures/talking-ocelot/'
OUT='assets/story/'

def load(path):
  im=np.asarray(Image.open(path).convert('RGB')).astype(int)
  r,g,b=im[...,0],im[...,1],im[...,2]
  return im,~((g>100)&(g>r*1.45)&(g>b*1.35))

def runs(prof,gap,thr):
  """Spans where prof>thr, joining spans separated by at most gap empty entries."""
  out=[];start=last=None
  for i,v in enumerate(prof>thr):
    if not v:continue
    if start is None:start=i
    elif i-last>gap:out.append([start,last+1]);start=i
    last=i
  if start is not None:out.append([start,last+1])
  return out

def frame_slices(mask,y0,y1,count):
  """Column ranges of the figures in one row, split where frames touch."""
  prof=mask[y0:y1].sum(0)
  spans=[s for s in runs(prof,4,1) if mask[y0:y1,s[0]:s[1]].sum()>200]
  while len(spans)<count:
    widths=[b-a for a,b in spans];i=int(np.argmax(widths));a,b=spans[i]
    single=np.median(sorted(widths)[:max(1,len(widths)-1)]) if len(widths)>1 else (b-a)/2
    parts=max(2,round((b-a)/single));cut=a+(b-a)//parts;q=(b-a)//(parts*4)
    c=cut-q+int(np.argmin(prof[cut-q:cut+q]))
    spans[i:i+1]=[[a,c],[c,b]]
  # Frame boundaries sit halfway across each gap, so stray motes go to the nearest figure.
  edges=[0]+[(spans[i][1]+spans[i+1][0])//2 for i in range(len(spans)-1)]+[mask.shape[1]]
  return list(zip(edges[:-1],edges[1:]))

def body_rows(m):
  rows=np.nonzero(m.sum(1)>=4)[0]
  return rows.min(),rows.max()+1

def cut(im,mask,y0,y1,x0,x1):
  """One frame as (RGBA image, anchor x, baseline y)."""
  m=mask[y0:y1,x0:x1];ys,xs=np.nonzero(m)
  ty,by=ys.min(),ys.max()+1;lx,rx=xs.min(),xs.max()+1
  rgb=im[y0:y1,x0:x1][ty:by,lx:rx].copy();m=m[ty:by,lx:rx]
  g=rgb[...,1];lim=np.maximum(rgb[...,0],rgb[...,2]);rgb[...,1]=np.where(g>lim*1.1,lim*1.1,g).astype(int)
  img=Image.fromarray(np.dstack([rgb.clip(0,255).astype(np.uint8),(m*255).astype(np.uint8)]),'RGBA')
  top,bottom=body_rows(m)
  head=m[top:top+max(1,int((bottom-top)*.45))];cx=np.nonzero(head)[1].mean()
  return img,cx,bottom

def walk(path,counts=(8,8,8,8)):
  im,mask=load(path);rows=runs(mask.sum(1),8,2)
  edges=[0]+[(rows[i][1]+rows[i+1][0])//2 for i in range(len(rows)-1)]+[mask.shape[0]]
  frames=[]
  for r,count in enumerate(counts):
    y0,y1=edges[r],edges[r+1]
    row=[cut(im,mask,y0,y1,a,b) for a,b in frame_slices(mask,y0,y1,count)]
    frames+=row+[row[0]]*(8-len(row))
  return frames

def strip(path,fixed):
  """One row of 8 frames on an even grid. fixed: keep every frame where frame 1 stands, for effects that drift apart."""
  im,mask=load(path);H,W=mask.shape;cw=W/8
  if not fixed:return [cut(im,mask,0,H,round(i*cw),round((i+1)*cw)) for i in range(8)]
  _,_,base=cut(im,mask,0,H,0,round(cw));m0=mask[:,:round(cw)];ys,xs=np.nonzero(m0)
  top,bottom=body_rows(m0[ys.min():ys.max()+1,xs.min():xs.max()+1]);head=m0[ys.min()+top:ys.min()+top+int((bottom-top)*.45)]
  ax=np.nonzero(head)[1].mean();by=ys.min()+bottom;out=[]
  # One crop box for all 8 cells, the union of what any of them shows.
  w=int(cw);union=np.zeros((H,w),bool)
  for i in range(8):union|=mask[:,round(i*cw):round(i*cw)+w]
  uy,ux=np.nonzero(union);t,b,l,r=uy.min(),uy.max()+1,ux.min(),ux.max()+1;ax-=l;by-=t
  for i in range(8):
    x0=round(i*cw)+l;sub=mask[t:b,x0:x0+r-l];rgb=im[t:b,x0:x0+r-l].copy()
    g=rgb[...,1];lim=np.maximum(rgb[...,0],rgb[...,2]);rgb[...,1]=np.where(g>lim*1.1,lim*1.1,g).astype(int)
    img=Image.fromarray(np.dstack([rgb.clip(0,255).astype(np.uint8),(sub*255).astype(np.uint8)]),'RGBA')
    out.append((img,ax,by))
  return out

def pack(name,groups):
  """groups: (frames, scale). Every frame shares one cell; feet sit 2 px above the cell's bottom edge."""
  items=[(img,cx,base,k) for frames,k in groups for img,cx,base in frames]
  half=max(max(cx,img.width-cx)*k for img,cx,_,k in items);cw=2*int(np.ceil(half))+4
  above=max(base*k for img,_,base,k in items);below=max((img.height-base)*k for img,_,base,k in items)
  ch=int(np.ceil(above+below))+4;foot=ch-2-int(np.ceil(below))
  sheet=Image.new('RGBA',(cw*8,ch*((len(items)+7)//8)),(0,0,0,0))
  for i,(img,cx,base,k) in enumerate(items):
    w,h=max(1,round(img.width*k)),max(1,round(img.height*k))
    small=img.resize((w,h),Image.LANCZOS)
    a=np.asarray(small)[...,3];small.putalpha(Image.fromarray(np.where(a>110,255,0).astype(np.uint8)))
    ox,oy=(i%8)*cw,(i//8)*ch
    tile=Image.new('RGBA',(cw,ch),(0,0,0,0));tile.alpha_composite(small,(round(cw/2-cx*k),round(foot-base*k)))
    sheet.alpha_composite(tile,(ox,oy))
  sheet.save(OUT+name,optimize=True)
  print(f"{OUT}{name}: frameSize [{cw},{ch}], feet {ch-foot}px above the cell bottom")

def height(frames):return np.median([base-body_rows(np.asarray(img)[...,3]>0)[0] for img,_,base in frames])

if __name__=='__main__':
  # On-screen heights in game pixels; Eli stands about 55. Sheets are drawn at scale .5.
  for name,src,tall in [('mara',CH+'mara/mara_walk_sheet.png',54),('emilia',CH+'emilia/emilia_walk_sheet.png',50)]:
    frames=walk(src);pack(name+'-sheet.png',[(frames,tall*2/height(frames[16:24]))])
  frames=walk(CH+'drayfus/drayfus_walk_sheet.png');k=62*2/height(frames[16:24])
  beckon=strip(CH+'drayfus/drayfus_beckon_strip.png',False)
  pack('drayfus-sheet.png',[(frames,k),(beckon,62*2/height(beckon))])
  # The ocelot is cat-sized: about 28 px tall walking side-on, a little more sitting up.
  frames=walk(CR+'talking-ocelot_walk_sheet.png',(7,7,8,8));k=28*2/height(frames[:7])
  sit=strip(CR+'talking-ocelot_dissolve_strip.png',True)
  pack('ocelot-sheet.png',[(frames,k),(sit,36*2/height(sit[:1]))])
