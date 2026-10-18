// M-10 钩子：手持钩子破坏任何树叶时，在原版掉落之外追加掉落（概率见 lib/rules.ts 与数据附录 H）。
// 掉落物生成在方块中心。作者之钩（ex_crookwriter）与原模组一样不参与。
import { world, ItemStack, ItemTypes } from '@minecraft/server'
import { CROOK } from '../data/tools.js'
import { crookRolls, CrookFamily } from '../lib/rules.js'

const FAMILY: Record<string, CrookFamily> = {
    [CROOK.wood]: 'wood_bone', [CROOK.bone]: 'wood_bone', [CROOK.gold]: 'gold', [CROOK.hay]: 'hay_reed', [CROOK.reed]: 'hay_reed',
}
const itemExists = (id: string) => ItemTypes.get(id) !== undefined

// 原模组的 DestroyBlock 回调在创造模式下同样触发（V-05 待实测确认）
world.afterEvents.playerBreakBlock.subscribe(({ block, brokenBlockPermutation, itemStackBeforeBreak, dimension }) => {
    const family = itemStackBeforeBreak && FAMILY[itemStackBeforeBreak.typeId]
    if (!family) return
    const leaf = brokenBlockPermutation.type.id
    const rolls = crookRolls(family, leaf, itemExists)
    const center = { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 }
    for (const [chance, item, count] of rolls) {
        const r = Math.random() * 100
        if (r < chance) dimension.spawnItem(new ItemStack(item, count), center)
    }
})
