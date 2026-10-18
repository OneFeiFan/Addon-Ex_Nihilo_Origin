// 筛子的运行期数据（2.4 重新设计，见《与原模组的差异》"筛子"一节）
// 对应原模组：CORE/SieveCore.js（registerMesh、Sieve.sieve、Sieve.addSieved）
// 数值依据：铁维持原模组数值作为锚点，其他矿物按原版矿物生成数据（Minecraft Wiki 的 Ore (feature) 表）换算的相对含量，再按玩家的发展曲线调整。
// 概率是"基础概率"：网的倍率乘在上面，再乘伪随机空手保护的补偿系数（scripts/data/sieveComp.ts，由 tools/gen_sieve_comp.mjs 生成）。

export interface Mesh { id: string, idx: number, mult: number, durability: number }
export interface Content { id: string, idx: number }
export interface Drop { item: string, min: number, max: number, chance: number }
export const SIEVE = { groups: { ex: { meshes: [] as Mesh[], contents: [] as Content[] }, co: { meshes: [] as Mesh[], contents: [] as Content[] } }, drops: {} as Record<string, Drop[]> }

/** 网：组、物品、掉率倍率（乘法）、耐久。编号按登记顺序 1..n（对应方块状态 eno:mesh），所以新网只能加在最后 */
const registerMesh = (g: 'ex' | 'co', id: string, mult: number, durability: number) => { const l = SIEVE.groups[g].meshes; l.push({ id, idx: l.length + 1, mult, durability }) }
/** 可筛方块（编号对应方块状态 eno:content） */
const sievable = (g: 'ex' | 'co', id: string) => { const l = SIEVE.groups[g].contents; l.push({ id, idx: l.length + 1 }) }
/** 掉落：筛 input 时以 chance% 的基础概率掉 min~max 个 item */
const addSieved = (input: string, item: string, min: number, max: number, chance: number) => { (SIEVE.drops[input] ||= []).push({ item, min, max, chance }) }

// 网的倍率：升级链 木 → 线 → 燧石 → 铜 → 铁 → 钻石（2.4 改为乘法：原来的"加法"会把 1% 的钻石在铁网下放大 6 倍）
registerMesh('ex', 'eno:mesh_wood', 1.0, 130)
registerMesh('ex', 'eno:mesh_silk', 1.1, 832)
registerMesh('ex', 'eno:mesh_flint', 1.2, 1664)
registerMesh('ex', 'eno:mesh_iron', 1.5, 3328)
registerMesh('ex', 'eno:mesh_diamond', 2.0, 6656)
registerMesh('ex', 'eno:mesh_copper', 1.35, 2500)
sievable('ex', 'minecraft:dirt')
sievable('ex', 'minecraft:sand')
sievable('ex', 'minecraft:gravel')
sievable('ex', 'minecraft:soul_sand')
sievable('ex', 'eno:dust')
sievable('ex', 'eno:gravel_nether')
sievable('ex', 'eno:gravel_ender')

registerMesh('co', 'eno:meshco_silk', 1.1, 3328)
registerMesh('co', 'eno:meshco_flint', 1.2, 6656)
registerMesh('co', 'eno:meshco_iron', 1.5, 13312)
registerMesh('co', 'eno:meshco_diamond', 2.0, 26624)
registerMesh('co', 'eno:meshco_copper', 1.35, 10000)
sievable('co', 'eno:compressed_dirt')
sievable('co', 'eno:compressed_dust')
sievable('co', 'eno:compressed_sand')
sievable('co', 'eno:compressed_gravel')
sievable('co', 'eno:compressed_soulsand')


// ---- 泥土：沿用原模组（小石子必出） ----
addSieved('minecraft:dirt', 'minecraft:wheat_seeds', 1, 2, 7)
addSieved('minecraft:dirt', 'minecraft:pumpkin_seeds', 1, 1, 7)
addSieved('minecraft:dirt', 'minecraft:melon_seeds', 1, 1, 7)
addSieved('minecraft:dirt', 'eno:seeds_oak', 1, 1, 1)
addSieved('minecraft:dirt', 'eno:seeds_spruce', 1, 1, 1)
addSieved('minecraft:dirt', 'eno:seeds_birch', 1, 1, 0)
addSieved('minecraft:dirt', 'eno:seeds_acacia', 1, 1, 2)
addSieved('minecraft:dirt', 'eno:seeds_dark_oak', 1, 1, 2)
addSieved('minecraft:dirt', 'eno:seeds_carrot', 1, 1, 2)
addSieved('minecraft:dirt', 'eno:seeds_potato', 1, 1, 2)
addSieved('minecraft:dirt', 'eno:seeds_bamboo', 1, 1, 2)
addSieved('minecraft:dirt', 'eno:seeds_berries', 1, 1, 3)
addSieved('minecraft:dirt', 'eno:seeds_grass', 1, 1, 7)
addSieved('minecraft:dirt', 'eno:seeds_canes', 1, 1, 7)
addSieved('minecraft:dirt', 'eno:stone_small', 2, 4, 100)
// eno:compressed_dirt（重型筛：同一张表，每次结算 6 轮）
addSieved('eno:compressed_dirt', 'minecraft:wheat_seeds', 1, 2, 7)
addSieved('eno:compressed_dirt', 'minecraft:pumpkin_seeds', 1, 1, 7)
addSieved('eno:compressed_dirt', 'minecraft:melon_seeds', 1, 1, 7)
addSieved('eno:compressed_dirt', 'eno:seeds_oak', 1, 1, 1)
addSieved('eno:compressed_dirt', 'eno:seeds_spruce', 1, 1, 1)
addSieved('eno:compressed_dirt', 'eno:seeds_birch', 1, 1, 0)
addSieved('eno:compressed_dirt', 'eno:seeds_acacia', 1, 1, 2)
addSieved('eno:compressed_dirt', 'eno:seeds_dark_oak', 1, 1, 2)
addSieved('eno:compressed_dirt', 'eno:seeds_carrot', 1, 1, 2)
addSieved('eno:compressed_dirt', 'eno:seeds_potato', 1, 1, 2)
addSieved('eno:compressed_dirt', 'eno:seeds_bamboo', 1, 1, 2)
addSieved('eno:compressed_dirt', 'eno:seeds_berries', 1, 1, 3)
addSieved('eno:compressed_dirt', 'eno:seeds_grass', 1, 1, 7)
addSieved('eno:compressed_dirt', 'eno:seeds_canes', 1, 1, 7)
addSieved('eno:compressed_dirt', 'eno:stone_small', 2, 4, 100)

// ---- 沙子（中等颗粒）：铁 / 铜 / 金矿石碎块；植物；粗盐 ----
addSieved('minecraft:sand', 'eno:iron_crushed', 1, 4, 20)
addSieved('minecraft:sand', 'eno:copper_crushed', 1, 4, 24)
addSieved('minecraft:sand', 'eno:gold_crushed', 1, 4, 6)
addSieved('minecraft:sand', 'minecraft:cocoa_beans', 1, 2, 3)
addSieved('minecraft:sand', 'eno:seeds_jungle', 1, 1, 3)
addSieved('minecraft:sand', 'eno:seeds_cactus', 1, 1, 2)
addSieved('minecraft:sand', 'eno:spores', 1, 2, 1)
addSieved('minecraft:sand', 'eno:salt_crude', 1, 1, 8)
// eno:compressed_sand（重型筛：同一张表，每次结算 6 轮）
addSieved('eno:compressed_sand', 'eno:iron_crushed', 1, 4, 20)
addSieved('eno:compressed_sand', 'eno:copper_crushed', 1, 4, 24)
addSieved('eno:compressed_sand', 'eno:gold_crushed', 1, 4, 6)
addSieved('eno:compressed_sand', 'minecraft:cocoa_beans', 1, 2, 3)
addSieved('eno:compressed_sand', 'eno:seeds_jungle', 1, 1, 3)
addSieved('eno:compressed_sand', 'eno:seeds_cactus', 1, 1, 2)
addSieved('eno:compressed_sand', 'eno:spores', 1, 2, 1)
addSieved('eno:compressed_sand', 'eno:salt_crude', 1, 1, 8)

// ---- 沙砾（粗颗粒）：块状矿物。铜 30% 比铁多（原版铜矿约为铁矿的 1.2 倍）；金 7%（原版约为铁的 0.3）；青金石按原版含量上调；钻石按发展曲线控制；绿宝石原版只在山地，降低 ----
addSieved('minecraft:gravel', 'minecraft:flint', 1, 3, 25)
addSieved('minecraft:gravel', 'eno:iron_broken', 1, 4, 25)
addSieved('minecraft:gravel', 'eno:copper_broken', 1, 4, 30)
addSieved('minecraft:gravel', 'minecraft:coal', 1, 2, 15)
addSieved('minecraft:gravel', 'eno:gold_broken', 1, 4, 7)
addSieved('minecraft:gravel', 'minecraft:lapis_lazuli', 1, 3, 10)
addSieved('minecraft:gravel', 'minecraft:diamond', 1, 1, 1)
addSieved('minecraft:gravel', 'minecraft:emerald', 1, 1, 0.5)
addSieved('minecraft:gravel', 'eno:salt_crude', 1, 1, 5)
// eno:compressed_gravel（重型筛：同一张表，每次结算 6 轮）
addSieved('eno:compressed_gravel', 'minecraft:flint', 1, 3, 25)
addSieved('eno:compressed_gravel', 'eno:iron_broken', 1, 4, 25)
addSieved('eno:compressed_gravel', 'eno:copper_broken', 1, 4, 30)
addSieved('eno:compressed_gravel', 'minecraft:coal', 1, 2, 15)
addSieved('eno:compressed_gravel', 'eno:gold_broken', 1, 4, 7)
addSieved('eno:compressed_gravel', 'minecraft:lapis_lazuli', 1, 3, 10)
addSieved('eno:compressed_gravel', 'minecraft:diamond', 1, 1, 1)
addSieved('eno:compressed_gravel', 'minecraft:emerald', 1, 1, 0.5)
addSieved('eno:compressed_gravel', 'eno:salt_crude', 1, 1, 5)

// ---- 灵魂沙：石英由"33%、1–6 个"改为"50%、1–4 个"（每次的期望几乎不变）。
//      空手保护 K = 1 意味着至少每两次出一样，总概率低于 50% 的表无法保持原来的平均，所以把石英的概率提上来、数量收窄 ----
addSieved('minecraft:soul_sand', 'minecraft:quartz', 1, 4, 50)
addSieved('minecraft:soul_sand', 'minecraft:nether_wart', 1, 2, 5)
addSieved('minecraft:soul_sand', 'minecraft:ghast_tear', 1, 1, 2)
// eno:compressed_soulsand（重型筛：同一张表，每次结算 6 轮）
addSieved('eno:compressed_soulsand', 'minecraft:quartz', 1, 4, 50)
addSieved('eno:compressed_soulsand', 'minecraft:nether_wart', 1, 2, 5)
addSieved('eno:compressed_soulsand', 'minecraft:ghast_tear', 1, 1, 2)

// 粗盐（2.4.2 上调）：尘土 12%、沙子 8%、沙砾 5%（原定 8 / 5 / 3，实测"几乎筛不到"）
// ---- 尘土（细颗粒）：矿石粉末与粉状物；骨粉 20 → 15（瓷土可用灰烬代替）；萤石粉 6 → 10（降低末地石的门槛） ----
addSieved('eno:dust', 'eno:iron_powdered', 1, 4, 20)
addSieved('eno:dust', 'eno:copper_powdered', 1, 4, 24)
addSieved('eno:dust', 'eno:gold_powdered', 1, 4, 6)
addSieved('eno:dust', 'minecraft:redstone', 1, 2, 15)
addSieved('eno:dust', 'minecraft:bone_meal', 1, 4, 15)
addSieved('eno:dust', 'minecraft:gunpowder', 1, 3, 7)
addSieved('eno:dust', 'minecraft:glowstone_dust', 1, 3, 10)
addSieved('eno:dust', 'minecraft:blaze_powder', 1, 3, 5)
addSieved('eno:dust', 'eno:salt_crude', 1, 1, 12)
// eno:compressed_dust（重型筛：同一张表，每次结算 6 轮）
addSieved('eno:compressed_dust', 'eno:iron_powdered', 1, 4, 20)
addSieved('eno:compressed_dust', 'eno:copper_powdered', 1, 4, 24)
addSieved('eno:compressed_dust', 'eno:gold_powdered', 1, 4, 6)
addSieved('eno:compressed_dust', 'minecraft:redstone', 1, 2, 15)
addSieved('eno:compressed_dust', 'minecraft:bone_meal', 1, 4, 15)
addSieved('eno:compressed_dust', 'minecraft:gunpowder', 1, 3, 7)
addSieved('eno:compressed_dust', 'minecraft:glowstone_dust', 1, 3, 10)
addSieved('eno:compressed_dust', 'minecraft:blaze_powder', 1, 3, 5)
addSieved('eno:compressed_dust', 'eno:salt_crude', 1, 1, 12)

// ---- 下界沙砾：按原版下界的矿物（下界金矿、石英，天花板的萤石），再加远古残骸碎片（4 个合成 1 块远古残骸） ----
addSieved('eno:gravel_nether', 'eno:nether_gold_broken', 1, 4, 30)
addSieved('eno:gravel_nether', 'minecraft:quartz', 1, 3, 30)
addSieved('eno:gravel_nether', 'minecraft:glowstone_dust', 1, 2, 10)
addSieved('eno:gravel_nether', 'eno:debris_fragment', 1, 1, 4)

// ---- 末地沙砾：末地石当作陨石质岩石——陨铁；紫颂种子（紫颂苗种在末地石上）；末影珍珠 ----
addSieved('eno:gravel_ender', 'eno:ender_iron_broken', 1, 4, 40)
addSieved('eno:gravel_ender', 'eno:seeds_chorus', 1, 1, 8)
addSieved('eno:gravel_ender', 'minecraft:ender_pearl', 1, 1, 3)
