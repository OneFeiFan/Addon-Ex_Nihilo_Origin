// M-03 木桶：逐行对照 CORE/BarrelCore.js 的 tileEntity.tick / click / liquidInteract / show
// 状态存在方块实体的动态属性里（26.50 稳定版）；内容物由实体 eno:barrel_content 显示（方案 B）。
//
// 原模组的"进度"：threadProcess() = |sin(经过的 tick × 0.09°)|，满 1000 tick（50 秒）到 1 —— 发酵、各种液体反应都按这个时长。
// 这里不用世界时间戳（重进世界会归零），改为累计"处理中经过的 tick 数" proc，效果相同。
// 暂未移植：漏斗输入输出（StorageInterface）、作者之钩打开的测试界面。
import { world, system, Block, Player, ItemStack, Dimension, Entity, BlockDynamicPropertiesComponent, Vector3, WeatherType } from '@minecraft/server'
import { registerBlockComponent } from '@sapdon/runtime'
import { COMPOST, LIQUID_RECIPES, BUCKETS, FILL, LIQUID_LIMITS, LIQUID_TEXTURE, OUTPUT_TEXTURE, compostTexture, SALT_PER_BRINE, DISSOLVE_TICKS, PRECIPITATE_TICKS, precipitate, PRECIPITATE, SALT_TEXTURE } from '../data/barrel.js'
import { consumeMainhand } from '../lib/tool.js'

/** 沉淀出的粉盐（显示成彩色结晶层） */
const SALTS = new Set(PRECIPITATE.map((d) => d.item))
const STEP = 2            // 方块 tick 间隔（与 src-build/barrel.ts 的 setTick 一致）
const DONE = 1000         // 处理完成所需的 tick（原模组 sin 到 1）
const ENTITY = 'eno:barrel_content'

interface State {
    inId: string, inN: number         // slotInPut
    cId: string, cN: number           // slotCompost
    outId: string, outN: number       // slotOutPut
    liq: string, amt: number          // liquidStorage（同时只有一种液体，0–1 桶）
    proc: number, refresh: boolean, ferm: boolean, vol: number
    salt: number, ash: number, extra: string   // 2.4：已放入的粗盐、灰烬；extra = 其余产物（JSON）
}
const EMPTY: State = { inId: '', inN: 0, cId: '', cN: 0, outId: '', outN: 0, liq: '', amt: 0, proc: 0, refresh: false, ferm: false, vol: 0, salt: 0, ash: 0, extra: '' }
const dp = (b: Block) => b.getComponent('minecraft:dynamic_properties') as BlockDynamicPropertiesComponent | undefined
function load(b: Block): State {
    const s = dp(b), st: any = { ...EMPTY }
    if (s) for (const k of Object.keys(EMPTY)) { const v = s.get(k); if (v !== undefined) st[k] = v }
    return st
}
function save(b: Block, st: State, before: State) {
    const s = dp(b); if (!s) return
    for (const k of Object.keys(EMPTY) as (keyof State)[]) if (st[k] !== before[k]) s.set(k, st[k] as any)
}
const addLiquid = (st: State, liq: string, n: number) => { st.liq = liq; st.amt = Math.min(1, st.amt + n) }
const takeLiquid = (st: State, n: number) => { st.amt = Math.max(0, st.amt - n); if (st.amt <= 1e-9) { st.amt = 0; st.liq = ''; st.salt = 0; st.ash = 0 } }

// ---------- 天气（26.50 没有查询接口：记住最近一次天气变化，存进世界动态属性以便重进世界后恢复）----------
let raining = false
world.afterEvents.worldLoad.subscribe(() => { raining = world.getDynamicProperty('eno:raining') === true })
// 只认主世界的天气变化；维度字段写法不固定（"overworld" / "minecraft:overworld" 都见过），按包含判断
world.afterEvents.weatherChange.subscribe(({ newWeather, dimension }) => {
    if (!/overworld/i.test(dimension)) return
    raining = newWeather !== WeatherType.Clear
    world.setDynamicProperty('eno:raining', raining)
})
const seesSky = (b: Block) => { const top = b.dimension.getTopmostBlock({ x: b.location.x, z: b.location.z }); return !top || top.location.y <= b.location.y }
/** 不下雨的生物群系（原模组只看天气；按作者要求补上）：沙漠、热带草原、恶地不下雨，冰雪类下的是雪 */
const NO_RAIN = new Set(['desert', 'desert_hills', 'desert_mutated', 'savanna', 'savanna_plateau', 'savanna_mutated', 'savanna_plateau_mutated',
    'mesa', 'mesa_plateau', 'mesa_plateau_stone', 'mesa_bryce', 'mesa_plateau_mutated', 'mesa_plateau_stone_mutated',
    'ice_plains', 'ice_plains_spikes', 'ice_mountains', 'cold_taiga', 'cold_taiga_hills', 'cold_taiga_mutated', 'cold_beach',
    'frozen_river', 'frozen_ocean', 'deep_frozen_ocean', 'legacy_frozen_ocean', 'snowy_slopes', 'frozen_peaks', 'jagged_peaks', 'grove'].map((b) => `minecraft:${b}`))
const rainsHere = (b: Block) => { if (b.dimension.id !== 'minecraft:overworld') return false; try { return !NO_RAIN.has(b.dimension.getBiome(b.location).id) } catch { return true } }

// ---------- tick ----------
function tick(b: Block, material: string) {
    const before = load(b), st: State = { ...before }
    liquidInteract(b, st, material)
    if (!b.isValid || b.typeId === 'minecraft:lava') { removeContent(b.dimension, b.location); return }   // 木桶被岩浆烧掉了
    if (!st.refresh) st.proc = 0; else st.proc += STEP    // setOrigin：不在处理时进度归零

    // 堆肥：桶里体积不满 1000 时，每次从投入槽取一个进堆肥槽；满 1000 开始发酵
    const vol = st.cId && COMPOST[st.cId] ? COMPOST[st.cId].volume * st.cN : 0
    if (!st.ferm && vol < 1000) {
        const f = st.inId && COMPOST[st.inId]
        if (f) { st.cN = vol / f.volume + 1; st.cId = st.inId; st.inN -= 1; if (st.inN <= 0) { st.inN = 0; st.inId = '' } }   // 原模组的换算：总体积不变，按新物品计数
        st.vol = vol
    } else if (!st.ferm) { st.refresh = true; st.ferm = true; st.vol = 1000 }
    if (st.ferm && st.proc >= DONE) { st.refresh = false; st.ferm = false; st.vol = 0; st.cId = ''; st.cN = 0; st.outId = 'minecraft:dirt'; st.outN = 1 }

    // 下雨：空桶或水桶、没有堆肥和产物时，露天每 tick 积 0.005 桶水
    if (raining && (!st.liq || st.liq === 'water') && st.vol <= 0 && !st.outId && !st.refresh && seesSky(b) && rainsHere(b)) {
        if (!st.liq) { }
        addLiquid(st, 'water', 0.005 * STEP)
    }

    // 液体配方：投入槽里是当前液体能处理的物品 → 立即得到产物
    const out = st.inId && LIQUID_RECIPES[st.liq]?.[st.inId]
    if (out) { st.outId = out; st.outN = 1; st.inId = ''; st.inN = 0; takeLiquid(st, 1); st.refresh = false }

    save(b, st, before)
    show(b, st)
}

function liquidInteract(b: Block, st: State, material: string) {
    const at = (dy: number) => b.dimension.getBlock({ x: b.location.x, y: b.location.y + dy, z: b.location.z })
    switch (st.liq) {
        case 'waterslime':   // 水 + 牛奶：50 秒后出 2 个粘液球
            st.refresh = true
            if (st.proc >= DONE) { st.outId = 'minecraft:slime_ball'; st.outN += 2; takeLiquid(st, 1); st.refresh = false }
            break
        case 'brine':        // 2.4：卤水 + 灰烬 → 10 秒后沉淀出粉盐，桶里留下一桶水
            if (st.ash > 0) {
                st.refresh = true
                if (st.proc >= PRECIPITATE_TICKS) {
                    const [first, ...rest] = precipitate()
                    st.outId = first[0]; st.outN = first[1]; st.extra = rest.length ? JSON.stringify(rest) : ''
                    st.liq = 'water'; st.amt = 1; st.ash = 0; st.refresh = false
                }
            }
            break
        case 'water':        // 2.4：放够 4 个粗盐 → 20 秒后溶成卤水
            if (st.salt >= SALT_PER_BRINE) {
                st.refresh = true
                if (st.proc >= DISSOLVE_TICKS) { st.liq = 'brine'; st.salt = 0; st.refresh = false }
                break
            }
            if (st.salt > 0) break
            // 满桶水 + 下方菌丝：50 秒后变成女巫水
            if (st.amt >= 1 && at(-1)?.typeId === 'minecraft:mycelium') {
                st.refresh = true
                if (st.proc >= DONE) { takeLiquid(st, 1); addLiquid(st, 'waterwitch', 1); st.refresh = false }
            } else if (st.refresh) {
                // 做女巫水途中移走了菌丝：失败，水冒着烟消失（作者要求；原代码在这种情况下的分支是"出一块冰"，实际几乎走不到，D-14）
                takeLiquid(st, 1); st.refresh = false
                const c = { x: b.location.x + 0.5, y: b.location.y + 0.9, z: b.location.z + 0.5 }
                for (let i = 0; i < 6; i++) b.dimension.spawnParticle('minecraft:basic_smoke_particle', { x: c.x + (Math.random() - 0.5) * 0.6, y: c.y, z: c.z + (Math.random() - 0.5) * 0.6 })
                b.dimension.playSound('random.fizz', c)
            }
            break
        case 'lava':         // 岩浆：上方有水 → 黑曜石；木桶装岩浆 → 冒火星，50 秒后烧成岩浆
            st.refresh = true
            if (['minecraft:water', 'minecraft:flowing_water'].includes(at(1)?.typeId ?? '')) { st.outId = 'minecraft:obsidian'; st.outN = 1; takeLiquid(st, 1); st.refresh = false }
            if (material === 'wood') {
                if (Math.random() <= 0.05) b.dimension.spawnParticle('minecraft:basic_flame_particle', { x: b.location.x + 0.5, y: b.location.y + 1.1, z: b.location.z + 0.5 })
                if (st.proc >= DONE) { b.setType('minecraft:lava'); st.refresh = false }
            }
            break
    }
}

// ---------- 右键 ----------
function giveBack(player: Player, empty: string) {
    // bucketInteract：手上多于 1 个时把空桶放进背包，否则直接换成空桶
    const eq = player.getComponent('minecraft:equippable'), held = eq?.getEquipment('Mainhand' as any)
    if (held && held.amount > 1) { consumeMainhand(player); player.getComponent('minecraft:inventory')?.container?.addItem(new ItemStack(empty, 1)) }
    else eq?.setEquipment('Mainhand' as any, new ItemStack(empty, 1))
}
function click(b: Block, player: Player) {
    const before = load(b), st: State = { ...before }
    const held = player.getComponent('minecraft:equippable')?.getEquipment('Mainhand' as any)
    const id = held?.typeId ?? ''
    const bucket = BUCKETS[id], full = FILL[id]?.[st.liq], recipe = LIQUID_RECIPES[st.liq]?.[id], compostable = COMPOST[id]

    if (bucket) {   // setLiquid
        if (bucket.liquid === 'milk') {
            if (st.liq === 'water' && st.amt >= 1) { st.liq = 'waterslime'; giveBack(player, bucket.empty) }   // LiquidSet.mixSet：水 + 牛奶 = 史莱姆水
        } else if ((LIQUID_LIMITS[st.liq] ?? []).includes(bucket.liquid) && !st.liq && !st.outId && st.vol <= 0 && st.amt < 1) {
            st.liq = bucket.liquid; st.amt = 1; giveBack(player, bucket.empty)
        }
    }
    if (full && st.amt >= 1) {   // getLiquid：原模组这里总是把手上的空桶减 1、把装满的桶放进背包
        takeLiquid(st, 1); st.refresh = false
        consumeMainhand(player)
        player.getComponent('minecraft:inventory')?.container?.addItem(new ItemStack(full, 1))
    }
    if (!st.outId && compostable && !st.liq && !st.ferm) { st.inId = id; st.inN += 1; consumeMainhand(player) }   // getBlock
    if (recipe && st.amt >= 1) { st.inId = id; st.inN += 1; consumeMainhand(player) }
    // 2.4 盐：粗盐一个一个放（水满一桶、没有产物、不在做女巫水时）；卤水里放 1 个灰烬。
    // 反馈只用桶里液面的变化（不弹文字提示）；放灰烬时有一声"嘶"和一点烟
    const top = { x: b.location.x + 0.5, y: b.location.y + 0.95, z: b.location.z + 0.5 }
    const puff = (particle: string, n: number) => { for (let i = 0; i < n; i++) b.dimension.spawnParticle(particle, { x: top.x + (Math.random() - 0.5) * 0.6, y: top.y, z: top.z + (Math.random() - 0.5) * 0.6 }) }
    if (id === 'eno:salt_crude' && st.liq === 'water' && st.amt >= 1 && !st.outId && st.salt < SALT_PER_BRINE && (st.salt > 0 || !st.refresh)) {
        st.salt += 1; consumeMainhand(player)   // 不出声、不出粒子，只看桶里盐晶变多
    }
    if (id === 'eno:ash' && st.liq === 'brine' && st.amt >= 1 && !st.outId && st.ash === 0) {
        st.ash = 1; consumeMainhand(player)
        b.dimension.playSound('random.fizz', top, { volume: 0.4 })
        puff('minecraft:basic_smoke_particle', 5)
    }
    if (st.outId) {   // 取出产物（一次全部取出）
        const at = { x: b.location.x + 0.5, y: b.location.y + 1, z: b.location.z + 0.5 }
        b.dimension.spawnItem(new ItemStack(st.outId, st.outN), at)
        if (st.extra) { try { for (const [i, n] of JSON.parse(st.extra) as [string, number][]) b.dimension.spawnItem(new ItemStack(i, n), at) } catch { } }
        st.outId = ''; st.outN = 0; st.extra = ''
    }
    save(b, st, before)
    show(b, st)
}

// ---------- 显示（tileEntity.show）：产物 > 液体 > 堆肥 ----------
const keyOf = (d: Dimension, l: Vector3) => `${d.id}|${l.x}|${l.y}|${l.z}`
const contents = new Map<string, Entity>()
function contentEntity(d: Dimension, l: Vector3, create: boolean): Entity | undefined {
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
function show(b: Block, st: State) {
    let h = 0, t = 0
    if (st.outId && OUTPUT_TEXTURE[st.outId] !== undefined) { h = 1000; t = OUTPUT_TEXTURE[st.outId] }
    else if (st.outId && SALTS.has(st.outId)) { h = 1000; t = SALT_TEXTURE.sediment }   // 2.4.2：沉淀出的粉盐还没取走——桶里显示一层彩色结晶
    else if (st.liq === 'water' && st.salt > 0) {   // 放了几个粗盐就有多少盐晶；放够 4 个后随溶解进度盐晶变少、水变浑
        h = Math.round(1000 * st.amt)
        const step = st.salt >= SALT_PER_BRINE ? Math.floor(st.proc / DISSOLVE_TICKS * 6) : -1
        t = step < 1 ? SALT_TEXTURE.salty[Math.min(st.salt, SALT_PER_BRINE) - 1] : SALT_TEXTURE.dissolve[Math.min(step, 6) - 1]
    }
    else if (st.liq === 'brine' && st.ash > 0) {     // 加了灰烬：随沉淀进度慢慢结出晶体
        h = Math.round(1000 * st.amt)
        t = SALT_TEXTURE.precip[Math.min(5, Math.floor(st.proc / PRECIPITATE_TICKS * 6))]
    }
    else if (st.liq && LIQUID_TEXTURE[st.liq] !== undefined) { h = Math.round(1000 * st.amt); t = LIQUID_TEXTURE[st.liq] }
    else if (st.cId && COMPOST[st.cId]) {
        const base = COMPOST[st.cId].base
        if (st.proc <= 0) { h = Math.round(st.vol); t = compostTexture(base, 0) }
        else { h = 1000; t = compostTexture(base, Math.round(Math.round((st.proc % DONE) / 10) / 5)) }   // 发酵：原模组第 round(进度/10) 帧，取最近的 5 的倍数
    }
    if (h <= 0) { removeContent(b.dimension, b.location); return }
    const e = contentEntity(b.dimension, b.location, true)
    if (!e) return
    if (e.getProperty('eno:h') !== h) e.setProperty('eno:h', h)
    if (e.getProperty('eno:t') !== t) e.setProperty('eno:t', t)
}

registerBlockComponent('eno:barrel', {
    onTick: ({ block }, { params }: any) => tick(block, params.material),
    onPlayerInteract: ({ block, player }) => { if (player) click(block, player) },
    // 原 destroyBlock：清空所有槽位（内容物不掉落）
    onBreak: ({ block, dimension }) => removeContent(dimension, block.location),
})
// 重进世界时，内容物实体由下一次 tick 重新关联（按位置查找），不需要额外处理
