"""Placeholder earth cliff face for layered (non-quarry) areas: 16-bit style brown earth slabs, seamless.

Replace assets/ground/earth-cliff.webp with the painted tile from art/sprite-prompts/layered-world-terrain.md when it
exists (same 512 x 512 size). Run: python3 scripts/draw-earth-cliff.py
"""
import random
from PIL import Image

N = 128  # pixel-art grid, scaled 4x to 512
rnd = random.Random(7)
OUT = (52, 34, 24)
BROWNS = [(140, 94, 56), (126, 83, 49), (152, 104, 62), (117, 76, 45)]
img = Image.new('RGB', (N, N))
px = img.load()

cols = []
x = 0
while x < N:
    w = rnd.randint(10, 20)
    if N - x - w < 9:
        w = N - x
    cols.append((x, w))
    x += w

for cx, w in cols:
    y = rnd.randint(0, N - 1)
    left = N
    while left > 0:
        h = min(left, rnd.randint(50, 110))
        base = rnd.choice(BROWNS)
        lean = rnd.randint(-2, 2)
        jag = 0
        for dy in range(h):
            yy = (y + dy) % N
            if rnd.random() < .18:
                jag = max(-1, min(1, jag + rnd.choice((-1, 1))))
            top = min(dy, 4)
            for dx in range(w):
                xx = (cx + dx + (jag if dx == 0 else 0)) % N
                t = dx / max(1, w - 1)
                shade = 1.18 - .5 * t if t > .15 else 1.12
                c = tuple(max(0, min(255, int(v * shade))) for v in base)
                if dy >= h - 4:
                    c = tuple(int(v * .7) for v in c)
                if top < 3 and (dx < 3 - top or dx > w - 4 + top):
                    c = OUT
                elif dx == 0 or dx == w - 1 or dy == h - 1:
                    c = OUT
                elif dy == 0:
                    c = OUT
                elif dy == 1:
                    c = tuple(min(255, v + 34) for v in base)
                elif rnd.random() < .03:
                    c = tuple(int(v * .78) for v in c)
                elif 0 < dx < 3 and dy % 9 < 5:
                    c = tuple(min(255, v + 18) for v in base)
                px[xx, yy] = c
        y = (y + h) % N
        left -= h

# embedded stones
for _ in range(0):
    sx, sy, r = rnd.randrange(N), rnd.randrange(N), rnd.randint(2, 3)
    for dy in range(-r, r + 1):
        for dx in range(-r - 1, r + 2):
            if (dx / (r + 1)) ** 2 + (dy / r) ** 2 <= 1:
                light = dy < 0 and dx < 0
                c = (150, 146, 134) if light else (118, 114, 104)
                if (dx / (r + 1)) ** 2 + (dy / r) ** 2 > .62:
                    c = OUT
                px[(sx + dx) % N, (sy + dy) % N] = c
# roots and moss
for _ in range(6):
    sx, sy = rnd.randrange(N), rnd.randrange(N)
    for i in range(rnd.randint(5, 10)):
        px[(sx + (i // 3) * rnd.choice((-1, 1))) % N, (sy + i) % N] = (88, 60, 36)
for _ in range(12):
    sx, sy = rnd.randrange(N), rnd.randrange(N)
    for dx in range(rnd.randint(1, 3)):
        px[(sx + dx) % N, sy] = (92, 112, 52)

img.resize((512, 512), Image.NEAREST).save('art/sprites/terrain/layered/earth-cliff-placeholder.png')
img.resize((512, 512), Image.NEAREST).save('assets/ground/earth-cliff.webp', 'WEBP', lossless=True)
