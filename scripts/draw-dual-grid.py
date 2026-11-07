"""Dual-grid tileset template and stand-in sheets (see docs/DUAL-GRID.md).

A dual-grid sheet is 4 x 4 cells. Each cell is one combination of its four corners being terrain or not; the cell at
row r, column c holds mask MASK_AT[r][c] (corner bits: 1 top-left, 2 top-right, 4 bottom-left, 8 bottom-right), the
SpriteCook layout. Mask 0 (no corners) is the bottom-left cell and stays empty.

Writes:
  art/sprites/terrain/dual-grid/dual-grid-template.png  white = terrain, magenta = empty, for image generators
  assets/ground/dual/plateau-top.png   stand-in: grass top of a raised plateau, with a dark rim and hanging lip
  assets/ground/dual/cliff-wall.png    stand-in: earth cliff wall, front-on
  assets/ground/dual/sand.png, dirt-path.png, water.png   stand-ins for the Glasswater ground layers
Run: python3 scripts/draw-dual-grid.py
"""
import math
import random
from PIL import Image

FRAME_BY_MASK = [12, 15, 8, 9, 0, 11, 14, 7, 13, 4, 1, 10, 3, 2, 5, 6]
MASK_AT = [[0] * 4 for _ in range(4)]
for mask, frame in enumerate(FRAME_BY_MASK):
    MASK_AT[frame // 4][frame % 4] = mask
ART = 32          # art pixels per tile
SCALE = 8         # 32 * 8 = 256 px per cell, 1024 px sheet


def wobble(u, v):
    # Zero on every tile border, so neighbouring pieces always meet; gentle bumps inside.
    return .1 * math.sin(math.pi * u) * math.sin(math.pi * v) * math.sin(9 * u + 6 * v)


def filled(mask, u, v, gx, gy):
    """u, v in [0, 1] inside a tile; corners are blended smoothly so edges curve like hand-drawn terrain."""
    tl, tr, bl, br = (mask & 1) > 0, (mask & 2) > 0, (mask & 4) > 0, (mask & 8) > 0
    value = tl * (1 - u) * (1 - v) + tr * u * (1 - v) + bl * (1 - u) * v + br * u * v
    return value + wobble(u, v) > .5


def shape(mask):
    grid = [[filled(mask, (x + .5) / ART, (y + .5) / ART, x, y) for x in range(ART)] for y in range(ART)]
    return grid


def sheet(paint):
    img = Image.new('RGBA', (ART * 4, ART * 4), (0, 0, 0, 0))
    px = img.load()
    for r in range(4):
        for c in range(4):
            mask = MASK_AT[r][c]
            if not mask:
                continue
            g = shape(mask)
            for y in range(ART):
                for x in range(ART):
                    if g[y][x]:
                        color = paint(mask, g, x, y)
                        if color:
                            px[c * ART + x, r * ART + y] = color
    return img.resize((ART * 4 * SCALE, ART * 4 * SCALE), Image.NEAREST)


def edge(g, x, y, dx, dy):
    nx, ny = x + dx, y + dy
    return 0 <= nx < ART and 0 <= ny < ART and not g[ny][nx]


rnd = random.Random(3)
NOISE = [[rnd.random() for _ in range(ART * 4)] for _ in range(ART * 4)]


def grass(mask, g, x, y):
    if edge(g, x, y, 0, 1) or edge(g, x, y, 0, -1) or edge(g, x, y, 1, 0) or edge(g, x, y, -1, 0):
        return (38, 64, 27, 255)
    if edge(g, x, y, 0, 2) or edge(g, x, y, 0, 3):
        return (77, 122, 44, 255)       # lip shadow above a drop
    if edge(g, x, y, 0, -2) or edge(g, x, y, -2, 0):
        return (163, 206, 96, 255)      # lit rim on the upper-left
    n = NOISE[y][x]
    return (124, 178, 72, 255) if n < .55 else (110, 162, 62, 255) if n < .85 else (146, 196, 84, 255)


COLS = []
x = 0
while x < ART:
    w = rnd.randint(4, 7)
    COLS.append((x, min(w, ART - x)))
    x += w


def wall(mask, g, x, y):
    if edge(g, x, y, 1, 0) or edge(g, x, y, -1, 0) or edge(g, x, y, 0, 1):
        return (52, 34, 24, 255)
    col = next(i for i, (cx, w) in enumerate(COLS) if cx <= x < cx + w)
    cx, w = COLS[col]
    base = [(140, 94, 56), (126, 83, 49), (152, 104, 62), (117, 76, 45)][col % 4]
    if x == cx:
        return (52, 34, 24, 255)
    t = (x - cx) / max(1, w - 1)
    shade = 1.15 - .45 * t
    if (y + col * 7) % 23 == 0:
        return (52, 34, 24, 255)
    if edge(g, x, y, 0, 2):
        shade *= .72
    return tuple(min(255, int(v * shade)) for v in base) + (255,)


def template(mask, g, x, y):
    return (255, 255, 255, 255)


def near_edge(g, x, y, r):
    return any(edge(g, x, y, dx, dy) for dx in range(-r, r + 1) for dy in range(-r, r + 1) if abs(dx) + abs(dy) == r)


def flat(colors, rim, outline):
    def paint(mask, g, x, y):
        if near_edge(g, x, y, 1):
            return outline
        if near_edge(g, x, y, 2):
            return rim
        n = NOISE[y][x]
        return colors[0] if n < .6 else colors[1] if n < .9 else colors[2]
    return paint


sand = flat([(222, 196, 136, 255), (212, 184, 124, 255), (236, 214, 160, 255)], (196, 168, 110, 255), (150, 120, 72, 255))
dirt = flat([(184, 146, 96, 255), (172, 134, 86, 255), (198, 162, 110, 255)], (146, 110, 68, 255), (104, 80, 50, 255))
water = flat([(52, 160, 170, 255), (46, 148, 160, 255), (84, 186, 192, 255)], (150, 222, 220, 255), (240, 250, 246, 255))

tpl = sheet(template)
bg = Image.new('RGBA', tpl.size, (255, 0, 255, 255))
bg.alpha_composite(tpl)
px = bg.load()
for i in range(0, bg.size[0], 256):       # thin cell borders
    for j in range(bg.size[1]):
        px[i, j] = (0, 0, 0, 255)
        px[j, i] = (0, 0, 0, 255)
bg.convert('RGB').save('art/sprites/terrain/dual-grid/dual-grid-template.png')
import os
for name, painter in (('plateau-top', grass), ('cliff-wall', wall)):
    if not os.path.exists(f'art/sprites/terrain/dual-grid/{name}-source.png'):
        sheet(painter).save(f'assets/ground/dual/{name}.png')
for name, painter in (('sand', sand), ('dirt-path', dirt), ('water', water)):
    sheet(painter).save(f'assets/ground/dual/{name}.png')
