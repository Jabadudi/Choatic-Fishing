"""Prepare the approved quarry source paintings without changing their alpha or gameplay."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
for name in ['quarry-gantry','stonecutting-bench']:
    image=Image.open(root/'art/sprites/props/quarry'/f'{name}.png').convert('RGBA')
    image=image.crop(image.getbbox())
    image.thumbnail((480,480),Image.Resampling.LANCZOS)
    image.save(root/'assets/props/atlas'/f'{name}.webp',quality=92,method=6)
