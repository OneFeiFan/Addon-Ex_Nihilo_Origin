// M-09 锤子：锤子挖到转换表中的方块时，掉落替换为表中产物（原模组用 registerDropFunctionForID 包装掉落函数）
// 实现（O-07）：让方块正常被破坏，移除同一 tick 内在该格生成的掉落物，再生成转换产物。
// 原模组的掉落函数不看附魔：精准采集、时运都不影响转换结果。
import { world, system, ItemStack, Vector3 } from '@minecraft/server'
import { HAMMERS, HAMMER_TABLE } from '../data/tools.js'
import { isCreative } from '../lib/tool.js'
import { oreCount } from '../lib/rules.js'

const HAMMER_SET = new Set(HAMMERS)
interface Pending { dim: string, loc: Vector3, tick: number, out: string, count: number | 'ore', done?: boolean }
const pending: Pending[] = []
// 我们自己生成的转换产物：生成后也会触发 entitySpawn，必须跳过，否则会被当成原版掉落物删掉
const ownDrops = new Set<string>()


world.beforeEvents.playerBreakBlock.subscribe(({ block, itemStack, player, dimension }) => {
    if (!itemStack || !HAMMER_SET.has(itemStack.typeId) || isCreative(player)) return
    const rule = HAMMER_TABLE[block.typeId]
    if (!rule) return
    pending.push({ dim: dimension.id, loc: block.location, tick: system.currentTick, out: rule.out, count: rule.count })
})

const inCell = (p: Vector3, c: Vector3) => p.x >= c.x - 0.25 && p.x <= c.x + 1.25 && p.y >= c.y - 0.25 && p.y <= c.y + 1.25 && p.z >= c.z - 0.25 && p.z <= c.z + 1.25
world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (entity.typeId !== 'minecraft:item' || !pending.length) return
    if (ownDrops.delete(entity.id)) return
    const now = system.currentTick
    for (const p of pending) {
        if (p.dim === entity.dimension.id && now - p.tick <= 1 && inCell(entity.location, p.loc)) { entity.remove(); return }
    }
})

world.afterEvents.playerBreakBlock.subscribe(({ block, dimension }) => {
    const p = pending.find((q) => !q.done && q.dim === dimension.id && q.loc.x === block.location.x && q.loc.y === block.location.y && q.loc.z === block.location.z)
    if (!p) return
    p.done = true
    system.runTimeout(() => {
        const n = p.count === 'ore' ? oreCount() : p.count
        const drop = dimension.spawnItem(new ItemStack(p.out, n), { x: p.loc.x + 0.5, y: p.loc.y + 0.5, z: p.loc.z + 0.5 })
        ownDrops.add(drop.id)
        system.runTimeout(() => ownDrops.delete(drop.id), 5)
    }, 1)
})
// 清理过期记录（被其他脚本取消的破坏等）
system.runInterval(() => { const now = system.currentTick; for (let i = pending.length - 1; i >= 0; i--) if (now - pending[i].tick > 2) pending.splice(i, 1) }, 20)
