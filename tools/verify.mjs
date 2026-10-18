// 里程碑 1/2 的自动验收：产物与 eno_data.json 逐项比对
import fs from 'fs'; import path from 'path'
const ROOT = process.cwd(); const BP = path.join(ROOT, 'dev/eno-port_BP'), RP = path.join(ROOT, 'dev/eno-port_RP')
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const dir = (p) => fs.existsSync(p) ? fs.readdirSync(p).map((f) => J(path.join(p, f))) : []
const items = dir(path.join(BP, 'items')), blocks = dir(path.join(BP, 'blocks')), recipes = dir(path.join(BP, 'recipes'))
const lang = Object.fromEntries(['zh_CN', 'en_US'].map((l) => [l, Object.fromEntries(fs.readFileSync(path.join(RP, 'texts', l + '.lang'), 'utf8').split('\n').filter(Boolean).map((x) => x.split(/=(.*)/s).slice(0, 2)))]))
const itemTex = J(path.join(RP, 'textures/item_texture.json')).texture_data, terrain = J(path.join(RP, 'textures/terrain_texture.json')).texture_data
const sounds = J(path.join(RP, 'blocks.json'))
const errors = []
for (const it of items) { const c = it['minecraft:item'].components; const key = `item.${it['minecraft:item'].description.identifier}`
  for (const l of Object.keys(lang)) if (!lang[l][key]) errors.push(`缺少翻译 ${l} ${key}`)
  if (c['minecraft:block_placer'] && !c['minecraft:icon']) {   // 翻书物品：图标来自对应方块
    const bid = c['minecraft:block_placer'].block; const blk = blocks.find((x) => x['minecraft:block'].description.identifier === bid)
    if (!blk) errors.push(`翻书物品缺少外观方块 ${bid}`); else for (const m of Object.values(blk['minecraft:block'].components['minecraft:material_instances'])) if (!terrain[m.texture]) errors.push(`翻书贴图未登记 ${m.texture}`)
    const fb = fs.existsSync(path.join(RP, 'textures/flipbook_textures.json')) ? J(path.join(RP, 'textures/flipbook_textures.json')) : []
    if (!fb.some((f) => blk && Object.values(blk['minecraft:block'].components['minecraft:material_instances']).some((m) => m.texture === f.atlas_tile))) errors.push(`翻书动画未登记 ${bid}`)
  } else if (!itemTex[c['minecraft:icon']]) errors.push(`缺少物品贴图 ${c['minecraft:icon']}`) }
for (const b of blocks) { const blk = b['minecraft:block']; const id = blk.description.identifier; const c = blk.components
  if (blk.description.menu_category?.category === 'none') continue
  for (const l of Object.keys(lang)) if (!lang[l][`tile.${id}.name`]) errors.push(`缺少翻译 ${l} ${id}`)
  for (const [face, m] of Object.entries(c['minecraft:material_instances'] || {})) if (!terrain[m.texture]) errors.push(`缺少方块贴图 ${id} ${face} ${m.texture}`)
  if (!sounds[id]) errors.push(`缺少音效 ${id}`) }
const allIds = new Set([...items.map((i) => i['minecraft:item'].description.identifier), ...blocks.map((b) => b['minecraft:block'].description.identifier)])
for (const r of recipes) { const body = Object.values(r).find((v) => typeof v === 'object' && v.description); const refs = []
  const walk = (o) => { if (!o || typeof o !== 'object') return; if (typeof o.item === 'string') refs.push(o.item); for (const v of Object.values(o)) walk(v) }; walk(body)
  if (typeof body.input === 'string') refs.push(body.input); if (typeof body.output === 'string') refs.push(body.output)
  for (const ref of refs) if (ref.startsWith('eno:') && !allIds.has(ref)) errors.push(`配方 ${body.description.identifier} 引用了未注册的 ${ref}`) }
// 运行期数据（scripts/data/*.ts、scripts/lib/rules.ts）引用的 ID 都必须存在
const runtimeSrc = ['scripts/data/tools.ts', 'scripts/data/sieve.ts', 'scripts/lib/rules.ts'].map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
for (const r of new Set([...runtimeSrc.matchAll(/["'](eno:[a-z0-9_]+)["']/g)].map((m) => m[1]))) if (!allIds.has(r)) errors.push(`运行期数据引用了未注册的 ${r}`)
// 里程碑 4：筛子的几何体、材质、状态
const geo = path.join(RP, 'models/blocks/eno_sieve.json')
if (!fs.existsSync(geo)) errors.push('缺少筛子几何体'); else {
  const g = J(geo)['minecraft:geometry'][0]; const boneNames = new Set(g.bones.map((b) => b.name))
  // Sapdon known-pitfalls §10.1：up/down 必须是负 uv_size，侧面为正；缺 UV 的面不可见
  for (const b of g.bones) for (const c of b.cubes) for (const f of ['north', 'east', 'south', 'west', 'up', 'down']) {
    const uv = c.uv[f]; if (!uv) { errors.push(`筛子模型 ${b.name} 缺 ${f} 面 UV`); continue }
    const neg = uv.uv_size[0] < 0 && uv.uv_size[1] < 0, pos = uv.uv_size[0] >= 0 && uv.uv_size[1] >= 0
    if ((f === 'up' || f === 'down') ? !neg : !pos) errors.push(`筛子模型 ${b.name} 的 ${f} 面 uv_size 符号错误`)
    if (!uv.material_instance) errors.push(`筛子模型 ${b.name} 的 ${f} 面缺 material_instance`)
  }
  for (const b of blocks.filter((x) => /^eno:(sieve|heavysieve)_/.test(x['minecraft:block'].description.identifier))) {
    const blk = b['minecraft:block']; const id = blk.description.identifier
    for (const bn of Object.keys(blk.components['minecraft:geometry'].bone_visibility)) if (!boneNames.has(bn)) errors.push(`${id} 引用了不存在的骨骼 ${bn}`)
    const mats = [blk.components['minecraft:material_instances'], ...(blk.permutations || []).map((p) => p.components['minecraft:material_instances']).filter(Boolean)]
    for (const mi of mats) for (const [k, v] of Object.entries(mi)) if (!terrain[v.texture]) errors.push(`${id} 材质 ${k} 的贴图不存在 ${v.texture}`)
    if (!blk.components['minecraft:block_entity']) errors.push(`${id} 缺少方块实体`)
  }
}
// 世界排列预算（3.3）
let perms = 0
for (const b of blocks) { const st = b['minecraft:block'].description.states || {}; let n = 1; for (const v of Object.values(st)) n *= Array.isArray(v) ? v.length : (v.values ? (Array.isArray(v.values) ? v.values.length : v.values.max - v.values.min + 1) : 1); perms += n }
console.log(`方块排列总数 ${perms}（世界预算 65536 的 ${(perms / 655.36).toFixed(1)}%）`)
// 贴图必须是 32 位 RGBA（索引色 PNG 在游戏里会显示成色块）
for (const dir of ['textures/items', 'textures/blocks']) (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.png')) { const b = fs.readFileSync(p); if (b[25] !== 6) errors.push(`贴图不是 RGBA：${path.relative(RP, p)}`) } } })(path.join(RP, dir))
// 物品组件里的整数字段（写成小数会让整份组件被拒）
for (const it of items) { const c = it['minecraft:item'].components, id = it['minecraft:item'].description.identifier
  for (const d of c['minecraft:digger']?.destroy_speeds ?? []) if (!Number.isInteger(d.speed)) errors.push(`${id} 的挖掘速度不是整数：${d.speed}`)
  for (const k of ['minecraft:max_stack_size', 'minecraft:damage']) if (c[k] !== undefined && !Number.isInteger(typeof c[k] === 'object' ? c[k].value : c[k])) errors.push(`${id} 的 ${k} 不是整数`) }
// 同一创造分组的物品必须同一类别
{ const cat = {}; for (const it of items) { const mc = it['minecraft:item'].description.menu_category; if (!mc?.group) continue; (cat[mc.group] ||= new Set()).add(mc.category) }
  for (const [g, s] of Object.entries(cat)) if (s.size > 1) errors.push(`创造分组 ${g} 混有多个类别：${[...s].join(', ')}`) }
// 渲染控制器的 arrays 必须是 { textures: { "Array.xxx": [...] } }
for (const f of (fs.existsSync(path.join(RP, 'render_controllers')) ? fs.readdirSync(path.join(RP, 'render_controllers')) : [])) { const rc = J(path.join(RP, 'render_controllers', f)).render_controllers
  for (const [n, c] of Object.entries(rc)) for (const [kind, arrs] of Object.entries(c.arrays ?? {})) {
    if (!['textures', 'geometries', 'materials'].includes(kind)) errors.push(`渲染控制器 ${n} 的 arrays 结构错误：${kind}`)
    for (const k of Object.keys(arrs)) if (!k.startsWith('Array.')) errors.push(`渲染控制器 ${n} 的数组名应以 Array. 开头：${k}`) } }
console.log(`物品 ${items.length}，方块 ${blocks.length}，配方 ${recipes.length}，lang 键 ${Object.keys(lang.zh_CN).length}`)
console.log(errors.length ? `发现 ${errors.length} 个问题：\n` + errors.slice(0, 30).join('\n') : '全部通过')
process.exit(errors.length ? 1 : 0)
