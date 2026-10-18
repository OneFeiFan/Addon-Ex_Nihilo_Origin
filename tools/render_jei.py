# 指导书的"配方图"（类似 PC 版 JEI 模组的配方列表）：python tools/render_jei.py（需要 Python 3 + Pillow）
# 把筛子掉落、锤子转换、钩子掉落、木桶堆肥 / 桶内配方、坩埚、熔炉这些"一个容器对应很多配方"的信息画成图：
# 原料图标 → 机器 → 产物图标，图标角上标数量，下方标概率。数据直接从 scripts/data/*.ts 读取（筛子、锤子、堆肥、熔炉），与游戏里一致。
# 输出：res/textures/ui/eno_guide/jei_<名字>.png（288×288，指导书里按 144×144 显示）。
import os, re, sys, importlib.util
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('render_guide', os.path.join(HERE, 'render_guide.py'))
G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)
ROOT, OUT = G.ROOT, G.OUT
S = 288                      # 配方图边长（显示时缩到一半）
INK = (64, 52, 40, 255)
read = lambda rel: open(os.path.join(ROOT, rel), encoding='utf8').read()

# ---------- 小号像素字体（只有数字和几个符号，够标数量 / 概率）----------
GLYPH = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['111', '001', '111', '100', '111'],
    '3': ['111', '001', '111', '001', '111'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'], '8': ['111', '101', '111', '101', '111'],
    '9': ['111', '101', '111', '001', '111'], '%': ['101', '001', '010', '100', '101'], '-': ['000', '000', '111', '000', '000'],
    '.': ['000', '000', '000', '000', '010'], 'x': ['000', '101', '010', '101', '000'], '+': ['000', '010', '111', '010', '000'],
    '/': ['001', '001', '010', '100', '100'], ' ': ['000', '000', '000', '000', '000'],
}
def text(img, s, x, y, scale=2, color=INK, center=False, shadow=None):
    w = len(s) * 4 * scale - scale
    if center: x -= w // 2
    d = ImageDraw.Draw(img)
    for i, ch in enumerate(s):
        g = GLYPH.get(ch, GLYPH[' '])
        for r, row in enumerate(g):
            for c, bit in enumerate(row):
                if bit == '1':
                    px, py = x + (i * 4 + c) * scale, y + r * scale
                    if shadow: d.rectangle([px + scale, py + scale, px + 2 * scale - 1, py + 2 * scale - 1], fill=shadow)
                    d.rectangle([px, py, px + scale - 1, py + scale - 1], fill=color)

# ---------- 图标：本模组物品 / 方块、原版物品 / 方块 ----------
ITEM_ICON = dict(re.findall(r"(?:item|food|hammer|crook|mesh)\('(eno:[a-z0-9_]+)', '([a-z0-9_]+)'", read('src-build/content/items.ts')))
BLOCK_TEX = {}
for m in re.finditer(r"block\('(eno:[a-z0-9_]+)', ('[^']+'|\[[^\]]+\])", read('src-build/content/blocks.ts')):
    BLOCK_TEX[m.group(1)] = re.findall(r"'([^']+)'", m.group(2))
VAN_ITEM = {
    'flint': 'flint', 'coal': 'coal', 'diamond': 'diamond', 'emerald': 'emerald', 'lapis_lazuli': 'dye_powder_blue', 'redstone': 'redstone_dust',
    'gunpowder': 'gunpowder', 'glowstone_dust': 'glowstone_dust', 'blaze_powder': 'blaze_powder', 'bone_meal': 'dye_powder_white', 'quartz': 'quartz',
    'nether_wart': 'nether_wart', 'ghast_tear': 'ghast_tear', 'cocoa_beans': 'dye_powder_brown', 'wheat_seeds': 'seeds_wheat', 'pumpkin_seeds': 'seeds_pumpkin',
    'melon_seeds': 'seeds_melon', 'iron_ingot': 'iron_ingot', 'gold_ingot': 'gold_ingot', 'clay_ball': 'clay_ball', 'slime_ball': 'slimeball',
    'milk_bucket': 'bucket_milk', 'water_bucket': 'bucket_water', 'lava_bucket': 'bucket_lava', 'bucket': 'bucket_empty', 'rotten_flesh': 'rotten_flesh',
    'spider_eye': 'spider_eye', 'wheat': 'wheat', 'pumpkin_pie': 'pumpkin_pie', 'egg': 'egg', 'porkchop': 'porkchop_raw', 'beef': 'beef_raw',
    'cooked_beef': 'beef_cooked', 'chicken': 'chicken_raw', 'cooked_chicken': 'chicken_cooked', 'cod': 'fish_raw', 'cooked_cod': 'fish_cooked',
    'apple': 'apple', 'golden_apple': 'apple_golden', 'melon_slice': 'melon', 'carrot': 'carrot', 'potato': 'potato', 'baked_potato': 'potato_baked',
    'poisonous_potato': 'potato_poisonous', 'salmon': 'fish_salmon_raw', 'cooked_salmon': 'fish_salmon_cooked', 'tropical_fish': 'fish_clownfish_raw',
    'pufferfish': 'fish_pufferfish_raw', 'mutton': 'mutton_raw', 'cooked_mutton': 'mutton_cooked', 'rabbit': 'rabbit_raw', 'cooked_rabbit': 'rabbit_cooked',
    'string': 'string', 'sugar_cane': 'reeds', 'bamboo': 'bamboo', 'kelp': 'kelp', 'sea_pickle': 'sea_pickle', 'glowstone': 'glowstone_dust',
    'iron_block': 'iron_ingot', 'stick': 'stick', 'copper_ingot': 'copper_ingot', 'ender_pearl': 'ender_pearl',
}
VAN_FLAT_BLOCK = {   # 植物类：画成平面贴图
    'dandelion': ('flower_dandelion', None), 'poppy': ('flower_rose', None), 'blue_orchid': ('flower_blue_orchid', None), 'allium': ('flower_allium', None),
    'azure_bluet': ('flower_houstonia', None), 'red_tulip': ('flower_tulip_red', None), 'orange_tulip': ('flower_tulip_orange', None),
    'white_tulip': ('flower_tulip_white', None), 'pink_tulip': ('flower_tulip_pink', None), 'oxeye_daisy': ('flower_oxeye_daisy', None),
    'sunflower': ('double_plant_sunflower_front', None), 'lilac': ('double_plant_syringa_top', None), 'tall_grass': ('double_plant_grass_top', G.FOLIAGE),
    'large_fern': ('double_plant_fern_top', G.FOLIAGE), 'rose_bush': ('double_plant_rose_top', None), 'peony': ('double_plant_paeonia_top', None),
    'brown_mushroom': ('mushroom_brown', None), 'red_mushroom': ('mushroom_red', None), 'waterlily': ('waterlily', (32, 128, 48)), 'vine': ('vine', G.FOLIAGE),
    'oak_sapling': ('sapling_oak', None), 'spruce_sapling': ('sapling_spruce', None), 'birch_sapling': ('sapling_birch', None),
    'jungle_sapling': ('sapling_jungle', None), 'acacia_sapling': ('sapling_acacia', None), 'dark_oak_sapling': ('sapling_roofed_oak', None),
    'torch': ('torch_on', None), 'fire': ('fire_0', None),
}
VAN_CUBE = {
    'dirt': 'dirt', 'gravel': 'gravel', 'sand': 'sand', 'red_sand': 'red_sand', 'soul_sand': 'soul_sand', 'cobblestone': 'cobblestone', 'stone': 'stone',
    'clay': 'clay', 'obsidian': 'obsidian', 'netherrack': 'netherrack', 'end_stone': 'end_stone', 'ice': 'ice', 'mycelium': ('mycelium_top', 'mycelium_side'),
    'oak_log': ('log_oak_top', 'log_oak'), 'spruce_log': ('log_spruce_top', 'log_spruce'), 'birch_log': ('log_birch_top', 'log_birch'),
    'jungle_log': ('log_jungle_top', 'log_jungle'), 'acacia_log': ('log_acacia_top', 'log_acacia'), 'dark_oak_log': ('log_big_oak_top', 'log_big_oak'),
    'cactus': ('cactus_top', 'cactus_side'), 'melon_block': ('melon_top', 'melon_side'), 'pumpkin': ('pumpkin_top', 'pumpkin_face_off'),
    'oak_leaves': 'leaves_oak_carried', 'spruce_leaves': 'leaves_spruce_carried', 'birch_leaves': 'leaves_birch_carried', 'jungle_leaves': 'leaves_jungle_carried',
    'acacia_leaves': 'leaves_acacia_carried', 'dark_oak_leaves': 'leaves_big_oak_carried', 'gold_block': 'gold_block', 'iron_block': 'iron_block',
    'lava': 'lava_still', 'flowing_lava': 'lava_flow', 'ancient_debris': ('ancient_debris_top', 'ancient_debris_side'),
}
UI = lambda n: Image.open(os.path.join(OUT, n + '.png')).convert('RGBA')
ALIAS = {   # 没有普通物品图标的：蚕是动态图标物品，坩埚是模型方块
    'eno:silk_worm': lambda: G.mod('items/eno/eno_enr_silkworm_0'),
    'eno:crucible': lambda: UI('crucible'), 'eno:crucible_raw': lambda: UI('crucible'),
    'eno:ore_salts_iron': lambda: UI('crystal_iron'), 'eno:ore_salts_copper': lambda: UI('crystal_copper'), 'eno:ore_salts_gold': lambda: UI('crystal_gold'),
}
_icons = {}
def cube_icon(up, side):
    s = G.Scene(k=1.15, cx=G.W / 2, cy=G.H / 2); s.add(G.cube({'up': up, 'south': side, 'east': side})); im = s.render(); return im.crop(im.getbbox())
def fit(img, size):
    """缩放到 size × size 以内（像素风格：整数倍放大用最近邻）"""
    k = size / max(img.width, img.height)
    return img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.NEAREST if k >= 1 else Image.LANCZOS)
def icon(i, size=32):
    key = (i, size)
    if key in _icons: return _icons[key]
    ns, name = i.split(':')
    img = None
    try:
        if i in ALIAS: img = ALIAS[i]()
        elif ns == 'eno' and i in ITEM_ICON: img = G.mod(f'items/eno/{ITEM_ICON[i]}')
        elif ns == 'eno' and i in BLOCK_TEX:
            t = BLOCK_TEX[i]; f = [G.mod(f'blocks/eno/{x}') for x in (t if len(t) == 6 else t * 6)]
            img = cube_icon(f[0], f[4])
        elif ns == 'eno': img = UI(name)
        elif name in VAN_ITEM: img = G.van(f'items/{VAN_ITEM[name]}')
        elif name in VAN_FLAT_BLOCK: n, tint = VAN_FLAT_BLOCK[name]; img = G.van(f'blocks/{n}', tint)
        elif name in VAN_CUBE:
            v = VAN_CUBE[name]; up, side = (v, v) if isinstance(v, str) else v
            img = cube_icon(G.van(f'blocks/{up}'), G.van(f'blocks/{side}'))
    except Exception as e:
        print('  图标失败', i, e)
    if img is None:
        print('  缺图标', i); img = Image.new('RGBA', (16, 16), (200, 60, 200, 255))
    _icons[key] = fit(img, size)
    return _icons[key]

def paste(canvas, img, cx, cy):
    canvas.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))
def slot(canvas, cx, cy, size=40):
    d = ImageDraw.Draw(canvas)
    d.rectangle([cx - size // 2, cy - size // 2, cx + size // 2 - 1, cy + size // 2 - 1], fill=(139, 139, 139, 255), outline=(55, 55, 55, 255))
    d.line([cx - size // 2, cy + size // 2 - 1, cx + size // 2 - 1, cy + size // 2 - 1], fill=(255, 255, 255, 255))
    d.line([cx + size // 2 - 1, cy - size // 2, cx + size // 2 - 1, cy + size // 2 - 1], fill=(255, 255, 255, 255))
def item_slot(canvas, i, cx, cy, count=None, chance=None, size=40):
    """一个带槽背景的物品：右下角数量（白字），下方概率"""
    slot(canvas, cx, cy, size); paste(canvas, icon(i, size - 8), cx, cy)
    # 数字用 3 倍像素字（指导书里按一半大小显示，2 倍时太小看不清）
    if count and count != '1': text(canvas, count, cx + size // 2 - (len(count) * 12 - 3), cy + size // 2 - 16, 3, (255, 255, 255, 255), shadow=(50, 50, 50, 255))
    if chance is not None: text(canvas, chance, cx, cy + size // 2 + 4, 3, center=True)
def arrow(canvas, x1, y, x2):
    G.draw_arrow(canvas, x1, y, x2, y, color=(110, 100, 90, 255))
def pct(c): return (f'{c:g}%' if c < 100 else '100%')

# ---------- 三种版式 ----------
def drops_sheet(name, input_id, machine_img, drops):
    """一种原料 → 机器 → 多种掉落（概率、数量）：上方表头，下面 4 列网格"""
    c = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    item_slot(c, input_id, 70, 30, size=44); arrow(c, 100, 30, 136); paste(c, fit(machine_img, 52), 168, 30); arrow(c, 198, 30, 232)
    drops = sorted(drops, key=lambda d: -d[3])          # 概率高的排前面
    cols, cw = (4, 70) if len(drops) <= 12 else (5, 56)  # 超过 12 种时改 5 列，保证 3 行放得下
    top, rh = 80, 64
    for k, (it, lo, hi, ch) in enumerate(drops):
        cx, cy = (39 if cols == 4 else 32) + (k % cols) * cw, top + (k // cols) * rh
        item_slot(c, it, cx, cy, size=38, count=None if lo == hi == 1 else (str(lo) if lo == hi else f'{lo}-{hi}'), chance=pct(ch))
    c.save(os.path.join(OUT, f'jei_{name}.png')); return name
def rows_sheet(name, rows):
    """多行"原料（+ 原料）→ 机器 → 产物"：rows = [([(id, 数量)...], 机器图, [(id, 数量, 概率)...])]，每张最多 5 行"""
    c = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    for r, (ins, mach, outs) in enumerate(rows):
        cy = 28 + r * 58; x = 24
        for j, (it, n) in enumerate(ins):
            if j: text(c, '+', x - 4, cy - 7, 3, center=True)
            item_slot(c, it, x, cy, count=n); x += 48
        if mach is not None:
            arrow(c, x - 18, cy, x + 4); paste(c, fit(mach, 34), x + 24, cy); x += 52
        arrow(c, x - 18, cy, x + 6); x += 30
        for it, n, ch in outs:
            item_slot(c, it, x, cy, count=n, chance=ch); x += 46
    c.save(os.path.join(OUT, f'jei_{name}.png')); return name
def grid_sheet(name, items, head=None):
    """很多物品的网格（木桶堆肥）：每格图标 + 下方标注"""
    c = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    top = 4
    if head is not None: paste(c, fit(head, 44), S // 2, 26); top = 58
    for k, (it, label) in enumerate(items):
        cx, cy = 26 + (k % 6) * 47, top + 20 + (k // 6) * 56
        item_slot(c, it, cx, cy, size=36, chance=label)
    c.save(os.path.join(OUT, f'jei_{name}.png')); return name

# ======================== 数据与各张配方图 ========================
def sieve_data():
    d = {}
    for m in re.finditer(r"addSieved\('([^']+)', '([^']+)', (\d+), (\d+), ([\d.]+)\)", read('scripts/data/sieve.ts')):
        d.setdefault(m.group(1), []).append((m.group(2), int(m.group(3)), int(m.group(4)), float(m.group(5))))
    return d
def main():
    made = []
    sv = sieve_data(); sieve, heavy = UI('sieve'), UI('heavysieve')
    for inp, nm in (('minecraft:dirt', 'sieve_dirt'), ('minecraft:gravel', 'sieve_gravel'), ('minecraft:sand', 'sieve_sand'), ('eno:dust', 'sieve_dust'),
                    ('minecraft:soul_sand', 'sieve_soul_sand'), ('eno:gravel_nether', 'sieve_nether'), ('eno:gravel_ender', 'sieve_ender')):
        made.append(drops_sheet(nm, inp, sieve, sv[inp][:15]))
    # 重型筛：压缩方块，每次相当于普通筛 6 次（这里列压缩泥土、压缩沙砾作代表）
    made.append(drops_sheet('heavy_dirt', 'eno:compressed_dirt', heavy, sv['eno:compressed_dirt'][:15]))
    made.append(drops_sheet('heavy_gravel', 'eno:compressed_gravel', heavy, sv['eno:compressed_gravel'][:15]))
    # 锤子
    ham = G.mod('items/eno/eno_enr_hammers_stone_0')
    t = read('scripts/data/tools.ts')
    rules = [(a, b, c.strip("'")) for a, b, c in re.findall(r"transformation\('([^']+)', '([^']+)', ([^)]+)\)", t)]
    basic = [r for r in rules if r[2] != 'ore' and 'compressed' not in r[0] and not r[0].endswith('_log')]
    logs = [r for r in rules if r[0].endswith('_log')][:1]
    comp = [r for r in rules if 'compressed' in r[0]]
    ores = [r for r in rules if r[2] == 'ore']
    made.append(rows_sheet('hammer_basic', [([(a, None)], ham, [(b, None if c == '1' else c, None)]) for a, b, c in basic + logs]))
    made.append(rows_sheet('hammer_compressed', [([(a, None)], ham, [(b, c, None)]) for a, b, c in comp]))
    made.append(rows_sheet('hammer_ore', [([(a, None)], ham, [(b, '4-7', None)]) for a, b, c in ores if a.startswith(('eno:iron', 'eno:copper', 'eno:gold'))][:5]))
    # 钩子：每种钩子挖橡树叶 / 云杉 / 丛林
    crooks = [('eno:crook_wood', 12, 6, 2), ('eno:crook_gold', 20, 14, 10), ('eno:crook_hay', 15, 9, 5)]
    made.append(rows_sheet('crook_oak', [([(ck, None), ('minecraft:oak_leaves', None)], None, [('minecraft:oak_sapling', None, pct(s)), ('minecraft:apple', None, pct(a)), ('eno:silk_worm', None, pct(w))]) for ck, s, a, w in crooks] +
                           [([('eno:crook_wood', None), ('minecraft:jungle_leaves', None)], None, [('minecraft:jungle_sapling', None, '12%'), ('minecraft:vine', None, '1%'), ('eno:silk_worm', None, '2%')])]))
    # 木桶：堆肥（标"装满需要几个"）
    comp_items = []
    b = read('scripts/data/barrel.ts')
    for w in ('oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak'): comp_items.append((f'minecraft:{w}_sapling', 125))
    for w in ('oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak'): comp_items.append((f'minecraft:{w}_leaves', 125))
    comp_items += [(i, float(v)) for i, v, _ in re.findall(r"compost\('([^']+)', ([\d.]+), (\d+)\)", b)]
    need = lambda v: str(int(-(-1000 // v)))
    labelled = [(i, 'x' + need(v)) for i, v in comp_items]
    for k in range(0, len(labelled), 30): made.append(grid_sheet(f'compost_{k // 30 + 1}', labelled[k:k + 30]))   # 每张 6 × 5
    # 木桶：桶内配方
    W_, L_, WW = UI('barrel_water'), UI('crucible_lava'), UI('barrel_witch')
    made.append(rows_sheet('barrel_liquid', [
        ([('minecraft:water_bucket', None), ('eno:dust', None)], UI('barrel_water'), [('minecraft:clay', None, None)]),
        ([('minecraft:water_bucket', None), ('minecraft:milk_bucket', None)], UI('barrel_water'), [('minecraft:slime_ball', '2', None)]),
        ([('minecraft:lava_bucket', None), ('minecraft:redstone', None)], UI('barrel'), [('minecraft:netherrack', None, None)]),
        ([('minecraft:lava_bucket', None), ('minecraft:glowstone_dust', None)], UI('barrel'), [('minecraft:end_stone', None, None)]),
        ([('minecraft:lava_bucket', None), ('minecraft:water_bucket', None)], UI('barrel'), [('minecraft:obsidian', None, None)]),
    ]))
    made.append(rows_sheet('barrel_witch', [
        ([('minecraft:water_bucket', None), ('minecraft:mycelium', None)], UI('barrel_water'), [('eno:barrel_witch', None, None)]),
        ([('eno:barrel_witch', None), ('minecraft:sand', None)], UI('barrel_witch'), [('minecraft:soul_sand', None, None)]),
    ]))
    # 坩埚：熔化（4 块 → 1 桶岩浆）、热源；木坩埚
    made.append(rows_sheet('crucible', [
        ([('minecraft:cobblestone', '4')], UI('crucible'), [('minecraft:lava_bucket', None, None)]),
        ([('minecraft:stone', '4')], UI('crucible'), [('minecraft:lava_bucket', None, None)]),
        ([('minecraft:gravel', '4')], UI('crucible'), [('minecraft:lava_bucket', None, None)]),
    ]))
    made.append(rows_sheet('crucible_heat', [([(h, None)], None, [('eno:crucible_lava', None, v)]) for h, v in
                                             (('minecraft:torch', 'x1'), ('minecraft:fire', 'x1.5'), ('minecraft:lava', 'x2.5'), ('minecraft:flowing_lava', 'x3'))]))
    made.append(rows_sheet('oak_crucible', [
        ([('minecraft:oak_sapling', '8')], UI('oak_crucible'), [('minecraft:water_bucket', None, None)]),
        ([('minecraft:oak_leaves', '4')], UI('oak_crucible'), [('minecraft:water_bucket', None, None)]),
    ]))
    # 熔炉（本模组的熔炉配方）
    fur = UI('furnace')
    sm = re.findall(r"modSmelt\('([^']+)', '([^']+)'(?:, (\d+))?\)", read('scripts/data/furnace.ts'))
    row = lambda a, b, n: ([(a, None)], fur, [(b, n if n and n != '1' else None, None)])
    made.append(rows_sheet('smelt_ore', [row(a, b, n) for a, b, n in sm if a in ('eno:iron_gravel', 'eno:copper_gravel', 'eno:gold_gravel', 'eno:copper_sand', 'eno:iron_dust')]))
    made.append(rows_sheet('smelt_other', [row(a, b, n) for a, b, n in sm if a in ('eno:ore_salts_iron', 'eno:ore_salts_copper', 'eno:dust_saw', 'eno:silk_worm', 'eno:crucible_raw')]))
    # 盐：粗盐 → 卤水 → 加灰烬沉淀 → 粉盐 → 矿盐晶体 → 8 个锭
    made.append(rows_sheet('salt', [
        ([('minecraft:water_bucket', None), ('eno:salt_crude', '4')], UI('barrel_water'), [('eno:barrel_brine', None, None)]),
        ([('eno:barrel_brine', None), ('eno:ash', None)], None, [('eno:iron_dust_salts', '1-2', '37%'), ('eno:copper_dust_salts', '1-2', '44%'), ('eno:gold_dust_salts', None, '17%')]),
        ([('eno:iron_dust_salts', '9')], None, [('eno:ore_salts_iron', None, None)]),
        ([('eno:ore_salts_iron', None)], fur, [('minecraft:iron_ingot', '8', None)]),
    ]))
    print('[jei] 生成', len(made), '张配方图')

if __name__ == '__main__':
    main()
