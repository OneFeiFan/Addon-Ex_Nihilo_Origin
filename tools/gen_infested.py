# 寄生树叶贴图生成器（可选工具，需要 Python 3 + Pillow）：python tools/gen_infested.py
# 按每种原版树叶的贴图自动生成两张：寄生叶（整片变白，保留原贴图的叶形和明暗）、生寄生叶（原本的绿色上爬着白色的丝）。
# 原版贴图来自 Mojang 的 bedrock-samples（缓存在 tools/vanilla/）。以后原版加了新树种，在 SPECIES 里加一行再运行即可。
# 输出：res/textures/blocks/eno/eno_infested_<树种>.png、eno_infesting_<树种>.png（已随源码提交）
import os, importlib.util
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('render_guide', os.path.join(HERE, 'render_guide.py'))
G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)
OUT = os.path.join(G.ROOT, 'res/textures/blocks/eno')

# 树种 → (原版贴图, 正常颜色的染色)。原版大多数树叶贴图是灰度的、游戏里按生物群系染绿；樱花、杜鹃本身带颜色（染色给 None）
FOLIAGE, BIRCH, SPRUCE = (72, 181, 24), (128, 167, 85), (97, 153, 97)
SPECIES = {
    'oak': ('leaves_oak', FOLIAGE), 'spruce': ('leaves_spruce', SPRUCE), 'birch': ('leaves_birch', BIRCH),
    'jungle': ('leaves_jungle', FOLIAGE), 'acacia': ('leaves_acacia', FOLIAGE), 'dark_oak': ('leaves_big_oak', FOLIAGE),
    'mangrove': ('mangrove_leaves', (146, 192, 66)), 'cherry': ('cherry_leaves', None), 'azalea': ('azalea_leaves', None),
    'flowering_azalea': ('azalea_leaves_flowers', None), 'pale_oak': ('pale_oak_leaves', None),
}

def generate(name, src, tint):
    img = G.van(f'blocks/{src}')
    px = img.load(); w, h = img.size
    lum = [[(0.3 * px[x, y][0] + 0.59 * px[x, y][1] + 0.11 * px[x, y][2]) for x in range(w)] for y in range(h)]
    vals = [lum[y][x] for y in range(h) for x in range(w) if px[x, y][3] > 0]
    lo, hi = min(vals), max(vals); span = max(1, hi - lo)
    white = Image.new('RGBA', (w, h)); raw = Image.new('RGBA', (w, h))
    wp, rp = white.load(), raw.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0: continue
            t = (lum[y][x] - lo) / span                       # 0 = 最暗，1 = 最亮
            v = int(176 + 79 * t)                              # 寄生叶：明暗保留，整体提到接近白色
            wp[x, y] = (v, v, min(255, v + 4), a)
            base = (tuple(int(c * lum[y][x] / 255) for c in tint) if tint else (r, g, b))   # 正常颜色
            if t > 0.8 or (x * 7 + y * 13) % 19 == 0:        # 最亮处和零星几点先被丝盖住，其余保持原本的颜色
                rp[x, y] = (v, v, min(255, v + 4), a)
            else:
                rp[x, y] = tuple(int(c * 0.88 + 255 * 0.12) for c in base) + (a,)
    white.save(os.path.join(OUT, f'eno_infested_{name}.png'))
    raw.save(os.path.join(OUT, f'eno_infesting_{name}.png'))

if __name__ == '__main__':
    for name, (src, tint) in SPECIES.items(): generate(name, src, tint)
    print('[infested] 生成', len(SPECIES), '种树叶的寄生贴图')
