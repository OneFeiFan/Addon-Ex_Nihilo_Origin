// 诱饵：放在地上的诱饵方块（对应原模组 bait.js 的 BaitAPI.registerBait）
// 原模组用透明方块 + 平躺的物品模型（Animation.Item，0.5 倍大小）显示——物品模型是把图标的每个像素挤出成小方块。
// 这里同样按诱饵贴图逐像素生成模型：只为不透明的像素生成 0.5×0.5×0.5 像素的小方块（8×8 像素见方、平躺在地上），
// 用不透明材质渲染，不依赖贴图透明度（用 alpha_test 时透明像素在真机上显示成了黑色）。
import path from 'path'
import { flatItemCubes } from './geometry.js'
import { BlockAPI, BlockComponent, GRegistry } from '@sapdon/core'
import { blockSounds, registered } from './api.js'

let lootRegistered = false
function pixelGeometry(identifier: string, pngPath: string) {
    const cubes = flatItemCubes(pngPath, 8)
    GRegistry.register(identifier.replace(/\./g, '_'), 'resource', 'models/blocks/', { toObject: () => ({
        format_version: '1.21.20',
        'minecraft:geometry': [{ description: { identifier, texture_width: 16, texture_height: 16 }, bones: [{ name: 'bait', pivot: [0, 0, 0], cubes }] }],
    }) } as any)
}

export function baitBlock(id: string, texture: string, item: string) {
    if (!lootRegistered) { lootRegistered = true; GRegistry.register('eno_bait', 'behavior', 'loot_tables/blocks/', { toObject: () => ({ pools: [] }) } as any) }
    const geo = `geometry.${id.replace(':', '.')}`
    pixelGeometry(geo, path.join(process.cwd(), 'res/textures/blocks/eno', `${texture}.png`))
    const b: any = BlockAPI.createGeometryBlock(id, 'none' as any, geo, { '*': { texture } }, {} as any)
    b.hide_in_command = true
    b.addComponent(BlockComponent.combineComponents(
        BlockComponent.setDestructibleByMiningCustom(0, undefined as any),
        BlockComponent.setDestructibleByExplosionCustom(0),
        BlockComponent.setCollisionBoxEnabled(false),
        BlockComponent.setSelectionBoxCustom([-4, 0, -4], [8, 1, 8]),
        BlockComponent.setLightDampening(0),
        BlockComponent.setLoot('loot_tables/blocks/eno_bait.json'),   // 掉落由脚本处理（原掉落函数返回诱饵物品）
        BlockComponent.setCustomComponentV2('eno:bait', { item }),
    ))
    blockSounds[id] = 'grass'
    registered.add(id)
}
