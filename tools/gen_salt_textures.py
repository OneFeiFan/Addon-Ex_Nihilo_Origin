# 盐系列贴图生成器（可选工具，需要 Python 3 + Pillow）：python tools/gen_salt_textures.py
# 设计原则（向原版物品贴图看齐）：
#   · 16×16；每种颜色只用 5 个色阶（高光 / 亮 / 中 / 暗 / 轮廓），光从左上来
#   · 轮廓用同色相的深色（不用纯黑）；不撒单像素随机噪点，细节用小块表达
#   · 形状一眼可辨：粗盐 = 几块立方体的岩盐（食盐晶体本来就是立方体，带一点土黄色杂质）；
#     粉盐 = 斜向的晶体碎片（干净、无杂质，颜色与对应的矿盐晶体一致）
#   · 配色沿用原模组（铁红、铜绿、金黄……）；曾比较过"按真实金属盐的颜色"和"晶簇形的粉盐"两套方案，作者选了现在这套
import os, random
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ITEMS, BLOCKS = os.path.join(ROOT, 'res/textures/items/eno'), os.path.join(ROOT, 'res/textures/blocks/eno')
BARREL = os.path.join(ROOT, 'res/textures/entity/eno/barrel')
clamp = lambda v: max(0, min(255, int(round(v))))
mix = lambda a, b, t: tuple(clamp(x + (y - x) * t) for x, y in zip(a, b))
shade = lambda c, k: tuple(clamp(x * k) for x in c)
WHITE = (255, 255, 255)
def ramp(base):
    """5 个色阶：0 高光、1 亮、2 中、3 暗、4 轮廓"""
    return [mix(base, WHITE, 0.62), mix(base, WHITE, 0.25), base, shade(base, 0.72), shade(base, 0.48)]

METALS = {   # 粉盐物品贴图、矿盐晶体贴图、基色——取自原模组矿盐晶体贴图中心区域的颜色，保证粉盐和晶体同色（铁红、铜绿、金黄……）
    'iron': ('eno_ex_irondustsalts_0', 'eno_ore_salts_Iron_0', (173, 14, 0)),
    'copper': ('eno_ex_copperdustsalts_0', 'eno_ore_salts_copper_0', (110, 167, 119)),
    'gold': ('eno_ex_golddustsalts_0', 'eno_ore_salts_gold_0', (254, 223, 29)),
    'nickel': ('eno_ex_nickeldustsalts_0', 'eno_ore_salts_nickel_0', (190, 181, 121)),
    'platinum': ('eno_ex_platinumdustsalts_0', 'eno_ore_salts_platinum_0', (60, 115, 255)),
    'tin': ('eno_ex_tindustsalts_0', 'eno_ore_salts_tin_0', (98, 127, 127)),
    'lead': ('eno_ex_leaddustsalts_0', 'eno_ore_salts_lead_0', (113, 104, 151)),
    'silver': ('eno_ex_silverdustsalts_0', 'eno_ore_salts_silver_0', (167, 217, 229)),
}

def finish(grid, pal):
    """grid：每格 -1 透明，0–3 色阶；自动在外缘描一圈色阶 4（轮廓）"""
    img = Image.new('RGBA', (16, 16)); px = img.load()
    for y in range(16):
        for x in range(16):
            v = grid[y][x]
            if v >= 0: px[x, y] = pal[v] + (255,)
            elif any(0 <= x + dx < 16 and 0 <= y + dy < 16 and grid[y + dy][x + dx] >= 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = pal[4] + (255,)
    return img

# ---------- 粗盐：三块等轴立方体的岩盐 ----------
# 三个面的明暗差要拉开（顶面最亮、左面中、右面暗），面与面之间的棱用色阶区分，小尺寸下也能看出是立方体
def iso_cube(grid, cx, ty, a, b):
    """等轴立方体：顶面是 2:1 菱形（半宽 a 像素），侧面高 b 像素。色阶：0 顶面棱上的高光、1 顶面、2 左面、3 右面"""
    for y in range(16):
        for x in range(16):
            dx = x + 0.5 - cx; dy = y + 0.5 - ty - a / 2
            top = abs(dx) / a + abs(dy) / (a / 2) <= 1
            side = abs(dx) < a and dy > 0 and (dy <= b or abs(dx) / a + abs(dy - b) / (a / 2) <= 1)
            if top:
                edge = abs(dx) / a + abs(dy) / (a / 2) > 0.62
                grid[y][x] = 0 if (edge and dx < 0 and dy < 0.5) else 1
            elif side:
                grid[y][x] = 2 if dx < 0 else 3
def crude_salt():
    grid = [[-1] * 16 for _ in range(16)]
    iso_cube(grid, 11.0, 1, 4.0, 3)        # 后面一块
    iso_cube(grid, 6.0, 3, 5.0, 5)         # 前面一块大的
    iso_cube(grid, 12.0, 8, 3.0, 3)        # 右前一块小的
    pal = [(252, 252, 248), (236, 234, 226), (196, 192, 182), (150, 146, 138), (96, 92, 86)]
    img = finish(grid, pal); px = img.load()
    IMP = (170, 142, 104)
    for (x, y) in [(3, 11), (4, 12), (9, 13), (13, 13), (7, 6)]:   # 零星几处土黄色杂质
        if px[x, y][3] and px[x, y][:3] != pal[4]: px[x, y] = IMP + (255,)
    img.save(os.path.join(ITEMS, 'eno_salt_crude.png'))

# ---------- 粉盐：两枚斜向的晶体碎片（参考原版紫水晶碎片的形状语言） ----------
# 逐行画出 45° 的晶体：每一行的像素从左到右依次是 高光 → 亮面 → 棱 → 暗面，所以高光和暗面各连成一条斜线，
# 读起来就是有棱有面的晶体；尖端收成一个像素，底端是平的断口
SHADES = {1: [0], 2: [0, 3], 3: [0, 1, 3], 4: [0, 1, 2, 3], 5: [0, 1, 1, 2, 3], 6: [0, 1, 1, 2, 3, 3]}
def diag_shard(grid, rows):
    """rows：[(y, 起始列, 宽度)]"""
    for y, x0, w in rows:
        for k, v in enumerate(SHADES[w]):
            if 0 <= x0 + k < 16: grid[y][x0 + k] = v
def dust_salt(base, name):
    grid = [[-1] * 16 for _ in range(16)]
    main = {1: 1, 2: 2, 3: 3, 4: 4, 13: 4, 14: 3}
    diag_shard(grid, [(y, 12 - y, main.get(y, 5)) for y in range(1, 15)])           # 主碎片：右上是尖，左下是断口
    small = {8: 1, 9: 2, 10: 3, 14: 3}
    diag_shard(grid, [(y, 21 - y, small.get(y, 4)) for y in range(8, 15)])          # 右下一枚小碎片
    finish(grid, ramp(base)).save(os.path.join(ITEMS, name + '.png'))

# 矿盐晶体方块：沿用原模组的贴图（res/textures/blocks/eno/eno_ore_salts_*_0.png，中心亮、四周暗的渐变），本工具不生成

# ---------- 木桶里盐反应的过程（液面贴图） ----------
# 不用散落的斑点，改用大块、低对比的形状：
#   放粗盐：水面中央浮起一片像浮冰一样的盐壳，每放一个就长大一圈（同一片在长，不是新冒出来的点）
#   溶解：盐壳先裂成几块，碎块从边缘慢慢化掉、颜色也越来越透，同时水逐渐变成浑浊的卤水
#   加灰烬后：卤水里慢慢泛起一团团白色的絮状物，越来越浓
#   反应结束：沉在桶里的一层灰白色结晶（中性的颜色——沉淀出哪几种粉盐是随机的，所以不用彩色暗示）
def value_noise(seed, cells=4):
    """可平铺的平滑噪声，取值 0–1（每 16/cells 像素一个随机格点，双线性插值）"""
    r = random.Random(seed); g = [[r.random() for _ in range(cells)] for _ in range(cells)]
    out = [[0.0] * 16 for _ in range(16)]; step = 16 / cells
    for y in range(16):
        for x in range(16):
            fx, fy = x / step, y / step; x0, y0 = int(fx) % cells, int(fy) % cells; x1, y1 = (x0 + 1) % cells, (y0 + 1) % cells
            tx, ty = fx - int(fx), fy - int(fy); tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
            a = g[y0][x0] + (g[y0][x1] - g[y0][x0]) * tx; b = g[y1][x0] + (g[y1][x1] - g[y1][x0]) * tx
            out[y][x] = a + (b - a) * ty
    return out
ICE = [(236, 243, 248), (220, 231, 241), (198, 214, 230), (168, 188, 212)]   # 盐壳：中心、主体、边缘、裂缝
CLOUD = (226, 228, 226)
SEDIMENT = [(214, 211, 202), (204, 201, 192), (196, 193, 184), (224, 221, 213)]
def put(px, x, y, c, a=1.0):
    old = px[x, y][:3]; px[x, y] = mix(old, c, a) + (255,)
def barrel_textures():
    water = Image.open(os.path.join(BARREL, 'ex_water_0.png')).convert('RGBA')
    gray = water.convert('L').convert('RGBA')
    brine = Image.blend(gray, Image.new('RGBA', water.size, (176, 184, 190, 255)), 0.6)
    brine.save(os.path.join(BARREL, 'ex_brine.png'))
    n1 = value_noise(11)
    field = [[((x + 0.5 - 8) ** 2 + (y + 0.5 - 8) ** 2) ** 0.5 + (n1[y][x] - 0.5) * 3.0 for x in range(16)] for y in range(16)]   # 盐壳的"距离场"，带一点起伏
    radius = [2.6, 4.2, 5.6, 7.2]
    def crust(img, r, alpha=1.0, keep=None):
        px = img.load()
        for y in range(16):
            for x in range(16):
                f = field[y][x]
                if f >= r or (keep and not keep(x, y)): continue
                c = ICE[0] if f < r * 0.45 else ICE[1] if f < r - 1.1 else ICE[2]
                if (x + y) % 7 == 0 and f < r - 1.1: c = mix(c, WHITE, 0.4)       # 淡淡的斜向反光，像冰面
                put(px, x, y, c, alpha)
        return img
    for n in range(1, 5): crust(water.copy(), radius[n - 1]).save(os.path.join(BARREL, f'ex_salty_{n}.png'))
    # 溶解：盐壳按几个中心分成碎块，裂缝处先化开；碎块越来越小、越来越透
    seeds = [(5, 5), (11, 4), (12, 11), (5, 12), (8, 8)]
    def nearest2(x, y):
        d = sorted(((x + 0.5 - sx) ** 2 + (y + 0.5 - sy) ** 2) ** 0.5 for sx, sy in seeds); return d[0], d[1]
    for d in range(1, 7):
        base = Image.blend(water, brine, d / 6)
        shrink = [0.0, 0.8, 1.6, 2.4, 3.2, 99][d - 1]                         # 碎块从裂缝向内化掉的程度
        def keep(x, y, shrink=shrink):
            a, b = nearest2(x, y); return (b - a) > 0.9 + shrink and field[y][x] < radius[3] - shrink * 0.6
        crust(base, radius[3], alpha=max(0.0, 1 - d * 0.16), keep=keep).save(os.path.join(BARREL, f'ex_dissolve_{d}.png'))
    # 加灰烬：絮状物从噪声的高处慢慢泛起、连成片
    n2 = value_noise(23, cells=8)
    for k in range(1, 7):
        img = brine.copy(); px = img.load(); level = 1 - 0.14 * k            # 噪声高于 level 的地方出现絮状物，逐帧扩大
        for y in range(16):
            for x in range(16):
                v = n2[y][x]
                if v > level + 0.12: put(px, x, y, CLOUD, 0.8)              # 浓的絮团
                elif v > level: put(px, x, y, CLOUD, 0.4)                   # 絮团边缘的薄雾
        img.save(os.path.join(BARREL, f'ex_precip_{k}.png'))
    # 沉淀：灰白色的结晶层（大块、低对比，像原版方解石）
    n3 = value_noise(31, cells=8); img = Image.new('RGBA', (16, 16)); px = img.load()
    for y in range(16):
        for x in range(16):
            v = n3[y][x]; c = SEDIMENT[1] if v < 0.35 else SEDIMENT[0] if v < 0.7 else SEDIMENT[3]
            px[x, y] = c + (255,)
    img.save(os.path.join(BARREL, 'ex_sediment.png'))


if __name__ == '__main__':
    crude_salt()
    for name, (item, block, color) in METALS.items():
        dust_salt(color, item)
    barrel_textures()
    print('[salt] 粗盐、粉盐、矿盐晶体、木桶反应过程贴图已生成')
