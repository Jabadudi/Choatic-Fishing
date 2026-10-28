# Draws assets/items/shard-{moonfang,rimejaw,flitlynx}.webp as stand-ins until the guardian shards are painted. Run from the repository root.
# Each reuses the eel shard's crystal with its pattern smoothed away, retinted, and the guardian's silhouette cut from its story sheet.
from PIL import Image, ImageFilter, ImageChops, ImageOps
import numpy as np
root='.';out='assets/items'
base=Image.open(f'{root}/assets/items/shard-eel.webp').convert('RGBA')
alpha=base.getchannel('A')
lum=base.convert('L')
# Smooth the inner pattern away but keep the crystal's facet edges near the rim.
inner=alpha.filter(ImageFilter.MinFilter(25))
smooth=lum.filter(ImageFilter.GaussianBlur(18)).point(lambda v:int(70+v*.25))
lum=Image.composite(smooth,lum,inner.filter(ImageFilter.GaussianBlur(4)))
def key(img):
  a=np.array(img.convert('RGBA')).astype(int)
  g=(a[:,:,1]>140)&(a[:,:,1]>a[:,:,0]+40)&(a[:,:,1]>a[:,:,2]+40)
  a[g,3]=0;return Image.fromarray(a.astype('uint8'))
CREATURES={
 'moonfang':('story/moonfang.png',(145,10,465,260),((24,26,58),(150,160,220),(250,250,255))),
 'rimejaw':('story/rimejaw-sheet.png',(45,35,455,305),((10,40,60),(110,200,230),(240,255,255))),
 'flitlynx':('story/flitlynx-sheet.png',(70,25,400,325),((60,20,10),(230,120,70),(255,235,200))),
}
for id,(sheet,box,(dark,mid,light)) in CREATURES.items():
  tinted=ImageOps.colorize(lum,dark,light,mid).convert('RGBA');tinted.putalpha(alpha)
  sil=key(Image.open(f'{root}/assets/{sheet}').crop(box));sil=sil.crop(sil.getbbox())
  sil.thumbnail((46,46),Image.LANCZOS)
  mask=sil.getchannel('A')
  glow=Image.new('RGBA',sil.size,light+(0,));glow.putalpha(mask.point(lambda v:215 if v>128 else 0))
  halo=Image.new('RGBA',(128,128),(0,0,0,0));x=(128-sil.width)//2;y=(128-sil.height)//2+4
  soft=Image.new('RGBA',sil.size,light+(0,));soft.putalpha(mask.filter(ImageFilter.GaussianBlur(2.5)).point(lambda v:int(v*.45)))
  halo.alpha_composite(soft,(x,y));halo.alpha_composite(glow,(x,y))
  
  halo.putalpha(ImageChops.multiply(halo.getchannel('A'),alpha.filter(ImageFilter.MinFilter(9))))
  icon=Image.alpha_composite(tinted,halo)
  icon.save(f'{out}/shard-{id}.webp',quality=92,method=6)
