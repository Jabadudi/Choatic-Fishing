# Draws assets/items/lodestone.webp: a dark iron lump with filings standing up at its poles. Run from the repository root.
import math,random
from PIL import Image,ImageDraw,ImageFilter
import numpy as np
random.seed(11);np.random.seed(11)
S=512
# Irregular lump: a ring of jittered points, smoothed.
pts=[]
for i in range(26):
    a=i/26*2*math.pi;r=150+random.uniform(-22,22)+18*math.sin(3*a+1)
    pts.append((256+math.cos(a)*r*1.12,262+math.sin(a)*r*.86))
mask=Image.new('L',(S,S),0);ImageDraw.Draw(mask).polygon(pts,fill=255);mask=mask.filter(ImageFilter.GaussianBlur(4)).point(lambda v:255 if v>128 else 0)
m=np.array(mask)/255.
# Height: blurred mask plus lumpy noise, so the light finds bumps and facets.
h=np.array(mask.filter(ImageFilter.GaussianBlur(40))).astype(float)/255
lump=np.zeros((S,S))
for _ in range(40):
    x,y,r=random.uniform(130,390),random.uniform(150,380),random.uniform(20,60)
    yy,xx=np.mgrid[0:S,0:S];lump+=np.exp(-((xx-x)**2+(yy-y)**2)/(2*r*r))*random.uniform(-.15,.25)
h=h+lump*.7+np.random.rand(S,S)*.02
gy,gx=np.gradient(h*90)
n=np.dstack([-gx,-gy,np.ones_like(h)]);n/=np.linalg.norm(n,axis=2,keepdims=True)
L=np.array([-.55,-.65,.52]);L/=np.linalg.norm(L)
lam=np.clip((n*L).sum(2),0,1)
spec=np.clip((n*np.array([-.3,-.4,.87])).sum(2),0,1)**28
grain=np.array(Image.fromarray(np.uint8(np.random.rand(S,S)*255)).filter(ImageFilter.GaussianBlur(1.2))).astype(float)/255
base=np.array([18,20,27]);hi=np.array([112,120,140])
col=base+(hi-base)*(lam[...,None]**1.8)
col+= (grain[...,None]-.5)*30
col+= spec[...,None]*np.array([190,200,220])
# Faint blue sheen where the lodestone is strongest.
col+= np.array([0,8,30])*lam[...,None]
rock=np.dstack([np.clip(col,0,255),m*255]).astype(np.uint8)
rock=Image.fromarray(rock,'RGBA')
# Iron filings standing up at the two poles.
fil=Image.new('RGBA',(S,S),(0,0,0,0));fd=ImageDraw.Draw(fil)
for (px,py,ang) in [(118,205,-2.55),(398,318,.55)]:
    for k in range(95):
        a=ang+random.gauss(0,.45);r0=random.uniform(-8,26);Lg=random.uniform(28,74)
        x0,y0=px+math.cos(a)*r0,py+math.sin(a)*r0;x1,y1=x0+math.cos(a)*Lg,y0+math.sin(a)*Lg
        v=random.randint(40,80);fd.line((x0,y0,x1,y1),fill=(v,v+2,v+8,255),width=random.choice([4,5,6]))
        fd.line((x0+1,y0-1,x1+1,y1-1),fill=(v+110,v+112,v+125,230),width=2)
aura=Image.new('RGBA',(S,S),(0,0,0,0));ImageDraw.Draw(aura).polygon(pts,fill=(110,175,255,170));aura=aura.filter(ImageFilter.GaussianBlur(26))
out=Image.new('RGBA',(S,S),(0,0,0,0));out.alpha_composite(aura);out.alpha_composite(fil)
ol=Image.new('RGBA',(S,S),(14,15,18,255));ol.putalpha(mask.filter(ImageFilter.MaxFilter(11)));out.alpha_composite(ol);out.alpha_composite(rock)
out=out.crop(out.getbbox());w,hh=out.size;side=max(w,hh)+20
sq=Image.new('RGBA',(side,side),(0,0,0,0));sq.alpha_composite(out,((side-w)//2,(side-hh)//2))
sq=sq.resize((128,128),Image.LANCZOS);sq.save('assets/items/lodestone.webp','WEBP',quality=90)
