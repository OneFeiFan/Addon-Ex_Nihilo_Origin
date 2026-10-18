// M-13 陶瓷桶：与原版铁桶相同的用法（原模组用 BcuketRegister 库注册）
//   · 空桶对准水 / 岩浆源方块：装满（手上不止一个时，装满的桶放进背包）
//   · 装满的桶右键方块：在点击的那一面放出液体，换回空桶
// 往木桶、坩埚里倒 / 取液体由那两个机器自己处理（scripts/mechanics/barrel.ts、crucible.ts）。
import { ItemStack, Player, EquipmentSlot, BlockPermutation } from '@minecraft/server'
import { registerItemComponent } from '@sapdon/runtime'

const EMPTY = 'eno:bucket_porcelain_empty'
const FULL: Record<string, string> = { water: 'eno:bucket_porcelain_water', lava: 'eno:bucket_porcelain_lava' }
const LIQUID_OF: Record<string, string> = { 'eno:bucket_porcelain_water': 'minecraft:water', 'eno:bucket_porcelain_lava': 'minecraft:lava' }

function replaceHeld(player: Player, to: string) {
    const eq = player.getComponent('minecraft:equippable'), held = eq?.getEquipment(EquipmentSlot.Mainhand)
    if (held && held.amount > 1) {
        held.amount -= 1; eq!.setEquipment(EquipmentSlot.Mainhand, held)
        player.getComponent('minecraft:inventory')?.container?.addItem(new ItemStack(to, 1))
    } else eq?.setEquipment(EquipmentSlot.Mainhand, new ItemStack(to, 1))
}

registerItemComponent('eno:porcelain_bucket', {
    onUseOn: ({ source, block, blockFace, itemStack }) => {
        if (!(source instanceof Player) || !itemStack) return
        if (itemStack.typeId === EMPTY) {
            // 只有源方块能装（liquid_depth 为 0）
            const liquid = block.typeId === 'minecraft:water' ? 'water' : block.typeId === 'minecraft:lava' ? 'lava' : ''
            if (!liquid || block.permutation.getState('liquid_depth' as any) !== 0) return
            block.setType('minecraft:air')
            replaceHeld(source, FULL[liquid])
            return
        }
        const liquid = LIQUID_OF[itemStack.typeId]
        if (!liquid) return
        // 点到的是可替换的格子（空气、液体）就放在这一格，否则放在点击的那一面
        const face = blockFace === 'Up' ? block.above() : blockFace === 'Down' ? block.below() : blockFace === 'North' ? block.north()
            : blockFace === 'South' ? block.south() : blockFace === 'East' ? block.east() : block.west()
        const place = block.isAir || block.isLiquid ? block : face
        if (!place || !(place.isAir || place.isLiquid)) return
        place.setPermutation(BlockPermutation.resolve(liquid))
        replaceHeld(source, EMPTY)
    },
})
