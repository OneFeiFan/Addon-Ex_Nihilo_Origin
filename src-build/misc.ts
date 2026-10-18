// 诅咒之土（BLOCKS/cruseearth.js）、末影蛋糕（BLOCKS/endercake.js）、紫颂苗（BLOCKS/chorussprout.js）
import { BlockAPI, BlockComponent, GRegistry } from '@sapdon/core'
import { blockSounds, registered, block } from './api.js'
import { MaterialModel, Box } from './geometry.js'
import { itemVisual } from './furnace.js'

const emptyLoot = () => { GRegistry.register('eno_no_drop', 'behavior', 'loot_tables/blocks/', { toObject: () => ({ pools: [] }) } as any); return 'loot_tables/blocks/eno_no_drop.json' }

/** 诅咒之土：继承泥土（硬度 0.5、铲子、沙砾音效）；贴图 [上, 下, 东, 西, 南, 北]。掉落由脚本决定（精准采集掉自身，否则掉泥土） */
export function cursedEarth(id: string, up: string, down: string, side: string) {
    const b: any = block(id, [up, down, side, side, side, side], { category: 'nature', hardness: 0.5, explosion: 0.5, sound: 'gravel', tools: ['shovel'], noDrop: true, components: ['eno:cursed_earth'] })
    // 原模组每 tick 运行；这里每 20 tick，计数按 20 累计。每块诅咒之土各自的计数存在方块实体里
    b.addComponent(BlockComponent.combineComponents(BlockComponent.setTick([20, 20], true), BlockComponent.setBlockEntity(true)))
}

// ---------- 末影蛋糕：继承蛋糕（硬度 0.2、布料音效），随玩家朝向放置；每吃一口少 2 像素，6 口后消失；不掉落 ----------
const c = (n: number) => n / 16
export const CAKE_SHAPES = [15, 13, 11, 9, 7, 5]   // 原模组 data：15 起每口减 2，≤ 4 时消失
export function endCake(id: string, t: { down: string, up: string, side: string }) {
    const m = new MaterialModel('geometry.eno.end_cake')
    CAKE_SHAPES.forEach((shape, i) => m.bone(`bite_${i}`, { up: 'up', down: 'down', side: 'side' }, [[c(1), c(0), c(1), c(15), c(8), c(shape)] as Box]))
    m.register('eno_end_cake')
    const b: any = BlockAPI.createGeometryBlock(id, 'items' as any, 'geometry.eno.end_cake',
        { '*': { texture: t.side }, up: { texture: t.up }, down: { texture: t.down }, side: { texture: t.side } }, {} as any)
    b.registerState('eno:bites', { values: { min: 0, max: CAKE_SHAPES.length - 1 } })
    // createBlockWithRotation：放置时朝向玩家（四个水平方向）
    b.registerTrait('minecraft:placement_direction', { enabled_states: ['minecraft:cardinal_direction'] })
    const yRot: Record<string, number> = { north: 0, south: 180, west: 90, east: 270 }
    for (const [dir, rot] of Object.entries(yRot)) b.addPermutation(`q.block_state('minecraft:cardinal_direction') == '${dir}'`, new Map().set('minecraft:transformation', { rotation: [0, rot, 0] }))
    const vis: Record<string, string> = {}
    CAKE_SHAPES.forEach((_, i) => { vis[`bite_${i}`] = `q.block_state('eno:bites') == ${i}` })
    b.addComponent(BlockComponent.combineComponents(
        BlockComponent.setGeometry('geometry.eno.end_cake', { bone_visibility: vis }),
        BlockComponent.setDestructibleByMiningCustom(0.2, undefined as any), BlockComponent.setDestructibleByExplosionCustom(0.5),
        BlockComponent.setCollisionBoxCustom([-7, 0, -7], [14, 8, 14]), BlockComponent.setSelectionBoxCustom([-7, 0, -7], [14, 8, 14]),
        BlockComponent.setLightDampening(0), BlockComponent.setLoot(emptyLoot()),
        BlockComponent.setCustomComponentV2('eno:end_cake', {}),
    ))
    blockSounds[id] = 'cloth'
    registered.add(id)
}

// ---------- 紫颂苗：一个方块 + 生长阶段状态 eno:stage（0–3），像原版作物一样 ----------
// 原模组是 4 个方块（ex_chorusSprout、ex_chorusSprout1~3）依次替换；这里合成一个方块，用状态切换每个阶段的模型。
// 井字形四片面片模型，没有碰撞，任何阶段都掉 1 个紫颂种子。
// 没有用 Sapdon 的 createCropBlock：它的存活条件写死成"只能放在耕地上"（紫颂苗种在末地石上），
// 内置生长组件的最高阶段写死为 3、随机刻生长没有上限检查、概率 1/3（原模组 15%）、只认原版骨粉。
export const CHORUS_STAGES = 4
export function chorusSprout(id: string, textures: string[]) {
    const geo = (i: number) => `geometry.${id.replace(':', '.')}_${i}`
    // 原模组 setPlantModel：x = 0.25、0.75 与 z = 0.25、0.75 四片竖直面片，高 0.01–0.99，每片贴整张贴图。
    // 用极薄的面片 + alpha_test（原版植物的做法）。0.18.x 逐像素生成小方块时把 32×32 的贴图按 16×16 取 UV，每个阶段的图都错位了。
    const full = { uv: [0, 0], uv_size: [16, 16] }
    // 面片给一点点厚度（0.02 像素）：零厚度的立方体可能让整个方块的模型校验失败（2.3.2_r2 真机上方块整个不存在了）。
    // 每片只画一个面：alpha_test 是双面渲染，同一片的两个面相隔 0.02 像素会互相争抢深度、闪烁（r3 真机）
    const planeX = (x: number) => ({ origin: [x - 0.01, 0.16, -8], size: [0.02, 15.68, 16], uv: { east: full } })
    const planeZ = (z: number) => ({ origin: [-8, 0.16, z - 0.01], size: [16, 15.68, 0.02], uv: { south: full } })
    const cubes = [planeX(-4), planeX(4), planeZ(-4), planeZ(4)]
    textures.forEach((_, i) => {
        GRegistry.register(geo(i).replace(/\./g, '_'), 'resource', 'models/blocks/', { toObject: () => ({
            format_version: '1.21.20',
            'minecraft:geometry': [{ description: { identifier: geo(i), texture_width: 16, texture_height: 16 }, bones: [{ name: 'plant', pivot: [0, 0, 0], cubes }] }],
        }) } as any)
    })
    GRegistry.register('eno_chorus_sprout', 'behavior', 'loot_tables/blocks/', { toObject: () => ({ pools: [{ rolls: 1, entries: [{ type: 'item', name: 'eno:seeds_chorus', weight: 1 }] }] }) } as any)
    const mat = (t: string) => ({ '*': { texture: t, render_method: 'alpha_test' } })
    const b: any = BlockAPI.createGeometryBlock(id, 'none' as any, geo(0), mat(textures[0]), {} as any)
    b.hide_in_command = true
    b.registerState('eno:stage', { values: { min: 0, max: textures.length - 1 } })
    for (let i = 1; i < textures.length; i++) b.addPermutation(`q.block_state('eno:stage') == ${i}`, BlockComponent.combineComponents(
        BlockComponent.setGeometry(geo(i)), BlockComponent.setMaterialInstances(mat(textures[i]))))
    b.addComponent(BlockComponent.combineComponents(
        BlockComponent.setDestructibleByMiningCustom(0, undefined as any), BlockComponent.setDestructibleByExplosionCustom(0),
        BlockComponent.setCollisionBoxEnabled(false), BlockComponent.setLightDampening(0),
        BlockComponent.setLoot('loot_tables/blocks/eno_chorus_sprout.json'),
        BlockComponent.setCustomComponents(['eno:chorus_sprout']),
    ))
    blockSounds[id] = 'grass'
    registered.add(id)
}

// ---------- 方块破坏机（BLOCKS/MACHINE/damage.js）----------
// 原模组用 4 个 data 值表示朝向（0 南、1 北、2 西、3 东），放置时正面朝向玩家；只有 data 0 进创造栏、掉落也统一是 data 0。
// 这里用一个方块 + 朝向状态表示；模型的正面在南面，按朝向转过去。每 50 tick 像铁镐一样挖掉正面前方的方块（见运行期脚本）。
export function blockBreaker(id: string, side: string, front: string) {
    // 正面放在南面：物品栏图标用基础模型，能看到南面
    const b: any = BlockAPI.createBasicBlock(id, 'items', [side, side, side, side, front, side], {} as any)
    b.registerTrait('minecraft:placement_direction', { enabled_states: ['minecraft:cardinal_direction'] })
    // 放置时正面朝向玩家（作者实测：原模组里破坏机的正面也是对着玩家的，与熔炉相同）
    const yRot: Record<string, number> = { north: 0, south: 180, east: 270, west: 90 }
    for (const [dir, rot] of Object.entries(yRot)) b.addPermutation(`q.block_state('minecraft:cardinal_direction') == '${dir}'`, new Map().set('minecraft:transformation', { rotation: [0, rot, 0] }))
    // 物品栏图标单独指定外观，正面在图标能看到的南面（不受朝向变体影响）
    itemVisual(b, 'minecraft:geometry.full_block', { up: { texture: side }, down: { texture: side }, east: { texture: side }, west: { texture: side }, south: { texture: front }, north: { texture: side } })
    b.addComponent(BlockComponent.combineComponents(
        // 原模组 createSpecialType 只给了音效、ToolAPI 材质 stone：按圆石（硬度 2、镐子）
        BlockComponent.setDestructibleByMiningCustom(2, undefined as any), BlockComponent.setDestructibleByExplosionCustom(6),
        BlockComponent.setTags(['minecraft:is_pickaxe_item_destructible']),
        BlockComponent.setTick([50, 50], true),
        BlockComponent.setCustomComponents(['eno:block_breaker']),
    ))
    blockSounds[id] = 'stone'
    registered.add(id)
}
