"""Rebuild runtime quarry material tiles from approved source paintings."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
for name in ['quarry-bedrock-v2','quarry-cliff-v2']:
    image=Image.open(root/'art/sprites/terrain/quarry'/f'{name}.png').convert('RGB')
    image.resize((512,512),Image.Resampling.LANCZOS).save(root/'assets/ground'/f'{name}.webp',quality=94,method=6)
