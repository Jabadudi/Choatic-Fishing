# Cuts the chief's house and guest lodge floor and wall tiles from art/sprites/props/tiles/chief-lodge-tiles.png
# into assets/props/. Crops start and end on plank seams (or the middle of a timber post) so they repeat.
import numpy as np
from PIL import Image, ImageFilter
src=Image.open('art/sprites/props/tiles/chief-lodge-tiles.png').convert('RGB')
def flatten(im,radius,strength=.7):
    # Evens out the painted highlight so it doesn't repeat across the room.
    a=np.array(im).astype(float);lum=a.mean(2)
    low=np.array(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))).astype(float)
    return Image.fromarray((a*((lum.mean()/np.maximum(low,1))**strength)[...,None]).clip(0,255).astype(np.uint8))
def blend_x(im,band):
    a=np.array(im).astype(float);w=a.shape[1]
    for i in range(band):t=i/band;a[:,w-band+i]=a[:,w-band+i]*(1-t)+a[:,i]*t
    return Image.fromarray(a.astype(np.uint8))
def save(im,name,size):im.resize(size,Image.LANCZOS).save(f'assets/props/{name}.webp',quality=90,method=6)
def tone(im,grey,dark):return Image.blend(im,im.convert('L').convert('RGB'),grey).point(lambda v:int(v*dark))
save(tone(blend_x(flatten(src.crop((65,106,470,450)),40,1),20),.3,.85),'chief-floor',(256,217))
save(flatten(src.crop((596,19,942,461)),50,.4),'chief-wall',(200,256))
beam=flatten(src.crop((1115,94,1422,142)),30,.5);save(beam,'chief-wall-top',(256,40));save(beam.rotate(90,expand=True),'chief-wall-side',(40,256))
save(tone(blend_x(flatten(src.crop((65,590,470,824)),40,1),20),.1,.95),'lodge-floor',(256,148))
save(flatten(src.crop((607,517,888,956)),50,.4),'lodge-wall',(164,256))
beam=flatten(src.crop((1115,556,1422,618)),30,.5);save(beam,'lodge-wall-top',(256,52));save(beam.rotate(90,expand=True),'lodge-wall-side',(52,256))
