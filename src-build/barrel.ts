// M-03 木桶：方块（23 种）与内容物实体（方案 B：桶里的堆肥、液体、产物由一个实体负责显示）
// 对应原模组：CORE/BarrelCore.js（barrel_boxes_1、BuildBarrelBox、Barrel.add）
import { BlockAPI, BlockComponent, EntityAPI, EntityComponent, GRegistry, TerrainTextureManager } from '@sapdon/core'
import { textureController } from './renderControllers.js'
import { blockSounds, registered, Category } from './api.js'
import { MaterialModel, Box } from './geometry.js'
import { BARREL_TEXTURES, ANIMATED } from '../scripts/data/barrel.js'

const c = (n: number) => n / 16
// barrel_boxes_1：桶底 + 四面桶壁
const BODY: Box[] = [
    [c(2), c(0), c(2), c(14), c(1), c(14)],
    [c(1), c(0), c(1), c(14), c(16), c(2)],
    [c(1), c(0), c(2), c(2), c(16), c(15)],
    [c(14), c(0), c(1), c(15), c(16), c(14)],
    [c(2), c(0), c(14), c(15), c(16), c(15)],
]
const BARREL_GEOMETRY = 'geometry.eno.barrel'
let shared = false
function registerShared() {
    if (shared) return
    shared = true
    new MaterialModel(BARREL_GEOMETRY).bone('body', 'body', BODY).register('eno_barrel')
    registerContentEntity()
}

type Material = 'wood' | 'stone' | 'glass'
const PROPS: Record<Material, { hardness: number, explosion: number, sound: string, tags: string[], render?: string }> = {
    wood: { hardness: 2, explosion: 3, sound: 'wood', tags: ['minecraft:is_axe_item_destructible'] },          // 木板
    stone: { hardness: 1.5, explosion: 6, sound: 'stone', tags: ['minecraft:is_pickaxe_item_destructible'] },  // 石头
    glass: { hardness: 0.3, explosion: 0.3, sound: 'glass', tags: [], render: 'blend' },                      // 玻璃（原模组 renderlayer 1、透明）
}

/** 一个木桶方块（Barrel.add）：texture 为桶身贴图，material 决定属性，以及木桶装岩浆会不会被烧掉 */
export function barrel(id: string, texture: string, material: Material) {
    registerShared()
    if (texture.startsWith('eno_v_')) TerrainTextureManager.registerTexture(texture, `textures/blocks/${texture.slice(6)}`)   // 原版贴图（石头）
    const p = PROPS[material]
    const mi = { texture, ...(p.render ? { render_method: p.render } : {}) }
    const b: any = BlockAPI.createGeometryBlock(id, 'items' as Category, BARREL_GEOMETRY, { '*': mi, body: mi }, { group: 'eno:itemGroup.name.barrel' } as any)
    b.addComponent(BlockComponent.combineComponents(
        BlockComponent.setDestructibleByMiningCustom(p.hardness, undefined as any),
        BlockComponent.setDestructibleByExplosionCustom(p.explosion),
        ...(p.tags.length ? [BlockComponent.setTags(p.tags)] : []),
        BlockComponent.setCollisionBoxCustom([-7, 0, -7], [14, 16, 14]),   // 原版是多个盒子；26.50 只能单个 AABB，取外轮廓
        BlockComponent.setLightDampening(0),
        BlockComponent.setBlockEntity(true),                                // 桶里的状态存在方块实体的动态属性里
        BlockComponent.setMovable('immovable'),
        BlockComponent.setTick([2, 2], true),                               // 原模组每 tick 运行；这里每 2 tick，时间按 2 累计
        BlockComponent.setCustomComponentV2('eno:barrel', { material }),
    ))
    blockSounds[id] = p.sound
    registered.add(id)
}

// ---------- 内容物实体 ----------
// 原模组 BuildBarrelBox：model.addBox(c2, c1, c2, c14, ydata, c14, 贴图) —— 桶内 12×12、从 1 像素高到 ydata。
// 这里按比例缩到 1–14.5 像素：内容量 0–1000 对应高度 0–13.45 像素（作者要求装满时比桶沿低一截）。
// 实体属性：eno:h = ydata × 1000（0–1000），eno:t = 贴图编号（scripts/data/barrel.ts 的 BARREL_TEXTURES）。
// 高度用动画缩放子骨骼实现（Sapdon 已知坑 §11.3：缩放骨要挂在父骨下）；整数属性（§11.1：float 默认值会被写坏）。
export const CONTENT_ENTITY = 'eno:barrel_content'
const CONTENT_GEOMETRY = 'geometry.eno.barrel_content'
const CONTENT_ANIMATION = 'animation.eno.barrel_content.level'
function registerContentEntity() {
    const uvSide = (w: number) => ({ uv: [2, 1.5], uv_size: [w, 13.45] })
    GRegistry.register('eno_barrel_content', 'resource', 'models/entity/', { toObject: () => ({
        format_version: '1.21.20',
        'minecraft:geometry': [{
            description: { identifier: CONTENT_GEOMETRY, texture_width: 16, texture_height: 16, visible_bounds_width: 1.5, visible_bounds_height: 1.5, visible_bounds_offset: [0, 0.5, 0] },
            bones: [
                { name: 'root', pivot: [0, 1, 0] },
                { name: 'content', parent: 'root', pivot: [0, 1.05, 0], cubes: [{
                    // 比桶壁每边小 0.01 像素、比桶底高 0.05 像素：避免面重合（0.05 像素时缝隙看得出来）
                    origin: [-5.99, 1.05, -5.99], size: [11.98, 13.45, 11.98],   // 装满时顶面在 14.5 像素：比桶沿低一截，作者觉得这样比齐平更好看（与指导书图标一致）
                    // 顶 / 底面负 uv_size（Sapdon 已知坑 §10.1）；取贴图中间 12×12，与原模组盒子在方块贴图上的投影一致
                    uv: { up: { uv: [14, 14], uv_size: [-12, -12] }, down: { uv: [14, 14], uv_size: [-12, -12] }, north: uvSide(12), south: uvSide(12), east: uvSide(12), west: uvSide(12) },
                }] },
            ],
        }],
    }) } as any)
    GRegistry.register('eno_barrel_content', 'resource', 'animations/', { toObject: () => ({
        format_version: '1.8.0',
        animations: { [CONTENT_ANIMATION]: { loop: true, bones: { content: { scale: [1, "math.clamp(q.property('eno:h') / 1000, 0, 1)", 1] } } } },
    }) } as any)

    const rcName = textureController('eno_barrel_content', BARREL_TEXTURES.length, "q.property('eno:t')", { root: true, content: "q.property('eno:h') > 0" }, ANIMATED)   // 空的时候不画

    const e = EntityAPI.createDummyEntity(CONTENT_ENTITY, BARREL_TEXTURES[0], { is_summonable: true, is_spawnable: false, format_version: '1.21.0' } as any)
    e.behavior.addProperty('eno:h', { type: 'int', range: [0, 1000], default: 0, client_sync: true })
    e.behavior.addProperty('eno:t', { type: 'int', range: [0, BARREL_TEXTURES.length - 1], default: 0, client_sync: true })
    e.behavior.addComponent(EntityComponent.combineComponents(
        EntityComponent.setTypeFamily(['eno_barrel_content', 'inanimate']), EntityComponent.setFireImmune(true),
        new Map<string, any>().set('minecraft:damage_sensor', { triggers: [{ cause: 'all', deals_damage: false }] }),
    ))
    const r: any = e.resource
    r.textures = {}   // 去掉 DummyEntity 默认带的贴图键
    BARREL_TEXTURES.forEach((t, i) => r.addTexture(`t${i}`, t))
    r.addMaterial('default', 'entity_alphatest')
    r.addGeometry('default', CONTENT_GEOMETRY)
    r.addAnimation('level', CONTENT_ANIMATION)
    r.setScript('animate', ['level'])
    r.render_controllers = [rcName]
}
