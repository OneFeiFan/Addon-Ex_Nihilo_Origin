// 催熟：骨粉催熟紫颂苗（原版骨粉点在自定义方块上不会自动生效）。
// 灰烬不再直接当骨粉用：改为"灰烬 + 任意一份肉 → 2 份骨粉"（作者决定，见 recipes.ts），得到的是真正的原版骨粉。
// 下面对原版作物的模拟目前没有入口在用，保留以备将来需要（例如别的物品也要能催熟）：
//   · 小麦、胡萝卜、马铃薯、甜菜根、南瓜 / 西瓜茎（growth 0–7）：长 2–5 个阶段
//   · 甜浆果丛（growth 0–3）、可可豆（age 0–2）：长 1 个阶段
//   · 树苗：45% 进入下一阶段；已经是第二阶段时长成树（/place feature）
//   · 草方块：在周围的草方块上长出草和花
//   · 紫颂苗（eno:stage 0–3）：长 1 到剩余阶段数个阶段
// 与原版骨粉相同：生存模式消耗 1 个，创造模式不消耗；播放骨粉音效和绿色粒子。
import { Block, Player, BlockPermutation, GameMode, EquipmentSlot } from '@minecraft/server'

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const CROPS7 = new Set(['minecraft:wheat', 'minecraft:carrots', 'minecraft:potatoes', 'minecraft:beetroot', 'minecraft:melon_stem', 'minecraft:pumpkin_stem'])
const TREE: Record<string, string> = {
    'minecraft:oak_sapling': 'minecraft:oak_tree_feature', 'minecraft:birch_sapling': 'minecraft:birch_tree_feature',
    'minecraft:spruce_sapling': 'minecraft:spruce_tree_feature', 'minecraft:jungle_sapling': 'minecraft:jungle_tree_feature',
    'minecraft:acacia_sapling': 'minecraft:savanna_tree_feature', 'minecraft:cherry_sapling': 'minecraft:cherry_tree_feature',
}

function withState(b: Block, state: string, value: number | boolean) { b.setPermutation(b.permutation.withState(state as any, value as any)) }

/** 对一个方块施一次肥；返回是否起了作用（没作用时不消耗） */
function fertilize(b: Block): boolean {
    const id = b.typeId, st = (k: string) => b.permutation.getState(k as any) as number
    if (id === 'eno:chorus_sprout') { const s = st('eno:stage'); if (s >= 3) return false; withState(b, 'eno:stage', s + rnd(1, 3 - s)); return true }
    if (CROPS7.has(id)) { const g = st('growth'); if (g >= 7) return false; withState(b, 'growth', Math.min(7, g + rnd(2, 5))); return true }
    if (id === 'minecraft:sweet_berry_bush') { const g = st('growth'); if (g >= 3) return false; withState(b, 'growth', g + 1); return true }
    if (id === 'minecraft:cocoa') { const g = st('age'); if (g >= 2) return false; withState(b, 'age', g + 1); return true }
    if (TREE[id]) {
        if (Math.random() >= 0.45) return true   // 原版：每次 45% 推进，没推进也会消耗骨粉
        if (b.permutation.getState('age_bit' as any) !== true) { withState(b, 'age_bit', true); return true }
        const l = b.location, before = b.permutation
        b.setType('minecraft:air')
        try { b.dimension.runCommand(`place feature ${TREE[id]} ${l.x} ${l.y} ${l.z}`) }
        catch (e) { b.setPermutation(before);  }
        return true
    }
    if (id === 'minecraft:grass_block') {
        let grew = false
        for (let n = 0; n < 16; n++) {
            const g = b.dimension.getBlock({ x: b.location.x + rnd(-3, 3), y: b.location.y, z: b.location.z + rnd(-3, 3) })
            const up = g?.typeId === 'minecraft:grass_block' ? g.above() : undefined
            if (up?.isAir) { up.setPermutation(BlockPermutation.resolve(Math.random() < 0.9 ? 'minecraft:short_grass' : Math.random() < 0.5 ? 'minecraft:dandelion' : 'minecraft:poppy')); grew = true }
        }
        return grew
    }
    return false
}

/** 玩家手持骨粉对方块使用 */
export function fertilizeWith(player: Player, block: Block) {
    if (!fertilize(block)) return
    const c = block.center()
    block.dimension.playSound('item.bone_meal.use', c)
    block.dimension.spawnParticle('minecraft:crop_growth_emitter', c)
    if (player.getGameMode() !== GameMode.Creative) {
        const eq = player.getComponent('minecraft:equippable'), held = eq?.getEquipment(EquipmentSlot.Mainhand)
        if (held) { if (held.amount > 1) { held.amount -= 1; eq!.setEquipment(EquipmentSlot.Mainhand, held) } else eq!.setEquipment(EquipmentSlot.Mainhand, undefined) }
    }
}
