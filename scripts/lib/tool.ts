// 工具公共逻辑：耐久消耗（原模组用 InnerCore ToolAPI 管理耐久，基岩版自定义工具需要脚本处理）
import { Player, ItemStack, EquipmentSlot, GameMode } from '@minecraft/server'

export const isCreative = (p: Player) => p.getGameMode() === GameMode.Creative

/** 消耗 amount 点耐久，考虑耐久附魔；超过最大耐久时工具损坏。返回是否损坏 */
export function damageMainhand(player: Player, amount: number): boolean {
    const eq = player.getComponent('minecraft:equippable')
    const item = eq?.getEquipment(EquipmentSlot.Mainhand)
    if (!eq || !item) return false
    const dur = item.getComponent('minecraft:durability')
    if (!dur) return false
    const unbreaking = item.getComponent('minecraft:enchantable')?.getEnchantment('unbreaking')?.level ?? 0
    let applied = 0
    for (let i = 0; i < amount; i++) if (Math.random() < 1 / (unbreaking + 1)) applied++
    if (!applied) return false
    const next = dur.damage + applied
    if (next > dur.maxDurability) {   // 原模组：data > maxDamage 时工具损坏
        eq.setEquipment(EquipmentSlot.Mainhand, undefined)
        player.playSound('random.break')
        return true
    }
    dur.damage = next
    eq.setEquipment(EquipmentSlot.Mainhand, item)
    return false
}

export const durabilityOf = (item?: ItemStack) => item?.getComponent('minecraft:durability')?.damage

/** InnerCore setCarriedItem(id, count - 1, data)：手上物品减 1（创造模式同样消耗，原模组行为） */
export function consumeMainhand(player: Player) {
    const eq = player.getComponent('minecraft:equippable')
    const item = eq?.getEquipment(EquipmentSlot.Mainhand)
    if (!eq || !item) return
    if (item.amount > 1) { item.amount -= 1; eq.setEquipment(EquipmentSlot.Mainhand, item) } else eq.setEquipment(EquipmentSlot.Mainhand, undefined)
}
