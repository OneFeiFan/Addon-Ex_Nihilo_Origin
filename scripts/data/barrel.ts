// 木桶的数据：堆肥、液体配方、内容物贴图
// 对应原模组：BLOCKS/MACHINE/barrel.js（Barrel.dataSet / dataAdd / modelset）、CORE/BarrelCore.js
// 本文件不引用引擎接口，构建期（内容物实体的贴图表）和运行期共用。

// ---------- 内容物实体的贴图表：编号即实体属性 eno:t 的取值 ----------
export const BARREL_TEXTURES: string[] = []
const tex = (path: string) => { BARREL_TEXTURES.push(path); return BARREL_TEXTURES.length - 1 }
/** 堆肥底色 ex_0..ex_20，每种 21 档（原模组 101 帧逐像素插值到泥土，取第 0、5、10…100 帧） */
for (let b = 0; b <= 20; b++) for (let s = 0; s <= 20; s++) tex(`textures/entity/eno/barrel/ex_${b}_${s * 5}`)
export const compostTexture = (base: number, step: number) => base * 21 + step
/** 动画液体：连续 N 张帧贴图（原模组的竖排动画贴图拆开），渲染控制器按时间加上帧号 */
const frames = (name: string, n: number) => { const first = tex(`textures/entity/eno/barrel/${name}_0`); for (let i = 1; i < n; i++) tex(`textures/entity/eno/barrel/${name}_${i}`); return first }
export const LIQUID_TEXTURE: Record<string, number> = {
    water: frames('ex_water', 32),   // 32 帧，每帧 1 tick（原模组 ex_water.anim.1）
    lava: frames('ex_lava', 20),     // 20 帧，每帧 8 tick（原模组 ex_lava.anim.8）
    waterwitch: tex('textures/entity/eno/barrel/ex_waterwitch'),
    waterslime: tex('textures/entity/eno/barrel/ex_waterslime'),
    brine: tex('textures/entity/eno/barrel/ex_brine'),   // 2.4：卤水（粗盐溶在水里）
    geode: tex('textures/entity/eno/barrel/ex_geode'),   // 2.7：母岩溶液（岩浆 + 紫水晶碎片）
}
/**
 * 盐反应的过程显示（贴图由 tools/gen_salt_textures.py 生成）：
 *   放粗盐：水面中央浮起一片像浮冰的盐壳，每放一个长大一圈（salty 1–4）
 *   溶解（20 秒）：盐壳裂成碎块、从边缘慢慢化掉，水逐渐变成浑浊的卤水（dissolve 1–6）
 *   加灰烬后（10 秒）：卤水里泛起白色絮状物、越来越浓（precip 1–6），完成后是一层灰白色的结晶（sediment），取走粉盐后变回清水
 */
export const SALT_TEXTURE = {
    salty: [1, 2, 3, 4].map((n) => tex(`textures/entity/eno/barrel/ex_salty_${n}`)),
    dissolve: [1, 2, 3, 4, 5, 6].map((n) => tex(`textures/entity/eno/barrel/ex_dissolve_${n}`)),
    precip: [1, 2, 3, 4, 5, 6].map((n) => tex(`textures/entity/eno/barrel/ex_precip_${n}`)),
    sediment: tex('textures/entity/eno/barrel/ex_sediment'),
}
/** 产物（Barrel.modelset）：桶里显示成满满一块 */
export const OUTPUT_TEXTURE: Record<string, number> = {
    'minecraft:dirt': tex('textures/blocks/dirt'),
    'minecraft:end_stone': tex('textures/blocks/end_stone'),
    'minecraft:obsidian': tex('textures/blocks/obsidian'),
    'minecraft:netherrack': tex('textures/blocks/netherrack'),
    'minecraft:clay': tex('textures/blocks/clay'),
    'minecraft:ice': tex('textures/blocks/ice'),
    'minecraft:amethyst_shard': tex('textures/blocks/amethyst_block'),   // 2.7：母岩溶液凝固后
    'minecraft:soul_sand': tex('textures/blocks/soul_sand'),
    'minecraft:slime_ball': tex('textures/entity/eno/barrel/ex_slime'),
}

/** 动画贴图：编号 → [帧数, 每帧 tick 数]（渲染控制器的 uv_anim 按它逐帧取图） */
export const ANIMATED: Record<number, [number, number]> = {}
ANIMATED[LIQUID_TEXTURE.water] = [32, 1]
ANIMATED[LIQUID_TEXTURE.lava] = [20, 8]

// ---------- 堆肥（Barrel.dataSet("null", …)）：物品、体积（满 1000 开始发酵）、堆肥底色 ----------
export const COMPOST: Record<string, { volume: number, base: number }> = {}
const compost = (item: string, volume: number, base: number) => { COMPOST[item] = { volume, base } }

for (const w of ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak']) compost(`minecraft:${w}_sapling`, 125, 1)
for (const w of ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak']) compost(`minecraft:${w}_leaves`, 125, 1)
compost('minecraft:rotten_flesh', 100, 2)
compost('minecraft:spider_eye', 160, 3)
compost('minecraft:dandelion', 100, 14)
compost('minecraft:poppy', 100, 5)
compost('minecraft:blue_orchid', 100, 6)
compost('minecraft:allium', 100, 4)
compost('minecraft:azure_bluet', 100, 7)
compost('minecraft:red_tulip', 100, 9)
compost('minecraft:orange_tulip', 100, 9)
compost('minecraft:white_tulip', 100, 0)
compost('minecraft:pink_tulip', 100, 10)
compost('minecraft:oxeye_daisy', 100, 7)
compost('minecraft:sunflower', 125, 14)
compost('minecraft:lilac', 125, 4)
compost('minecraft:tall_grass', 125, 1)
compost('minecraft:large_fern', 125, 1)
compost('minecraft:rose_bush', 125, 8)
compost('minecraft:peony', 125, 10)
compost('minecraft:brown_mushroom', 125, 11)
compost('minecraft:red_mushroom', 125, 12)
compost('minecraft:wheat', 160, 13)
compost('minecraft:pumpkin_pie', 160, 2)
compost('minecraft:egg', 80, 13)
compost('minecraft:porkchop', 200, 15)
compost('minecraft:beef', 200, 8)
compost('minecraft:cooked_beef', 200, 16)
compost('minecraft:chicken', 200, 12)
compost('minecraft:cooked_chicken', 200, 2)
compost('minecraft:cod', 150, 17)
compost('minecraft:cooked_cod', 150, 18)
compost('minecraft:apple', 180, 8)
compost('minecraft:golden_apple', 180, 14)
compost('minecraft:melon_slice', 40, 8)
compost('minecraft:melon_block', 166.7, 8)
compost('minecraft:pumpkin', 166.7, 13)
compost('minecraft:cactus', 166.7, 19)
compost('minecraft:carrot', 80, 9)
compost('minecraft:potato', 160, 13)
compost('minecraft:baked_potato', 160, 13)
compost('minecraft:poisonous_potato', 160, 19)
compost('minecraft:waterlily', 100, 1)
compost('minecraft:vine', 100, 1)
compost('minecraft:salmon', 150, 5)
compost('minecraft:cooked_salmon', 150, 2)
compost('minecraft:tropical_fish', 150, 9)
compost('minecraft:pufferfish', 150, 20)
compost('minecraft:mutton', 200, 8)
compost('minecraft:cooked_mutton', 200, 16)
compost('minecraft:rabbit', 200, 12)
compost('minecraft:cooked_rabbit', 200, 2)
compost('minecraft:string', 30, 0)
compost('minecraft:ghast_tear', 160, 0)
compost('minecraft:nether_wart', 100, 5)
compost('minecraft:sugar_cane', 100, 19)
compost('eno:dust_saw', 125, 13)
compost('minecraft:bamboo', 125, 19)
compost('minecraft:sea_pickle', 160, 13)
compost('minecraft:kelp', 125, 1)
compost('eno:silk_worm', 40, 7)
compost('eno:cooked_silk_worm', 40, 16)

// ---- 2.8 生物群系有机物（1.13 以后的新植物、下界植物、海洋生物等）----
// 体积按与已有物品的相似程度定：小植物 / 叶子 ≈ 树苗 125；花 100；薄的（地毯、花簇、海草）50–60；
// 方块大小的植物（苔藓块、菌岩、菌光体、蘑菇方块、珊瑚块）≈ 西瓜 / 南瓜 166.7（6 个一块泥土）；
// 浆果等小果实 ≈ 西瓜片 40；储存方块（干草块、干海带块）≈ 装满一桶。木头类（菌柄、树干）不能堆肥。
// 底色（最后一个数）取 ex_0..ex_20 里最接近的颜色：1 绿、5 红、17 青绿、14 黄、4 / 10 粉紫、16 棕、13 土黄、0 白。
const organics: [string, number, number][] = [
    // 原版早就有、但原模组漏掉的
    ['minecraft:short_grass', 80, 1], ['minecraft:fern', 80, 1], ['minecraft:deadbush', 80, 16], ['minecraft:cornflower', 100, 6],
    ['minecraft:lily_of_the_valley', 100, 0], ['minecraft:beetroot', 80, 3], ['minecraft:bread', 160, 13], ['minecraft:cookie', 40, 16],
    ['minecraft:cake', 500, 0], ['minecraft:hay_block', 1000, 13], ['minecraft:dried_kelp', 100, 16], ['minecraft:dried_kelp_block', 900, 16],
    // 浆果
    ['minecraft:sweet_berries', 40, 5], ['minecraft:glow_berries', 40, 9],
    // 新树种与林下植物
    ['minecraft:cherry_sapling', 125, 10], ['minecraft:cherry_leaves', 125, 10], ['minecraft:pink_petals', 50, 10],
    ['minecraft:mangrove_propagule', 125, 1], ['minecraft:mangrove_leaves', 125, 1], ['minecraft:mangrove_roots', 100, 16],
    ['minecraft:azalea', 125, 1], ['minecraft:flowering_azalea', 125, 4], ['minecraft:azalea_leaves', 125, 1], ['minecraft:azalea_leaves_flowered', 125, 4],
    ['minecraft:pale_oak_sapling', 125, 7], ['minecraft:pale_oak_leaves', 125, 7], ['minecraft:pale_moss_block', 166.7, 7],
    ['minecraft:pale_moss_carpet', 50, 7], ['minecraft:pale_hanging_moss', 100, 7], ['minecraft:open_eyeblossom', 100, 9], ['minecraft:closed_eyeblossom', 100, 7],
    // 繁茂洞穴
    ['minecraft:moss_block', 166.7, 1], ['minecraft:moss_carpet', 50, 1], ['minecraft:spore_blossom', 125, 4], ['minecraft:big_dripleaf', 125, 1],
    ['minecraft:small_dripleaf_block', 100, 1], ['minecraft:hanging_roots', 100, 16], ['minecraft:glow_lichen', 60, 19],
    // 嗅探兽植物、新的小植物
    ['minecraft:torchflower', 100, 9], ['minecraft:pitcher_plant', 125, 6], ['minecraft:pitcher_pod', 60, 1],
    ['minecraft:cactus_flower', 100, 10], ['minecraft:leaf_litter', 50, 16], ['minecraft:bush', 125, 1], ['minecraft:firefly_bush', 125, 1],
    ['minecraft:short_dry_grass', 60, 13], ['minecraft:tall_dry_grass', 100, 13], ['minecraft:wildflowers', 50, 14],
    // 下界植物（菌柄、菌核是木头，不能堆肥）
    ['minecraft:crimson_fungus', 125, 5], ['minecraft:warped_fungus', 125, 17], ['minecraft:crimson_roots', 100, 5], ['minecraft:warped_roots', 100, 17],
    ['minecraft:nether_sprouts', 60, 17], ['minecraft:weeping_vines', 100, 5], ['minecraft:twisting_vines', 100, 17],
    ['minecraft:nether_wart_block', 166.7, 5], ['minecraft:warped_wart_block', 166.7, 17], ['minecraft:shroomlight', 166.7, 14],
    // 蘑菇方块、紫颂
    ['minecraft:brown_mushroom_block', 166.7, 11], ['minecraft:red_mushroom_block', 166.7, 12], ['minecraft:mushroom_stem', 166.7, 11],
    ['minecraft:chorus_fruit', 100, 4], ['minecraft:chorus_flower', 125, 4],
    // 海洋：海草、珊瑚（珊瑚是动物，与肉类一样可以堆肥）
    ['minecraft:seagrass', 60, 1],
    ...['tube', 'brain', 'bubble', 'fire', 'horn'].flatMap((c, i): [string, number, number][] => {
        const base = [6, 4, 4, 5, 14][i]
        return [[`minecraft:${c}_coral`, 100, base], [`minecraft:${c}_coral_fan`, 80, base], [`minecraft:${c}_coral_block`, 166.7, base]]
    }),
]
for (const [item, volume, base] of organics) compost(item, volume, base)

// ---------- 液体配方（Barrel.dataSet(液体, …)）：桶里有 1 桶该液体时放入物品，立即得到产物 ----------
export const LIQUID_RECIPES: Record<string, Record<string, string>> = { water: {}, lava: {}, waterwitch: {} }
const liquidRecipe = (liquid: string, item: string, output: string) => { LIQUID_RECIPES[liquid][item] = output }
liquidRecipe('water', 'eno:dust', 'minecraft:clay')
liquidRecipe('waterwitch', 'minecraft:sand', 'minecraft:soul_sand')
liquidRecipe('lava', 'minecraft:glowstone_dust', 'minecraft:end_stone')
liquidRecipe('lava', 'minecraft:redstone', 'minecraft:netherrack')

// ---------- 液体容器（LiquidRegistry）：装满的桶 → 液体 / 空桶 ----------
export const BUCKETS: Record<string, { liquid: string, empty: string }> = {
    'minecraft:water_bucket': { liquid: 'water', empty: 'minecraft:bucket' },
    'minecraft:lava_bucket': { liquid: 'lava', empty: 'minecraft:bucket' },
    'minecraft:milk_bucket': { liquid: 'milk', empty: 'minecraft:bucket' },
    'eno:bucket_porcelain_water': { liquid: 'water', empty: 'eno:bucket_porcelain_empty' },
    'eno:bucket_porcelain_lava': { liquid: 'lava', empty: 'eno:bucket_porcelain_empty' },
    // 2.5：女巫水桶——女巫水只能在木桶里生成，用桶舀到木坩埚炼药
    'eno:bucket_witch_water': { liquid: 'waterwitch', empty: 'minecraft:bucket' },
    'eno:bucket_porcelain_witch_water': { liquid: 'waterwitch', empty: 'eno:bucket_porcelain_empty' },
}
/** 空桶 + 液体 → 装满的桶 */
export const FILL: Record<string, Record<string, string>> = {
    'minecraft:bucket': { water: 'minecraft:water_bucket', lava: 'minecraft:lava_bucket', waterwitch: 'eno:bucket_witch_water' },
    'eno:bucket_porcelain_empty': { water: 'eno:bucket_porcelain_water', lava: 'eno:bucket_porcelain_lava', waterwitch: 'eno:bucket_porcelain_witch_water' },
}
/** 空桶能装进哪些液体（LiquidSet.limitSet("Barrel")）：键为桶里当前的液体（'' = 空） */
export const LIQUID_LIMITS: Record<string, string[]> = { '': ['water', 'lava', 'waterwitch'], water: ['water'], lava: ['lava'], waterslime: [], brine: [] }

// ---------- 2.4 盐：粗盐溶成卤水，加灰烬沉淀出粉盐（见《与原模组的差异》"盐"一节）----------
// 1 桶水里一个一个放入 4 个粗盐 → 静置 20 秒变成卤水；卤水里放 1 个灰烬（草木灰，碱）→ 10 秒后沉淀出铁 / 铜 / 金的粉盐，桶里留下一桶水。
// 依据：加碱让溶液里的金属离子以氢氧化物 / 碳酸盐的形式沉淀（湿法冶金里最基础的"碱沉淀"）。
export const SALT_PER_BRINE = 4
export const DISSOLVE_TICKS = 400      // 20 秒
export const PRECIPITATE_TICKS = 200   // 10 秒
/**
 * 沉淀表：比例按原版矿石的含量（铁 : 铜 : 金 ≈ 1 : 1.2 : 0.3），每桶期望 铁 0.72、铜 0.86、金 0.22 个粉盐。
 * 每桶至少出一样（避免白做）；为了期望不变，基础概率 48% / 57% / 22% 先乘 0.767。
 */
export const PRECIPITATE: { item: string, chance: number, min: number, max: number }[] = [
    { item: 'eno:iron_dust_salts', chance: 0.368, min: 1, max: 2 },
    { item: 'eno:copper_dust_salts', chance: 0.437, min: 1, max: 2 },
    { item: 'eno:gold_dust_salts', chance: 0.169, min: 1, max: 1 },
]
export function precipitate(rnd = Math.random): [string, number][] {
    const n = (d: { min: number, max: number }) => d.min + Math.floor(rnd() * (d.max - d.min + 1))
    const out: [string, number][] = []
    for (const d of PRECIPITATE) if (rnd() < d.chance) out.push([d.item, n(d)])
    if (!out.length) {
        let r = rnd() * PRECIPITATE.reduce((s, d) => s + d.chance, 0), i = 0
        while (i < PRECIPITATE.length - 1 && r >= PRECIPITATE[i].chance) { r -= PRECIPITATE[i].chance; i++ }
        out.push([PRECIPITATE[i].item, n(PRECIPITATE[i])])
    }
    return out
}

// ---------- 2.5 结冰（docs/木桶结冰.md）----------
// 满满一桶水，Y ≥ 120、亮度 ≤ 7 时慢慢结冰，120 秒结成冰块（右键取出）；方块光 ≥ 12 时冰慢慢融化，120 秒变回一桶水。
// 依据：原版的温度随高度降低（高处的水会结冰），冰在方块光大于 11 时融化。
// 液面用原版霜冰的四帧碎裂贴图：结冰时倒着播（裂纹慢慢合拢），融化时正着播。
export const FREEZE_TICKS = 2400, FREEZE_Y = 120, FREEZE_LIGHT = 7, MELT_LIGHT = 12
export const FROST_TEXTURE = [0, 1, 2, 3].map((i) => tex(`textures/blocks/frosted_ice_${i}`))   // 0 = 裂纹最少

// ---------- 2.7 紫水晶：木桶里的母岩溶液 ----------
// 装 1 桶岩浆的木桶放入 1 个紫水晶碎片（消耗）→ 岩浆变成母岩溶液。之后按"随机刻"在木桶的东南西北和下方
// 随机挑一个位置：是空气就长出小型紫水晶芽，是芽就长大一级（小 → 中 → 大 → 紫水晶簇）。每长一级消耗 1/4 桶，
// 所以 1 桶岩浆最多长成一整簇（作者要求）；随机落在不同位置时，可能是几个没长完的芽。
// 芽、簇都是原版方块：芽打掉什么都不掉，只有长成的簇才掉碎片（原版规则）。
// 没有能长的位置、或岩浆用完时记一次失败，连续 5 次失败后溶液凝固；右键敲掉凝固物得到 2–3 个碎片，木桶变空。
export const GEODE_STEPS = 4               // 1 桶岩浆 = 4 级生长 = 1 整簇
export const GEODE_TICK = 1200             // 平均每 60 秒一次"随机刻"
export const GEODE_FAILS = 5
export const AMETHYST_STAGES = ['minecraft:small_amethyst_bud', 'minecraft:medium_amethyst_bud', 'minecraft:large_amethyst_bud', 'minecraft:amethyst_cluster']
