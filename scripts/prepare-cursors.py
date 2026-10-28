import numpy as np, sys
from PIL import Image
# Cuts art/sprites/cursors/cursor-sheet.png (six cursors in a row on #00FF00) into 32×32 transparent PNG cursors.
# Usage: python3 scripts/prepare-cursors.py [OUT_DIR]. Prints each cursor's hotspot for src/cursors.js.
OUT=sys.argv[1] if len(sys.argv)>1 else 'assets/cursors'
IDS=['hook','arrow','wand','paw','leaf','shard']
SIZE,PAD=32,1
a=np.asarray(Image.open('art/sprites/cursors/cursor-sheet.png').convert('RGB')).astype(int)
r,g,b=a[...,0],a[...,1],a[...,2]
# Backdrop and the faint cell lines are bright, saturated green; the leaf is a dark olive, so it survives.
solid=~((g>120)&(g-np.maximum(r,b)>70))
w=a.shape[1]//len(IDS)
for i,id in enumerate(IDS):
    # A small inset skips the faint cell borders; the wand's sparkles stay in its cell.
    keep=np.zeros_like(solid);keep[:,i*w+6:(i+1)*w-6]=solid[:,i*w+6:(i+1)*w-6]
    ys,xs=np.nonzero(keep);y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    side=max(y1-y0,x1-x0);cy,cx=(y0+y1)/2,(x0+x1)/2
    rgba=np.dstack([a,keep*255]).astype(np.uint8)
    img=Image.fromarray(rgba).crop((int(cx-side/2),int(cy-side/2),int(cx-side/2)+side,int(cy-side/2)+side))
    # Premultiply before shrinking so the green never bleeds into the edges.
    arr=np.asarray(img).astype(float);al=arr[...,3:]/255;pm=np.dstack([arr[...,:3]*al,arr[...,3:]]).astype(np.uint8)
    inner=SIZE-2*PAD;small=np.asarray(Image.fromarray(pm).resize((inner,inner),Image.BOX)).astype(float)
    al=small[...,3:]/255;rgb=np.where(al>0,small[...,:3]/np.maximum(al,1e-6),0)
    alpha=np.where(small[...,3]>=110,255,0)
    out=np.zeros((SIZE,SIZE,4),np.uint8);out[PAD:-PAD,PAD:-PAD]=np.dstack([rgb.clip(0,255),alpha]).astype(np.uint8)
    Image.fromarray(out).save(f'{OUT}/{id}.png',optimize=True)
    ys,xs=np.nonzero(out[...,3])
    if id=='paw':hot=(int(round(xs.mean())),int(round(ys.mean())))
    elif id=='wand':
        o=out.astype(int);star=(o[...,3]>0)&(o[...,0]>180)&(o[...,1]>150)&(o[...,2]<120)&(np.arange(SIZE)[None,:]+np.arange(SIZE)[:,None]<SIZE)
        sy,sx=np.nonzero(star);hot=(int(round(sx.mean())),int(round(sy.mean())))
    else:
        k=np.argmin(xs+ys);hot=(int(xs[k]),int(ys[k]))
    print(id,'hotspot',list(hot))
