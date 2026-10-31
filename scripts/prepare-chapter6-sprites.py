"""Turn the Chapter 6 character art into game-ready sheets in assets/story/.

Each walk sheet follows the house layout (see prepare-eli-sprites.py): 4 rows (right, left, toward the camera,
away from the camera) on a #00FF00 matte. Eli is drawn with 8 frames per direction and everyone else with 6, but
older sheets with 8 still work: set the count per row in WALK_FRAMES below. Rows are always packed 8 cells wide,
so a 6-frame sheet leaves the last 2 cells of each row empty, and the definition lists the frames with
walkClips(frames, cycle) in src/sprite-definitions.js, which keeps the stride pace whatever the count. Frames are found by the empty gaps between them; a gap
bridged by stray glow motes is split at the emptiest column. Each frame is placed in a uniform cell with its feet
on a shared baseline and its head and torso centred, at twice the size the game draws it (definitions use scale .5).

  mara-sheet.png     rows 0-3 walk.
  emilia-sheet.png   rows 0-3 walk.
  drayfus-sheet.png  rows 0-3 walk, row 4 the beckon strip (arms crossed, then a come-here wave).
  ocelot-sheet.png   rows 0-3 walk (the side rows have 7 frames; the 8th cell repeats the 1st),
                     row 4 the dissolve strip (sitting, then breaking into blue motes), kept in place frame to frame.

  brume-sheet.png    rows 0-3 walk, cut from Brume's column-layout sheet (the Moonfang wolf), row 4 his bow, row 5 lying down to sleep.
  corvane-sheet.png  rows 0-3 walk (column layout, ground line removed), row 4 the shadows-part entrance, row 5 the block.

Run from the repository root: python3 scripts/prepare-chapter6-sprites.py
Requires Pillow and NumPy.
"""
from PIL import Image
import numpy as np

CH='art/sprites/characters/'
# Frames per row (right, left, toward the camera, away). New non-Eli sheets have 6. Change a row when its art is redrawn.
WALK_FRAMES={'mara':(8,8,8,8),'emilia':(8,8,8,8),'drayfus':(8,8,8,8),'ocelot':(7,7,8,8)}
CR='art/sprites/creatures/talking-ocelot/'
MF='art/sprites/creatures/moonfang/'
CV=CH+'corvane/'
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

def frame_slices(band,count):
  """Ranges along axis 1 of the figures in one strip of frames, split where frames touch."""
  prof=band.sum(0)
  spans=[s for s in runs(prof,4,1) if band[:,s[0]:s[1]].sum()>200]
  while len(spans)<count:
    widths=[b-a for a,b in spans];i=int(np.argmax(widths));a,b=spans[i]
    single=np.median(sorted(widths)[:max(1,len(widths)-1)]) if len(widths)>1 else (b-a)/2
    parts=max(2,round((b-a)/single));cut=a+(b-a)//parts;q=(b-a)//(parts*4)
    c=cut-q+int(np.argmin(prof[cut-q:cut+q]))
    spans[i:i+1]=[[a,c],[c,b]]
  # Frame boundaries sit halfway across each gap, so stray motes go to the nearest figure.
  edges=[0]+[(spans[i][1]+spans[i+1][0])//2 for i in range(len(spans)-1)]+[band.shape[1]]
  return list(zip(edges[:-1],edges[1:]))

def body_rows(m):
  rows=np.nonzero(m.sum(1)>=4)[0]
  return rows.min(),rows.max()+1

def ground_line(m):
  """Rows to drop from the bottom of a frame mask: a flat dark ground line drawn under the feet, wider than the boots."""
  ys=np.nonzero(m.any(1))[0];by=ys.max()+1;width=lambda y:np.count_nonzero(m[y])
  while by-6>ys.min() and width(by-1)>1.6*width(by-6):by-=1
  return by

def cut(im,mask,y0,y1,x0,x1,anchor='head',line=False):
  """One frame as (RGBA image, anchor x, baseline y). anchor 'body' centres four-legged walkers on their whole body.
  line: the sheet draws a ground line under each frame, which is left out."""
  m=mask[y0:y1,x0:x1].copy()
  if line:m[ground_line(m):]=False
  ys,xs=np.nonzero(m)
  ty,by=ys.min(),ys.max()+1;lx,rx=xs.min(),xs.max()+1
  rgb=im[y0:y1,x0:x1][ty:by,lx:rx].copy();m=m[ty:by,lx:rx]
  g=rgb[...,1];lim=np.maximum(rgb[...,0],rgb[...,2]);rgb[...,1]=np.where(g>lim*1.1,lim*1.1,g).astype(int)
  img=Image.fromarray(np.dstack([rgb.clip(0,255).astype(np.uint8),(m*255).astype(np.uint8)]),'RGBA')
  top,bottom=body_rows(m)
  head=m[top:top+max(1,int((bottom-top)*.45))] if anchor=='head' else m[top:bottom];cx=np.nonzero(head)[1].mean()
  return img,cx,bottom

def walk(path,counts=(8,8,8,8),layout='rows',anchor='head',line=False):
  """layout 'rows': one direction per row, frames left to right (the older sheets).
  layout 'columns': one direction per column, frames top to bottom (sheets drawn from now on).
  Either way the frames come back in the house order: right, left, toward the camera, away, 8 slots each."""
  im,mask=load(path);axis=1 if layout=='rows' else 0
  bands=runs(mask.sum(axis),8,2)
  size=mask.shape[0] if layout=='rows' else mask.shape[1]
  edges=[0]+[(bands[i][1]+bands[i+1][0])//2 for i in range(len(bands)-1)]+[size]
  frames=[]
  for r,count in enumerate(counts):
    a0,a1=edges[r],edges[r+1]
    if layout=='rows':row=[cut(im,mask,a0,a1,x0,x1,anchor,line) for x0,x1 in frame_slices(mask[a0:a1],count)]
    else:row=[cut(im,mask,y0,y1,a0,a1,anchor,line) for y0,y1 in frame_slices(mask[:,a0:a1].T,count)]
    frames+=row+[None]*(8-len(row))
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

def strip_column(path):
  """One column of 8 frames, top to bottom, found by the gaps between them. Each frame keeps its sideways place, so a
  figure that bows or lies down moves the way it was drawn; the anchor is frame 1's body centre, and each frame stands
  on its own lowest pixels (bowing and lying down both keep the paws on the ground)."""
  im,mask=load(path);xs=np.nonzero(mask.any(0))[0];l,r=xs.min(),xs.max()+1;out=[];ax=None
  for y0,y1 in frame_slices(mask[:,l:r].T,8):
    sub=mask[y0:y1,l:r];ys=np.nonzero(sub.any(1))[0];t=ys.min();top,bottom=body_rows(sub[t:])
    if ax is None:ax=np.nonzero(sub[t+top:t+bottom])[1].mean()
    m=sub[t:t+bottom];rgb=im[y0+t:y0+t+bottom,l:r].copy()
    g=rgb[...,1];lim=np.maximum(rgb[...,0],rgb[...,2]);rgb[...,1]=np.where(g>lim*1.1,lim*1.1,g).astype(int)
    out.append((Image.fromarray(np.dstack([rgb.clip(0,255).astype(np.uint8),(m*255).astype(np.uint8)]),'RGBA'),ax,bottom))
  return out

def pack(name,groups):
  """groups: (frames, scale). Every frame shares one cell; feet sit 2 px above the cell's bottom edge."""
  # Empty cells (rows with fewer than 8 frames) stay transparent.
  items=[(f[0],f[1],f[2],k) if f else None for frames,k in groups for f in frames]
  real=[i for i in items if i]
  half=max(max(cx,img.width-cx)*k for img,cx,_,k in real);cw=2*int(np.ceil(half))+4
  above=max(base*k for img,_,base,k in real);below=max((img.height-base)*k for img,_,base,k in real)
  ch=int(np.ceil(above+below))+4;foot=ch-2-int(np.ceil(below))
  sheet=Image.new('RGBA',(cw*8,ch*((len(items)+7)//8)),(0,0,0,0))
  for i,item in enumerate(items):
    if not item:continue
    img,cx,base,k=item
    w,h=max(1,round(img.width*k)),max(1,round(img.height*k))
    small=img.resize((w,h),Image.LANCZOS)
    a=np.asarray(small)[...,3];small.putalpha(Image.fromarray(np.where(a>110,255,0).astype(np.uint8)))
    ox,oy=(i%8)*cw,(i//8)*ch
    tile=Image.new('RGBA',(cw,ch),(0,0,0,0));tile.alpha_composite(small,(round(cw/2-cx*k),round(foot-base*k)))
    sheet.alpha_composite(tile,(ox,oy))
  sheet.save(OUT+name,optimize=True)
  print(f"{OUT}{name}: frameSize [{cw},{ch}], feet {ch-foot}px above the cell bottom")
  return cw,ch

def height(frames):return np.median([base-body_rows(np.asarray(img)[...,3]>0)[0] for img,_,base in [f for f in frames if f]])

if __name__=='__main__':
  # On-screen heights in game pixels; Eli stands about 55. Sheets are drawn at scale .5.
  for name,src,tall in [('mara',CH+'mara/mara_walk_sheet.png',54),('emilia',CH+'emilia/emilia_walk_sheet.png',50)]:
    frames=walk(src,WALK_FRAMES[name]);pack(name+'-sheet.png',[(frames,tall*2/height(frames[16:24]))])
  frames=walk(CH+'drayfus/drayfus_walk_sheet.png',WALK_FRAMES['drayfus']);k=62*2/height(frames[16:24])
  beckon=strip(CH+'drayfus/drayfus_beckon_strip.png',False)
  pack('drayfus-sheet.png',[(frames,k),(beckon,62*2/height(beckon))])
  # The ocelot is cat-sized: about 28 px tall walking side-on, a little more sitting up.
  frames=walk(CR+'talking-ocelot_walk_sheet.png',WALK_FRAMES['ocelot']);k=28*2/height(frames[:7])
  sit=strip(CR+'talking-ocelot_dissolve_strip.png',True)
  pack('ocelot-sheet.png',[(frames,k),(sit,36*2/height(sit[:1]))])
  # Brume, the Moonfang wolf: pony-sized, about 64 px tall side-on.
  # Row 4 is the bow and row 5 lying down to sleep, both facing right, scaled so he stands as tall as when walking.
  frames=walk(MF+'brume_walk_sheet.png',(8,8,8,8),'columns','body')
  bow=strip_column(MF+'brume_bow_column.png');sleep=strip_column(MF+'brume_sleep_column.png')
  pack('brume-sheet.png',[(frames,64*2/height(frames[:8])),(bow,64*2/height(bow[:1])),(sleep,64*2/height(sleep[:1]))])
  # Corvane, Croshelda's general: taller than Drayfus, about 68 px. Row 4 is the shadows-part entrance (facing the
  # camera) and row 5 blocking Emilia's ice (facing right), each scaled to his walking height.
  frames=walk(CV+'corvane_walk-sheet.png',(8,8,8,8),'columns','head',line=True)
  part=strip_column(CV+'corvane_shadows-part.png');block=strip_column(CV+'corvane_block.png')
  pack('corvane-sheet.png',[(frames,68*2/height(frames[16:24])),(part,68*2/height(part[:1])),(block,68*2/height(block[:1]))])
