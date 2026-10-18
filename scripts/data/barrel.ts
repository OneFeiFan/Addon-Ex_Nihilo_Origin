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
}
/** 空桶 + 液体 → 装满的桶 */
export const FILL: Record<string, Record<string, string>> = {
    'minecraft:bucket': { water: 'minecraft:water_bucket', lava: 'minecraft:lava_bucket' },
    'eno:bucket_porcelain_empty': { water: 'eno:bucket_porcelain_water', lava: 'eno:bucket_porcelain_lava' },
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
