// M-07 半砖熔炉：方块 + 承载实体（实体容器）+ 自定义熔炉界面 —— 全部用 Sapdon：
//   · BlockAPI.createTileBlock：方块照常显示，背后挂一个隐形实体当容器（Sapdon 文档："当前引擎版本下唯一可用的方块容器路线"，
//     方块原生容器在 26.50 仍需实验开关）
//   · ContainerUISystem：熔炉界面（原料 / 燃料 / 产物三格 + 箭头、火焰两条进度），写法照 Sapdon 示例 vanilla_recreation
// 界面门控：实体容器的标题取自承载实体的名字，脚本在实体生成时把名字设为界面键（Sapdon known-pitfalls §4.5）。
// 对应原模组：BLOCKS/MACHINE/furnace.js
import { BlockAPI, BlockComponent, ItemAPI, ItemCategory, ItemComponent, ContainerUISystem, ChestUISystem } from '@sapdon/core'
import { FURNACE_NAME } from '../scripts/data/furnace.js'
import { blockSounds, registered } from './api.js'
import { MaterialModel, Box } from './geometry.js'

export const PROGRESS_ITEM = 'eno:furnace_progress'
let progressItem = false
// 模型的正面在南面；放置时正面朝向玩家。
// 物品栏图标：图标会套用默认朝向（south）的旋转，正面被转到了北面、看不见（0.16.1 真机）。
// 所以用 minecraft:item_visual 单独指定物品的外观（不受方块变体影响），正面放在图标能看到的南面。
const yRot: Record<string, number> = { north: 0, south: 180, east: 270, west: 90 }

function progressSlots(ui: ContainerUISystem, arrows: [slot: number, y: number][], flame: [slot: number, y: number]) {
    for (const [slot, y] of arrows) ui.addProgressSlot({ slot, pos: [77, y], size: [22, 15], base: 'textures/ui/arrow_inactive', fill: 'textures/ui/arrow_active', clipDirection: 'left' })
    ui.addProgressSlot({ slot: flame[0], pos: [52, flame[1]], size: [13, 13], base: 'textures/ui/flame_empty_image', fill: 'textures/ui/flame_full_image', clipDirection: 'down' })
    if (!progressItem) {
        progressItem = true
        // 进度物品：剩余耐久 = 进度（界面按它裁切箭头 / 火焰），图标被格子挡住
        ItemAPI.createItem(PROGRESS_ITEM, ItemCategory.None, 'eno_enr_crook_0', {} as any).addComponent(ItemComponent.setDurability(100))
    }
}
function newUI(key: string, title: string, hiddenName: string) {
    const ui = new ContainerUISystem(`eno_${key}:${key}`, 'ui/')   // 门控键 = 文件名，不能带点（known-pitfalls §4.10）
    // 实体容器的标题 = 承载实体的名字。名字用"只有格式代码"的字符串（显示出来是空的，不会浮在机器上方），
    // 再给这个名字单独登记一条界面门控（Sapdon 的 ContainerUISystem 只按文件名登记，文件名不能带 §）
    ChestUISystem.registerContainerUI(hiddenName, `eno_${key}.container_root_panel`)
    ui.setTitle(title)
    ui.setPanel({ size: [180, 166] })
    ui.setGridOrigin([8, 22])
    ui.setSlotDefaults({ cellSize: [18, 18] })
    return ui
}
/** 方块的共同部分：四向放置、燃烧时正面换点燃贴图 */
export function itemVisual(b: any, geometry: string, materials: Record<string, any>) {
    b.addComponent(new Map().set('minecraft:item_visual', { geometry: { identifier: geometry }, material_instances: materials }))
}
function furnaceBlock(b: any, mats: (front: string) => Record<string, any>, frontLit: string) {
    b.registerState('eno:lit', [false, true])
    b.registerTrait('minecraft:placement_direction', { enabled_states: ['minecraft:cardinal_direction'] })
    for (const [dir, rot] of Object.entries(yRot)) b.addPermutation(`q.block_state('minecraft:cardinal_direction') == '${dir}'`, new Map().set('minecraft:transformation', { rotation: [0, rot, 0] }))
    b.addPermutation("q.block_state('eno:lit') == true", BlockComponent.setMaterialInstances(mats(frontLit)))
}

/** 半砖熔炉：槽 0 原料、1 燃料、2 产物、3 箭头、4 火焰 */
export function halfFurnace(id: string, t: { top: string, side: string, front: string, frontLit: string }) {
    const ui = newUI('furnace_half_ui', 'tile.eno:furnacehalf.name', FURNACE_NAME['eno:furnacehalf_entity'])
    ui.addSlot({ slot: 0, pos: [50, 22], kind: 'input' })
    ui.addSlot({ slot: 1, pos: [50, 60], kind: 'input' })
    ui.addSlot({ slot: 2, pos: [108, 37], kind: 'output', enabled: true, cellSize: [26, 26] })   // kind 'output' 必须显式 enabled
    progressSlots(ui, [[3, 42]], [4, 43])

    const tile: any = BlockAPI.createTileBlock(id, 'items', [t.top, t.top, t.side, t.side, t.side, t.front],
        { entity_texture: 'textures/entity/eno/transparent', inventory_size: 5, container_type: 'minecart_chest', can_be_siphoned_from: false } as any)
    const b = tile.block, e = tile.entity
    new MaterialModel('geometry.eno.half_furnace')
        .bone('body', { up: 'top', down: 'top', side: 'side', south: 'front' }, [[0, 0, 0, 1, 0.5, 1] as Box]).register('eno_half_furnace')
    const mats = (front: string) => ({ '*': { texture: t.side }, top: { texture: t.top }, side: { texture: t.side }, front: { texture: front } })
    furnaceBlock(b, mats, t.frontLit)
    b.addComponent(BlockComponent.combineComponents(
        BlockComponent.setGeometry('geometry.eno.half_furnace'),
        BlockComponent.setMaterialInstances(mats(t.front)),
        // 原模组：无 base、ToolAPI 材质 stone；按石台阶（硬度 2、镐子）
        BlockComponent.setDestructibleByMiningCustom(2, undefined as any), BlockComponent.setDestructibleByExplosionCustom(6),
        BlockComponent.setTags(['minecraft:is_pickaxe_item_destructible']),
        BlockComponent.setCollisionBoxCustom([-8, 0, -8], [16, 8, 16]), BlockComponent.setSelectionBoxCustom([-8, 0, -8], [16, 8, 16]),
        BlockComponent.setLightDampening(0),
    ))
    itemVisual(b, 'geometry.eno.half_furnace', mats(t.front))
    // 承载实体：点击区域与半砖一致
    e.behavior.addComponent(new Map().set('minecraft:custom_hit_test', { hitboxes: [{ width: 1, height: 0.5, pivot: [0, 0.25, 0] }] }))
    blockSounds[id] = 'stone'
    registered.add(id)
}

/**
 * 熔炉（BLOCKS/MACHINE/furnaceadvance.js）：两条熔炼线共用燃料，每件 200 tick。
 * 原模组创造栏里没有它，本意是潜行时把半砖熔炉叠到半砖熔炉上合成一整块（代码引用了不存在的方块 ID，从未生效）——这里按本意实现，见运行期脚本。
 * 槽 0 / 1 原料（下 / 上）、2 燃料、3 / 4 产物（下 / 上）、5 / 6 箭头（下 / 上）、7 火焰
 */
export function fullFurnace(id: string, t: { top: string, side: string, front: string, frontLit: string }) {
    const ui = newUI('furnace_full_ui', 'tile.eno:furnace.name', FURNACE_NAME['eno:furnace_entity'])
    ui.addSlot({ slot: 1, pos: [50, 14], kind: 'input' })                                       // desert1（上）
    ui.addSlot({ slot: 0, pos: [50, 34], kind: 'input' })                                       // desert（下）
    ui.addSlot({ slot: 2, pos: [50, 70], kind: 'input' })                                       // fuel
    ui.addSlot({ slot: 4, pos: [110, 12], kind: 'output', enabled: true, cellSize: [22, 22] })  // result1（上）
    ui.addSlot({ slot: 3, pos: [110, 36], kind: 'output', enabled: true, cellSize: [22, 22] })  // result（下）
    progressSlots(ui, [[6, 17], [5, 39]], [7, 54])

    const tile: any = BlockAPI.createTileBlock(id, 'none', [t.top, t.top, t.side, t.side, t.front, t.side],
        { entity_texture: 'textures/entity/eno/transparent', inventory_size: 8, container_type: 'minecart_chest', can_be_siphoned_from: false } as any)
    const b = tile.block
    // 承载实体的点击框与方块表面齐平：Sapdon 默认的点击框（0.81×0.92）缩在整块方块里面，射线先命中方块，
    // 右键打不开界面（真机）。齐平时射线优先命中实体（半砖熔炉就是这样打开界面的）
    tile.entity.behavior.addComponent(new Map().set('minecraft:custom_hit_test', { hitboxes: [{ width: 1, height: 1, pivot: [0, 0.5, 0] }] }))
    const mats = (front: string) => ({ '*': { texture: t.side }, up: { texture: t.top }, down: { texture: t.top }, east: { texture: t.side }, west: { texture: t.side }, south: { texture: front }, north: { texture: t.side } })
    furnaceBlock(b, mats, t.frontLit)
    itemVisual(b, 'minecraft:geometry.full_block', mats(t.front))
    b.addComponent(BlockComponent.combineComponents(
        BlockComponent.setMaterialInstances(mats(t.front)),
        BlockComponent.setDestructibleByMiningCustom(3.5, undefined as any), BlockComponent.setDestructibleByExplosionCustom(3.5),   // 原版熔炉
        BlockComponent.setTags(['minecraft:is_pickaxe_item_destructible']),
    ))
    blockSounds[id] = 'stone'
    registered.add(id)
}
