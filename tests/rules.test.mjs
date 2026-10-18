// 运行：node --experimental-strip-types --test tests/
import test from 'node:test'
import assert from 'node:assert/strict'
import { oreCount } from '../scripts/lib/rules.ts'

test('碎矿锤成粉碎矿的数量分布：3% / 12% / 20% / 65%', () => {
    const c = { 4: 0, 5: 0, 6: 0, 7: 0 }
    for (let r = 0; r < 100; r += 0.01) c[oreCount(r)]++
    const total = 10000
    assert.ok(Math.abs(c[7] / total - 0.03) < 0.001)
    assert.ok(Math.abs(c[6] / total - 0.12) < 0.001)
    assert.ok(Math.abs(c[5] / total - 0.20) < 0.001)
    assert.ok(Math.abs(c[4] / total - 0.65) < 0.001)
})

import { crookRolls, isLeaves, saplingFor, SILKWORM } from '../scripts/lib/rules.ts'
const exists = (id) => ['minecraft:cherry_sapling', 'other:maple_sapling'].includes(id)

test('钩子识别任何树叶：原版新树种、其他 Addon 的树叶都算，寄生叶不算', () => {
    for (const id of ['minecraft:oak_leaves', 'minecraft:cherry_leaves', 'minecraft:azalea_leaves_flowered', 'other:maple_leaves', 'other:leaves']) assert.ok(isLeaves(id), id)
    for (const id of ['minecraft:oak_log', 'eno:infested_leaf0', 'eno:infested_raw0', 'other:sleeves_block']) assert.ok(!isLeaves(id), id)
})

test('原模组 6 种树叶沿用原数值；leaves2 上金钩按原代码数值启用', () => {
    assert.deepEqual(crookRolls('wood_bone', 'minecraft:spruce_leaves', exists), [[12, 'minecraft:spruce_sapling', 1], [6, 'minecraft:spruce_sapling', 2], [2, SILKWORM, 1]])
    assert.deepEqual(crookRolls('gold', 'minecraft:dark_oak_leaves', exists), [[20, 'minecraft:dark_oak_sapling', 1], [17, 'minecraft:apple', 1], [10, SILKWORM, 1]])
})

test('新树叶：按钩子的树苗 / 蚕概率；找不到树苗时只出蚕', () => {
    assert.deepEqual(crookRolls('hay_reed', 'minecraft:mangrove_leaves', exists), [[15, 'minecraft:mangrove_propagule', 1], [5, SILKWORM, 1]])
    assert.deepEqual(crookRolls('gold', 'other:maple_leaves', exists), [[20, 'other:maple_sapling', 1], [10, SILKWORM, 1]])
    assert.deepEqual(crookRolls('gold', 'other:ghost_leaves', exists), [[10, SILKWORM, 1]])
    assert.equal(saplingFor('minecraft:azalea_leaves_flowered', exists), 'minecraft:flowering_azalea')
})

import { sieveRolls, randomNum, prdC } from '../scripts/lib/rules.ts'
import { SIEVE } from '../scripts/data/sieve.ts'
import { sieveComp } from '../scripts/data/sieveComp.ts'
import { precipitate } from '../scripts/data/barrel.ts'
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }

test('伪随机常数：长期平均等于目标概率', () => {
    for (const p of [0.01, 0.07, 0.25, 0.6]) {
        const c = prdC(p), rnd = mulberry32(7)
        let n = 0, hits = 0
        for (let i = 0; i < 200000; i++) { n++; if (rnd() < Math.min(1, c * n)) { hits++; n = 0 } }
        assert.ok(Math.abs(hits / 200000 - p) < p * 0.03 + 0.001, `p=${p} 实际 ${hits / 200000}`)
    }
})

test('筛子：空手保护 K = 1（绝不连续两次空手），补偿后长期平均与"基础概率 × 网倍率"一致', () => {
    for (const input of ['minecraft:sand', 'minecraft:gravel', 'eno:dust', 'minecraft:soul_sand', 'eno:gravel_nether', 'eno:gravel_ender']) {
        for (const mult of [1, 1.5]) {
            const drops = SIEVE.drops[input].map((d) => ({ ...d, min: 1, max: 1 }))
            const mem = { n: {}, e: {} }, rnd = mulberry32(99)
            let total = 0, streak = 0, maxStreak = 0
            for (let i = 0; i < 60000; i++) {
                const got = sieveRolls(input, drops, mult, sieveComp(input, mult), 1, mem, rnd).length
                total += got; streak = got ? 0 : streak + 1; maxStreak = Math.max(maxStreak, streak)
            }
            const target = drops.reduce((s, d) => s + Math.min(1, d.chance / 100 * mult), 0)
            assert.ok(maxStreak <= 1, `${input} 连续空手 ${maxStreak} 次`)
            assert.ok(Math.abs(total / 60000 - target) < target * 0.03, `${input} ×${mult}：平均 ${total / 60000}，目标 ${target}`)
        }
    }
})

test('重型筛一次 6 轮；数量在 [min, max] 内', () => {
    const drops = [{ item: 'a', min: 2, max: 4, chance: 100 }]
    const out = sieveRolls('x', drops, 1, 1, 6, { n: {}, e: {} }, mulberry32(1))
    assert.equal(out.length, 6)
    assert.ok(out.every(([, n]) => n >= 2 && n <= 4))
    assert.equal(randomNum(2, 4, 0), 2); assert.equal(randomNum(2, 4, 0.9999), 4)
})

test('卤水沉淀：每桶至少一样，期望 铁 0.72 / 铜 0.86 / 金 0.22', () => {
    const rnd = mulberry32(3), sum = {}
    for (let i = 0; i < 100000; i++) {
        const out = precipitate(rnd)
        assert.ok(out.length >= 1)
        for (const [id, n] of out) sum[id] = (sum[id] ?? 0) + n
    }
    const ev = (id) => sum[id] / 100000
    assert.ok(Math.abs(ev('eno:iron_dust_salts') - 0.72) < 0.02)
    assert.ok(Math.abs(ev('eno:copper_dust_salts') - 0.855) < 0.02)
    assert.ok(Math.abs(ev('eno:gold_dust_salts') - 0.22) < 0.01)
})
