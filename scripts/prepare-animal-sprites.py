"""Turn the new animals' art into game-ready sheets in assets/, and their poses into Index portraits in assets/codex/.

Each animal's source art lives in art/sprites/creatures/<id>/, made from the prompts in the project's
new-animals art prompt file: a column-layout walk set (4 columns: right, left, toward the camera, away; 8 frames
top to bottom) and action columns of 8 frames facing right. The cutting helpers are shared with
prepare-chapter6-sprites.py, so every sheet follows the house row layout: rows 0-3 walk, then one row per action.

  fox-sheet.png   rows 0-3 walk, row 4 the flee run, row 5 sitting and sniffing (idle), row 6 hurt (frames 0-1)
                  and defeat (frames 2-7).
  boar-sheet.png  rows 0-3 walk (7 frames each; the 8th cell is empty), row 4 the charge, row 5 hurt (frames 0-2) and
                  defeat (frames 3-7).
  elk-sheet.png   rows 0-3 walk, row 4 the antler swing, row 5 grazing (idle), row 6 hurt (frames 0-1) and defeat (2-7).
  bear-sheet.png  rows 0-3 walk, row 4 rearing up to roar, row 5 the claw swipe, row 6 hurt (frames 0-1) and defeat (2-7).
  crab-sheet.png  rows 0-3 the sideways scuttle (right and left are drawn, not mirrored), row 4 the claw pinch, row 5
                  hurt (frames 0-1) and flipping onto its back (2-7).
  goat-sheet.png  rows 0-3 walk, row 4 rearing up and the headbutt, row 5 hurt (frames 0-1) and defeat (2-7).
  otter-sheet.png rows 0-3 swimming at the surface, rows 4-7 the bounding walk on land, row 8 diving (frames 0-1 swim,
                  2-4 the dive, 5-7 the tail and ripples), row 9 hurt (frames 0-1) and defeat (2-7).
  duck-sheet.png  rows 0-3 paddling, row 4 taking off (frames 0-3) and flying (4-7), row 5 hurt (0-2) and defeat (3-7).
  pike-sheet.png  rows 0-3 swimming, seen from above, row 4 the lunge and snap, row 5 hurt (frames 0-2) and belly up (3-7).
  seal-sheet.png  rows 0-3 swimming, rows 4-7 hauling itself along on land, row 8 sliding into the sea, row 9 hurt (0-2)
                  and defeat (3-7).
  heron-sheet.png rows 0-3 walk, row 4 taking off (frames 0-3) and flying (4-7), lifted off the ground; row 5 spearing a
                  fish (idle); row 6 hurt (frames 0-2) and defeat (3-7).

Run from the repository root: python3 scripts/prepare-animal-sprites.py
Requires Pillow and NumPy.
"""
import importlib.util
import numpy as np
from PIL import Image

spec=importlib.util.spec_from_file_location('ch6','scripts/prepare-chapter6-sprites.py')
ch6=importlib.util.module_from_spec(spec);spec.loader.exec_module(ch6)
ch6.OUT='assets/'
SRC='art/sprites/creatures/'

def portrait(path,out,size=256):
  """The pose on a transparent square, centred, for the Index."""
  im,mask=ch6.load(path);ys,xs=np.nonzero(mask);t,b,l,r=ys.min(),ys.max()+1,xs.min(),xs.max()+1
  rgb=im[t:b,l:r].copy();m=mask[t:b,l:r]
  g=rgb[...,1];lim=np.maximum(rgb[...,0],rgb[...,2]);rgb[...,1]=np.where(g>lim*1.1,lim*1.1,g).astype(int)
  img=Image.fromarray(np.dstack([rgb.clip(0,255).astype(np.uint8),(m*255).astype(np.uint8)]),'RGBA')
  k=(size-16)/max(img.size);img=img.resize((max(1,round(img.width*k)),max(1,round(img.height*k))),Image.LANCZOS)
  sheet=Image.new('RGBA',(size,size),(0,0,0,0));sheet.alpha_composite(img,((size-img.width)//2,(size-img.height)//2))
  sheet.save(out,optimize=True);print(out)

def width(frames):
  """Median nose-to-tail length of the drawn figures (column strips share one crop box, so the image width won't do)."""
  return np.median([np.ptp(np.nonzero(np.asarray(img)[...,3].any(0))[0])+1 for img,_,_ in [f for f in frames if f]])

def drop_strays(frames,share=.04):
  """Clear small specks along each frame's top edge: the feet of the frame above, where it overlaps this one's rows."""
  out=[]
  for img,ax,base in frames:
    a=np.asarray(img).copy();m=a[...,3]>0;h,w=m.shape;seen=np.zeros_like(m);total=m.sum()
    for x0 in np.nonzero(m[0])[0]:
      if seen[0,x0]:continue
      stack=[(0,x0)];seen[0,x0]=True;part=[]
      while stack:
        y,x=stack.pop();part.append((y,x))
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
          v,u=y+dy,x+dx
          if 0<=v<h and 0<=u<w and m[v,u] and not seen[v,u]:seen[v,u]=True;stack.append((v,u))
      if len(part)<total*share:
        for y,x in part:a[y,x,3]=0
    out.append((Image.fromarray(a,'RGBA'),ax,base))
  return out

if __name__=='__main__':
  # The fox: a little bigger than a rabbit, about 26 px tall to the ear tips walking side-on (Eli is about 55).
  d=SRC+'fox/'
  frames=ch6.walk(d+'fox_walk-sheet.png',(8,8,8,8),'columns','body');k=26*2/ch6.height(frames[:8])
  run=ch6.strip_column(d+'fox_run-column.png');idle=ch6.strip_column(d+'fox_idle-column.png');hurt=ch6.strip_column(d+'fox_hurt-column.png')
  # The run is stretched out, so it is matched by length: a galloping fox is about a fifth longer than a walking one.
  # The hurt strip starts standing, like the walk, and the idle strip stands to sniff in frame 7, so both are matched by
  # nose-to-tail length, which holds better than height while the head moves.
  side=width(frames[:8])
  ch6.pack('fox-sheet.png',[(frames,k),(run,k*side*1.2/width(run)),(idle,k*side/width(idle[6:7])),(hurt,k*side/width(hurt[:1]))])
  portrait(d+'fox_pose.png','assets/codex/fox.png')
  # The boar: waist-high to Eli and heavy, about 30 px tall at the bristles walking side-on. Its walk set has 7 frames a side.
  d=SRC+'boar/'
  frames=ch6.walk(d+'boar_walk-sheet.png',(7,7,7,7),'columns','body');k=30*2/ch6.height(frames[:7]);side=width(frames[:7])
  charge=ch6.strip_column(d+'boar_charge-column.png');hurt=ch6.strip_column(d+'boar_hurt-column.png')
  # Both strips start standing side-on, so their first frames are matched to the walk's length (the charge's dust aside).
  ch6.pack('boar-sheet.png',[(frames,k),(charge,k*side/width(charge[:1])),(hurt,k*side/width(hurt[:1]))])
  portrait(d+'boar_pose.png','assets/codex/boar.png')
  # The elk: taller than Eli at the shoulder, about 72 px to the antler tips walking side-on.
  # Every strip starts standing side-on, so each is matched to the walk by its first frame's length.
  d=SRC+'elk/'
  frames=ch6.walk(d+'elk_walk-sheet.png',(8,8,8,8),'columns','body');k=72*2/ch6.height(frames[:8]);side=width(frames[:8])
  strips=[ch6.strip_column(d+f'elk_{name}-column.png') for name in ('antler-swing','graze','hurt')]
  # The generated walk shrinks a little down each column. Each frame is pulled halfway back to the median height on its
  # own: all the way would blow up the long, low strides, which are shorter for a reason.
  mid=ch6.height(frames)
  ch6.pack('elk-sheet.png',[([f],72*2/np.sqrt(ch6.height([f])*mid)) for f in frames]+[(s,k*side/width(s[:1])) for s in strips])
  portrait(d+'elk_pose.png','assets/codex/elk.png')
  # The bear: a heavy brown bear, about 46 px tall at the shoulder hump walking side-on, so its head is level with Eli's.
  # Every strip starts on all fours side-on, so each is matched to the walk by its first frame's length.
  d=SRC+'bear/'
  frames=ch6.walk(d+'bear_walk-sheet.png',(8,8,8,8),'columns','body');k=46*2/ch6.height(frames[:8]);side=width(frames[:8])
  # The rearing frames nearly touch (one empty line between the roar's paws and the next frame's head), so that strip
  # is split on any gap at all.
  strips=[ch6.strip_column(d+f'bear_{name}-column.png',1 if name=='rear' else 4) for name in ('rear','swipe','hurt')]
  ch6.pack('bear-sheet.png',[(frames,k)]+[(s,k*side/width(s[:1])) for s in strips])
  portrait(d+'bear_pose.png','assets/codex/bear.png')
  # The heron: chest-high to Eli, about 42 px to the plume walking side-on.
  d=SRC+'heron/'
  frames=ch6.walk(d+'heron_walk-sheet.png',(8,8,8,8),'columns','body');k=42*2/ch6.height(frames[:8])
  # Frames in the action strips nearly touch (a raised beak under the feet above), so they split on any empty line.
  flight,fish,hurt=[drop_strays(ch6.strip_column(d+f'heron_{name}-column.png',1)) for name in ('flight','fish','hurt')]
  # The fish and hurt strips start standing like the walk, so they are matched by height. The flight is matched by beak
  # to tail length against its first frame, a crouch about as long as the stalk; each frame stands on its own lowest
  # pixels, so the airborne frames are lifted (in source pixels) to fly about 18 px above the ground.
  kf=k*ch6.height(frames[:8])/ch6.height(fish[:1]);kh=k*ch6.height(frames[:8])/ch6.height(hurt[:1])
  kfl=k*width(frames[:8])*1.15/width(flight[:1])
  lift=[0,0,.35,.7,1,1,1,1]
  flight=[(img,ax,base+round(l*18*2/kfl)) for (img,ax,base),l in zip(flight,lift)]
  # The generated walk shrinks down each column; a stalking heron stays upright, so every frame is scaled to full height.
  ch6.pack('heron-sheet.png',[([f],42*2/ch6.height([f])) for f in frames]+[(flight,kfl),(fish,kf),(hurt,kh)])
  portrait(d+'heron_pose.png','assets/codex/heron.png')
  # The shore crab: knee-high to Eli and wide, about 22 px tall to the raised claws.
  d=SRC+'crab/'
  frames=ch6.walk(d+'crab_walk-sheet.png',(8,8,8,8),'columns','body');k=22*2/ch6.height(frames[:8]);side=width(frames[:8])
  pinch,hurt=[drop_strays(ch6.strip_column(d+f'crab_{name}-column.png',1)) for name in ('pinch','hurt')]
  # Both strips start in the walk's stance, so each is matched to the walk by its first frame's width.
  ch6.pack('crab-sheet.png',[(frames,k),(pinch,k*side/width(pinch[:1])),(hurt,k*side/width(hurt[:1]))])
  portrait(d+'crab_pose.png','assets/codex/crab.png')
  # The crag goat: waist-high to Eli, about 34 px to the horn tips walking side-on.
  d=SRC+'goat/'
  frames=ch6.walk(d+'goat_walk-sheet.png',(8,8,8,8),'columns','body');k=34*2/ch6.height(frames[:8]);side=width(frames[:8])
  butt,hurt=[drop_strays(ch6.strip_column(d+f'goat_{name}-column.png',1)) for name in ('headbutt','hurt')]
  ch6.pack('goat-sheet.png',[(frames,k),(butt,k*side/width(butt[:1])),(hurt,k*side/width(hurt[:1]))])
  portrait(d+'goat_pose.png','assets/codex/goat.png')
  # The otter lives in the water, so its swim set is the walk; the land lope follows for when it is ashore. About 44 px
  # nose to tail swimming side-on. The dive and hurt strips start swimming and standing side-on, matched by length.
  d=SRC+'otter/'
  swim=ch6.walk(d+'otter_swim-sheet.png',(8,8,8,8),'columns','body');k=44*2/width(swim[:8]);side=width(swim[:8])
  land=ch6.walk(d+'otter_walk-sheet.png',(8,8,8,8),'columns','body');kl=k*side/width(land[:8])
  dive,hurt=[drop_strays(ch6.strip_column(d+f'otter_{name}-column.png',1)) for name in ('dive','hurt')]
  ch6.pack('otter-sheet.png',[(swim,k),(land,kl),(dive,k*side/width(dive[:1])),(hurt,kl*width(land[:8])/width(hurt[:1]))])
  portrait(d+'otter_pose.png','assets/codex/otter.png')
  # The reed duck: about 20 px tall paddling. Its hurt strip starts paddling like the walk; the take-off is drawn at the
  # same scale as the hurt strip, so it shares that scale.
  d=SRC+'duck/'
  frames=ch6.walk(d+'duck_swim-sheet.png',(8,8,8,8),'columns','body');k=20*2/ch6.height(frames[:8]);side=width(frames[:8])
  fly,hurt=[drop_strays(ch6.strip_column(d+f'duck_{name}-column.png',1)) for name in ('takeoff','hurt')]
  kh=k*side/width(hurt[:1])
  # The flying frames are lifted off the water, like the heron's.
  lift=[0,0,.3,.6,1,1,1,1];fly=[(img,ax,base+round(l*14*2/kh)) for (img,ax,base),l in zip(fly,lift)]
  ch6.pack('duck-sheet.png',[(frames,k),(fly,kh),(hurt,kh)])
  portrait(d+'duck_pose.png','assets/codex/duck.png')
  # The silver pike, seen from above under the surface: about 52 px long. Its lunge and hurt strips are side-on, matched
  # to the swim's length by their first frames.
  d=SRC+'pike/'
  frames=ch6.walk(d+'pike_swim-sheet.png',(8,8,8,8),'columns','body');k=52*2/width(frames[:8]);side=width(frames[:8])
  lunge,hurt=[drop_strays(ch6.strip_column(d+f'pike_{name}-column.png',1)) for name in ('lunge','hurt')]
  ch6.pack('pike-sheet.png',[(frames,k),(lunge,k*side/width(lunge[:1])),(hurt,k*side/width(hurt[:1]))])
  portrait(d+'pike_pose.png','assets/codex/pike.png')
  # The grey seal: about 64 px nose to tail-flippers swimming. Like the otter, the swim set is its walk and the land
  # haul follows; the slide into the sea and the hurt strip start on land, matched to the land set's length.
  d=SRC+'seal/'
  swim=ch6.walk(d+'seal_swim-sheet.png',(8,8,8,8),'columns','body');k=64*2/width(swim[:8]);side=width(swim[:8])
  land=ch6.walk(d+'seal_walk-sheet.png',(8,8,8,8),'columns','body');kl=k*side/width(land[:8])
  dive,hurt=[drop_strays(ch6.strip_column(d+f'seal_{name}-column.png',1)) for name in ('dive','hurt')]
  lw=width(land[:8])
  ch6.pack('seal-sheet.png',[(swim,k),(land,kl),(dive,kl*lw/width(dive[:1])),(hurt,kl*lw/width(hurt[:1]))])
  portrait(d+'seal_pose.png','assets/codex/seal.png')
