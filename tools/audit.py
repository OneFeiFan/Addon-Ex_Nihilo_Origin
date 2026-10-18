# 构建产物全面检查（可选，需要 Python 3）：python tools/audit.py
# 检查贴图索引、方块 / 物品 / 配方 / 战利品表 / 实体 / 音效 / 语言 / 创造分组的引用是否都存在、格式是否合规。
# 已知的误报：熔炉承载实体引用原版渲染控制器 controller.render.cow；scripts 里的组件名、粒子名、生物 ID、物品标签会出现在 script-id 一栏。
import json, glob, os, re
P=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); R=f'{P}/dev/eno-port_RP'; B=f'{P}/dev/eno-port_BP'
# 原版物品 / 方块 ID 表：Mojang bedrock-samples 的 metadata/vanilladata_modules/mojang-items.json、mojang-blocks.json，放在 tools/ 下
VI={d['name'] for d in json.load(open(f'{P}/tools/mojang-items.json'))['data_items']}
VB_raw=json.load(open(f'{P}/tools/mojang-blocks.json'))
VB={d['name'] for d in VB_raw['data_items']}
BSTATES={d['name']:{p['name'] for p in d.get('properties',[])} for d in VB_raw['data_items']}
issues=[]
def add(cat,msg): issues.append((cat,msg))
J=lambda f: json.load(open(f,encoding='utf8'))
terrain=J(f'{R}/textures/terrain_texture.json')['texture_data']; itemtex=J(f'{R}/textures/item_texture.json')['texture_data']
def texfile(path): return any(os.path.exists(f'{R}/{path}{e}') for e in ('.png','.tga'))
def vanilla_tex(path): return path.startswith('textures/blocks/') or path.startswith('textures/items/') or path.startswith('textures/ui/') or path.startswith('textures/entity/')
for k,v in terrain.items():
    t=v['textures']; t=t if isinstance(t,list) else [t]
    for p in t:
        p=p if isinstance(p,str) else p.get('path')
        if not texfile(p) and not ('/eno/' not in p): add('terrain', f'{k} -> {p} 文件不存在')
for k,v in itemtex.items():
    p=v['textures']
    if '/eno/' in p and not texfile(p): add('item_texture', f'{k} -> {p} 文件不存在')
    if k!=k.lower(): add('item_texture', f'贴图名含大写 {k}')
geos=set()
for f in glob.glob(f'{R}/models/**/*.json', recursive=True):
    for g in J(f).get('minecraft:geometry',[]): geos.add(g['description']['identifier'])
myitems={J(f)['minecraft:item']['description']['identifier'] for f in glob.glob(f'{B}/items/*.json')}
myblocks={J(f)['minecraft:block']['description']['identifier'] for f in glob.glob(f'{B}/blocks/*.json')}
allids=VI|VB|myitems|myblocks
CATS={'construction','equipment','items','nature','none','commands'}
RM={'opaque','double_sided','blend','alpha_test','alpha_test_single_sided','blend_to_opaque','alpha_test_to_opaque','alpha_test_single_sided_to_opaque'}
# ---- blocks ----
for f in glob.glob(f'{B}/blocks/*.json'):
    d=J(f); blk=d['minecraft:block']; bid=blk['description']['identifier']
    mc=blk['description'].get('menu_category',{})
    if mc.get('category') and mc['category'] not in CATS: add('block', f'{bid} menu_category {mc}')
    comps=[('base',blk['components'])]+[(p['condition'],p['components']) for p in blk.get('permutations',[])]
    for where,c in comps:
        mi=c.get('minecraft:material_instances')
        if mi:
            rms={v.get('render_method','opaque') for v in mi.values() if isinstance(v,dict)}
            if len(rms)>1: add('block', f'{bid} [{where[:30]}] 材质实例混用渲染方式 {rms}（游戏报错：不能混用不透明和透明材质）')
            for k,v in mi.items():
                if isinstance(v,str): continue
                if v.get('texture') not in terrain: add('block', f'{bid} [{where[:30]}] 材质 {k} 的贴图 {v.get("texture")} 不在 terrain_texture')
                if v.get('render_method') and v['render_method'] not in RM: add('block', f'{bid} render_method {v["render_method"]}')
        g=c.get('minecraft:geometry')
        if g:
            gid=g if isinstance(g,str) else g.get('identifier')
            if gid and not gid.startswith('minecraft:') and gid not in geos: add('block', f'{bid} 模型 {gid} 不存在')
        for box in ('minecraft:collision_box','minecraft:selection_box'):
            bx=c.get(box)
            if isinstance(bx,dict):
                o,s=bx['origin'],bx['size']
                if not (-8<=o[0]<=8 and 0<=o[1]<=16 and -8<=o[2]<=8 and o[0]+s[0]<=8 and o[1]+s[1]<=16 and o[2]+s[2]<=8 and min(s)>=0): add('block', f'{bid} {box} 超出范围 {bx}')
        lt=c.get('minecraft:loot')
        if lt and not os.path.exists(f'{B}/{lt}'): add('block', f'{bid} 战利品表 {lt} 不存在')
        tk=c.get('minecraft:tick')
        if tk and any(not isinstance(x,int) for x in tk.get('interval_range',[])): add('block', f'{bid} tick 间隔非整数')
        ld=c.get('minecraft:light_dampening')
        if ld is not None and not (isinstance(ld,int) and 0<=ld<=15): add('block', f'{bid} light_dampening {ld}')
    iv=blk['components'].get('minecraft:item_visual')
    if iv:
        for k,v in iv['material_instances'].items():
            if v['texture'] not in terrain: add('block', f'{bid} item_visual 贴图 {v["texture"]} 不在 terrain_texture')
# ---- items ----
for f in glob.glob(f'{B}/items/*.json'):
    it=J(f)['minecraft:item']; iid=it['description']['identifier']; c=it['components']
    ic=c.get('minecraft:icon')
    if isinstance(ic,str) and ic not in itemtex: add('item', f'{iid} 图标 {ic} 不在 item_texture')
    ms=c.get('minecraft:max_stack_size')
    if ms is not None and not (1<=ms<=64): add('item', f'{iid} max_stack_size {ms}')
    dig=c.get('minecraft:digger')
    if dig:
        for s in dig['destroy_speeds']:
            if not isinstance(s['speed'],int): add('item', f'{iid} 挖掘速度非整数 {s["speed"]}')
            b=s['block']
            if isinstance(b,str) and b not in allids: add('item', f'{iid} digger 方块 {b} 不存在')
    mc=it['description'].get('menu_category',{})
    if mc.get('category') and mc['category'] not in CATS: add('item', f'{iid} menu_category {mc}')
# ---- recipes ----
seen=set()
def chk_ing(rid, x):
    if isinstance(x,dict):
        if 'item' in x and x['item'] not in allids: add('recipe', f'{rid} 原料 {x["item"]} 不存在')
    elif isinstance(x,str) and x not in allids: add('recipe', f'{rid} 原料 {x} 不存在')
for f in glob.glob(f'{B}/recipes/*.json'):
    d=J(f); kind=[k for k in d if k.startswith('minecraft:recipe')][0]; r=d[kind]; rid=r['description']['identifier']
    if rid in seen: add('recipe', f'重复配方 ID {rid}')
    seen.add(rid)
    if kind=='minecraft:recipe_shaped':
        keys=set(''.join(r['pattern']))-{' '}
        if keys!=set(r['key']): add('recipe', f'{rid} pattern 与 key 不一致 {keys} vs {set(r["key"])}')
        for v in r['key'].values(): chk_ing(rid,v)
        if r['result']['item'] not in allids: add('recipe', f'{rid} 产物 {r["result"]["item"]} 不存在')
        if r.get('tags')!=['crafting_table']: add('recipe', f'{rid} tags {r.get("tags")}')
    elif kind=='minecraft:recipe_shapeless':
        for v in r['ingredients']: chk_ing(rid,v)
        if r['result']['item'] not in allids: add('recipe', f'{rid} 产物 不存在')
        if len(r['ingredients'])>9: add('recipe', f'{rid} 原料超过 9')
    elif kind=='minecraft:recipe_furnace':
        chk_ing(rid, r['input']); chk_ing(rid, r['output'])
        if not r.get('tags'): add('recipe', f'{rid} 熔炉配方缺 tags')
# ---- loot ----
for f in glob.glob(f'{B}/loot_tables/**/*.json', recursive=True):
    for pool in J(f).get('pools',[]):
        for e in pool.get('entries',[]):
            if e.get('type')=='item' and e['name'] not in allids: add('loot', f'{os.path.basename(f)} 物品 {e["name"]} 不存在')
# ---- entities ----
rcs=set()
for f in glob.glob(f'{R}/render_controllers/*.json'): rcs|=set(J(f)['render_controllers'])
anims=set()
for f in glob.glob(f'{R}/animations/*.json'): anims|=set(J(f)['animations'])
for f in glob.glob(f'{R}/entity/*.json'):
    d=J(f)['minecraft:client_entity']['description']; eid=d['identifier']
    for k,g in d.get('geometry',{}).items():
        if g not in geos: add('entity', f'{eid} 模型 {g} 不存在')
    for r in d.get('render_controllers',[]):
        r=r if isinstance(r,str) else list(r)[0]
        if r not in rcs: add('entity', f'{eid} 渲染控制器 {r} 不存在')
    for k,a in d.get('animations',{}).items():
        if a not in anims: add('entity', f'{eid} 动画 {a} 不存在')
    for k,t in d.get('textures',{}).items():
        if '/eno/' in t and not texfile(t): add('entity', f'{eid} 贴图 {t} 不存在')
    for k,m in d.get('materials',{}).items():
        if m not in ('entity_alphatest','entity','entity_alphablend','entity_emissive','entity_alphatest_one_sided'): add('entity', f'{eid} 材质 {m}')
bpents={J(f)['minecraft:entity']['description']['identifier'] for f in glob.glob(f'{B}/entities/*.json')}
rpents={J(f)['minecraft:client_entity']['description']['identifier'] for f in glob.glob(f'{R}/entity/*.json')}
if bpents!=rpents: add('entity', f'BP/RP 实体不对应 {bpents^rpents}')
# ---- sounds ----
sd=J(f'{R}/sounds/sound_definitions.json')
for k,v in sd.get('sound_definitions',sd).items():
    if not isinstance(v,dict): continue
    for s in v.get('sounds',[]):
        n=s if isinstance(s,str) else s.get('name')
        if not any(os.path.exists(f'{R}/{n}{e}') for e in ('.ogg','.wav','.fsb')): add('sound', f'{k} 文件 {n} 不存在')
bj=J(f'{R}/blocks.json')
VALID_SOUNDS={'stone','wood','gravel','grass','sand','cloth','glass','metal','snow','ladder','anvil','slime','bamboo','sweet_berry_bush','lantern','honey_block','nether_brick','soul_sand','basalt','bone_block','chain','copper','deepslate','dirt','moss_block','mud','roots','scaffolding','vines','wool','normal','itemframe','coral','netherrack','nylium','fungus','gilded_blackstone','candle','amethyst_block','tuff','powder_snow'}
for k,v in bj.items():
    if isinstance(v,dict) and v.get('sound') and v['sound'] not in VALID_SOUNDS: add('blocks.json', f'{k} 音效 {v["sound"]}')
    if isinstance(v,dict) and k not in myblocks: add('blocks.json', f'{k} 不是本模组方块')
# ---- lang ----
lang=dict(l.split('=',1) for l in open(f'{R}/texts/zh_CN.lang',encoding='utf8').read().splitlines() if '=' in l)
for i in myitems:
    if f'item.{i}' not in lang and f'item.{i}.name' not in lang: add('lang', f'物品 {i} 没有中文名')
for b in myblocks:
    bj_hidden=False
    if f'tile.{b}.name' not in lang: add('lang', f'方块 {b} 没有中文名')
cat=J(f'{B}/item_catalog/crafting_item_catalog.json')['minecraft:crafting_items_catalog']
for c in cat['categories']:
    for g in c['groups']:
        n=g['group_identifier']['name']
        if n not in lang: add('lang', f'创造分组 {n} 没有中文名')
        for it in g['items']:
            if it not in myitems|myblocks: add('catalog', f'{n} 里的 {it} 不存在')
# ---- vanilla IDs used in scripts ----
for f in glob.glob(f'{P}/scripts/**/*.ts', recursive=True):
    s=open(f,encoding='utf8').read()
    for m in set(re.findall(r"'(minecraft:[a-z0-9_]+)'", s)):
        if m not in VI and m not in VB and not m.startswith('minecraft:overworld') and m not in ('minecraft:the_end','minecraft:nether','minecraft:item','minecraft:falling_block','minecraft:lightning_bolt','minecraft:player'):
            add('script-id', f'{os.path.relpath(f,P)}: {m}')
from collections import defaultdict
g=defaultdict(list)
for c,m in issues: g[c].append(m)
for c,ms in g.items():
    print(f'== {c} ({len(ms)})'); [print('  ',m) for m in ms[:40]]
print('total', len(issues))
