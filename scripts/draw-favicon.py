# Draws the site favicon: a glowing blue lure-fish in the game's 16-bit style, on a 16x16 grid.
# Writes assets/icons/favicon.ico (16/32/48) and assets/icons/favicon-32.png.
from PIL import Image

GRID = [
    "................",
    "................",
    "...........kk...",
    "..........kddk..",
    ".......kkkkddk..",
    ".kk...kLLLLkk...",
    "kBBk.kLLLLLLLLk.",
    "kBBBkLLLLLLWkLLk",
    ".kBBBBLLLLLkkLLk",
    ".kBBBBMMMMMLLLLk",
    "kBBBkMMMMMMMMMk.",
    "kBBk.kMMMMMMMk..",
    ".kk...kkMMMkk...",
    "........kddk....",
    ".........kk.....",
    "................",
]
PALETTE = {
    'k': (14, 24, 38, 255),     # outline
    'd': (40, 92, 150, 255),    # fins
    'B': (58, 140, 214, 255),   # tail
    'L': (96, 196, 255, 255),   # body light
    'M': (52, 118, 196, 255),   # belly shade
    'W': (240, 252, 255, 255),  # eye glint
}

def draw():
    img = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    for y, row in enumerate(GRID):
        for x, c in enumerate(row):
            if c in PALETTE:
                img.putpixel((x, y), PALETTE[c])
    return img

if __name__ == '__main__':
    base = draw()
    sizes = [base.resize((s, s), Image.NEAREST) for s in (16, 32, 48)]
    sizes[2].save('assets/icons/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=sizes[:2])
    sizes[1].save('assets/icons/favicon-32.png')
