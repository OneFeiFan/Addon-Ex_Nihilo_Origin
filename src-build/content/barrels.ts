// 木桶
// 对应原模组：BLOCKS/MACHINE/barrel.js（Barrel.add）
import { barrel } from '../barrel.js'

barrel('eno:barrel_stone', 'eno_v_stone', 'stone')  // ex_barrelStone · Stone Barrel
barrel('eno:barrel_oak', 'eno_planks_oak_0', 'wood')  // ex_barrelOak · Oak Barrel
barrel('eno:barrel_birch', 'eno_planks_birch_0', 'wood')  // ex_barrelBirch · Birch Barrel
barrel('eno:barrel_acacia', 'eno_planks_acacia_0', 'wood')  // ex_barrelAcacia · Acacia Barrel
barrel('eno:barrel_big_oak', 'eno_planks_big_oak_0', 'wood')  // ex_barrelBigOak · Big Oak Barrel
barrel('eno:barrel_jungle', 'eno_planks_jungle_0', 'wood')  // ex_barrelJungle · Jungle Barrel
barrel('eno:barrel_spruce', 'eno_planks_spruce_0', 'wood')  // ex_barrelSpruce · Spruce Barrel
for (const color of ['black', 'blue', 'brown', 'cyan', 'gray', 'green', 'light_blue', 'lime', 'magenta', 'orange', 'pink', 'purple', 'red', 'silver', 'white', 'yellow']) {
    barrel(`eno:barrel_glass_${color}`, `eno_glass_${color}_0`, 'glass')  // ex_barrel_glass_<颜色> · <颜色> Glass Barrel
}
