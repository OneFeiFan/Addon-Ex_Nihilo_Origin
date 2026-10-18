// M-02 筛子 / 重型筛：逐行对照 SieveCore.js 的 tileEntity.click / destroyBlock
// 数据：网的种类、内容物、点击次数存在方块状态里；网的耗损（meshDamage）存在方块实体的动态属性里；网的倍率按网的种类查表（scripts/data/sieve.ts）。
import { world, ItemStack, Player, EquipmentSlot, Block, BlockDynamicPropertiesComponent, Vector3, Dimension } from '@minecraft/server'
import { registerBlockComponent } from '@sapdon/runtime'
import { SIEVE } from '../data/sieve.js'
import { sieveRolls, SIEVE_CLICKS, SieveMemory } from '../lib/rules.js'
import { sieveComp } from '../data/sieveComp.js'

type Group = 'ex' | 'co'
// 自定义状态不在 @minecraft/vanilla-data 的类型表里，需要转成 any
const S = { mesh: 'eno:mesh', content: 'eno:content', click: 'eno:click' } as Record<string, any>
const meshByItem = (g: Group, id: string) => SIEVE.groups[g].meshes.find((m) => m.id === id)
const meshByIdx = (g: Group, i: number) => SIEVE.groups[g].meshes.find((m) => m.idx === i)
const contentByItem = (g: Group, id: string) => SIEVE.groups[g].contents.find((c) => c.id === id)
const contentByIdx = (g: Group, i: number) => SIEVE.groups[g].contents.find((c) => c.idx === i)

const dp = (b: Block) => b.getComponent('minecraft:dynamic_properties') as BlockDynamicPropertiesComponent | undefined
const key = (d: Dimension, l: Vector3) => `${d.id}|${l.x}|${l.y}|${l.z}`
// 方块被破坏后读不到方块实体，所以把网的耗损在内存里也记一份，供 onBreak 掉落网时使用
const meshCache = new Map<string, number>()

/** InnerCore setCarriedItem(id, count - 1, data)：创造模式下同样消耗（原模组行为，D-15） */
/** 每个玩家的筛子记忆（伪随机计数、连续空手次数），存在玩家的动态属性里 */
const MEMORY = 'eno:sieve_memory'
function loadMemory(player: Player): SieveMemory {
    try { const raw = player.getDynamicProperty(MEMORY); if (typeof raw === 'string') return JSON.parse(raw) } catch { }
    return { n: {}, e: {} }
}
function saveMemory(player: Player, mem: SieveMemory) { player.setDynamicProperty(MEMORY, JSON.stringify(mem)) }

function consumeOne(player: Player) {
    const eq = player.getComponent('minecraft:equippable')
    const item = eq?.getEquipment(EquipmentSlot.Mainhand)
    if (!eq || !item) return
    if (item.amount > 1) { item.amount -= 1; eq.setEquipment(EquipmentSlot.Mainhand, item) } else eq.setEquipment(EquipmentSlot.Mainhand, undefined)
}

function click(block: Block, player: Player, group: Group) {
    const held = player.getComponent('minecraft:equippable')?.getEquipment(EquipmentSlot.Mainhand)
    const store = dp(block)
    let perm = block.permutation
    let mesh = perm.getState(S.mesh) as number, content = perm.getState(S.content) as number, clicks = perm.getState(S.click) as number
    let meshDamage = (store?.get('meshDamage') as number) ?? 0
    const dim = block.dimension, loc = block.location

    // 1. 没有网时，手持同组的网：装上（保留网的耗损）
    if (mesh === 0 && held) {
        const m = meshByItem(group, held.typeId)
        if (m) {
            mesh = m.idx
            meshDamage = held.getComponent('minecraft:durability')?.damage ?? 0
            consumeOne(player)
        }
    }
    if (mesh !== 0) {
        // 2. 没有料时，手持本组可筛的方块：放入 1 个（这一下同时算作第 1 次点击）
        if (content === 0 && held && held.typeId !== meshByIdx(group, mesh)?.id) {
            const c = contentByItem(group, held.typeId)
            if (c) { content = c.idx; consumeOne(player) }
        }
        // 3. 有料时：点击次数 +1，在玩家位置播放 sieve.ogg
        if (content > 0 && clicks < SIEVE_CLICKS) {
            dim.playSound('eno.sieve', player.location)
            clicks++
        }
        // 4. 第 14 次：网耗损 +1，结算掉落；网耗尽则损坏
        if (clicks >= SIEVE_CLICKS) {
            meshDamage += 1
            const input = contentByIdx(group, content)
            const drops = input ? SIEVE.drops[input.id] ?? [] : []
            const m = meshByIdx(group, mesh)
            const mult = m?.mult ?? 1
            if (input) {
                // 2.4：伪随机 + 空手保护，计数按玩家记；概率 = 基础概率 × 网的倍率 × 补偿系数
                const mem = loadMemory(player)
                for (const [item, n] of sieveRolls(input.id, drops, mult, sieveComp(input.id, mult), group === 'ex' ? 1 : 6, mem)) dim.spawnItem(new ItemStack(item, n), { x: loc.x + 0.5, y: loc.y + 0.9, z: loc.z + 0.5 })
                saveMemory(player, mem)
            }
            if (m && meshDamage > m.durability) {
                dim.playSound('eno.meshbreak', player.location)
                mesh = 0; meshDamage = 0
            }
            content = 0; clicks = 0
        }
    }
    perm = perm.withState(S.mesh, mesh).withState(S.content, content).withState(S.click, clicks)
    if (perm !== block.permutation) block.setPermutation(perm)
    store?.set('meshDamage', meshDamage)
    meshCache.set(key(dim, loc), meshDamage)
}

// 破坏筛子：放入的料丢失（原 destroyBlock 把 inPutSlot 清零），网连同耗损一起掉落（InnerCore 销毁方块实体时会掉落容器内容）
function dropMesh(dim: Dimension, loc: Vector3, group: Group, meshIdx: number) {
    const m = meshByIdx(group, meshIdx)
    if (!m) return
    const stack = new ItemStack(m.id, 1)
    const dur = stack.getComponent('minecraft:durability')
    if (dur) dur.damage = Math.min(meshCache.get(key(dim, loc)) ?? 0, dur.maxDurability)
    dim.spawnItem(stack, { x: loc.x + 0.5, y: loc.y + 0.5, z: loc.z + 0.5 })
    meshCache.delete(key(dim, loc))
}
const remember = (b: Block) => { const v = dp(b)?.get('meshDamage'); if (typeof v === 'number') meshCache.set(key(b.dimension, b.location), v) }
const isSieve = (b: Block) => b.hasComponent?.('minecraft:dynamic_properties') && /^eno:(sieve|heavysieve)_/.test(b.typeId)
world.beforeEvents.playerBreakBlock.subscribe(({ block }) => { if (isSieve(block)) remember(block) })
world.beforeEvents.explosion.subscribe((e) => { for (const b of e.getImpactedBlocks()) if (isSieve(b)) remember(b) })

// 方块组件注册交给 Sapdon 运行期（路线 B：handler 是普通闭包，可直接复用本文件的函数）
registerBlockComponent('eno:sieve', {
    onPlayerInteract: ({ block, player }, { params }: any) => { if (player) click(block, player, params.group) },
    onBreak: ({ brokenBlockPermutation, block, dimension }, { params }: any) => {
        const mesh = brokenBlockPermutation.getState(S.mesh) as number
        if (mesh > 0) dropMesh(dimension, block.location, params.group, mesh)
    },
})
