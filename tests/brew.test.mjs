import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addIngredient, potionId, ready, EMPTY_BREW, BOTTLES, BREW_TICKS } from '../scripts/lib/brew.ts'

const fresh = () => ({ ...EMPTY_BREW, bottles: BOTTLES })
test('效果 → 修饰 → 成药', () => {
    const b = fresh()
    assert.equal(addIngredient(b, 'minecraft:spider_eye'), 'ok')
    assert.equal(addIngredient(b, 'minecraft:redstone'), 'ok')
    assert.equal(potionId(b), 'minecraft:long_poison')
    assert.equal(ready(b), false); b.t = BREW_TICKS; assert.equal(ready(b), true)
    assert.equal(addIngredient(b, 'minecraft:glowstone_dust'), 'ok')   // 长效 + 萤石粉 → 加强版
    assert.equal(potionId(b), 'minecraft:strong_poison'); assert.equal(b.t, 0)
})
test('放错：修饰放早了 / 两种效果 → 失败，之后放不进东西', () => {
    const a = fresh(); assert.equal(addIngredient(a, 'minecraft:redstone'), 'fail'); assert.equal(addIngredient(a, 'minecraft:spider_eye'), 'reject')
    const b = fresh(); addIngredient(b, 'minecraft:slime_ball'); assert.equal(addIngredient(b, 'minecraft:fermented_spider_eye'), 'fail')
})
test('虚弱没有加强版；无关物品放不进去', () => {
    const b = fresh(); addIngredient(b, 'minecraft:fermented_spider_eye')
    assert.equal(addIngredient(b, 'minecraft:glowstone_dust'), 'reject'); assert.equal(potionId(b), 'minecraft:weakness')
    assert.equal(addIngredient(b, 'minecraft:dirt'), 'reject')
})
