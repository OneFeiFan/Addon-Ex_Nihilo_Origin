// 自定义工具耐久（锤子、钩子、矿石粉碎者、作者之钩、筛网）
// · 攻击实体：交给引擎原生处理。引擎会在命中时扣耐久，并通过 onBeforeDurabilityDamage 允许修改扣除量；
//   这里改成 InnerCore ToolAPI 的规则：非武器工具每次命中扣 2 点。
// · 破坏方块：基岩版引擎不会给自定义工具扣耐久（只提供 onMineBlock 事件），所以由脚本按原版规则扣 1 点，含耐久附魔。
//   筛网例外：原模组的 ToolType.mesh 在 onDestroy 中阻止了耐久消耗，网的耐久只由筛子消耗。
import { Player, EquipmentSlot } from '@minecraft/server'
import { registerItemComponent } from '@sapdon/runtime'
import { damageMainhand, isCreative, durabilityOf } from '../lib/tool.js'

const MESH = /^eno:mesh/
// 硬度为 0 的方块，原版工具破坏时不消耗耐久（只列常见的）
const INSTANT = /(_sapling|_flower|tulip|poppy|dandelion|orchid|allium|bluet|daisy|torch|short_grass|tall_grass|fern|deadbush|wheat|carrots|potatoes|beetroot|sugar_cane|redstone_wire|tripwire|flower_pot|_mushroom$|lily_pad|waterlily|seagrass|vine)/

registerItemComponent('eno:tool', {
        onBeforeDurabilityDamage(e) { e.durabilityDamage = 2 },
        onMineBlock({ source, itemStack, minedBlockPermutation }) {
            if (!(source instanceof Player) || isCreative(source) || !itemStack || MESH.test(itemStack.typeId)) return
            if (INSTANT.test(minedBlockPermutation.type.id)) return
            // 防御：如果将来引擎开始原生扣挖掘耐久，这里就不再重复扣
            if ((durabilityOf(source.getComponent('minecraft:equippable')?.getEquipment(EquipmentSlot.Mainhand)) ?? 0) > (durabilityOf(itemStack) ?? 0)) return
            damageMainhand(source, 1)
        },
})
