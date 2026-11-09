# 炼药相关贴图（可选工具，需要 Python 3 + Pillow）：python tools/gen_brew_textures.py
#   · 木坩埚里三种药水的液面（由清水贴图染成原版药水的颜色）
#   · 女巫水桶（铁桶、陶瓷桶）：把水桶图标里的水染成女巫水的紫色
import os, importlib.util
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('render_guide', os.path.join(HERE, 'render_guide.py'))
G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)
R = os.path.join(G.ROOT, 'res/textures')
POTION = {'weakness': (72, 77, 72), 'poison': (78, 147, 49), 'slowness': (90, 108, 129)}   # 原版药水颜色
WITCH = (96, 40, 128)

def tint_liquid(src, color, k=0.65):
    im = Image.open(src).convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]; l = (r + g + b) / 765
            px[x, y] = tuple(int(c * (0.55 + 0.75 * l) * k + v * (1 - k)) for c, v in zip(color, (r, g, b))) + (a,)
    return im

def witch_bucket(src, dst):
    """把水（偏蓝的像素）换成女巫水的紫色，桶身不动"""
    im = src.copy().convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and b > r + 25 and b > g + 10:
                l = (r + g + b) / 765
                px[x, y] = tuple(min(255, int(c * (0.6 + 0.9 * l)))  for c in WITCH) + (a,)
    im.save(dst)

if __name__ == '__main__':
    water = os.path.join(R, 'entity/eno/barrel/ex_water_0.png')   # 以清水的明暗为底（女巫水贴图太暗，染色后看不出颜色）
    for name, color in POTION.items():
        tint_liquid(water, color, 0.85).save(os.path.join(R, f'entity/eno/crucible/brew_{name}.png'))
    witch_bucket(G.van('items/bucket_water'), os.path.join(R, 'items/eno/eno_bucket_witch_water.png'))
    witch_bucket(G.mod('items/eno/eno_enr_bucketporcelainwater_0'), os.path.join(R, 'items/eno/eno_bucket_porcelain_witch_water.png'))
    print('[brew] 药水液面 3 张、女巫水桶 2 个')
