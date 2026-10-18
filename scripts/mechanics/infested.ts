// M-11 蚕与寄生树叶：逐行对照 ITEM/silkworm.js 与 BLOCKS/infestedleaves.js
//   · 手持蚕右键树叶：消耗 1 条蚕，树叶变成对应的"生寄生叶"
//   · 生寄生叶随机刻时长成"寄生叶"，并把上下左右前后 6 格里的树叶也变成生寄生叶（蔓延）
//   · 玩家放置寄生叶时同样感染周围 6 格的树叶
//   · 寄生叶被挖：10% 掉 2 根线、32.5% 掉 1 根线（D-05 按本意修复）；用剪刀剪下掉落自身并消耗 1 点剪刀耐久；生寄生叶什么都不掉
// 与原模组的差别：① 原模组只认自然生成的 6 种树叶，这里和钩子一样认任何原版树叶；每种树叶有自己的寄生贴图（按原版贴图自动生成），
//    其他附加包的树叶按橡树处理；方块改为两个（生寄生叶 eno:infesting_leaves、寄生叶 eno:infested_leaves）+ 树种状态 eno:species；
// ② 原模组寄生叶在"相邻方块变化"时还会感染那个邻居，26.50 没有相邻变化事件，暂缺（26.60 转正后补上）。
import { world, system, Block, Player, ItemStack, GameMode, EquipmentSlot, BlockPermutation } from '@minecraft/server'
import { registerBlockComponent } from '@sapdon/runtime'
import { isLeaves } from '../lib/rules.js'
import { consumeMainhand, damageMainhand } from '../lib/tool.js'
import { LEAF_SPECIES } from '../data/infested.js'

const SILKWORM = 'eno:silk_worm'
const RAW = 'eno:infesting_leaves', INFESTED = 'eno:infested_leaves'
/** 树叶 → 对应树种的生寄生叶（不是树叶返回 undefined） */
function rawFor(leafId: string): BlockPermutation | undefined {
    if (!isLeaves(leafId) || leafId.startsWith('eno:')) return undefined
    return BlockPermutation.resolve(RAW, { 'eno:species': LEAF_SPECIES[leafId] ?? 'oak' } as any)
}
const SIX = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]

/** 原模组 check()：把树叶变成对应的生寄生叶 */
function infestNeighbours(b: Block) {
    for (const [dx, dy, dz] of SIX) {
        let n
        try { n = b.dimension.getBlock({ x: b.location.x + dx, y: b.location.y + dy, z: b.location.z + dz }) } catch { continue }
        const raw = n && rawFor(n.typeId)
        if (raw) n!.setPermutation(raw)
    }
}

// 手持蚕右键树叶（蚕是 Sapdon 翻书物品，带 block_placer，所以在交互事件里处理，不依赖物品的 onUseOn）
world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    if (ev.itemStack?.typeId !== SILKWORM || !ev.isFirstEvent) return
    const raw = rawFor(ev.block.typeId)
    if (!raw) return
    ev.cancel = true
    const { block, player } = ev
    system.run(() => {
        consumeMainhand(player)   // 原模组 setCarriedItem(count - 1)：创造模式同样消耗
        block.setPermutation(raw)
    })
})

registerBlockComponent('eno:infesting', {
    // 原版随机刻：长成寄生叶（寄生叶的 onPlace 会感染周围）
    onRandomTick: ({ block }) => {
        const sp = block.permutation.getState('eno:species' as any)
        block.setPermutation(BlockPermutation.resolve(INFESTED, { 'eno:species': sp } as any))
    },
})

registerBlockComponent('eno:infested', {
    onPlace: ({ block }) => infestNeighbours(block),
    onPlayerBreak: ({ block, player, brokenBlockPermutation }) => {
        if (!(player instanceof Player) || player.getGameMode() === GameMode.Creative) return
        const tool = player.getComponent('minecraft:equippable')?.getEquipment(EquipmentSlot.Mainhand)
        const at = { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 }
        if (tool?.typeId === 'minecraft:shears') { damageMainhand(player, 1); block.dimension.spawnItem(new ItemStack(INFESTED, 1), at); return }
        // 原模组的云杉寄生叶（ex_infestedLeaf2）没写掉落函数，按默认掉落自身
        if (brokenBlockPermutation.getState('eno:species' as any) === 'spruce') { block.dimension.spawnItem(new ItemStack(INFESTED, 1), at); return }
        // 原代码 random < 42.5 ? 1 根 : random < 10 ? 2 根 —— 第二个分支永远到不了（D-05）。作者要求修复：10% 掉 2 根、另 32.5% 掉 1 根
        const r = Math.random() * 100
        if (r < 10) block.dimension.spawnItem(new ItemStack('minecraft:string', 2), at)
        else if (r < 42.5) block.dimension.spawnItem(new ItemStack('minecraft:string', 1), at)
    },
})
