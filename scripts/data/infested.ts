// 寄生树叶的树种（构建期生成方块状态与贴图、运行期判断树叶属于哪一种，共用这一份）
// 贴图由 tools/gen_infested.py 按同名原版树叶自动生成；原版以后加新树种：这里加一行、生成器里加一行，重新生成贴图即可。
export const SPECIES = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'azalea', 'flowering_azalea', 'pale_oak']
/** 原版树叶 → 树种；不在表里的树叶（包括其他附加包的树叶）按橡树处理 */
export const LEAF_SPECIES: Record<string, string> = {
    'minecraft:oak_leaves': 'oak', 'minecraft:spruce_leaves': 'spruce', 'minecraft:birch_leaves': 'birch', 'minecraft:jungle_leaves': 'jungle',
    'minecraft:acacia_leaves': 'acacia', 'minecraft:dark_oak_leaves': 'dark_oak', 'minecraft:mangrove_leaves': 'mangrove',
    'minecraft:cherry_leaves': 'cherry', 'minecraft:azalea_leaves': 'azalea', 'minecraft:azalea_leaves_flowered': 'flowering_azalea',
    'minecraft:pale_oak_leaves': 'pale_oak',
}
