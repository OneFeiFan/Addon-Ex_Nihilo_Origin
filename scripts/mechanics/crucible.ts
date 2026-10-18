// M-04 坩埚（陶瓷）与 M-05 木坩埚：逐行对照 BLOCKS/MACHINE/crucible.js 与 Compressum/Oak_Crucible_Core.js
// 状态存在方块实体的动态属性里；内容物由实体 eno:crucible_content 显示（两层：方块层 a、液体层 b）。
//
// 陶瓷坩埚：放入圆石 / 石头 / 沙砾（各 2500 工作量），下方有热源时每 tick 消耗"热量"点工作量、产出 0.0001×热量 桶岩浆
//   —— 一块方块共产 0.25 桶岩浆，与热源强弱无关，热源只影响速度（火把 1、火 1.5、岩浆 2.5、流动岩浆 3）。最多存 10 桶。
// 木坩埚：放入树苗（125）/ 树叶（250），每 tick 消耗 1 点工作量、产出 0.001 桶水，最多 1 桶。
// 与原模组的差别：① 热源每 tick 检查（原模组只在初始化和下方方块变化时更新，效果相同）；
// ② 木坩埚连点时原代码的计数会溢出卡住（物品丢失），这里改为排队依次处理；
// ③ 木坩埚原代码把高度都写进同一个网络字段，内容物实际上从不显示——这里按代码的本意显示树叶与水。
// 暂未移植：漏斗输入（StorageInterface）、作者之钩打开的测试界面。
import { system, Block, Player, ItemStack, Dimension, Entity, BlockDynamicPropertiesComponent, Vector3, EquipmentSlot } from '@minecraft/server'
import { registerBlockComponent } from '@sapdon/runtime'
import { MELT, HEAT, OAK_INPUT, TEX } from '../data/crucible.js'
import { FILL } from '../data/barrel.js'
import { consumeMainhand } from '../lib/tool.js'

const STEP = 2
const ENTITY = 'eno:crucible_content'
const dp = (b: Block) => b.getComponent('minecraft:dynamic_properties') as BlockDynamicPropertiesComponent | undefined
const num = (b: Block, k: string) => (dp(b)?.get(k) as number) ?? 0
const put = (b: Block, k: string, v: number) => dp(b)?.set(k, v)

// ---------- 内容物实体 ----------
const keyOf = (d: Dimension, l: Vector3) => `${d.id}|${l.x}|${l.y}|${l.z}`
const contents = new Map<string, Entity>()
function contentEntity(d: Dimension, l: Vector3, create: boolean) {
    const k = keyOf(d, l)
    let e = contents.get(k)
    if (e?.isValid) return e
    const at = { x: l.x + 0.5, y: l.y, z: l.z + 0.5 }
    e = d.getEntities({ type: ENTITY, location: at, maxDistance: 0.3 })[0]
    if (!e && create) e = d.spawnEntity(ENTITY, at)
    if (e) contents.set(k, e); else contents.delete(k)
    return e
}
function removeContent(d: Dimension, l: Vector3) { const e = contentEntity(d, l, false); if (e) { contents.delete(keyOf(d, l)); try { e.remove() } catch { } } }
/** 两层，高度单位为方块（0–1），内部换成 0.05 像素 */
function show(b: Block, a?: { lo: number, hi: number, t: number }, c?: { lo: number, hi: number, t: number }) {
    // 单位 0.05 像素。原模组的高度范围是 4–16 像素（0.25–1 格），这里按比例压到 4–14.5 像素：
    // 装满时比坩埚口低一截，与木桶相同（作者要求）
    const squash = (v: number) => 0.25 + (v - 0.25) * 0.875
    const px = (v: number) => Math.max(0, Math.min(320, Math.round(squash(v) * 320)))
    if (!a && !c) { removeContent(b.dimension, b.location); return }
    const e = contentEntity(b.dimension, b.location, true)
    if (!e) return
    const set = (k: string, v: number) => { if (e.getProperty(k) !== v) e.setProperty(k, v) }
    // 层很薄时（比如刚开始出岩浆）至少画 0.25 像素厚，否则看不见
    const hi = (l: { lo: number, hi: number }) => Math.min(317, Math.max(px(l.hi), px(l.lo) + 5))
    set('eno:a_lo', a ? px(a.lo) : 0); set('eno:a_hi', a ? hi(a) : 0); set('eno:a_t', a?.t ?? 0)
    set('eno:b_lo', c ? px(c.lo) : 0); set('eno:b_hi', c ? hi(c) : 0); set('eno:b_t', c?.t ?? 0)
}

// ---------- 取液体：手持空桶右键，液体 ≥ 1 桶时取出 1 桶（原模组：空桶减 1，装满的桶放进背包）----------
function takeBucket(player: Player, liquid: string): boolean {
    const held = player.getComponent('minecraft:equippable')?.getEquipment(EquipmentSlot.Mainhand)
    const full = held && FILL[held.typeId]?.[liquid]
    if (!full) return false
    consumeMainhand(player)
    player.getComponent('minecraft:inventory')?.container?.addItem(new ItemStack(full, 1))
    return true
}

// ---------- 陶瓷坩埚 ----------
const C4 = 4 / 16
function porcelainTick(b: Block) {
    const below = b.dimension.getBlock({ x: b.location.x, y: b.location.y - 1, z: b.location.z })
    const energy = HEAT[below?.typeId ?? ''] ?? 0
    let work = num(b, 'work'), lava = num(b, 'lava'), base = num(b, 'base'), pend = num(b, 'pend')
    const solid = num(b, 'solid')
    const w0 = work, l0 = lava
    if (lava < 10 && work > 0 && energy > 0) {
        const n = Math.min(STEP, Math.ceil(work / energy))   // 两 tick 合并一次处理
        lava = Math.min(10, lava + base * energy * n); work = Math.max(0, work - energy * n)
    }
    if (pend > 0) {   // 放入的方块进入熔化（原 tick：input.count--、worktime += addworktime）
        const m = MELT[dp(b)?.get('pendId') as string]
        if (m) { work += m.work; base = m.base; put(b, 'solid', m.texture) }
        pend -= 1; put(b, 'pend', pend); put(b, 'base', base)
    }
    if (work !== w0) put(b, 'work', work)
    if (lava !== l0) put(b, 'lava', lava)
    // 原 cruciblebox：岩浆 ≤ 0.1 桶时显示方块层（高度随工作量），否则显示岩浆层（浮在方块层的位置之上）
    if (work > 0 || lava > 0) {
        if (lava <= 0.1) show(b, { lo: C4, hi: 1 - (10000 - work) * 0.000075, t: num(b, 'solid') || solid })
        else { const lo = C4 + work * 0.000075; show(b, undefined, { lo, hi: lo + (lava / 10) * ((10000 - work) * 0.000075), t: TEX.lava }) }
    } else show(b)
}
function porcelainClick(b: Block, player: Player) {
    const held = player.getComponent('minecraft:equippable')?.getEquipment(EquipmentSlot.Mainhand)
    const id = held?.typeId ?? '', work = num(b, 'work'), lava = num(b, 'lava')
    if (work <= 7500 && work / 10000 + lava < 10 && MELT[id]) {
        consumeMainhand(player)
        dp(b)?.set('pendId', id); put(b, 'pend', num(b, 'pend') + 1)
    }
    if (lava >= 1 && takeBucket(player, 'lava')) put(b, 'lava', lava - 1)
}

// ---------- 木坩埚 ----------
function oakTick(b: Block) {
    let work = num(b, 'work'), water = num(b, 'water'), pend = num(b, 'pend'), lock = num(b, 'lock')
    const w0 = work, a0 = water, p0 = pend, k0 = lock
    const input = OAK_INPUT[dp(b)?.get('inId') as string]
    if (water < 1 && work > 0) {
        const n = Math.min(STEP, work)
        if (input) water = Math.min(1, water + input.water * n)
        work -= n
    }
    // 原代码：总量（工作量 + 水×1000）不超过 750、或已空时，取一个排队的物品；接近满（≥ 988）后锁住，直到全部取空
    if ((work + water * 1000 <= 750 || (work <= 0 && water < 1)) && input && !lock && pend > 0) { pend -= 1; work += input.work }
    if (work + water * 1000 >= 988 && !lock) lock = 1
    if (lock && work + water * 1000 <= 0) lock = 0
    if (work !== w0) put(b, 'work', work)
    if (water !== a0) put(b, 'water', water)
    if (pend !== p0) put(b, 'pend', pend)
    if (lock !== k0) put(b, 'lock', lock)
    const leaf = work > 0 ? { lo: C4, hi: C4 + work * 0.00075, t: TEX.leaf } : undefined
    const wat = water > 0 ? { lo: C4, hi: C4 + water * 0.75, t: TEX.water } : undefined
    show(b, leaf, wat)
}
function oakClick(b: Block, player: Player) {
    const held = player.getComponent('minecraft:equippable')?.getEquipment(EquipmentSlot.Mainhand)
    const id = held?.typeId ?? '', work = num(b, 'work'), water = num(b, 'water')
    if (work <= 750 && work / 1000 + water < 1 && OAK_INPUT[id]) {
        consumeMainhand(player)
        dp(b)?.set('inId', id); put(b, 'pend', num(b, 'pend') + 1)
    }
    if (water >= 1 && takeBucket(player, 'water')) put(b, 'water', water - 1)
}

registerBlockComponent('eno:crucible', {
    onTick: ({ block }, { params }: any) => (params.kind === 'oak' ? oakTick : porcelainTick)(block),
    onPlayerInteract: ({ block, player }, { params }: any) => { if (player) (params.kind === 'oak' ? oakClick : porcelainClick)(block, player) },
    onBreak: ({ block, dimension }) => removeContent(dimension, block.location),   // 原 destroy：放入的东西清空
})
