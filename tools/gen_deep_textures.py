# 深板岩 / 凝灰岩链的贴图（可选工具，需要 Python 3 + Pillow）：python tools/gen_deep_textures.py
#   · 深板岩石子、凝灰岩石子：把本模组的小石子图标换成对应岩石的颜色
#   · 粉碎深板岩、粉碎凝灰岩：按原版沙砾的颗粒明暗，换成对应岩石的颜色（和"下界沙砾、末地沙砾"同一种做法）
import os, importlib.util
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('render_guide', os.path.join(HERE, 'render_guide.py'))
G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)
R = os.path.join(G.ROOT, 'res/textures')

def mean_color(img):
    px = [img.getpixel((x, y)) for y in range(img.height) for x in range(img.width) if img.getpixel((x, y))[3] > 0]
    return tuple(sum(p[i] for p in px) // len(px) for i in range(3))

def recolor(src, color, contrast=1.0):
    """保留 src 的明暗，换成 color 的色调（亮度按 src 的相对亮度缩放）"""
    im = src.copy().convert('RGBA'); px = im.load()
    lum = [0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2] for p in (im.getpixel((x, y)) for y in range(im.height) for x in range(im.width)) if p[3] > 0]
    avg = sum(lum) / len(lum)
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0: continue
            k = 1 + ((0.3 * r + 0.59 * g + 0.11 * b) / avg - 1) * contrast
            px[x, y] = tuple(max(0, min(255, int(c * k))) for c in color) + (a,)
    return im

if __name__ == '__main__':
    deep = mean_color(G.van('blocks/deepslate/deepslate'))
    tuff = mean_color(G.van('blocks/tuff'))
    pebble = G.mod('items/eno/eno_enr_stonesmall_0')
    gravel = G.van('blocks/gravel')
    recolor(pebble, tuple(int(c * 0.78) for c in deep[:2]) + (int(deep[2] * 0.9),), 1.25).save(   # 比普通小石子明显更深
        os.path.join(R, 'items/eno/eno_deepslate_pebble.png'))
    recolor(pebble, tuff, 1.0).save(os.path.join(R, 'items/eno/eno_tuff_pebble.png'))
    recolor(gravel, deep, 1.2).save(os.path.join(R, 'blocks/eno/eno_crushed_deepslate.png'))
    recolor(gravel, tuff, 1.0).save(os.path.join(R, 'blocks/eno/eno_crushed_tuff.png'))
    print('[deep] 深板岩 / 凝灰岩石子、粉碎深板岩 / 凝灰岩', deep, tuff)
