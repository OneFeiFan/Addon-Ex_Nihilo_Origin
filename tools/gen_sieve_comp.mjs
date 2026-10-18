// 生成筛子的补偿系数表 scripts/data/sieveComp.ts（改了筛子掉落表或网的倍率后运行一次）：
//   node --experimental-strip-types tools/gen_sieve_comp.mjs
// 对每种可筛方块、每种网的倍率，模拟伪随机 + 空手保护，二分找一个系数，使长期平均掉落次数与"基础概率 × 网倍率"相同。
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { SIEVE } from '../scripts/data/sieve.ts'
import { sieveRolls } from '../scripts/lib/rules.ts'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
const N = 40000
function average(input, drops, mult, comp) {
    const rnd = mulberry32(12345), mem = { n: {}, e: {} }
    let hits = 0
    // 只数"掉了几样"（不管每样几个），补偿的是强制出货多出来的次数
    const one = drops.map((d) => ({ ...d, min: 1, max: 1 }))
    for (let i = 0; i < N; i++) hits += sieveRolls(input, one, mult, comp, 1, mem, rnd).length
    return hits / N
}
const table = {}
for (const g of ['ex', 'co']) {
    const mults = [...new Set(SIEVE.groups[g].meshes.map((m) => m.mult))]
    for (const c of SIEVE.groups[g].contents) {
        const drops = SIEVE.drops[c.id] ?? []
        table[c.id] = {}
        for (const mult of mults) {
            const target = drops.reduce((s, d) => s + Math.min(1, d.chance / 100 * mult), 0)
            let lo = 0.05, hi = 1
            if (average(c.id, drops, mult, 1) <= target * 1.002) { table[c.id][mult] = 1; continue }
            for (let it = 0; it < 18; it++) { const m = (lo + hi) / 2; if (average(c.id, drops, mult, m) > target) hi = m; else lo = m }
            table[c.id][mult] = Math.round((lo + hi) / 2 * 1000) / 1000
        }
        console.log(c.id, JSON.stringify(table[c.id]))
    }
}
const body = `// 由 tools/gen_sieve_comp.mjs 生成，请勿手改。改了 scripts/data/sieve.ts 的掉落表或网的倍率后重新运行：
//   node --experimental-strip-types tools/gen_sieve_comp.mjs
// 筛子补偿系数：[可筛方块][网的倍率] → 基础概率要乘的系数（抵消"空手保护"强制出货多出来的量，长期平均不变）
export const SIEVE_COMP: Record<string, Record<string, number>> = ${JSON.stringify(table, null, 4)}
export const sieveComp = (input: string, mult: number) => SIEVE_COMP[input]?.[String(mult)] ?? 1
`
fs.writeFileSync(path.join(ROOT, 'scripts/data/sieveComp.ts'), body)
console.log('→ scripts/data/sieveComp.ts')
