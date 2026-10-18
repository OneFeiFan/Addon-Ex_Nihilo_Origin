# 指导书插图生成器（可选工具，需要 Python 3 + Pillow）：python tools/render_guide.py
# 把"步骤"画成物品栏风格的立体小场景，多帧的竖着拼成一张长图，指导书里按帧播放（JSON UI 的 flip_book 动画）。
# 输出：res/textures/ui/eno_guide/fig_<名字>.png（已随源码提交，改了贴图后重新运行即可）。
# 帧数、播放速度写在 scripts/data/guide.ts 的 fig(...) 调用里，两边要一致（本文件末尾 FIGS 的帧数）。
# 场景里用到的原版贴图从 Mojang 的 bedrock-samples 下载，缓存在 tools/vanilla/。
import math, os, urllib.request
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'res/textures/ui/eno_guide')
VAN = os.path.join(ROOT, 'tools/vanilla')
W, H = 192, 128          # 每帧大小（与 guide.ts 的 FIG_W / FIG_H 一致）
COS, SIN = math.cos(math.pi / 6), math.sin(math.pi / 6)

_cache = {}
def mod(rel):
    """本模组贴图：res/textures/<rel>.png"""
    if rel not in _cache: _cache[rel] = Image.open(os.path.join(ROOT, 'res/textures', rel + '.png')).convert('RGBA')
    return _cache[rel]
def van(rel, tint=None):
    """原版贴图：blocks/xxx、items/xxx（png 或 tga），没有就从 bedrock-samples 下载"""
    key = (rel, tint)
    if key in _cache: return _cache[key]
    name = os.path.basename(rel)
    path = next((os.path.join(VAN, name + e) for e in ('.png', '.tga') if os.path.exists(os.path.join(VAN, name + e))), None)
    if not path:
        for e in ('.png', '.tga'):
            try:
                urllib.request.urlretrieve(f'https://raw.githubusercontent.com/Mojang/bedrock-samples/main/resource_pack/textures/{rel}{e}', os.path.join(VAN, name + e))
                path = os.path.join(VAN, name + e); break
            except Exception: pass
    img = Image.open(path).convert('RGBA')
    if img.height > img.width: img = img.crop((0, 0, img.width, img.width))   # 动画贴图只取第一帧
    if tint:
        r, g, b, a = img.split()
        gray = Image.merge('RGB', (r, g, b)).convert('L')
        img = Image.merge('RGBA', [gray.point(lambda v, c=c: v * c // 255) for c in tint] + [a])
    _cache[key] = img
    return img
FOLIAGE, WATER = (72, 181, 24), (63, 118, 228)

# ---------- 等轴渲染（与 tools/render-icons.mjs 相同的投影：x 向右下、z 向左下、y 向上）----------
class Scene:
    def __init__(self, k=2.4, cx=W / 2, cy=None):
        # 默认：单个方块放大到约 77×77 像素，贴近画面底部，上方留出放"物品"的空间
        self.k, self.cx, self.cy = k, cx, (H - 16 * k - 5 if cy is None else cy)
        self.parts, self.sprites, self.arrows = [], [], []
    def proj(self, x, y, z):
        return ((x - z) * COS * self.k + self.cx, (x + z) * SIN * self.k - y * self.k + self.cy)
    def add(self, boxes, at=(0, 0, 0)):
        """boxes：[(x1,y1,z1,x2,y2,z2, {'up':tex,'south':tex,'east':tex})]，单位像素；at：放在第几格"""
        ox, oy, oz = (a * 16 for a in at)
        for (x1, y1, z1, x2, y2, z2, t) in boxes: self.parts.append(((x1 + ox, y1 + oy, z1 + oz, x2 + ox, y2 + oy, z2 + oz), t))
        return self
    def sprite(self, img, x, y, scale=2):
        self.sprites.append((img, x, y, scale)); return self
    def arrow(self, x1, y1, x2, y2):
        self.arrows.append((x1, y1, x2, y2)); return self
    def render(self):
        canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        parts = sorted(self.parts, key=lambda p: ((p[0][0] + p[0][3] + p[0][2] + p[0][5]), p[0][1]))
        for box, t in parts:
            x1, y1, z1, x2, y2, z2 = box
            faces = []
            if t.get('up'): faces.append((1.0, t['up'], (x1, y2, z1), (x2 - x1, 0, 0), (0, 0, z2 - z1), (x1 % 16 if x2 - x1 < 16 else 0, z1 % 16 if z2 - z1 < 16 else 0, (x2 - 1) % 16 + 1 if x2 - x1 < 16 else 16, (z2 - 1) % 16 + 1 if z2 - z1 < 16 else 16)))
            yy1, yy2 = y1 % 16, (y2 - 1e-6) % 16 + 1e-6
            if t.get('south'): faces.append((0.8, t['south'], (x1, y2, z2), (x2 - x1, 0, 0), (0, y1 - y2, 0), (x1 % 16, 16 - yy2, (x2 - 1e-6) % 16 + 1e-6, 16 - yy1)))
            if t.get('east'): faces.append((0.62, t['east'], (x2, y2, z2), (0, 0, z1 - z2), (0, y1 - y2, 0), (16 - ((z2 - 1e-6) % 16 + 1e-6), 16 - yy2, 16 - z1 % 16, 16 - yy1)))
            for shade, tex, O, A, B, uv in faces: self._face(canvas, shade, tex, O, A, B, uv)
        for (x1, y1, x2, y2) in self.arrows: draw_arrow(canvas, x1, y1, x2, y2)
        for img, x, y, s in self.sprites:
            im = img.resize((img.width * s, img.height * s), Image.NEAREST) if s != 1 else img
            canvas.alpha_composite(im, (int(x - im.width / 2), int(y - im.height / 2)))
        return canvas
    def _face(self, canvas, shade, tex, O, A, B, uv):
        o = self.proj(*O); pa = self.proj(O[0] + A[0], O[1] + A[1], O[2] + A[2]); pb = self.proj(O[0] + B[0], O[1] + B[1], O[2] + B[2])
        ax, ay, bx, by = pa[0] - o[0], pa[1] - o[1], pb[0] - o[0], pb[1] - o[1]
        det = ax * by - ay * bx
        if abs(det) < 1e-6: return
        i00, i01, i10, i11 = by / det, -bx / det, -ay / det, ax / det   # 屏幕 → (a, b)
        u0, v0, u1, v1 = uv; s = tex.width / 16
        du, dv = (u1 - u0) * s, (v1 - v0) * s
        # 屏幕 (X, Y) → 贴图 (u, v)：仿射
        coeffs = (du * i00, du * i01, u0 * s - du * (i00 * o[0] + i01 * o[1]), dv * i10, dv * i11, v0 * s - dv * (i10 * o[0] + i11 * o[1]))
        img = tex.transform((W, H), Image.AFFINE, coeffs, resample=Image.NEAREST)
        mask = Image.new('L', (W, H), 0)
        ImageDraw.Draw(mask).polygon([o, pa, (pa[0] + bx, pa[1] + by), pb], fill=255)
        alpha = img.split()[3].point(lambda v: 255 if v >= 128 else 0)
        mask = Image.composite(mask, Image.new('L', (W, H), 0), alpha)
        rgb = img.convert('RGB').point(lambda v: int(v * shade))
        canvas.paste(rgb, (0, 0), mask)

def draw_arrow(canvas, x1, y1, x2, y2, color=(70, 60, 50, 255)):
    d = ImageDraw.Draw(canvas)
    ang = math.atan2(y2 - y1, x2 - x1)
    d.line([(x1, y1), (x2 - 6 * math.cos(ang), y2 - 6 * math.sin(ang))], fill=color, width=4)
    h = [(x2, y2), (x2 - 10 * math.cos(ang - 0.6), y2 - 10 * math.sin(ang - 0.6)), (x2 - 10 * math.cos(ang + 0.6), y2 - 10 * math.sin(ang + 0.6))]
    d.polygon(h, fill=color)

def all3(t): return {'up': t, 'south': t, 'east': t}
def cube(t, y2=16): return [(0, 0, 0, 16, y2, 16, t if isinstance(t, dict) else all3(t))]
def mini(t, k=1.1):
    """小方块（当作"物品"画在场景上方）"""
    s = Scene(k=k, cx=W / 2, cy=H / 2); s.add(cube(t)); im = s.render(); return im.crop(im.getbbox())
TOP = 24   # 方块上方"物品"的高度

BARREL = [(2, 0, 2, 14, 1, 14), (1, 0, 1, 14, 16, 2), (1, 0, 2, 2, 16, 15), (14, 0, 1, 15, 16, 14), (2, 0, 14, 15, 16, 15)]
def barrel(content=None, level=0, t=None):
    t = t or mod('blocks/eno/eno_planks_oak_0')
    out = [b + (all3(t),) for b in BARREL]
    if content and level > 0: out.append((2, 1, 2, 14, 1 + 13.45 * level, 14, {'up': content}))
    return out
SIEVE = [(0, 8, 0, 16, 12, 1), (0, 8, 15, 16, 12, 16), (0, 8, 1, 1, 12, 15), (15, 8, 1, 16, 12, 15), (1, 0, 1, 2, 9, 2), (14, 0, 14, 15, 9, 15), (14, 0, 1, 15, 9, 2), (1, 0, 14, 2, 9, 15)]
def sieve(mesh=None, content=None, level=0):
    t = mod('blocks/eno/eno_planks_oak_0')
    out = [b + (all3(t),) for b in SIEVE]
    if mesh: out.append((1, 8.8, 1, 15, 9.6, 15, {'up': mesh}))
    if content and level > 0: out.append((1, 9.6, 1, 15, 9.6 + 5.4 * level, 15, all3(content)))
    return out
CRUC = [(0, 3, 0, 1, 16, 16), (15, 3, 0, 16, 16, 16), (1, 3, 0, 15, 16, 1), (1, 3, 15, 15, 16, 16), (0, 0, 0, 1, 3, 1), (0, 0, 15, 1, 3, 16), (15, 0, 0, 16, 3, 1), (15, 0, 15, 16, 3, 16), (1, 2, 1, 15, 4, 15)]
def crucible(t, layers=()):
    out = [b + (t,) for b in CRUC]
    for lo, hi, tex in layers:
        if hi > lo: out.append((1, 4 + 10.5 * lo, 1, 15, 4 + 10.5 * hi, 15, {'up': tex, 'south': tex, 'east': tex}))   # 装满时顶面 14.5 像素（与游戏里一致）
    return out

def strip(frames, name):
    img = Image.new('RGBA', (W, H * len(frames)), (0, 0, 0, 0))
    for i, f in enumerate(frames): img.alpha_composite(f, (0, i * H))
    img.save(os.path.join(OUT, f'fig_{name}.png'))
    print(f'fig_{name}: {len(frames)} 帧')
    return len(frames)

# ======================== 各张插图 ========================
# 每秒约 8 帧的平滑动画：动作用插值慢慢过渡，开头、结尾各停一会儿；每张不超过 24 帧（竖长图高度 ≤ 3072 像素）。
LEAVES = van('blocks/leaves_oak_carried')
lerp = lambda a, b, t: a + (b - a) * t
def fade(img, a):
    """整张图按透明度 a 淡出（用于方块被挖掉）"""
    r, g, b, al = img.split(); return Image.merge('RGBA', (r, g, b, al.point(lambda v: int(v * a))))
def over(*imgs):
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for im in imgs: out.alpha_composite(im)
    return out
def arc(p0, p1, t, h=18):
    """从 p0 抛到 p1 的弧线"""
    return (lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t) - h * 4 * t * (1 - t))

def fig_crook():
    crook = mod('items/eno/eno_enr_crook_0')
    leaves = lambda: Scene().add(cube(LEAVES)).render()
    up, down = (152, 30), (124, 58)
    drops = [van('blocks/sapling_oak'), van('items/apple'), mod('items/eno/eno_enr_silkworm_0')]
    ends = [(56, 92), (96, 104), (136, 92)]
    frames = []
    for _ in range(4): frames.append(over(leaves(), Scene().sprite(crook, *up, 3).render()))
    for t in (0.35, 0.7, 1.0): frames.append(over(leaves(), Scene().sprite(crook, lerp(up[0], down[0], t), lerp(up[1], down[1], t), 3).render()))
    for k, t in enumerate((0.15, 0.35, 0.55, 0.75, 0.9, 1.0)):
        s = Scene()
        for d, e in zip(drops, ends): s.sprite(d, *arc((96, 70), e, t, 26), 3)
        frames.append(over(fade(leaves(), max(0, 1 - (k + 1) / 3)), s.render()))
    for _ in range(7):
        s = Scene()
        for d, e in zip(drops, ends): s.sprite(d, *e, 3)
        frames.append(s.render())
    return strip(frames, 'crook')

def fig_compost():
    sap, apple = van('blocks/sapling_oak'), van('items/apple')
    comp = lambda step: mod(f'entity/eno/barrel/ex_1_{step}')
    frames, level = [], 0.0
    for item, target in ((sap, 0.35), (LEAVES, 0.7), (apple, 1.0)):
        for t in (0, 0.33, 0.66, 1.0):   # 物品落进桶里
            s = Scene().add(barrel(comp(0), level))
            if t < 1: s.sprite(item, 96, lerp(TOP, 66, t), 2)
            frames.append(s.render())
        for t in (0.5, 1.0):             # 液面上升
            frames.append(Scene().add(barrel(comp(0), lerp(level, target, t))).render())
        level = target
    for step in (15, 35, 55, 75, 100):   # 发酵：颜色渐变成泥土
        frames.append(Scene().add(barrel(comp(step), 1.0)).render())
    dirt = mini(van('blocks/dirt'))
    for t in (0.5, 1.0): frames.append(Scene().add(barrel()).sprite(dirt, 96, lerp(70, TOP, t), 1).render())
    for _ in range(2): frames.append(Scene().add(barrel()).sprite(dirt, 96, TOP, 1).render())
    return strip(frames, 'compost')

def fig_sieve():
    mesh_item = mod('items/eno/eno_ex_silkmesh_0'); mesh = mod('blocks/eno/eno_ex_sieveSilkMesh_0'); dirt = van('blocks/dirt')
    frames = []
    for t in (0, 0.5, 1.0): frames.append(Scene().add(sieve()).sprite(mesh_item, 96, lerp(TOP, 62, t), 2).render())
    dmini = mini(dirt)
    for t in (0, 0.5, 1.0): frames.append(Scene().add(sieve(mesh)).sprite(dmini, 96, lerp(TOP, 58, t), 1).render())
    for k in range(10): frames.append(Scene().add(sieve(mesh, dirt, 1.0 - k / 10)).render())   # 右键 14 次，料慢慢筛完
    drops = [mod('items/eno/eno_enr_stonesmall_0'), van('items/seeds_wheat'), mod('items/eno/eno_ex_seedsoak_0')]
    ends = [(56, 34), (96, 26), (136, 34)]
    for t in (0.3, 0.6, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0):
        s = Scene().add(sieve(mesh))
        for d, e in zip(drops, ends): s.sprite(d, *arc((96, 60), e, t, 16), 2)
        frames.append(s.render())
    return strip(frames, 'sieve')

def fig_hammer():
    ham = mod('items/eno/eno_enr_hammers_stone_0')
    chain = [van('blocks/cobblestone'), van('blocks/gravel'), van('blocks/sand'), mod('blocks/eno/eno_ex_dust_0')]
    up, down = (152, 32), (126, 56)
    frames = []
    for i in range(3):
        for _ in range(2): frames.append(Scene().add(cube(chain[i])).sprite(ham, *up, 3).render())
        for t in (0.5, 1.0): frames.append(Scene().add(cube(chain[i])).sprite(ham, lerp(up[0], down[0], t), lerp(up[1], down[1], t), 3).render())
        for _ in range(3): frames.append(Scene().add(cube(chain[i + 1])).sprite(ham, *up, 3).render())
    return strip(frames, 'hammer')

def fig_ore():
    s = Scene()
    s.sprite(mini(van('blocks/gravel'), 1.6), 28, 38, 1)
    s.arrow(52, 38, 70, 38)
    for j in range(4): s.sprite(mod('items/eno/eno_ex_ironbroken_0'), 84 + (j % 2) * 18, 29 + (j // 2) * 18, 1)
    s.arrow(114, 38, 132, 38)
    s.sprite(mini(mod('blocks/eno/eno_ex_Irongravel_0'), 1.6), 160, 38, 1)
    s.arrow(160, 64, 160, 78)
    s.sprite(mini({'up': mod('blocks/eno/eno_ex_furnace_top_0'), 'south': mod('blocks/eno/eno_ex_furnace_front_on_0'), 'east': mod('blocks/eno/eno_ex_furnace_side_0')}, 1.6), 160, 102, 1)
    s.arrow(134, 102, 114, 102)
    s.sprite(van('items/iron_ingot'), 92, 102, 2)
    return strip([s.render()], 'ore')

def fig_crucible():
    t = {'up': mod('blocks/eno/eno_enr_crucible_2'), 'south': mod('blocks/eno/eno_enr_crucible_1'), 'east': mod('blocks/eno/eno_enr_crucible_1')}
    cob, lava = van('blocks/cobblestone'), van('blocks/lava_still')
    frames = []
    for k in range(16):
        p = min(1, k / 12)                 # 熔化进度；最后几帧停住
        c = 0.9 * (1 - p); l = 0.9 * p     # 圆石层变薄、岩浆层变厚（岩浆在下、圆石浮在上面）
        layers = ([(0, l, lava)] if l > 0 else []) + ([(l, l + c, cob)] if c > 0.02 else [])
        s = Scene(k=2.1, cy=H - 16 * 2.1 - 30).add(crucible(t, layers))
        s.sprite(van('blocks/torch_on'), W / 2, H - 16, 2)
        frames.append(s.render())
    return strip(frames, 'crucible')

def fig_oak_crucible():
    t = all3(mod('blocks/eno/eno_log_oak_0'))
    water = van('blocks/water_still_grey', WATER)
    frames = []
    for k in range(16):
        p = min(1, k / 12)
        w, lf = 0.9 * p, 0.9 * (1 - p)
        layers = ([(0, w, water)] if w > 0 else []) + ([(w, w + lf, LEAVES)] if lf > 0.02 else [])
        frames.append(Scene().add(crucible(t, layers)).render())
    return strip(frames, 'oak_crucible')

def fig_barrel_recipe():
    water = van('blocks/water_still_grey', WATER); dust = mod('blocks/eno/eno_ex_dust_0')
    frames = []
    for t in (0, 0, 0.33, 0.66, 1.0): frames.append(Scene().add(barrel(water, 1.0)).sprite(dust, 96, lerp(TOP, 62, t), 2).render())
    for _ in range(7): frames.append(Scene().add(barrel(van('blocks/clay'), 1.0)).render())
    return strip(frames, 'barrel_recipe')

def fig_furnace():
    top, side1, front1 = mod('blocks/eno/eno_ex_furnace_top_0'), mod('blocks/eno/eno_ex_furnace_side_1'), mod('blocks/eno/eno_ex_furnace_front_off_1')
    half = [(0, 0, 0, 16, 8, 16, {'up': top, 'south': front1, 'east': side1})]
    item = mini({'up': top, 'south': front1, 'east': side1}, 0.9)
    full = cube({'up': top, 'south': mod('blocks/eno/eno_ex_furnace_front_off_0'), 'east': mod('blocks/eno/eno_ex_furnace_side_0')})
    frames = []
    for t in (0, 0, 0.25, 0.5, 0.75, 1.0): frames.append(Scene().add(half).sprite(item, 96, lerp(TOP + 6, 58, t), 1).render())
    for _ in range(8): frames.append(Scene().add(full).render())
    return strip(frames, 'furnace')

def fig_infested():
    raw, inf = mod('blocks/eno/eno_infesting_oak'), mod('blocks/eno/eno_infested_oak')
    worm = mod('items/eno/eno_enr_silkworm_0')
    near = [(0, 1), (1, 0), (2, 1), (1, 2)]; corner = [(0, 0), (2, 2), (0, 2), (2, 0)]
    stages = [{}, {(1, 1): raw}, {(1, 1): inf, **{p: raw for p in near}}, {(1, 1): inf, **{p: inf for p in near}, **{p: raw for p in corner}},
              {(x, z): inf for x in range(3) for z in range(3)}]
    def scene(st, worm_y=None):
        s = Scene(k=1.7, cy=H - 16 * 1.7 - 2 - 16 * 1.7)
        for x in range(3):
            for z in range(3): s.add(cube(st.get((x, z), LEAVES)), (x - 1, 0, z - 1))
        if worm_y is not None: s.sprite(worm, 96, worm_y, 2)
        return s.render()
    frames = [scene({}, y) for y in (12, 12, 24, 36)]
    for st, n in zip(stages[1:], (3, 3, 3, 4)): frames += [scene(st)] * n
    return strip(frames, 'infested')

def fig_breaker():
    br = cube({'up': mod('blocks/eno/eno_ex_damageSide_0'), 'south': mod('blocks/eno/eno_ex_damageFront_0'), 'east': mod('blocks/eno/eno_ex_damageSide_0')})
    stone = van('blocks/stone')
    base = lambda: Scene(k=1.9, cy=H - 16 * 1.9 - 20).add(br, (0, 0, -1)).render()
    st = lambda: Scene(k=1.9, cy=H - 16 * 1.9 - 20).add(cube(stone), (0, 0, 1)).render()
    cob = mini(van('blocks/cobblestone'), 0.9)
    frames = [over(base(), st()) for _ in range(5)]
    for a in (0.6, 0.25): frames.append(over(base(), fade(st(), a)))
    for t in (0.5, 1.0, 1.0, 1.0, 1.0): frames.append(over(base(), Scene().sprite(cob, *arc((W / 2 - 30, H - 40), (W / 2 - 34, H - 24), t, 10), 1).render()))
    return strip(frames, 'breaker')

def fig_salt():
    """盐：放 4 个粗盐（盐壳一圈圈长大）→ 溶解（盐壳碎裂化开，水变成卤水）→ 放灰烬 → 泛起絮状物 → 结晶层 → 取出粉盐"""
    E = lambda n: mod(f'entity/eno/barrel/{n}')
    salt, ash = mod('items/eno/eno_salt_crude'), mod('items/eno/eno_enr_ash_0')
    shards = [mod('items/eno/eno_ex_irondustsalts_0'), mod('items/eno/eno_ex_copperdustsalts_0'), mod('items/eno/eno_ex_golddustsalts_0')]
    frames = []
    def b(tex, item=None, y=None):
        sc = Scene().add(barrel(tex, 1.0))
        if item is not None: sc.sprite(item, 96, y, 2)
        return sc.render()
    water = E('ex_water_0')
    frames += [b(water)] * 2
    prev = water
    for n in range(1, 5):                                     # 一个一个放粗盐：盐壳一圈圈长大
        frames.append(b(prev, salt, TOP + 8))
        prev = E(f'ex_salty_{n}'); frames.append(b(prev))
    for d in range(1, 7): frames.append(b(E(f'ex_dissolve_{d}')))   # 溶解成卤水
    brine = E('ex_brine'); frames.append(b(brine))
    frames += [b(brine, ash, TOP + 4), b(brine, ash, TOP + 22)]      # 放灰烬
    for k in range(1, 7): frames.append(b(E(f'ex_precip_{k}')))      # 泛起絮状物
    frames += [b(E('ex_sediment'))] * 2                              # 结晶层：可以取了
    for t in (0.4, 0.8, 1.0):                                        # 右键取出：粉盐弹出来，桶里变回清水
        sc = Scene().add(barrel(water, 1.0))
        for i, (img, end) in enumerate(zip(shards, [(52, 30), (96, 18), (140, 30)])): sc.sprite(img, *arc((96, 60), end, t, 14), 2)
        frames.append(sc.render())
    return strip(frames, 'salt')

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for f in (fig_crook, fig_compost, fig_sieve, fig_hammer, fig_ore, fig_crucible, fig_oak_crucible, fig_barrel_recipe, fig_furnace, fig_infested, fig_breaker, fig_salt): f()
