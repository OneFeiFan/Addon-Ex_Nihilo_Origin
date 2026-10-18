// 矿盐晶体：晶簇模型，代替整块方块的外观。
// 模型与贴图都按原模组（InnerCore 版）还原。
import { BlockComponent } from '@sapdon/core'
import { block, BlockOptions } from './api.js'
import { MaterialModel, Box } from './geometry.js'

const px = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): Box => [x1 / 16, y1 / 16, z1 / 16, x2 / 16, y2 / 16, z2 / 16]
// 与原模组完全相同的 10 个方柱（CORE/ENRCore.js defineAllSalts：model.addBox(c7, c0, c7, c9, c4, c9 …)，单位 1/16 格）：
// 中间一簇 2×2 的矮柱，四周四根悬空的细晶针。贴图也沿用原模组（中心亮、四周暗），按位置投影取 UV，与 InnerCore 的 addBox 相同
const CRYSTALS: Box[] = [
    px(7, 0, 7, 9, 4, 9), px(7, 0, 8, 8, 6, 9), px(8, 1, 7, 9, 7, 8), px(7, 1, 7, 8, 7, 8), px(8, 1, 8, 9, 7, 9),
    px(7, 0, 7, 9, 5, 9), px(7, 2, 11, 8, 8, 12), px(8, 2, 5, 9, 8, 6), px(10, 2, 8, 11, 9, 9), px(4, 3, 7, 5, 8, 8),
]
let registered = false
export function crystal(id: string, texture: string, o: BlockOptions) {
    if (!registered) { new MaterialModel('geometry.eno.salt_crystal').bone('crystals', 'crystal', CRYSTALS).register('eno_salt_crystal'); registered = true }
    const b: any = block(id, texture, o)
    b.addComponent(BlockComponent.combineComponents(
        BlockComponent.setGeometry('geometry.eno.salt_crystal'),
        BlockComponent.setMaterialInstances({ '*': { texture }, crystal: { texture } }),
        BlockComponent.setCollisionBoxCustom([-4, 0, -4], [8, 9, 8]),
        BlockComponent.setSelectionBoxCustom([-4, 0, -4], [8, 9, 8]),
        BlockComponent.setLightDampening(0),
    ))
    return b
}
