// 静态方块
// 对应原模组：Block.createBlock / Block.createSpecialType（属性取值见 README"方块属性"）
import { block, infestedLeaves, BlockOptions } from '../api.js'
import { crystal } from '../crystal.js'   // 矿盐晶体：晶簇模型

// ---- 矿盐（ITEM/OreSalts.js） ----
crystal('eno:ore_salts_copper', 'eno_ore_salts_copper_0', { category: 'nature', group: 'eno:itemGroup.name.oresalts', hardness: 0.8, explosion: 0.8, sound: 'stone', tools: ['pickaxe'] })  // ex_oreSaltsCopper · Copper Ore Salts
crystal('eno:ore_salts_tin', 'eno_ore_salts_tin_0', { category: 'nature', group: 'eno:itemGroup.name.oresalts', hardness: 0.8, explosion: 0.8, sound: 'stone', tools: ['pickaxe'] })  // ex_oreSaltsTin · Tin Ore Salts
crystal('eno:ore_salts_lead', 'eno_ore_salts_lead_0', { category: 'nature', group: 'eno:itemGroup.name.oresalts', hardness: 0.8, explosion: 0.8, sound: 'stone', tools: ['pickaxe'] })  // ex_oreSaltsLead · Lead Ore Salts
crystal('eno:ore_salts_silver', 'eno_ore_salts_silver_0', { category: 'nature', group: 'eno:itemGroup.name.oresalts', hardness: 0.8, explosion: 0.8, sound: 'stone', tools: ['pickaxe'] })  // ex_oreSaltsSilver · Silver Ore Salts
crystal('eno:ore_salts_iron', 'eno_ore_salts_Iron_0', { category: 'nature', group: 'eno:itemGroup.name.oresalts', hardness: 0.8, explosion: 0.8, sound: 'stone', tools: ['pickaxe'] })  // ex_oreSaltsIron · Iron Ore Salts
crystal('eno:ore_salts_gold', 'eno_ore_salts_gold_0', { category: 'nature', group: 'eno:itemGroup.name.oresalts', hardness: 0.8, explosion: 0.8, sound: 'stone', tools: ['pickaxe'] })  // ex_oreSaltsGold · Gold Ore Salts
crystal('eno:ore_salts_nickel', 'eno_ore_salts_nickel_0', { category: 'nature', group: 'eno:itemGroup.name.oresalts', hardness: 0.8, explosion: 0.8, sound: 'stone', tools: ['pickaxe'] })  // ex_oreSaltsNickel · Nickel Ore Salts
crystal('eno:ore_salts_platinum', 'eno_ore_salts_platinum_0', { category: 'nature', group: 'eno:itemGroup.name.oresalts', hardness: 0.8, explosion: 0.8, sound: 'stone', tools: ['pickaxe'] })  // ex_oreSaltsPlatinum · Platinum Ore Salts

// ---- 矿砾 / 矿砂 / 矿尘（EXCore.register；原模组有重力，基岩版暂为普通方块） ----
block('eno:iron_gravel', 'eno_ex_Irongravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_Irongravel · Iron Ore Gravel
block('eno:nether_iron_gravel', 'eno_ex_netherIrongravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_netherIrongravel · Nether Iron Ore Gravel
block('eno:ender_iron_gravel', 'eno_ex_enderIrongravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_enderIrongravel · Ender Iron Ore Gravel
block('eno:iron_sand', 'eno_ex_Ironsand_0', { category: 'nature', group: 'eno:itemGroup.name.ore_sand', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })  // ex_Ironsand · Iron Ore Sand
block('eno:iron_dust', 'eno_ex_Irondust_0', { category: 'nature', group: 'eno:itemGroup.name.ore_dust', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })  // ex_Irondust · Iron Ore Dust
block('eno:gold_gravel', 'eno_ex_Goldgravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_Goldgravel · Gold Ore Gravel
block('eno:nether_gold_gravel', 'eno_ex_netherGoldgravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_netherGoldgravel · Nether Gold Ore Gravel
block('eno:ender_gold_gravel', 'eno_ex_enderGoldgravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_enderGoldgravel · Ender Gold Ore Gravel
block('eno:gold_sand', 'eno_ex_Goldsand_0', { category: 'nature', group: 'eno:itemGroup.name.ore_sand', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })  // ex_Goldsand · Gold Ore Sand
block('eno:gold_dust', 'eno_ex_Golddust_0', { category: 'nature', group: 'eno:itemGroup.name.ore_dust', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })  // ex_Golddust · Gold Ore Dust
block('eno:nickel_gravel', 'eno_ex_Nickelgravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_Nickelgravel · Nickel Ore Gravel
block('eno:nether_nickel_gravel', 'eno_ex_netherNickelgravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_netherNickelgravel · Nether Nickel Ore Gravel
block('eno:ender_nickel_gravel', 'eno_ex_enderNickelgravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_enderNickelgravel · Ender Nickel Ore Gravel
block('eno:nickel_sand', 'eno_ex_Nickelsand_0', { category: 'nature', group: 'eno:itemGroup.name.ore_sand', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })  // ex_Nickelsand · Nickel Ore Sand
block('eno:nickel_dust', 'eno_ex_Nickeldust_0', { category: 'nature', group: 'eno:itemGroup.name.ore_dust', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })  // ex_Nickeldust · Nickel Ore Dust
block('eno:platinum_gravel', 'eno_ex_Platinumgravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_Platinumgravel · Platinum Ore Gravel
block('eno:nether_platinum_gravel', 'eno_ex_netherPlatinumgravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_netherPlatinumgravel · Nether Platinum Ore Gravel
block('eno:ender_platinum_gravel', 'eno_ex_enderPlatinumgravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_enderPlatinumgravel · Ender Platinum Ore Gravel
block('eno:platinum_sand', 'eno_ex_Platinumsand_0', { category: 'nature', group: 'eno:itemGroup.name.ore_sand', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })  // ex_Platinumsand · Platinum Ore Sand
block('eno:platinum_dust', 'eno_ex_Platinumdust_0', { category: 'nature', group: 'eno:itemGroup.name.ore_dust', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })  // ex_Platinumdust · Platinum Ore Dust
block('eno:aluminum_gravel', 'eno_ex_Aluminumgravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_Aluminumgravel · Aluminum Ore Gravel
block('eno:nether_aluminum_gravel', 'eno_ex_netherAluminumgravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_netherAluminumgravel · Nether Aluminum Ore Gravel
block('eno:ender_aluminum_gravel', 'eno_ex_enderAluminumgravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_enderAluminumgravel · Ender Aluminum Ore Gravel
block('eno:aluminum_sand', 'eno_ex_Aluminumsand_0', { category: 'nature', group: 'eno:itemGroup.name.ore_sand', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })  // ex_Aluminumsand · Aluminum Ore Sand
block('eno:aluminum_dust', 'eno_ex_Aluminumdust_0', { category: 'nature', group: 'eno:itemGroup.name.ore_dust', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })  // ex_Aluminumdust · Aluminum Ore Dust

// ---- 压缩方块（Compressum） ----
block('eno:compressed_cobblestone', 'eno_ex_compressed_cobblestone_0', { category: 'construction', hardness: 4, explosion: 12, sound: 'stone', tools: ['pickaxe'] })  // compressedcobblestone · Compressed Cobblestone
block('eno:compressed_dirt', 'eno_ex_compressed_dirt_0', { category: 'construction', hardness: 1, explosion: 1, sound: 'gravel', tools: ['shovel'] })  // compresseddirt · Compressed Dirt
block('eno:compressed_flint', 'eno_ex_compressed_flint_0', { category: 'construction', hardness: 3, explosion: 12, sound: 'stone', tools: ['pickaxe'] })  // compressedflint · Compressed Flint
block('eno:compressed_dust', 'eno_ex_compressed_dust_0', { category: 'construction', hardness: 1, explosion: 1, sound: 'sand', tools: ['shovel'] })  // compresseddust · Compressed Dust
block('eno:compressed_sand', 'eno_ex_compressed_sand_0', { category: 'construction', hardness: 1, explosion: 1, sound: 'sand', tools: ['shovel'] })  // compressedsand · Compressed Sand
block('eno:compressed_netherrack', 'eno_ex_compressed_netherrack_0', { category: 'construction', hardness: 0.8, explosion: 0.8, sound: 'netherrack', tools: ['pickaxe'] })  // compressednetherrack · Compressed Netherrack
block('eno:compressed_gravel', 'eno_ex_compressed_gravel_0', { category: 'construction', hardness: 1.2, explosion: 1.2, sound: 'gravel', tools: ['shovel'] })  // compressedgravel · Compressed Gravel
block('eno:compressed_stone', 'eno_ex_compressed_stone_0', { category: 'construction', hardness: 3, explosion: 12, sound: 'stone', tools: ['pickaxe'] })  // compressedstone · Compressed Stone
block('eno:compressed_nethergravel', 'eno_ex_compressed_nether_gravel_0', { category: 'construction', hardness: 1.2, explosion: 1.2, sound: 'gravel', tools: ['shovel'] })  // compressednethergravel · Compressed Nether Gravel
block('eno:compressed_endstone', 'eno_ex_compressed_end_stone_0', { category: 'construction', hardness: 6, explosion: 18, sound: 'stone', tools: ['pickaxe'] })  // compressedendstone · Compressed End Stone
block('eno:compressed_endergravel', 'eno_ex_compressed_ender_gravel_0', { category: 'construction', hardness: 1.2, explosion: 1.2, sound: 'gravel', tools: ['shovel'] })  // compressedendergravel · Compressed Ender Gravel
block('eno:compressed_soulsand', 'eno_ex_compressed_soul_sand_0', { category: 'construction', hardness: 1, explosion: 1, sound: 'soul_sand', tools: ['shovel'] })  // compressedsoulsand · Compressed Soul Sand

// ---- 其他方块 ----
block('eno:dust', 'eno_ex_dust_0', { category: 'nature', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })  // ex_dust · Dust
block('eno:gravel_nether', 'eno_ex_gravelNether_0', { category: 'nature', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_gravelNether · Nether Gravel
block('eno:gravel_ender', 'eno_ex_gravelEnder_0', { category: 'nature', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })  // ex_gravelEnder · Ender Gravel
// ex_saltcoarse（粗盐方块）：2.4 移除，粗盐改为物品 eno:salt_crude
block('eno:auto_crafting_table', ['eno_ex_compressor_top_0', 'eno_ex_side_0', 'eno_ex_side_0', 'eno_ex_side_0', 'eno_ex_side_0', 'eno_ex_side_0'], { category: 'items', hardness: 2.5, explosion: 2.5, sound: 'wood', tools: ['axe'] })  // ex_auto_crafting_table · Auto Crafting Table

// ---- 压缩方块（Compressum） ----
block('eno:compressed_obsidian_level1', 'eno_ex_compressedObsidian_level1_0', { category: 'construction', hardness: 50, explosion: 99999, sound: 'stone', tools: ['pickaxe'], harvest: ['diamond', 'netherite'] })  // ex_compressedObsidian_level1 · Compressed Obsidian level1
block('eno:compressed_obsidian_level2', 'eno_ex_compressedObsidian_level2_0', { category: 'construction', hardness: 50, explosion: 99999, sound: 'stone', tools: ['pickaxe'], harvest: ['diamond', 'netherite'] })  // ex_compressedObsidian_level2 · Compressed Obsidian level2

// ---- 寄生树叶（BLOCKS/infestedleaves.js）----
// 原模组是 3 种生寄生叶 + 3 种寄生叶（按橡树类 / 丛林 / 云杉分贴图）。这里改成两个方块，用"树种"状态区分，
// 每种原版树叶都有自己的寄生贴图（tools/gen_infested.py 按原版树叶贴图自动生成：生寄生叶 = 原色上爬着白丝，寄生叶 = 整片变白）。
// 继承原版树叶：硬度 0.15、草的音效；钩子按效率挖掘（eno:plant）。掉落由脚本决定（见 scripts/mechanics/infested.ts）。
infestedLeaves('eno:infesting_leaves', 'eno_infesting', 'eno:infesting')   // ex_infestedRaw0~2 · Raw Infested Leaves
infestedLeaves('eno:infested_leaves', 'eno_infested', 'eno:infested')      // ex_infestedLeaf0~2 · Infested Leaves

// ---- 2.4 新增：铜矿石沙砾 / 沙子 / 尘土（原模组 IC2 联动里的贴图；烧成原版铜锭）----
block('eno:copper_gravel', 'eno_ex_Coppergravel_0', { category: 'nature', group: 'eno:itemGroup.name.ore_gravel', hardness: 0.6, explosion: 0.6, sound: 'gravel', tools: ['shovel'] })
block('eno:copper_sand', 'eno_ex_Coppersand_0', { category: 'nature', group: 'eno:itemGroup.name.ore_sand', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })
block('eno:copper_dust', 'eno_ex_Copperdust_0', { category: 'nature', group: 'eno:itemGroup.name.ore_dust', hardness: 0.5, explosion: 0.5, sound: 'sand', tools: ['shovel'] })
