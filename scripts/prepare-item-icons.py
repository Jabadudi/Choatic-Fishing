import numpy as np, sys, os
from collections import deque
from PIL import Image
# Cuts the item icon sheets in art/sprites/items/sheets into square 128 px WebP icons with the green removed.
# Usage: python3 scripts/prepare-item-icons.py [OUT_DIR]. Pieces are found as connected shapes and assigned to grid cells by their centre,
# so an icon that leans into the next cell (the lure, the harpoon) still comes out whole.
U='art/sprites/items/sheets/'
OUT=sys.argv[1] if len(sys.argv)>1 else 'assets/items'
SIZE=128
SHEETS=[
 ('01-tools-weapons.png',4,3,False,['fishing-rod','hunting-bow','hunting-knife','reed-spear','shell-buckler','crab-maul','shell-sling','frying-pan','swordfish','harpoon-gun','anchor','pufferfish-bomb']),
 ('02-food-wares.png',4,3,False,['sardine','deer-meat','rabbit-meat','turtle-meat','eel-fillet','wild-herbs','willow-apples','healing-salve','grappling-squid','iron-fishhooks','whetstone','woven-fish-trap']),
 ('03-materials-trophies.png',4,3,False,['deer-hide','rabbit-pelt','turtle-shell','eel-skin','eel-oil','shadow-ichor','rusted-axe-head','deer-antlers','rabbits-foot','river-pearl','black-light-shard','old-boot']),
 ('04-shards-quest.png',4,2,True,['shard-rabbit','shard-deer','shard-turtle','shard-eel','shard-shadow-walker','region-core','treasure-key','reed-mark']),
 ('05-guardian-shards.png',3,1,True,['shard-moonfang','shard-rimejaw','shard-flitlynx']),
]
def key(a):
    r,g,b=[a[...,i].astype(int) for i in range(3)]
    m=np.maximum(r,b); gr=g-m
    alpha=np.clip(255-(gr-8)*255/32,0,255)
    alpha[g<60]=255
    alpha=np.where((gr>40)&(g>70),0,alpha).astype(np.uint8)
    out=a.copy(); out[...,1]=np.minimum(g,m+4).clip(0,255).astype(np.uint8)
    return np.dstack([out,alpha])
# The shard sheet holds green and aqua crystals, so it keys on closeness to the backdrop colour instead of on greenness.
def key_close(a):
    bg=np.median(np.concatenate([a[:8,:8].reshape(-1,3),a[-8:,-8:].reshape(-1,3)]),0)
    d=np.abs(a.astype(int)-bg).sum(-1)
    alpha=np.clip((d-40)*255/70,0,255).astype(np.uint8)
    out=a.copy(); r,g,b=[a[...,i].astype(int) for i in range(3)]
    edge=alpha<255; out[...,1]=np.where(edge,np.minimum(g,np.maximum(r,b)+20),g).clip(0,255).astype(np.uint8)
    return np.dstack([out,alpha])
def label(mask):
    lab=np.zeros(mask.shape,int); n=0; h,w=mask.shape
    for y,x in zip(*np.nonzero(mask)):
        if lab[y,x]:continue
        n+=1; lab[y,x]=n; q=deque([(y,x)])
        while q:
            cy,cx=q.popleft()
            for ny in range(max(0,cy-1),min(h,cy+2)):
                for nx in range(max(0,cx-1),min(w,cx+2)):
                    if mask[ny,nx] and not lab[ny,nx]:lab[ny,nx]=n;q.append((ny,nx))
    return lab,n
os.makedirs(OUT,exist_ok=True)
S=4
for f,cols,rows,close,names in SHEETS:
    a=np.array(Image.open(U+f).convert('RGB')); rgba=(key_close if close else key)(a); m=rgba[...,3]>40
    h,w=m.shape; small=m[:h//S*S,:w//S*S].reshape(h//S,S,w//S,S).any(axis=(1,3))
    lab,n=label(small); cell=np.zeros(m.shape,int)-1
    for i in range(1,n+1):
        ys,xs=np.nonzero(lab==i); cx,cy=xs.mean()*S,ys.mean()*S
        c=min(rows-1,int(cy/(h/rows)))*cols+min(cols-1,int(cx/(w/cols)))
        region=np.kron(lab==i,np.ones((S,S),bool)); cell[:region.shape[0],:region.shape[1]][region]=c
    for c,name in enumerate(names):
        sel=(cell==c)&(rgba[...,3]>0); ys,xs=np.nonzero(sel)
        piece=rgba.copy(); piece[...,3]=np.where(sel,piece[...,3],0)
        crop=piece[ys.min():ys.max()+1,xs.min():xs.max()+1]
        side=int(max(crop.shape[:2])*1.06); canvas=np.zeros((side,side,4),np.uint8)
        oy,ox=(side-crop.shape[0])//2,(side-crop.shape[1])//2; canvas[oy:oy+crop.shape[0],ox:ox+crop.shape[1]]=crop
        Image.fromarray(canvas,'RGBA').resize((SIZE,SIZE),Image.LANCZOS).save(f'{OUT}/{name}.webp',quality=90,method=6)
