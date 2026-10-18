// 矿石粉碎锤的右键功能：逐行对照 TOOL/Compressed_Tool.js 的 Item.registerUseFunction("ex_hammersoresmasher")
// 手持矿石粉碎锤右键方块：在点击的那一面（空气、水、岩浆处）放出一块矿砾 / 矿砂 / 矿尘，消耗背包里同一格的 4 个对应碎块。
// 按下面的顺序依次尝试，放出一块就停（原代码逐个调用 set()，放出后那一格不再是空气）；
// 每种只看背包里第一格这种物品，不足 4 个就跳过这种（原 searchItem 只返回第一格）。
// 原模组里还有铜、锡、铅、银四种，它们在本模组的物品表里没有注册（原代码中这几项实际上什么也不做），这里不列。
import { world, system, Player } from '@minecraft/server'

const SMASHER = 'eno:hammers_ore_smasher'
const ORDER: [block: string, item: string][] = []
const smash = (block: string, item: string) => ORDER.push([block, item])
for (const m of ['iron', 'gold', 'platinum', 'aluminum', 'nickel', 'copper']) smash(`eno:${m}_gravel`, `eno:${m}_broken`)
for (const m of ['iron', 'gold', 'platinum', 'aluminum', 'nickel', 'copper']) smash(`eno:${m}_sand`, `eno:${m}_crushed`)
for (const m of ['iron', 'gold', 'platinum', 'aluminum', 'nickel', 'copper']) smash(`eno:${m}_dust`, `eno:${m}_powdered`)
for (const m of ['iron', 'gold', 'platinum', 'aluminum', 'nickel']) smash(`eno:nether_${m}_gravel`, `eno:nether_${m}_broken`)
for (const m of ['iron', 'gold', 'platinum', 'aluminum', 'nickel']) smash(`eno:ender_${m}_gravel`, `eno:ender_${m}_broken`)

const REPLACEABLE = new Set(['minecraft:air', 'minecraft:water', 'minecraft:lava'])   // 原代码：方块 ID 0、9（静止水）、11（静止岩浆）
const OFFSET: Record<string, [number, number, number]> = { Up: [0, 1, 0], Down: [0, -1, 0], North: [0, 0, -1], South: [0, 0, 1], East: [1, 0, 0], West: [-1, 0, 0] }

function use(player: Player, at: { x: number, y: number, z: number }) {
    const target = player.dimension.getBlock(at)
    if (!target || !REPLACEABLE.has(target.typeId)) return
    const inv = player.getComponent('minecraft:inventory')?.container
    if (!inv) return
    for (const [block, item] of ORDER) {
        let slot = -1
        for (let i = 0; i < inv.size; i++) if (inv.getItem(i)?.typeId === item) { slot = i; break }
        const stack = slot >= 0 ? inv.getItem(slot) : undefined
        if (!stack || stack.amount < 4) continue
        if (stack.amount > 4) { stack.amount -= 4; inv.setItem(slot, stack) } else inv.setItem(slot, undefined)
        target.setType(block)
        return
    }
}

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    if (!ev.isFirstEvent || ev.itemStack?.typeId !== SMASHER) return
    const [dx, dy, dz] = OFFSET[ev.blockFace] ?? [0, 1, 0]
    const at = { x: ev.block.location.x + dx, y: ev.block.location.y + dy, z: ev.block.location.z + dz }
    const player = ev.player
    system.run(() => use(player, at))
})
