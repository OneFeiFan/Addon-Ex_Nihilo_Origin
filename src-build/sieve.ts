// M-02 筛子 / 重型筛：方块定义（几何体、状态、渲染、碰撞、方块实体）
// 状态即渲染：eno:mesh（0 = 无网）、eno:content（0 = 空）、eno:click（0–14 次）。网的耗损与网加成存在方块实体的动态属性里。
import { BlockComponent, BlockAPI, TerrainTextureManager } from '@sapdon/core'
import { blockSounds, registered } from './api.js'
import { MaterialModel, Box } from './geometry.js'

const c = (n: number) => n / 16
// SieveCore.boxes_1：框架（四条边沿 + 四条腿）
const FRAME: Box[] = [
    [c(0), c(8), c(0), c(16), c(12), c(1)], [c(0), c(8), c(15), c(16), c(12), c(16)],
    [c(0), c(8), c(1), c(1), c(12), c(15)], [c(15), c(8), c(1), c(16), c(12), c(15)],
    [c(1), c(0), c(1), c(2), c(9), c(2)], [c(14), c(0), c(14), c(15), c(9), c(15)],
    [c(14), c(0), c(1), c(15), c(9), c(2)], [c(1), c(0), c(14), c(2), c(9), c(15)],
]
const MESH_BOX: Box = [c(1), 0.55, c(1), c(15), 0.6, c(15)]
const contentBox = (click: number): Box => [c(1), 11 / 16, c(1), c(15), 15 / 16 - (0.25 / 14) * click, c(15)]
const MAX_MESH = 6, CLICKS = 15   // 网的种类上限（2.4 加了铜网，普通筛 6 种；0.x 时是 5，铜网在筛子里画不出来）
export const SIEVE_GEOMETRY = 'geometry.eno.sieve'

function registerGeometry() {
    const m = new MaterialModel(SIEVE_GEOMETRY).bone('frame', 'frame', FRAME)
    for (let k = 1; k <= MAX_MESH; k++) m.bone(`mesh_${k}`, `mesh_${k}`, [MESH_BOX])
    for (let k = 0; k < CLICKS; k++) m.bone(`content_${k}`, 'content', [contentBox(k)])
    m.register('eno_sieve')
}

const boneVisibility = () => {
    const v: Record<string, string> = { frame: 'true' }
    for (let m = 1; m <= MAX_MESH; m++) v[`mesh_${m}`] = `q.block_state('eno:mesh') == ${m}`
    for (let k = 0; k < CLICKS; k++) v[`content_${k}`] = `q.block_state('eno:content') > 0 && q.block_state('eno:click') == ${k}`
    return v
}

// 原版方块贴图（筛子里显示的泥土、沙子等）用 eno_v_<名字> 自己登记短名，避免依赖原版短名里的变体顺序
function contentTexture(name: string) {
    if (name.startsWith('eno_v_')) TerrainTextureManager.registerTexture(name, `textures/blocks/${name.slice(6)}`)
    return name
}

// ---- 定义入口（见 src-build/content/sieves.ts）----
interface SieveGroup { meshes: { id: string, texture: string }[], contents: string[] }
const GROUPS: Record<string, SieveGroup> = {}
let geometryRegistered = false

/** 一组筛子可装的网与可筛的方块（顺序即方块状态的取值：eno:mesh 1..n、eno:content 1..n） */
export function sieveGroup(group: 'ex' | 'co', def: SieveGroup) { GROUPS[group] = def }

/** 一个筛子方块：frameTexture 为框架贴图（木板 / 原木），group 决定能装哪些网、能筛哪些方块 */
export function sieve(id: string, frameTexture: string, group: 'ex' | 'co') {
    if (!geometryRegistered) { registerGeometry(); geometryRegistered = true }
    const { meshes, contents } = GROUPS[group]
    const materials = (contentTex?: string) => {
        // 同一方块的所有材质实例必须用同一种渲染方式（游戏报错：不能混用不透明和透明材质）。网需要 alpha_test，所以框架、内容物也用 alpha_test
        const at = (texture: string) => ({ texture, render_method: 'alpha_test' })
        const mi: Record<string, any> = { '*': at(frameTexture), frame: at(frameTexture) }
        for (let m = 1; m <= MAX_MESH; m++) mi[`mesh_${m}`] = { texture: meshes[m - 1]?.texture ?? frameTexture, render_method: 'alpha_test' }
        mi.content = at(contentTex ?? frameTexture)
        return mi
    }
    const block: any = BlockAPI.createGeometryBlock(id, 'items', SIEVE_GEOMETRY, materials(), { group: 'eno:itemGroup.name.sieve' } as any)
    block.registerState('eno:mesh', { values: { min: 0, max: meshes.length } })
    block.registerState('eno:content', { values: { min: 0, max: contents.length } })
    block.registerState('eno:click', { values: { min: 0, max: CLICKS - 1 } })
    // 内容物贴图：按 eno:content 切换（material_instances 在 permutation 中整体覆盖，所以每条都写全）
    contents.forEach((t, i) => block.addPermutation(`q.block_state('eno:content') == ${i + 1}`, BlockComponent.setMaterialInstances(materials(contentTexture(t)))))
    // 碰撞：原版是多个盒子拼成的，基岩版 26.50 只能是单个 AABB。取外轮廓，内容物高出边沿时随点击次数降低
    for (let k = 0; k < CLICKS; k++) {
        const top = (15 / 16 - (0.25 / 14) * k) * 16
        if (top > 12) block.addPermutation(`q.block_state('eno:content') > 0 && q.block_state('eno:click') == ${k}`, BlockComponent.setCollisionBoxCustom([-8, 0, -8], [16, +top.toFixed(4), 16]))
    }
    // 属性：普通筛按木板、重型筛按原木（硬度 2，斧子有效）
    const explosion = group === 'co' ? 2 : 3
    block.addComponent(BlockComponent.combineComponents(
        BlockComponent.setGeometry(SIEVE_GEOMETRY, { bone_visibility: boneVisibility() }),
        BlockComponent.setDestructibleByMiningCustom(2, undefined as any),
        BlockComponent.setDestructibleByExplosionCustom(explosion),
        BlockComponent.setTags(['minecraft:is_axe_item_destructible']),
        BlockComponent.setCollisionBoxCustom([-8, 0, -8], [16, 12, 16]),
        BlockComponent.setLightDampening(0),
        BlockComponent.setBlockEntity(true),
        BlockComponent.setMovable('immovable'),
        BlockComponent.setCustomComponentV2('eno:sieve', { group }),
    ))
    blockSounds[id] = 'wood'
    registered.add(id)
}
