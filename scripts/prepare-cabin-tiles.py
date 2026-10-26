# Cuts the cabin floor and wall tiles from art/sprites/props/tiles/cabin-tiles.png into assets/props/.
# Each crop starts and ends on a plank or log seam so it repeats, and the painted highlight is evened out.
import numpy as np
from PIL import Image, ImageFilter
src=Image.open('art/sprites/props/tiles/cabin-tiles.png').convert('RGB')
def flatten(im,radius,axis=None):
    a=np.array(im).astype(float);lum=a.mean(2)
    if axis=='x':low=np.tile(lum.mean(0,keepdims=True),(lum.shape[0],1));low=np.array(Image.fromarray(low.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))).astype(float)
    else:low=np.array(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))).astype(float)
    a=a*((lum.mean()/np.maximum(low,1))**.7)[...,None]
    return Image.fromarray(a.clip(0,255).astype(np.uint8))
def blend_x(im,band):
    # Cross-fades the right edge into the left so the horizontal repeat has no hard step.
    a=np.array(im).astype(float);w=a.shape[1]
    for i in range(band):
        t=i/band;a[:,w-band+i]=a[:,w-band+i]*(1-t)+a[:,i]*t
    return Image.fromarray(a[:, :w].astype(np.uint8))
floor=flatten(src.crop((90,190,636,522)),60)
floor=blend_x(floor,24).resize((256,156),Image.LANCZOS)
# Pull the orange back toward the furniture's browner wood.
floor=Image.blend(floor,floor.convert('L').convert('RGB'),.22).point(lambda v:int(v*.9))
floor.save('assets/props/cabin-floor.webp',quality=90,method=6)
wall=flatten(src.crop((800,44,1370,675)),40)
wall=blend_x(wall,30).resize((256,286),Image.LANCZOS)
wall.save('assets/props/cabin-wall.webp',quality=90,method=6)
top=flatten(src.crop((1520,312,2080,525)),60)
top=blend_x(top,24).resize((256,98),Image.LANCZOS)
top.save('assets/props/cabin-wall-top.webp',quality=90,method=6)
top.rotate(90,expand=True).save('assets/props/cabin-wall-side.webp',quality=90,method=6)
