// 构建期 API —— 内容定义（src-build/content/*.ts）逐条调用这些函数，
// 写法对应原模组的 Item.createItem / ToolAPI.setTool / Block.createBlock / Recipes.addShaped。
// 全部基于 Sapdon；Sapdon 没有的（战利品表、blocks.json 音效）在这里用 GRegistry 写原版 JSON。
import { ItemAPI, ItemCategory, ItemComponent, BlockAPI, BlockComponent, RecipeAPI, GRegistry, FlipbookTextures } from '@sapdon/core'
import { SPECIES } from '../scripts/data/infested.js'

export type Category = 'construction' | 'equipment' | 'items' | 'nature' | 'none'
const CAT: Record<Category, ItemCategory> = {
    construction: ItemCategory.Construction, equipment: ItemCategory.Equipment, items: ItemCategory.Items, nature: ItemCategory.Nature, none: ItemCategory.None,
}
const opts = (group?: string) => (group ? { group } : {}) as any
export const registered = new Set<string>()

// ======================== 物品 ========================
export interface ItemOptions { category?: Category, group?: string, stack?: number, components?: string[], liquidClipped?: boolean }

/**
 * 普通物品（Item.createItem）。
 * 物品贴图名（= res/textures/items/eno 里的文件名）必须全小写：游戏校验物品图标时按小写查找，
 * 带大写字母的贴图名会在内容日志里报 Missing referenced asset（2.3.5 真机日志）。
 */
export function item(id: string, texture: string, o: ItemOptions = {}) {
    const it = ItemAPI.createItem(id, CAT[o.category ?? 'items'], texture, opts(o.group))
    it.addComponent(ItemComponent.combineComponents(
        ItemComponent.setMaxStackSize(o.stack ?? 64),
        ...(o.components?.length ? [ItemComponent.setCustomComponents(o.components)] : []),
        ...(o.liquidClipped ? [ItemComponent.setLiquidClipped(true)] : []),
    ))
    registered.add(id)
    return it
}

/** 食物（Item.createFoodItem）：饱和度沿用 InnerCore 默认 */
export function food(id: string, texture: string, nutrition: number, o: ItemOptions = {}) {
    const it = ItemAPI.createItem(id, CAT[o.category ?? 'equipment'], texture, opts(o.group))
    it.addComponent(ItemComponent.combineComponents(
        ItemComponent.setMaxStackSize(o.stack ?? 64),
        ItemComponent.setFoodComponent({ nutrition } as any), ItemComponent.setUseAnimation('eat'), ItemComponent.setUseModifiers({ useDuration: 1.6 } as any),
    ))
    registered.add(id)
    return it
}

// ---- 工具（ToolAPI.setTool）：耐久由引擎处理攻击、由脚本处理挖掘（eno:tool，见 scripts/mechanics/toolDurability.ts）----
function toolBase(id: string, texture: string, durability: number, o: ItemOptions, extra: any[]) {
    const it = ItemAPI.createItem(id, CAT[o.category ?? 'equipment'], texture, opts(o.group))
    it.addComponent(ItemComponent.combineComponents(
        ItemComponent.setMaxStackSize(1), ItemComponent.setDurability(durability, 100, 100), ItemComponent.setHandEquipped(true),
        ItemComponent.setCustomComponents(['eno:tool']), ...extra,
    ))
    registered.add(id)
    return it
}

/** 锤子：对镐类、铲类方块有效（原模组把 ToolType.pickaxe 的 blockTypes 改成了 stone + dirt） */
const HAMMER_BLOCKS = "q.any_tag('minecraft:is_pickaxe_item_destructible', 'minecraft:is_shovel_item_destructible', 'stone', 'metal', 'dirt', 'sand', 'gravel', 'grass')"
export function hammer(id: string, texture: string, s: { durability: number, tier: 'wooden' | 'stone' | 'iron' | 'golden' | 'diamond', speed: number, damage: number }, o: ItemOptions = {}) {
    return toolBase(id, texture, s.durability, o, [
        ItemComponent.setDigger({ destroySpeeds: [{ block: { tags: HAMMER_BLOCKS } as any, speed: s.speed }], useEfficiency: false }),
        ItemComponent.setTags(['minecraft:is_pickaxe', 'minecraft:is_tool', `minecraft:${s.tier}_tier`]),
        ItemComponent.setDamage(s.damage),
    ])
}

/** 钩子：任何原版树叶与 plant 类方块按钩子效率挖掘（挖掘速度必须是整数） */
const LEAVES = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'azalea', 'azalea_leaves_flowered', 'pale_oak']
    .map((n) => n === 'azalea_leaves_flowered' ? `minecraft:${n}` : `minecraft:${n}_leaves`)
export function crook(id: string, texture: string, s: { durability: number, speed: number, damage: number }, o: ItemOptions = {}) {
    return toolBase(id, texture, s.durability, o, [
        ItemComponent.setDigger({ destroySpeeds: [...LEAVES.map((b) => ({ block: b as any, speed: s.speed })), { block: { tags: "q.any_tag('plant', 'eno:plant')" } as any, speed: s.speed }], useEfficiency: false }),
        ItemComponent.setTags(['minecraft:is_tool']),
        ItemComponent.setDamage(s.damage),
    ])
}

/** 筛网：带耐久的工具，耐久只由筛子消耗 */
export function mesh(id: string, texture: string, durability: number, o: ItemOptions = {}) {
    return toolBase(id, texture, durability, o, [])
}

/** 动态图标物品（原模组 registerIconOverrideFunction 每帧随机换图）：Sapdon FlipbookItem，帧序列为固定种子的伪随机排列 */
export function animatedItem(id: string, flipbookTexture: string, frames: number, o: ItemOptions = {}) {
    let x = 20231; const rnd = () => (x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
    const seq: number[] = []
    while (seq.length < 160) { const f = Math.floor(rnd() * frames); if (f !== seq[seq.length - 1]) seq.push(f) }
    const it: any = ItemAPI.createFlipbookItem(id, CAT[o.category ?? 'items'], flipbookTexture, { ticks_per_frame: 1, texture_path: `textures/blocks/eno/${flipbookTexture}` } as any)
    const fb = FlipbookTextures.flipbook_textures[FlipbookTextures.flipbook_textures.length - 1] as any
    fb.frames = seq; fb.blend_frames = false
    it.block.category = 'none'; it.block.hide_in_command = true   // 承载外观的方块只用于渲染图标
    it.addComponent(ItemComponent.combineComponents(ItemComponent.setMaxStackSize(o.stack ?? 64)))
    registered.add(id)
    return it
}

// ======================== 方块 ========================
type Tool = 'pickaxe' | 'shovel' | 'axe' | 'hoe'
export interface BlockOptions {
    category: Category, group?: string
    hardness: number, explosion: number, sound: string
    tools?: Tool[]                                  // 用哪类工具挖得快
    harvest?: ('diamond' | 'netherite')[]           // 需要至少这个等级的镐才掉落（继承黑曜石）
    tags?: string[]                                 // 额外的方块标签（如 eno:plant：钩子按效率挖掘）
    render?: 'alpha_test' | 'blend'                 // 树叶类用 alpha_test
    noDrop?: boolean                                // 不掉落任何东西（掉落由脚本决定时用）
    components?: string[]                           // 方块自定义组件
}
export const blockSounds: Record<string, string> = {}

/** 整块方块。贴图：一张贴图，或 [上, 下, 东, 西, 南, 北] 六张 */
export function block(id: string, texture: string | string[], o: BlockOptions) {
    const faces = typeof texture === 'string' ? Array(6).fill(texture) : texture
    const b = BlockAPI.createBasicBlock(id, o.category, faces, opts(o.group))
    const comps: any[] = [BlockComponent.setDestructibleByMiningCustom(o.hardness, undefined as any), BlockComponent.setDestructibleByExplosionCustom(o.explosion)]
    const tags = [...(o.tools ?? []).map((t) => `minecraft:is_${t}_item_destructible`), ...(o.tags ?? [])]
    if (tags.length) comps.push(BlockComponent.setTags(tags))
    if (o.harvest) comps.push(BlockComponent.setLoot(harvestLoot(id, o.harvest)))
    if (o.noDrop) comps.push(BlockComponent.setLoot(emptyLoot()))
    if (o.render) {
        const [up, down, east, west, south, north] = faces
        const m = (t: string) => ({ texture: t, render_method: o.render })
        comps.push(BlockComponent.setMaterialInstances({ '*': m(up), up: m(up), down: m(down), east: m(east), west: m(west), south: m(south), north: m(north) }))
    }
    if (o.components?.length) comps.push(BlockComponent.setCustomComponents(o.components))
    b.addComponent(BlockComponent.combineComponents(...comps))
    blockSounds[id] = o.sound
    registered.add(id)
    return b
}
let emptyRegistered = false
function emptyLoot() {
    if (!emptyRegistered) { GRegistry.register('empty', 'behavior', 'loot_tables/blocks/', { toObject: () => ({ pools: [] }) } as any); emptyRegistered = true }
    return 'loot_tables/blocks/empty.json'
}
function harvestLoot(id: string, tiers: string[]) {
    const name = id.replace(':', '_')
    GRegistry.register(name, 'behavior', 'loot_tables/blocks/', { toObject: () => ({
        pools: [{ rolls: 1, entries: [{ type: 'item', name: id, weight: 1 }],
            conditions: [{ condition: 'match_tool', item_tags_any: ['minecraft:is_pickaxe'] }, { condition: 'match_tool', item_tags_any: tiers.map((t) => `minecraft:${t}_tier`) }] }],
    }) } as any)
    return `loot_tables/blocks/${name}.json`
}

// ======================== 配方（Recipes.addShaped / addShapeless / addFurnace）========================
export const tag = (name: string) => ({ tag: name })
type Ing = string | { tag: string }
const ing = (i: Ing) => (typeof i === 'string' ? { item: i } : i)
const counter: Record<string, number> = {}
const recipeId = (result: string) => { const base = result.replace(/^minecraft:/, 'vanilla_').replace(/^.*:/, ''); counter[base] = (counter[base] || 0) + 1; return `eno:${base}_${counter[base]}` }
// 配方一开始就解锁（原模组没有配方书解锁机制）。写法照原版行为包：AlwaysUnlocked 是对象，不是数组
// （数组形式只用于"拿到某物品 / 某标签后解锁"，如 [{ item: '...' }]；之前写成 [{ context: 'AlwaysUnlocked' }] 是混用）
const unlock = (r: any) => { r.definitions.unlock = { context: 'AlwaysUnlocked' }; return r }

export function shaped(result: string, count: number, pattern: string[], keys: Record<string, Ing>) {
    unlock(RecipeAPI.registerSimpleShaped(recipeId(result), { item: result, count }, pattern, Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, ing(v)]))))
}
export function shapeless(result: string, count: number, ingredients: Ing[]) {
    unlock(RecipeAPI.registerSimpleShapeless(recipeId(result), { item: result, count }, ingredients.map(ing)))
}
export function furnace(input: string, output: string, count = 1) {
    if (count <= 1) { RecipeAPI.registerSimpleFurnace(recipeId(output), output, input); return }
    // 一次烧出多个：原版熔炉配方的产物写成 { item, count }
    const id = recipeId(output)
    GRegistry.register(id.replace(':', '_'), 'behavior', 'recipes/', { toObject: () => ({
        format_version: '1.20.10',
        'minecraft:recipe_furnace': { description: { identifier: id }, tags: ['furnace'], input, output: { item: output, count } },
    }) } as any)
}

// ======================== 创造分组（Item.addCreativeGroup）========================
const groups: { name: string, category: Category, ids: string[] }[] = []
export function creativeGroup(name: string, category: Category, ids: string[]) { groups.push({ name, category, ids }) }

/** 全部内容定义完成后调用：创造分组、方块音效（registry 对同名条目"后注册者胜出"，所以 blocks.json 最后写） */
export function finish() {
    const catalog = ItemAPI.createItemCatalog()
    for (const g of groups) catalog.addGroup(g.category as any, g.ids, { icon: g.ids[0], name: g.name })
    catalog.register()
    GRegistry.register('blocks', 'resource', '', { toObject: () => ({ format_version: '1.20.20', ...Object.fromEntries(Object.entries(blockSounds).map(([id, sound]) => [id, { sound }])) }) } as any)
}

/**
 * 寄生树叶：一个方块 + "树种"状态（eno:species），每个树种一张贴图 <贴图前缀>_<树种>。
 * 渲染用 alpha_test_single_sided（单面）：双面渲染时，相邻两块寄生叶贴在一起的两个面位置完全重合，
 * 转动视角时互相争抢深度而闪烁（真机）；单面时这两个面朝向相反，同一时刻只有一个会被画出来。
 */
export function infestedLeaves(id: string, texturePrefix: string, component: string) {
    const mat = (sp: string) => ({ '*': { texture: `${texturePrefix}_${sp}`, render_method: 'alpha_test_single_sided' } })
    const b: any = block(id, `${texturePrefix}_${SPECIES[0]}`, { category: 'nature', hardness: 0.15, explosion: 0.2, sound: 'grass', tools: ['hoe'], tags: ['eno:plant'], noDrop: true, components: [component] })
    b.registerState('eno:species', SPECIES)
    b.addComponent(BlockComponent.setMaterialInstances(mat(SPECIES[0])))
    for (const sp of SPECIES.slice(1)) b.addPermutation(`q.block_state('eno:species') == '${sp}'`, BlockComponent.setMaterialInstances(mat(sp)))
    return b
}
