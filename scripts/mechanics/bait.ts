// 诱饵：逐行对照 bait.js
//   · 手持诱饵右键方块顶面：在上方放下诱饵（消耗 1 个）
//   · 诱饵下方变成空气 → 诱饵消失（不掉落）
//   · 以诱饵为中心 11×11×11 的范围内至少有 9 个草方块、4 个水，且有玩家在 5 格以外时，每 tick 有 0.05% 的概率
//     生成对应的动物，诱饵消失（这里每 20 tick 检查一次，概率按 20 tick 累计；条件满足时平均约 100 秒一只）
//   · 挖掉诱饵掉落诱饵物品
// 与原模组的差别：原代码只认"换过维度"的玩家（BaitAPI.players 只在跨维度传送时登记），新世界里诱饵永远不会生效；
// 这里改为同一维度里的任何玩家。
import { world, system, ItemStack, GameMode, Block, Dimension } from '@minecraft/server'
import { registerBlockComponent } from '@sapdon/runtime'
import { consumeMainhand } from '../lib/tool.js'

const BAIT: Record<string, { block: string, mob: string }> = {}
for (const a of ['sheep', 'cow', 'chicken', 'pig', 'wolf', 'ocelot']) BAIT[`eno:bait_${a}`] = { block: `eno:bait_block_${a}`, mob: `minecraft:${a}` }
const MOB_OF: Record<string, string> = Object.fromEntries(Object.values(BAIT).map((b) => [b.block, b.mob]))
const INTERVAL = 20
const CHANCE = 1 - Math.pow(1 - 0.0005, INTERVAL)

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    const bait = ev.itemStack && BAIT[ev.itemStack.typeId]
    if (!bait || !ev.isFirstEvent || ev.blockFace !== 'Up') return
    const { block, player } = ev
    ev.cancel = true
    system.run(() => {
        const above = block.above()
        if (!above || !above.isAir) return
        above.setType(bait.block)
        consumeMainhand(player)
        track(above)
    })
})

// 诱饵方块是脚本放下的，方块自带的 tick 组件在真机上不会开始计时（0.12.3 里一次检查都没发生）：
// 改为记录所有诱饵的位置（存进世界动态属性，重进世界后继续），由全局计时器每 20 tick 检查一次
const STORE = 'eno:baits'
let baits = new Set<string>()
const save = () => world.setDynamicProperty(STORE, JSON.stringify([...baits]))
world.afterEvents.worldLoad.subscribe(() => { try { baits = new Set(JSON.parse((world.getDynamicProperty(STORE) as string) ?? '[]')) } catch { baits = new Set() } })
function track(b: Block) { baits.add(`${b.dimension.id}|${b.location.x}|${b.location.y}|${b.location.z}`); save() }
function untrack(k: string) { if (baits.delete(k)) save() }

function check(block: Block, dimension: Dimension, k: string) {
    const l = block.location
    const below = dimension.getBlock({ x: l.x, y: l.y - 1, z: l.z })
    if (!below || below.isAir) { block.setType('minecraft:air'); untrack(k);  return }
    const far = dimension.getPlayers().some((p) => Math.abs(p.location.x - l.x) > 5 || Math.abs(p.location.y - l.y) > 5 || Math.abs(p.location.z - l.z) > 5)
    // 只扫描世界高度范围以内：超范围时 getBlock 会抛错（超平坦世界里诱饵放在底层附近时，向下 5 格就出界了），
    // 0.12.3 / 0.12.4 的检查正是因此每次都在这里中断、一行输出都没有。原模组越界时按空气处理，效果相同。
    const { min, max } = dimension.heightRange
    let grass = 0, water = 0
    for (let x = -5; x <= 5; x++) for (let y = Math.max(-5, min - l.y); y <= Math.min(5, max - 1 - l.y); y++) for (let z = -5; z <= 5; z++) {
        let t: string | undefined
        try { t = dimension.getBlock({ x: l.x + x, y: l.y + y, z: l.z + z })?.typeId } catch { continue }   // 未加载的区块
        if (t === 'minecraft:grass_block') grass++; else if (t === 'minecraft:water') water++
    }
    const ok = grass >= 9 && water >= 4 && far
    const roll = ok && Math.random() < CHANCE
    // 条件满足时平均约 100 秒生成一只（与原模组相同）
    if (!roll) return
    dimension.spawnEntity(MOB_OF[block.typeId] as any, { x: l.x, y: l.y + 0.5, z: l.z })
    block.setType('minecraft:air')
    untrack(k)
}
system.runInterval(() => {
    for (const k of [...baits]) {
        const [dim, x, y, z] = k.split('|')
        let dimension: Dimension, block: Block | undefined
        try { dimension = world.getDimension(dim); block = dimension.getBlock({ x: +x, y: +y, z: +z }) } catch { continue }   // 所在区块未加载：跳过
        if (!block) continue
        if (!MOB_OF[block.typeId]) { untrack(k); continue }   // 已被挖掉或替换
        try { check(block, dimension, k) } catch (e) {  }   // 单个诱饵出错不影响其他诱饵
    }
}, INTERVAL)

registerBlockComponent('eno:bait', {
    onPlace: ({ block }) => track(block),
    onPlayerBreak: ({ block, player, brokenBlockPermutation }) => {
        if (player?.getGameMode() === GameMode.Creative) return
        const item = Object.keys(BAIT).find((k) => BAIT[k].block === brokenBlockPermutation.type.id)
        if (item) block.dimension.spawnItem(new ItemStack(item, 1), { x: block.location.x + 0.5, y: block.location.y + 0.2, z: block.location.z + 0.5 })
        untrack(`${block.dimension.id}|${block.location.x}|${block.location.y}|${block.location.z}`)
    },
})
