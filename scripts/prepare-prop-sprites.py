import numpy as np, sys, os
from PIL import Image
# Cuts each furniture sheet in art/sprites/props/sheets into single sprites with the green removed.
# Usage: python3 scripts/prepare-prop-sprites.py OUT_DIR. Sprites are found by the empty gaps between them.
U='art/sprites/props/sheets/'
SHEETS=[(n,n+'.png') for n in ['01-cabin-lodge','02-chief-house-shared','03-village-outdoor','04-training-blacksmith','05-inn-workshop-homes']]
OUT=sys.argv[1] if len(sys.argv)>1 else 'out'
def key(a):
    r,g,b=[a[...,i].astype(int) for i in range(3)]
    m=np.maximum(r,b); gr=g-m
    alpha=np.clip(255-(gr-8)*255/32,0,255)
    alpha[g<60]=255
    alpha=np.where((gr>40)&(g>70),0,alpha).astype(np.uint8)
    out=a.copy(); out[...,1]=np.minimum(g,m+4).clip(0,255).astype(np.uint8)
    return np.dstack([out,alpha])
def bands(prof,minlen,thr):
    on=prof>thr; res=[];s=None
    for i,v in enumerate(on):
        if v and s is None:s=i
        if not v and s is not None:
            if i-s>=minlen:res.append([s,i])
            s=None
    if s is not None and len(on)-s>=minlen:res.append([s,len(on)])
    return res
os.makedirs(OUT,exist_ok=True)
for name,f in SHEETS:
    a=np.array(Image.open(U+f).convert('RGB')); rgba=key(a); m=rgba[...,3]>0
    rows=bands(m.sum(1),40,2)
    while len(rows)<4:
        i=max(range(len(rows)),key=lambda j:rows[j][1]-rows[j][0]);y0,y1=rows[i];p=m[y0:y1].sum(1);q=len(p)//4;c=y0+q+int(np.argmin(p[q:-q]))
        rows[i:i+1]=[[y0,c],[c,y1]]
    k=0
    for (y0,y1) in rows:
        cols=bands(m[y0:y1].sum(0),30,1)
        while len(cols)<5:
            i=max(range(len(cols)),key=lambda j:cols[j][1]-cols[j][0]);x0,x1=cols[i];p=m[y0:y1,x0:x1].sum(0);q=len(p)//4;c=x0+q+int(np.argmin(p[q:-q]))
            cols[i:i+1]=[[x0,c],[c,x1]]
        for (x0,x1) in cols:
            k+=1
            sub=m[y0:y1,x0:x1]; ys=np.where(sub.any(1))[0]
            crop=rgba[y0+ys[0]:y0+ys[-1]+1,x0:x1]
            Image.fromarray(crop,'RGBA').save(f'{OUT}/{name}_{k:02d}.png')
