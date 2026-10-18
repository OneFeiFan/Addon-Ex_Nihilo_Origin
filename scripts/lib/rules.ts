// 与引擎无关的原模组规则（纯函数，便于单元测试）
/** 碎矿 / 矿砂 → 粉碎矿 / 粉末矿：3% 出 7 个，12% 出 6 个，20% 出 5 个，其余 4 个 */
export function oreCount(r = Math.random() * 100) { return r < 3 ? 7 : r < 15 ? 6 : r < 35 ? 5 : 4 }

// ---------- 钩子（M-10）----------
// 作者要求：识别任何树叶（不限树种与放置状态），掉落物生成在方块中心。
// 原模组的 6 种树叶沿用原数值；leaves2 上金 / 干草 / 甘蔗钩原代码因引用未定义变量而失效，这里按原代码写出的数值启用（D-12 修复）。
export type Roll = [chance: number, item: string, count: number]
export type CrookFamily = 'wood_bone' | 'gold' | 'hay_reed'
export const SILKWORM = 'eno:silk_worm'
const S = (w: string) => `minecraft:${w}_sapling`
const APPLE = 'minecraft:apple', VINE = 'minecraft:vine'

const KNOWN: Record<CrookFamily, Record<string, Roll[]>> = {
    wood_bone: {
        oak: [[12, S('oak'), 1], [6, APPLE, 1], [2, SILKWORM, 1]],
        spruce: [[12, S('spruce'), 1], [6, S('spruce'), 2], [2, SILKWORM, 1]],
        birch: [[12, S('birch'), 1], [6, APPLE, 1], [2, SILKWORM, 1]],
        jungle: [[12, S('jungle'), 1], [1, VINE, 1], [2, SILKWORM, 1]],
        acacia: [[12, S('acacia'), 1], [2, SILKWORM, 1]],
        dark_oak: [[12, S('dark_oak'), 1], [9, APPLE, 1], [2, SILKWORM, 1]],
    },
    gold: {
        oak: [[20, S('oak'), 1], [14, APPLE, 1], [10, SILKWORM, 1]],
        spruce: [[20, S('spruce'), 1], [14, S('spruce'), 2], [10, SILKWORM, 1]],
        birch: [[20, S('birch'), 1], [14, APPLE, 1], [10, SILKWORM, 1]],
        jungle: [[20, S('jungle'), 1], [9, VINE, 1], [10, SILKWORM, 1]],
        acacia: [[20, S('acacia'), 1], [10, SILKWORM, 1]],
        dark_oak: [[20, S('dark_oak'), 1], [17, APPLE, 1], [10, SILKWORM, 1]],
    },
    hay_reed: {
        oak: [[15, S('oak'), 1], [9, APPLE, 1], [5, SILKWORM, 1]],
        spruce: [[15, S('spruce'), 1], [9, S('spruce'), 2], [5, SILKWORM, 1]],
        birch: [[15, S('birch'), 1], [9, APPLE, 1], [5, SILKWORM, 1]],
        jungle: [[15, S('jungle'), 1], [4, VINE, 1], [5, SILKWORM, 1]],
        acacia: [[15, S('acacia'), 1], [5, SILKWORM, 1]],
        dark_oak: [[15, S('dark_oak'), 1], [12, APPLE, 1], [5, SILKWORM, 1]],
    },
}
/** 原模组之外的树叶：按同一把钩子的"树苗 / 蚕"概率（与原模组金合欢一行相同的结构） */
const GENERIC: Record<CrookFamily, [sapling: number, silkworm: number]> = { wood_bone: [12, 2], gold: [20, 10], hay_reed: [15, 5] }
const ORIGINAL_SPECIES: Record<string, string> = {
    'minecraft:oak_leaves': 'oak', 'minecraft:spruce_leaves': 'spruce', 'minecraft:birch_leaves': 'birch',
    'minecraft:jungle_leaves': 'jungle', 'minecraft:acacia_leaves': 'acacia', 'minecraft:dark_oak_leaves': 'dark_oak',
}
/** 1.16 之后新增的原版树叶 → 对应的"树苗" */
const NEW_VANILLA_SAPLING: Record<string, string> = {
    'minecraft:mangrove_leaves': 'minecraft:mangrove_propagule', 'minecraft:cherry_leaves': 'minecraft:cherry_sapling',
    'minecraft:azalea_leaves': 'minecraft:azalea', 'minecraft:azalea_leaves_flowered': 'minecraft:flowering_azalea',
    'minecraft:pale_oak_leaves': 'minecraft:pale_oak_sapling',
}
export const VANILLA_LEAVES = [...Object.keys(ORIGINAL_SPECIES), ...Object.keys(NEW_VANILLA_SAPLING)]

/** 任何树叶：原版的全部树叶，以及其他 Addon 中名字带 leaves 的方块 */
export const isLeaves = (typeId: string) => ORIGINAL_SPECIES[typeId] !== undefined || NEW_VANILLA_SAPLING[typeId] !== undefined || /(^|[:_])leaves(_|$)/.test(typeId)

/** 其他 Addon 的树叶：把名字里的 leaves 换成 sapling，物品存在才掉落 */
export function saplingFor(typeId: string, itemExists: (id: string) => boolean): string | undefined {
    if (NEW_VANILLA_SAPLING[typeId]) return NEW_VANILLA_SAPLING[typeId]
    const guess = typeId.replace(/leaves(_[a-z]+)?$/, 'sapling')
    return guess !== typeId && itemExists(guess) ? guess : undefined
}

export function crookRolls(family: CrookFamily, typeId: string, itemExists: (id: string) => boolean): Roll[] {
    if (!isLeaves(typeId)) return []
    const species = ORIGINAL_SPECIES[typeId]
    if (species) return KNOWN[family][species]
    const [sap, silk] = GENERIC[family]
    const sapling = saplingFor(typeId, itemExists)
    return [...(sapling ? [[sap, sapling, 1] as Roll] : []), [silk, SILKWORM, 1]]
}

// ---------- 筛子（M-02）----------
/** SieveCore.randomNum：[min, max] 均匀整数 */
export const randomNum = (min: number, max: number, r = Math.random()) => Math.floor(r * (max - min + 1)) + min
// 2.4：伪随机 + 空手保护（见《与原模组的差异》"筛子"一节）
//   · 伪随机分布（PRD）：每样掉落第 n 次判定的概率是 C·n（n = 距上次掉落的次数），中了就归零。长期平均仍等于目标概率 p，
//     但"盯着某样东西却很久不出"的情况几乎消失（1% 的钻石：普通随机 300 次不出的概率 4.9%，伪随机 0.08%）。
//   · 空手保护（K = 1）：同一个玩家筛同一种方块，连续空手 1 次后，下一次至少出一样（按各物品的概率比例抽）。
//   · 强制出货会让总量变多，所以基础概率先乘补偿系数（scripts/data/sieveComp.ts，按方块和网的倍率预先算好），长期平均不变。
//   · 计数按玩家记（存在玩家身上），不按筛子记——否则开一排筛子轮流点可以"刷"保底。
/** PRD 常数：使"C·n 递增、中了归零"的长期平均概率等于 p（二分求解，结果缓存） */
const prdCache = new Map<number, number>()
export function prdC(p: number): number {
    if (p >= 1) return 1
    if (p <= 0) return 0
    const key = Math.round(p * 1e6)
    const hit = prdCache.get(key)
    if (hit !== undefined) return hit
    let lo = 0, hi = p
    for (let it = 0; it < 60; it++) {
        const c = (lo + hi) / 2
        let surv = 1, expected = 0, n = 1
        while (surv > 1e-12 && c * n < 1) { const q = c * n; expected += n * surv * q; surv *= 1 - q; n++ }
        expected += n * surv
        if (1 / expected > p) hi = c; else lo = c
    }
    const c = (lo + hi) / 2
    prdCache.set(key, c)
    return c
}
/** 每个玩家的筛子记忆：n[方块|物品] = 距上次掉落的判定次数；e[方块] = 连续空手次数 */
export interface SieveMemory { n: Record<string, number>, e: Record<string, number> }
export const EMPTY_GUARD = 1
/**
 * 一次结算。rounds：普通筛 1、重型筛 6（每一轮都是一次完整的判定，计数照常推进）。
 * mult：网的倍率；comp：补偿系数；概率 = 基础概率 × mult × comp（上限 100%）
 */
export function sieveRolls(input: string, drops: { item: string, min: number, max: number, chance: number }[], mult: number, comp: number, rounds: number, mem: SieveMemory, rnd = Math.random) {
    const out: [string, number][] = []
    const ps = drops.map((d) => Math.min(1, (d.chance / 100) * mult * comp))
    for (let a = 0; a < rounds; a++) {
        const hits: number[] = []
        drops.forEach((d, i) => {
            const key = `${input}|${d.item}`
            const n = (mem.n[key] ?? 0) + 1
            if (ps[i] > 0 && rnd() < Math.min(1, prdC(ps[i]) * n)) { hits.push(i); mem.n[key] = 0 }
            else mem.n[key] = n
        })
        if (!hits.length && (mem.e[input] ?? 0) >= EMPTY_GUARD) {
            const total = ps.reduce((x, y) => x + y, 0)
            if (total > 0) {
                let r = rnd() * total, i = 0
                while (i < ps.length - 1 && r >= ps[i]) { r -= ps[i]; i++ }
                hits.push(i); mem.n[`${input}|${drops[i].item}`] = 0
            }
        }
        mem.e[input] = hits.length ? 0 : (mem.e[input] ?? 0) + 1
        for (const i of hits) { const d = drops[i]; const n = randomNum(d.min, d.max, rnd()); if (n > 0) out.push([d.item, n]) }
    }
    return out
}
export const SIEVE_CLICKS = 14
