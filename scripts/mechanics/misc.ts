// 诅咒之土、末影蛋糕、紫颂苗：逐行对照 BLOCKS/cruseearth.js、BLOCKS/endercake.js、BLOCKS/chorussprout.js
import { world, system, Block, Dimension, Vector3, ItemStack, Player, GameMode, EquipmentSlot, BlockDynamicPropertiesComponent } from '@minecraft/server'
import { registerBlockComponent } from '@sapdon/runtime'
import { fertilizeWith } from './fertilizer.js'

// ======================== 诅咒之土 ========================
// · 黑暗（上方亮度 ≤ 4）中满 10000 tick 后成熟，此后不断把相邻的草方块 / 泥土变成诅咒之土（依次：东、上、南、西、北、下）
// · 上方亮度 ≥ 8：很快退化成泥土，55% 在上方点火；退化前会对站在上面的生物造成 13 点伤害
// · 每 670 tick：附近 20 格内实体少于 35 个（原模组 config.json 的 EntityMax）、上方亮度 ≤ 6 时，
//   依次以 12.5% / 13.5% / 12.5% / 6% / 5% / 2% 的概率生成僵尸、苦力怕、骷髅、蜘蛛、女巫、末影人
// · 动物走到上面会招来闪电
// · 挖掉：精准采集掉自身，否则掉泥土
// 原模组每 tick 运行；这里每 20 tick 运行一次，计数按 20 累计，670 tick 的刷怪周期按累计 tick 判定。
const STEP = 20
const ENTITY_MAX = 35
const MOBS: [string, number][] = [['minecraft:zombie', 12.5], ['minecraft:creeper', 13.5], ['minecraft:skeleton', 12.5], ['minecraft:spider', 6], ['minecraft:witch', 5], ['minecraft:enderman', 2]]
const ANIMALS = new Set(['minecraft:chicken', 'minecraft:cow', 'minecraft:pig', 'minecraft:sheep', 'minecraft:wolf', 'minecraft:villager', 'minecraft:villager_v2', 'minecraft:mooshroom', 'minecraft:squid', 'minecraft:rabbit'])
const NOT_DAMAGED = new Set(['minecraft:item', 'minecraft:tnt', 'minecraft:falling_block', 'minecraft:xp_bottle', 'minecraft:xp_orb', 'minecraft:fishing_hook', 'minecraft:arrow', 'minecraft:snowball', 'minecraft:egg', 'minecraft:painting', 'minecraft:minecart', 'minecraft:fireball', 'minecraft:splash_potion', 'minecraft:boat', 'minecraft:lightning_bolt', 'minecraft:small_fireball'])
const SPREAD_ORDER = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1], [0, -1, 0]]

/** 原模组 World.getLightLevel 计入昼夜：天空光按时间减弱（夜里减 11）。基岩版接口只有总亮度和天空光，方块光按"总亮度高出天空光的部分"估算 */
function brightness(dim: Dimension, at: Vector3) {
    let total = 0, sky = 0
    try { total = dim.getLightLevel(at); sky = dim.getSkyLightLevel(at) } catch { return 0 }
    const t = world.getTimeOfDay()
    const darken = t < 12000 ? 0 : t < 13800 ? (t - 12000) / 1800 * 11 : t < 22200 ? 11 : t < 24000 ? (24000 - t) / 1800 * 11 : 0
    const blockLight = total > sky ? total : 0
    return Math.max(blockLight, Math.round(sky - darken))
}
const dp = (b: Block) => b.getComponent('minecraft:dynamic_properties') as BlockDynamicPropertiesComponent | undefined
const isSoil = (b?: Block) => b?.typeId === 'minecraft:grass_block' || b?.typeId === 'minecraft:dirt'

registerBlockComponent('eno:cursed_earth', {
    onTick: ({ block, dimension }) => {
        const l = block.location, top = { x: l.x + 0.5, y: l.y + 1, z: l.z + 0.5 }
        const light = brightness(dimension, { x: l.x, y: l.y + 1, z: l.z })
        // 计数存在方块的动态属性里（每块诅咒之土各自计时）；没有方块实体时退回到世界动态属性
        const key = `eno:ce|${dimension.id}|${l.x}|${l.y}|${l.z}`
        const store = dp(block)
        const get = (k: string) => ((store ? store.get(k) : world.getDynamicProperty(`${key}|${k}`)) as number) ?? 0
        const set = (k: string, v: number) => store ? store.set(k, v) : world.setDynamicProperty(`${key}|${k}`, v)
        const age = get('age') + STEP
        set('age', age)
        if (age >= 10000 && light <= 4) {
            for (const [dx, dy, dz] of SPREAD_ORDER) {
                const n = dimension.getBlock({ x: l.x + dx, y: l.y + dy, z: l.z + dz })
                if (isSoil(n)) { n!.setType(block.typeId); break }
            }
        }
        if (light >= 8) {
            const lit = get('lit') + STEP
            set('lit', lit)
            for (const e of dimension.getEntities({ location: top, maxDistance: 1 })) if (!NOT_DAMAGED.has(e.typeId)) { try { e.applyDamage(13) } catch { } }
            if (lit > 10) {
                block.setType('minecraft:dirt')
                if (Math.random() * 100 < 55) { const up = block.above(); if (up?.isAir) up.setType('minecraft:fire') }
                if (!store) { world.setDynamicProperty(`${key}|age`, undefined); world.setDynamicProperty(`${key}|lit`, undefined) }
                return
            }
        }
        // 刷怪：累计 tick 每跨过一个 670 的周期判定一次
        if (Math.floor(age / 670) !== Math.floor((age - STEP) / 670) && light <= 6) {
            const near = dimension.getEntities({ location: top, maxDistance: 20 }).length
            const spawned: string[] = []
            if (near < ENTITY_MAX) for (const [mob, chance] of MOBS) if (Math.random() * 100 < chance) { dimension.spawnEntity(mob as any, { x: l.x + 0.5, y: l.y + 1.5, z: l.z + 0.5 }); spawned.push(mob) }
        }
        for (const e of dimension.getEntities({ location: top, maxDistance: 1 })) if (ANIMALS.has(e.typeId)) { dimension.spawnEntity('minecraft:lightning_bolt' as any, { x: l.x, y: l.y, z: l.z }); break }
    },
    onPlayerBreak: ({ block, player }) => {
        if (!(player instanceof Player) || player.getGameMode() === GameMode.Creative) return
        const tool = player.getComponent('minecraft:equippable')?.getEquipment(EquipmentSlot.Mainhand)
        const silk = (tool?.getComponent('minecraft:enchantable')?.getEnchantment('silk_touch')?.level ?? 0) >= 1
        block.dimension.spawnItem(new ItemStack(silk ? 'eno:dirt_earth' : 'minecraft:dirt', 1), { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 })
    },
})

// ======================== 末影蛋糕 ========================
// 右键：吃一口（6 口后消失），并把玩家送往末地。从主世界过去时，在 (100, 48, 0) 铺 5×5 黑曜石平台、清空上方 3 格，
// 把玩家放在平台上 —— 与原版进入末地时的出生平台相同（原模组放在 y=53 会摔伤，这里直接站在平台上）。
const CAKE_BITES = 6
registerBlockComponent('eno:end_cake', {
    onPlayerInteract: ({ block, player }) => {
        if (!player) return
        const bites = (block.permutation.getState('eno:bites' as any) as number) + 1
        if (bites >= CAKE_BITES) block.setType('minecraft:air')
        else block.setPermutation(block.permutation.withState('eno:bites' as any, bites))
        if (player.dimension.id === 'minecraft:the_end') return
        const fromOverworld = player.dimension.id === 'minecraft:overworld'
        const end = world.getDimension('the_end')
        player.teleport({ x: 100.5, y: 53, z: 0.5 }, { dimension: end })
        if (!fromOverworld) return
        // 跨维度传送要经过加载画面，末地的区块也要过一会儿才加载：上一版固定只等 5 tick，平台位置的区块还没加载，
        // getBlock 返回空、什么都没放就结束了。现在一直等到玩家已在末地、平台所在区块可用时才铺平台（最多等 20 秒）。
        let waited = 0
        const job = system.runInterval(() => {
            waited++
            if (!player.isValid || waited > 400) { system.clearRun(job); return }
            if (player.dimension.id !== 'minecraft:the_end') return
            const probe = end.getBlock({ x: 100, y: 48, z: 0 })
            // 区块加载好之前把玩家固定在原处，不让他往下掉（每次传送都会清零下落距离）
            if (!probe) { player.teleport({ x: 100.5, y: 53, z: 0.5 }, { dimension: end }); return }
            for (let x = 98; x <= 102; x++) for (let z = -2; z <= 2; z++) {
                for (let y = 49; y <= 51; y++) end.getBlock({ x, y, z })?.setType('minecraft:air')
                end.getBlock({ x, y: 48, z })?.setType('minecraft:obsidian')
            }
            // 原模组把玩家放在 y=53，会摔下 4 格扣血；这里直接放在平台表面（y=49），不会摔伤
            player.teleport({ x: 100.5, y: 49, z: 0.5 }, { dimension: end })
            system.clearRun(job)
        }, 1)
    },
})

// ======================== 紫颂苗 ========================
// 随机刻时 15% 的概率长一个阶段（原模组），共 4 个阶段（eno:stage 0–3），最后一个阶段不再生长。
// 骨粉 / 灰烬催熟见 scripts/mechanics/fertilizer.ts（原版骨粉点在自定义方块上不会自动生效，在这里接住）
registerBlockComponent('eno:chorus_sprout', {
    onRandomTick: ({ block }) => {
        const stage = block.permutation.getState('eno:stage' as any) as number
        if (stage < 3 && Math.random() < 0.15) block.setPermutation(block.permutation.withState('eno:stage' as any, stage + 1))
    },
    onPlayerInteract: ({ block, player }) => {
        const held = player?.getComponent('minecraft:equippable')?.getEquipment('Mainhand' as any)
        if (player && held?.typeId === 'minecraft:bone_meal') fertilizeWith(player, block)
    },
})

// ======================== 方块破坏机 ========================
// 每 50 tick（原模组的间隔）挖掉正面前方的方块。按作者要求做成"真正在挖掘"，与原模组不同：
//   · 掉落：按原版规则，相当于用一把铁镐挖（合成配方里正好有铁镐）——钻石矿掉钻石、石头掉圆石、玻璃什么都不掉、
//     箱子连同里面的东西一起掉出（原模组是一律掉方块本身，液体、植物等不掉）
//   · 挖掉时有原版的破坏粒子和音效
//   · 不挖空气、液体，以及基岩、传送门框架、命令方块这类不可破坏的方块
// 做法：用 /setblock … destroy 拆方块（原版粒子、音效、容器内容掉落），它按"空手挖"给的掉落当 tick 删掉，
// 2 tick 后再按铁镐生成正确的掉落（LootTableManager.generateLootFromBlock）。
const UNBREAKABLE = new Set(['minecraft:bedrock', 'minecraft:barrier', 'minecraft:invisible_bedrock', 'minecraft:end_portal', 'minecraft:end_portal_frame', 'minecraft:end_gateway', 'minecraft:portal',
    'minecraft:command_block', 'minecraft:repeating_command_block', 'minecraft:chain_command_block', 'minecraft:structure_block', 'minecraft:structure_void', 'minecraft:jigsaw',
    'minecraft:allow', 'minecraft:deny', 'minecraft:border_block', 'minecraft:light_block', ...Array.from({ length: 16 }, (_, i) => `minecraft:light_block_${i}`), 'minecraft:moving_block', 'minecraft:piston_arm_collision', 'minecraft:sticky_piston_arm_collision', 'minecraft:reinforced_deepslate'])
// 正面朝向玩家：朝向状态是玩家面朝的方向，正面（也就是要挖的那一格）在它的反方向
const FRONT: Record<string, [number, number, number]> = { north: [0, 0, 1], south: [0, 0, -1], east: [-1, 0, 0], west: [1, 0, 0] }
const PICKAXE = () => new ItemStack('minecraft:iron_pickaxe', 1)
/** 正在被破坏机拆的格子：这一 tick 里在这些格子冒出的掉落物是"空手挖"的结果，删掉 */
const suppress: { dim: string, x: number, y: number, z: number, tick: number }[] = []
world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (!suppress.length || entity.typeId !== 'minecraft:item') return
    const now = system.currentTick
    for (let i = suppress.length - 1; i >= 0; i--) if (now - suppress[i].tick > 1) suppress.splice(i, 1)   // 事件可能在下一 tick 才送到：窗口 1 tick
    const l = entity.location
    if (suppress.some((s) => s.dim === entity.dimension.id && Math.floor(l.x) === s.x && Math.floor(l.y) === s.y && Math.floor(l.z) === s.z)) entity.remove()
})
registerBlockComponent('eno:block_breaker', {
    onTick: ({ block, dimension }) => {
        const [dx, dy, dz] = FRONT[block.permutation.getState('minecraft:cardinal_direction' as any) as string] ?? FRONT.south
        const at = { x: block.location.x + dx, y: block.location.y + dy, z: block.location.z + dz }
        const target = dimension.getBlock(at)
        if (!target || target.isAir || target.isLiquid || UNBREAKABLE.has(target.typeId)) return
        const id = target.typeId
        let loot: ItemStack[] = []
        try { loot = world.getLootTableManager().generateLootFromBlock(target, PICKAXE()) ?? [] } catch { }
        // 容器里的东西要原样掉出来：/setblock destroy 会掉，但它连同方块本身的"空手"掉落一起掉；
        // 所以先记下容器内容，删掉这一 tick 冒出的所有掉落物，再把容器内容和铁镐掉落一起放出来
        const inv = target.getComponent('minecraft:inventory')?.container
        const contents: ItemStack[] = []
        if (inv) for (let i = 0; i < inv.size; i++) { const it = inv.getItem(i); if (it) contents.push(it) }
        suppress.push({ dim: dimension.id, ...at, tick: system.currentTick })
        try { dimension.runCommand(`setblock ${at.x} ${at.y} ${at.z} air destroy`) } catch { target.setType('minecraft:air') }
        system.runTimeout(() => {   // 等删除窗口过去再放出正确的掉落
            const pos = { x: at.x + 0.5, y: at.y + 0.5, z: at.z + 0.5 }
            for (const it of [...loot, ...contents]) dimension.spawnItem(it, pos)
        }, 2)
    },
})
