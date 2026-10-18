// M-04 坩埚（陶瓷坩埚、生坩埚）与 M-05 木坩埚：方块与内容物实体
// 对应原模组：BLOCKS/MACHINE/crucible.js（Crucible_boxes_*、CrucibleBoxFunc）、Compressum/Oak_Crucible_Core.js
import { BlockAPI, BlockComponent, EntityAPI, EntityComponent, GRegistry } from '@sapdon/core'
import { textureController } from './renderControllers.js'
import { blockSounds, registered, Category } from './api.js'
import { MaterialModel, Box } from './geometry.js'
import { CRUCIBLE_TEXTURES, ANIMATED } from '../scripts/data/crucible.js'

const c = (n: number) => n / 16
// 四面壁 + 四条腿（陶瓷坩埚与木坩埚相同）
const WALLS_LEGS: Box[] = [
    [c(0), c(3), c(0), c(1), c(16), c(16)], [c(15), c(3), c(0), c(16), c(16), c(16)],
    [c(1), c(3), c(0), c(15), c(16), c(1)], [c(1), c(3), c(15), c(15), c(16), c(16)],
    [c(0), c(0), c(0), c(1), c(3), c(1)], [c(0), c(0), c(15), c(1), c(3), c(16)],
    [c(15), c(0), c(0), c(16), c(3), c(1)], [c(15), c(0), c(15), c(16), c(3), c(16)],
]
const FLOOR_LOW: Box[] = [[c(1), c(2), c(1), c(15), c(3), c(15)], [c(2), c(1), c(2), c(14), c(2), c(14)]]   // Crucible_boxes_3
const FLOOR_INNER: Box[] = [[c(1), c(3), c(1), c(15), c(4), c(15)]]                                            // 内容物底下的内底

let shared = false
function registerShared() {
    if (shared) return
    shared = true
    new MaterialModel('geometry.eno.crucible')
        .bone('walls', { up: 'up', down: 'down', side: 'side' }, [...WALLS_LEGS, [c(1), c(2), c(1), c(15), c(3), c(15)]])
        .bone('floor', 'floor', [...FLOOR_LOW, ...FLOOR_INNER]).register('eno_crucible')
    new MaterialModel('geometry.eno.oak_crucible').bone('walls', 'body', WALLS_LEGS).bone('floor', 'body', FLOOR_INNER).register('eno_oak_crucible')
    registerContentEntity()
}

const common = (kind: string) => [
    BlockComponent.setLightDampening(0),
    BlockComponent.setMovable('immovable'),
    ...(kind === 'raw' ? [] : [BlockComponent.setBlockEntity(true), BlockComponent.setTick([2, 2], true), BlockComponent.setCustomComponentV2('eno:crucible', { kind })]),
]

/** 陶瓷坩埚 / 生坩埚：贴图三张（底、顶、侧）+ 内底贴图；生坩埚没有功能，只用来烧制 */
export function crucible(id: string, t: { down: string, up: string, side: string, floor: string }, kind: 'porcelain' | 'raw') {
    registerShared()
    const b: any = BlockAPI.createGeometryBlock(id, 'items' as Category, 'geometry.eno.crucible',
        { '*': { texture: t.side }, up: { texture: t.up }, down: { texture: t.down }, side: { texture: t.side }, floor: { texture: t.floor } }, {} as any)
    b.addComponent(BlockComponent.combineComponents(
        // 原模组无 base、ToolAPI 材质 stone：按物理特性取陶瓷（类似陶瓦：硬度 1.25、镐子）
        BlockComponent.setDestructibleByMiningCustom(1.25, undefined as any), BlockComponent.setDestructibleByExplosionCustom(4.2),
        BlockComponent.setTags(['minecraft:is_pickaxe_item_destructible']), ...common(kind),
    ))
    blockSounds[id] = 'stone'
    registered.add(id)
}

/** 木坩埚：一张原木贴图 */
export function oakCrucible(id: string, texture: string) {
    registerShared()
    const b: any = BlockAPI.createGeometryBlock(id, 'items' as Category, 'geometry.eno.oak_crucible', { '*': { texture }, body: { texture } }, {} as any)
    b.addComponent(BlockComponent.combineComponents(
        BlockComponent.setDestructibleByMiningCustom(2, undefined as any), BlockComponent.setDestructibleByExplosionCustom(2),
        BlockComponent.setTags(['minecraft:is_axe_item_destructible']), ...common('oak'),
    ))
    blockSounds[id] = 'wood'
    registered.add(id)
}

// ---------- 内容物实体：两层（原模组 CrucibleBoxFunc / oakcruciblebox 同时画一个方块层和一个液体层）----------
// 每层属性：eno:<层>_lo / _hi = 底 / 顶的高度（单位 0.05 像素，0–320），eno:<层>_t = 贴图编号。
// 两个渲染控制器各只显示自己那一层（part_visibility），才能让两层用不同的贴图。
export const CRUCIBLE_CONTENT = 'eno:crucible_content'
function registerContentEntity() {
    const GEO = 'geometry.eno.crucible_content', ANIM = 'animation.eno.crucible_content.layers'
    // 每层两根骨骼：<层>_pos 只负责位移、<层> 只负责缩放（同一根骨骼上同时做位移和缩放，真机上高度不对）。
    // 立方体比坩埚内壁每边小 0.01 像素、整体抬高 0.05 像素：避免与内壁、内底的面重合（重合时会从缝里透出来）。
    const side = { uv: [1, 0], uv_size: [14, 16] }
    const layer = (name: string) => [
        { name: `${name}_pos`, parent: 'root', pivot: [0, 0, 0] },
        { name, parent: `${name}_pos`, pivot: [0, 0, 0], cubes: [{ origin: [-6.99, 0, -6.99], size: [13.98, 16, 13.98],
            uv: { up: { uv: [15, 15], uv_size: [-14, -14] }, down: { uv: [15, 15], uv_size: [-14, -14] }, north: side, south: side, east: side, west: side } }] },
    ]
    GRegistry.register('eno_crucible_content', 'resource', 'models/entity/', { toObject: () => ({
        format_version: '1.21.20',
        'minecraft:geometry': [{ description: { identifier: GEO, texture_width: 16, texture_height: 16, visible_bounds_width: 1.5, visible_bounds_height: 1.5, visible_bounds_offset: [0, 0.5, 0] },
            bones: [{ name: 'root', pivot: [0, 0, 0] }, ...layer('a'), ...layer('b')] }],
    }) } as any)
    const bonesAnim: Record<string, any> = {}
    for (const l of ['a', 'b']) {
        bonesAnim[`${l}_pos`] = { position: [0, `q.property('eno:${l}_lo') * 0.05 + 0.05`, 0] }
        bonesAnim[l] = { scale: [1, `math.max(0, q.property('eno:${l}_hi') - q.property('eno:${l}_lo')) / 320`, 1] }
    }
    GRegistry.register('eno_crucible_content', 'resource', 'animations/', { toObject: () => ({
        format_version: '1.8.0', animations: { [ANIM]: { loop: true, bones: bonesAnim } },
    }) } as any)

    const names = ['a', 'b'].map((l) => textureController(`eno_crucible_content_${l}`, CRUCIBLE_TEXTURES.length, `q.property('eno:${l}_t')`,
        { root: true, [`${l}_pos`]: true, [l]: `q.property('eno:${l}_hi') > q.property('eno:${l}_lo')` }, ANIMATED))

    const e = EntityAPI.createDummyEntity(CRUCIBLE_CONTENT, CRUCIBLE_TEXTURES[0], { is_summonable: true, is_spawnable: false, format_version: '1.21.0' } as any)
    for (const l of ['a', 'b']) {
        e.behavior.addProperty(`eno:${l}_lo`, { type: 'int', range: [0, 320], default: 0, client_sync: true })
        e.behavior.addProperty(`eno:${l}_hi`, { type: 'int', range: [0, 320], default: 0, client_sync: true })
        e.behavior.addProperty(`eno:${l}_t`, { type: 'int', range: [0, CRUCIBLE_TEXTURES.length - 1], default: 0, client_sync: true })
    }
    e.behavior.addComponent(EntityComponent.combineComponents(
        EntityComponent.setTypeFamily(['eno_crucible_content', 'inanimate']), EntityComponent.setFireImmune(true),
        new Map<string, any>().set('minecraft:damage_sensor', { triggers: [{ cause: 'all', deals_damage: false }] }),
    ))
    const r: any = e.resource
    r.textures = {}
    CRUCIBLE_TEXTURES.forEach((t, i) => r.addTexture(`t${i}`, t))
    r.addMaterial('default', 'entity_alphatest')
    r.addGeometry('default', GEO)
    r.addAnimation('layers', ANIM)
    r.setScript('animate', ['layers'])
    r.render_controllers = names
}
