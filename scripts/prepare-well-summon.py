"""Cut the Wishing Well summon art in art/sprites/wishing-well/ into game-ready strips in assets/well-summon/.

Each sheet has its frames in one row on a green (#00FF00) background. Frames are found by connected regions,
the green and its spill are removed, and every frame goes into an equal cell of one horizontal strip:
Eli lined up by the feet, fish by the snout, effects by their centre. Pebbles already flying out of Eli's
hands are dropped, because the game draws those stones itself. Prints the cell sizes and anchors that
SUMMON_ART in src/well-summon.js uses. Run from the repository root:
    python3 scripts/prepare-well-summon.py
Requires Pillow and NumPy.
"""
import json,os
from collections import deque
import numpy as np
from PIL import Image
SRC='art/sprites/wishing-well/'
OUT='assets/well-summon/'
PX=4  # Pixels per scene unit: the scene is 320 units wide.
def key(path):
    a=np.asarray(Image.open(path).convert('RGB')).astype(int);r,g,b=a[...,0],a[...,1],a[...,2]
    m=np.maximum(r,b);gr=g-m
    alpha=np.clip(255-(gr-8)*255/32,0,255);alpha[g<60]=255;alpha[(gr>40)&(g>70)]=0
    out=a.copy();out[...,1]=np.minimum(g,m+4)
    return np.dstack([out,alpha]).clip(0,255).astype(np.uint8)
def components(mask):
    H,W=mask.shape;lab=np.zeros((H,W),np.int32);n=0;sizes=[0]
    for y0,x0 in zip(*np.nonzero(mask)):
        if lab[y0,x0]:continue
        n+=1;lab[y0,x0]=n;q=deque([(y0,x0)]);count=0
        while q:
            y,x=q.popleft();count+=1
            for yy in range(max(0,y-1),min(H,y+2)):
                for xx in range(max(0,x-1),min(W,x+2)):
                    if mask[yy,xx] and not lab[yy,xx]:lab[yy,xx]=n;q.append((yy,xx))
        sizes.append(count)
    return lab,np.array(sizes)
def frames(path,count,attached=False,body_only=()):
    """Split a one-row sheet into `count` RGBA frames, each cropped to its content."""
    rgba=key(path);mask=rgba[...,3]>96;lab,sizes=components(mask);W=mask.shape[1]
    ys,xs=np.nonzero(lab);ids=lab[ys,xs];n=len(sizes)
    cx=np.bincount(ids,weights=xs,minlength=n)/np.maximum(1,np.bincount(ids,minlength=n))
    out=[]
    for k in range(count):
        mine=[i for i in range(1,n) if sizes[i]>=6 and k*W/count<=cx[i]<(k+1)*W/count]
        if attached:
            # Keep the body and only what touches it, such as a pebble in his hand; stones in flight may sit in the next cell.
            body=max(mine,key=lambda i:sizes[i]);by,bx=np.nonzero(lab==body)
            y0,y1,x0,x1=max(0,by.min()-4),by.max()+5,max(0,bx.min()-4),bx.max()+5
            near=lab[y0:y1,x0:x1]==body
            for _ in range(3):near=near|np.roll(near,1,0)|np.roll(near,-1,0)|np.roll(near,1,1)|np.roll(near,-1,1)
            touching=set(np.unique(lab[y0:y1,x0:x1][near]))-{0}
            mine=[body] if k in body_only else sorted(touching)
        keep=np.isin(lab,mine);yy,xx=np.nonzero(keep)
        y0,y1,x0,x1=yy.min(),yy.max()+1,xx.min(),xx.max()+1
        crop=rgba[y0:y1,x0:x1].copy();crop[...,3]=np.where(keep[y0:y1,x0:x1],crop[...,3],0)
        # Soft edge pixels next to the kept regions stay, so outlines are not cut hard.
        near=keep[y0:y1,x0:x1].copy()
        for _ in range(2):near=near|np.roll(near,1,0)|np.roll(near,-1,0)|np.roll(near,1,1)|np.roll(near,-1,1)
        edge=near&(lab[y0:y1,x0:x1]==0)&(rgba[y0:y1,x0:x1,3]>0)
        crop[...,3]=np.where(edge,rgba[y0:y1,x0:x1,3],crop[...,3])
        out.append(Image.fromarray(crop,'RGBA'))
    return out
def scaled(images,scale):
    return [im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.LANCZOS) for im in images]
def strip(name,images,anchor):
    """Place frames in equal cells. anchor(im) gives the point of each frame that lines up across the strip."""
    points=[anchor(im) for im in images]
    left=max(p[0] for p in points);right=max(im.width-p[0] for im,p in zip(images,points))
    top=max(p[1] for p in points);bottom=max(im.height-p[1] for im,p in zip(images,points))
    w,h=int(np.ceil(left+right))+2,int(np.ceil(top+bottom))+2
    sheet=Image.new('RGBA',(w*len(images),h),(0,0,0,0))
    for k,(im,p) in enumerate(zip(images,points)):sheet.alpha_composite(im,(k*w+1+round(left-p[0]),1+round(top-p[1])))
    sheet.save(OUT+name+'.webp','WEBP',quality=90,method=6)
    return {'src':name,'frames':len(images),'w':round(w/PX,2),'h':round(h/PX,2),'ax':round((left+1)/PX,2),'ay':round((top+1)/PX,2)}
def feet(im):
    a=np.asarray(im)[...,3]>96;rows=np.nonzero(a.any(1))[0];low=a[rows[-1]-max(2,im.height//16):rows[-1]+1]
    return (float(np.nonzero(low.any(0))[0].mean()),float(rows[-1]+1))
def snout(im):
    a=np.asarray(im)[...,3]>96;cols=np.nonzero(a.any(0))[0];ys=np.nonzero(a[:,cols[-1]-max(2,im.width//12):].any(1))[0]
    return (float(cols[-1]+1),float(ys.mean()))
def centre(im):return (im.width/2,im.height/2)
os.makedirs(OUT,exist_ok=True);art={}
# Eli stands 44 units tall in the first frame of both throws.
single=frames(SRC+'eli-throw-single.png',6,True,(3,));multi=frames(SRC+'eli-throw-multi.png',6,True,(3,4))
eli=44*PX/single[0].height
art['eliSingle']=strip('eli-throw-single',scaled(single,eli),feet);art['eliMulti']=strip('eli-throw-multi',scaled(multi,44*PX/multi[0].height),feet)
# Each fish has a length in scene units; frames 1-4 swim and frame 5 bites.
for rarity,name,length in [('common','sardine',34),('uncommon','reed-perch',40),('rare','river-eel',74),('epic','glowfin',46),('legendary','golden-koi',86)]:
    fish=frames(SRC+f'fish-{name}.png',5);s=length*PX/fish[0].width
    art[rarity]=strip(f'fish-{name}',scaled(fish,s),snout)
    if rarity=='legendary':
        # A dark silhouette of the koi for the shadow that passes in the deep.
        shadows=[]
        for im in scaled(fish[:4],s):
            a=np.asarray(im).copy();a[...,:3]=(4,22,28);shadows.append(Image.fromarray(a,'RGBA'))
        art['shadow']=strip('koi-shadow',shadows,snout)
fx=frames(SRC+'effects.png',7)
art['stone']=strip('wishstone',scaled(fx[:1],7*PX/fx[0].width),centre)
art['splash']=strip('splash',scaled(fx[1:4],34*PX/fx[3].width),lambda im:(im.width/2,im.height*.82))
art['sparkle']=strip('sparkle',scaled(fx[4:7],30*PX/fx[5].width),centre)
# The two scenes are full pictures, kept at three times the scene size.
for name in ['well-scene','well-cavern']:Image.open(SRC+name+'.png').convert('RGB').resize((960,540),Image.LANCZOS).save(OUT+name+'.webp','WEBP',quality=82,method=6)
print(json.dumps(art))
