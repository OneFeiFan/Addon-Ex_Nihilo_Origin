// 女巫水炼药的规则（纯函数，有单元测试）。见 docs/女巫水炼药与坩埚.md
// 木坩埚里装 1 桶女巫水 → 放效果材料 → 可选放修饰材料 → 静置成药 → 玻璃瓶取出（每瓶 1/3 桶，全部是喷溅型）。
// 放错材料（先放修饰、或放第二种效果）→ 失败反应：之后不能再放东西，几秒后整锅蒸发。

export type Mod = '' | 'long' | 'strong'
export interface Brew { eff: string, mod: Mod, t: number, fail: number, bottles: number }
export const EMPTY_BREW: Brew = { eff: '', mod: '', t: 0, fail: 0, bottles: 0 }

export const BOTTLES = 3            // 1 桶出 3 瓶
export const BREW_TICKS = 800       // 静置 40 秒（放最后一样材料后重新计时）
export const FAIL_TICKS = 60        // 失败反应 3 秒后蒸发

/** 效果材料 → 药水效果 */
export const EFFECT: Record<string, string> = {
    'minecraft:fermented_spider_eye': 'weakness',
    'minecraft:spider_eye': 'poison',
    'minecraft:slime_ball': 'slowness',
}
/** 修饰材料 → 修饰（与原版一致：红石延长、萤石粉加强） */
export const MODIFIER: Record<string, Mod> = { 'minecraft:redstone': 'long', 'minecraft:glowstone_dust': 'strong' }
/** 原版有哪些变体（虚弱没有加强版） */
const VARIANTS: Record<string, Mod[]> = { weakness: ['', 'long'], poison: ['', 'long', 'strong'], slowness: ['', 'long', 'strong'] }

/** 放入一样东西：'ok' 放进去了、'reject' 放不进去（不消耗）、'fail' 放错了（消耗，进入失败反应） */
export function addIngredient(b: Brew, item: string): 'ok' | 'reject' | 'fail' {
    if (b.bottles <= 0 || b.fail > 0) return 'reject'
    if (EFFECT[item]) {
        if (b.eff) { b.fail = 1; return 'fail' }            // 两种效果打架
        b.eff = EFFECT[item]; b.t = 0; return 'ok'
    }
    const m = MODIFIER[item]
    if (m) {
        if (!b.eff) { b.fail = 1; return 'fail' }           // 修饰放早了
        if (!VARIANTS[b.eff].includes(m)) return 'reject'   // 原版没有这个变体（虚弱 + 萤石粉）
        if (b.mod === m) return 'reject'
        b.mod = m; b.t = 0; return 'ok'                     // 后放的修饰覆盖先放的（长效药水加萤石粉 → 加强版）
    }
    return 'reject'
}
export const ready = (b: Brew) => b.bottles > 0 && !!b.eff && b.fail === 0 && b.t >= BREW_TICKS
/** 原版药水类型 ID（给 Potions.resolve） */
export const potionId = (b: Brew) => `minecraft:${b.mod ? b.mod + '_' : ''}${b.eff}`
