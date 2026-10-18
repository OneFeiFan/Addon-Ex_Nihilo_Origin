// M-07 半砖熔炉与熔炉：逐行对照 BLOCKS/MACHINE/furnace.js、furnaceadvance.js 的 tileEntity.tick / getFuel
//   · 半砖熔炉：一条熔炼线，每件 300 tick；熔炉：两条熔炼线共用燃料，每件 200 tick
//   · 燃料燃烧时间与原版熔炉相同；岩浆桶烧完留下空桶；燃烧中正面换成点燃贴图
//   · 进度：在进度格里放"进度物品"，剩余耐久 = 进度；进度为 0 时清空该格（只画底图）
// 原模组的格子规则（只有能熔炼的物品能放进原料格、只有燃料能放进燃料格、产物格不能放东西）：
// 基岩版容器没有放入过滤，这里改为——放错格子的物品被弹到熔炉上方。
// 承载实体由 Sapdon 内置的 sapdon:block_with_entity 在方块放置时生成。实体容器的标题 = 实体名字 = 界面门控键：
// 0.14.1 用可读的键，名字浮在机器上方；0.14.2 不起名、改用 lang 里的实体名称，真机标题是"未知"、门控失效。
// 现在用只由格式代码组成的名字（scripts/data/furnace.ts 的 FURNACE_NAME），显示出来是空的。
// 承载实体的点击框盖住了方块，玩家挖不到方块本身：打实体时按挖方块处理（见下方 entityHitEntity）。
//
// 熔炉的获得方式（原模组的本意）：手持半砖熔炉、潜行右键一个半砖熔炉 → 两块合成一整块熔炉，里面的东西保留。
import { world, system, Entity, ItemStack, Container, BlockPermutation, Player, Dimension, Vector3 } from '@minecraft/server'
import { SMELT, SMELT_COUNT, FUEL, FUEL_TAGS, FURNACE_NAME } from '../data/furnace.js'
import { consumeMainhand } from '../lib/tool.js'

const PROGRESS = 'eno:furnace_progress'
interface Line { input: number, result: number, arrow: number, make: string, create: string }
interface Kind { block: string, cook: number, fuel: number, flame: number, lines: Line[] }
const KINDS: Record<string, Kind> = {
    'eno:furnacehalf_entity': { block: 'eno:furnacehalf', cook: 300, fuel: 1, flame: 4, lines: [{ input: 0, result: 2, arrow: 3, make: 'make', create: 'isCreate' }] },
    'eno:furnace_entity': { block: 'eno:furnace', cook: 200, fuel: 2, flame: 7, lines: [
        { input: 0, result: 3, arrow: 5, make: 'make', create: 'isCreate' },
        { input: 1, result: 4, arrow: 6, make: 'make1', create: 'isCreate1' },
    ] },
}

// ---------- 跟踪承载实体 ----------
const furnaces = new Map<string, Entity>()
const pendingTransfer = new Map<string, (e: Entity) => void>()
const cellKey = (d: Dimension, l: Vector3) => `${d.id}|${Math.floor(l.x)}|${Math.floor(l.y + 0.01)}|${Math.floor(l.z)}`
function adopt(e: Entity) {
    if (!KINDS[e.typeId]) return
    const name = FURNACE_NAME[e.typeId]
    if (e.nameTag !== name) { e.nameTag = name;  }
    if (!furnaces.has(e.id)) { }
    furnaces.set(e.id, e)
    const k = cellKey(e.dimension, e.location), job = pendingTransfer.get(k)
    if (job) { pendingTransfer.delete(k); job(e) }
}
world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    adopt(entity)
    // 熔炉被挖掉时承载实体会把容器里的东西全掉出来（Sapdon item_despawn），进度物品不该掉：生成即删除
    if (entity.typeId === 'minecraft:item' && entity.getComponent('minecraft:item')?.itemStack.typeId === PROGRESS) entity.remove()
})
world.afterEvents.entityLoad.subscribe(({ entity }) => adopt(entity))
world.afterEvents.worldLoad.subscribe(() => { for (const d of ['overworld', 'nether', 'the_end']) for (const t of Object.keys(KINDS)) for (const e of world.getDimension(d).getEntities({ type: t })) adopt(e) })

const fuelOf = (item?: ItemStack) => {
    if (!item) return 0
    if (FUEL[item.typeId]) return FUEL[item.typeId]
    for (const [tag, t] of FUEL_TAGS) if (item.hasTag(tag)) return t
    return 0
}
const num = (e: Entity, k: string, d = 0) => (e.getDynamicProperty(k) as number) ?? d

const written = new Map<string, number>()
function writeProgress(c: Container, key: string, slot: number, value: number) {
    const k = `${key}#${slot}`
    if (value <= 0) { if (c.getItem(slot)) c.setItem(slot, undefined); written.delete(k); return }
    const stack = new ItemStack(PROGRESS, 1)
    const dur = stack.getComponent('minecraft:durability')
    if (!dur) return
    const damage = Math.min(dur.maxDurability - 1, Math.max(1, Math.round(dur.maxDurability * (1 - value))))
    if (written.get(k) === damage && c.getItem(slot)?.typeId === PROGRESS) return
    written.set(k, damage)
    dur.damage = damage
    c.setItem(slot, stack)
}
function eject(e: Entity, c: Container, slot: number) {
    const it = c.getItem(slot)
    if (!it) return
    c.setItem(slot, undefined)
    e.dimension.spawnItem(it, { x: e.location.x, y: e.location.y + 0.8, z: e.location.z })
}
const take1 = (c: Container, slot: number, it: ItemStack) => { if (it.amount > 1) { it.amount -= 1; c.setItem(slot, it) } else c.setItem(slot, undefined) }

function tick(e: Entity, kind: Kind) {
    const c = e.getComponent('minecraft:inventory')?.container
    if (!c) return
    for (const l of kind.lines) { const it = c.getItem(l.arrow); if (it && it.typeId !== PROGRESS) eject(e, c, l.arrow) }
    { const it = c.getItem(kind.flame); if (it && it.typeId !== PROGRESS) eject(e, c, kind.flame) }
    let fuelSlot = c.getItem(kind.fuel)
    if (fuelSlot && !fuelOf(fuelSlot)) { eject(e, c, kind.fuel); fuelSlot = undefined }

    let burn = num(e, 'burn'), burnMax = num(e, 'burnMax', 200)
    const st = kind.lines.map((l) => {
        let desert = c.getItem(l.input)
        if (desert && !SMELT[desert.typeId]) { eject(e, c, l.input); desert = undefined }
        const out = c.getItem(l.result), result = desert && SMELT[desert.typeId]
        const count = desert ? SMELT_COUNT[desert.typeId] ?? 1 : 1   // 矿盐晶体一次烧出 8 个
        const ok = !!result && (!out || (out.typeId === result && out.amount + count <= out.maxAmount))
        return { l, desert, out, result, count, ok, make: num(e, l.make), create: e.getDynamicProperty(l.create) === true }
    })
    if (st.some((s) => s.ok)) {   // 任意一条线能熔炼时才烧燃料（原模组）
        if (burn > 0) { for (const s of st) if (s.ok) { s.create = true; s.make += 1 } }
        else if (fuelSlot) {      // getFuel：岩浆桶留下空桶，其他燃料减 1
            const f = fuelOf(fuelSlot)
            if (fuelSlot.typeId === 'minecraft:lava_bucket') c.setItem(kind.fuel, new ItemStack('minecraft:bucket', 1)); else take1(c, kind.fuel, fuelSlot)
            burnMax = burn = f
        } else for (const s of st) { s.make = 0; s.create = false }
        for (const s of st) if (s.ok && s.make >= kind.cook) {
            c.setItem(s.l.result, new ItemStack(s.result!, (s.out?.amount ?? 0) + s.count))
            take1(c, s.l.input, s.desert!)
            s.make = 0; s.create = false
        }
    }
    if (burn > 0) burn -= 1
    for (const s of st) { if (!s.desert) s.create = false; if (!s.create) s.make = 0 }
    if (burn <= 0 && st.every((s) => !s.create)) { burn = 0; burnMax = 200; for (const s of st) s.make = 0 }
    e.setDynamicProperty('burn', burn); e.setDynamicProperty('burnMax', burnMax)
    for (const s of st) { e.setDynamicProperty(s.l.make, s.make); e.setDynamicProperty(s.l.create, s.create); writeProgress(c, e.id, s.l.arrow, s.make / kind.cook) }
    writeProgress(c, e.id, kind.flame, burnMax > 0 ? burn / burnMax : 0)
    const b = e.dimension.getBlock({ x: Math.floor(e.location.x), y: Math.floor(e.location.y + 0.01), z: Math.floor(e.location.z) })
    if (b?.typeId === kind.block) {
        const lit = burn > 0
        if (b.permutation.getState('eno:lit' as any) !== lit) b.setPermutation(b.permutation.withState('eno:lit' as any, lit))
    }
}

system.runInterval(() => {
    for (const [id, e] of furnaces) {
        if (!e.isValid) { furnaces.delete(id); continue }
        try { tick(e, KINDS[e.typeId]) } catch (err) {  }
    }
}, 1)

// ---------- 半砖熔炉 + 半砖熔炉 → 熔炉 ----------
function upgrade(player: Player, dim: Dimension, loc: Vector3) {
    const block = dim.getBlock(loc)
    if (block?.typeId !== 'eno:furnacehalf') return
    const half = dim.getEntities({ type: 'eno:furnacehalf_entity', location: { x: loc.x + 0.5, y: loc.y, z: loc.z + 0.5 }, maxDistance: 0.8 })[0]
    const c = half?.getComponent('minecraft:inventory')?.container
    // 先把东西取出来、移除旧的承载实体，再换方块（否则旧实体检测到方块被破坏，会把东西掉一地）
    const keep = c ? { desert: c.getItem(0), fuel: c.getItem(1), result: c.getItem(2) } : {}
    const data = half ? { burn: num(half, 'burn'), burnMax: num(half, 'burnMax', 200), make: num(half, 'make'), isCreate: half.getDynamicProperty('isCreate') === true } : undefined
    if (c) for (let i = 0; i < c.size; i++) c.setItem(i, undefined)
    if (half) { furnaces.delete(half.id); half.remove() }
    const dir = block.permutation.getState('minecraft:cardinal_direction' as any) as string
    pendingTransfer.set(cellKey(dim, loc), (e) => {
        const nc = e.getComponent('minecraft:inventory')?.container
        if (nc) { nc.setItem(0, keep.desert); nc.setItem(2, keep.fuel); nc.setItem(3, keep.result) }
        if (data) for (const [k, v] of Object.entries(data)) e.setDynamicProperty(k, v)
    })
    block.setPermutation(BlockPermutation.resolve('eno:furnace', { 'minecraft:cardinal_direction': dir } as any))
    // 承载实体通常由 sapdon:block_with_entity 在放置时生成；万一没有，自己补一个
    system.runTimeout(() => {
        if (!pendingTransfer.has(cellKey(dim, loc))) return
        if (!dim.getEntities({ type: 'eno:furnace_entity', location: { x: loc.x + 0.5, y: loc.y, z: loc.z + 0.5 }, maxDistance: 0.8 }).length) dim.spawnEntity('eno:furnace_entity' as any, { x: loc.x + 0.5, y: loc.y, z: loc.z + 0.5 })
    }, 2)
    consumeMainhand(player)
    dim.playSound('dig.stone', { x: loc.x + 0.5, y: loc.y + 0.5, z: loc.z + 0.5 })
}
world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    if (!ev.isFirstEvent || ev.itemStack?.typeId !== 'eno:furnacehalf' || !ev.player.isSneaking || ev.block.typeId !== 'eno:furnacehalf') return
    ev.cancel = true
    const { player, block } = ev, dim = block.dimension, loc = block.location
    system.run(() => upgrade(player, dim, loc))
})
world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    if (ev.target.typeId !== 'eno:furnacehalf_entity' || ev.itemStack?.typeId !== 'eno:furnacehalf' || !ev.player.isSneaking) return
    ev.cancel = true
    const { player, target } = ev, dim = target.dimension
    const loc = { x: Math.floor(target.location.x), y: Math.floor(target.location.y + 0.01), z: Math.floor(target.location.z) }
    system.run(() => upgrade(player, dim, loc))
})

// ---------- 挖熔炉：承载实体挡住了方块，打实体 = 挖掉熔炉 ----------
// 掉落：容器里的东西全部掉出（进度物品除外）；生存模式（必须手持镐子）掉落熔炉本身，整块熔炉掉两个半砖熔炉
world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }) => {
    const kind = KINDS[hitEntity.typeId]
    if (!kind || !(damagingEntity instanceof Player)) return
    // 生存模式下必须拿着镐子才挖得动（避免空手误点一下就把熔炉连同里面的东西拆掉）；创造模式一下就拆
    const held = damagingEntity.getComponent('minecraft:equippable')?.getEquipment('Mainhand' as any)
    const creative = String(damagingEntity.getGameMode()).toLowerCase() === 'creative'
    if (!creative && !held?.hasTag('minecraft:is_pickaxe')) {  return }
    const dim = hitEntity.dimension, l = hitEntity.location
    const at = { x: Math.floor(l.x), y: Math.floor(l.y + 0.01), z: Math.floor(l.z) }, drop = { x: at.x + 0.5, y: at.y + 0.5, z: at.z + 0.5 }
    const c = hitEntity.getComponent('minecraft:inventory')?.container
    if (c) for (let i = 0; i < c.size; i++) { const it = c.getItem(i); if (it && it.typeId !== PROGRESS) dim.spawnItem(it, drop); c.setItem(i, undefined) }
    furnaces.delete(hitEntity.id)
    hitEntity.remove()
    const block = dim.getBlock(at)
    if (block?.typeId === kind.block) {
        block.setType('minecraft:air')
        if (!creative) dim.spawnItem(new ItemStack(kind.block === 'eno:furnace' ? 'eno:furnacehalf' : kind.block, kind.block === 'eno:furnace' ? 2 : 1), drop)
        dim.playSound('dig.stone', drop)
    }
})
