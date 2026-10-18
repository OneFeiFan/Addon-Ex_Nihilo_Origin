// 物品
// 对应原模组：Item.createItem / ToolAPI.setTool（原 ID 与英文名写在每行末尾的注释里）
import { item, food, hammer, crook, mesh, animatedItem } from '../api.js'

// ---- 杂项 ----
item('eno:slime_ball_black', 'eno_ex_blackslimeball_0')  // ex_slimeBallBlack · Black Slime Ball

// ---- 粉盐（ITEM/OreSalts.js） ----
item('eno:copper_dust_salts', 'eno_ex_copperdustsalts_0', { group: 'eno:itemGroup.name.salts' })  // ex_CopperDustSalts · Copper Dust Salts
item('eno:tin_dust_salts', 'eno_ex_tindustsalts_0', { group: 'eno:itemGroup.name.salts' })  // ex_TinDustSalts · Tin Dust Salts
item('eno:lead_dust_salts', 'eno_ex_leaddustsalts_0', { group: 'eno:itemGroup.name.salts' })  // ex_LeadDustSalts · Lead Dust Salts
item('eno:silver_dust_salts', 'eno_ex_silverdustsalts_0', { group: 'eno:itemGroup.name.salts' })  // ex_SilverDustSalts · Silver Dust Salts
item('eno:iron_dust_salts', 'eno_ex_irondustsalts_0', { group: 'eno:itemGroup.name.salts' })  // ex_IronDustSalts · Iron Dust Salts
item('eno:gold_dust_salts', 'eno_ex_golddustsalts_0', { group: 'eno:itemGroup.name.salts' })  // ex_GoldDustSalts · Gold Dust Salts
item('eno:nickel_dust_salts', 'eno_ex_nickeldustsalts_0', { group: 'eno:itemGroup.name.salts' })  // ex_NickelDustSalts · Nickel Dust Salts
item('eno:platinum_dust_salts', 'eno_ex_platinumdustsalts_0', { group: 'eno:itemGroup.name.salts' })  // ex_PlatinumDustSalts · Platinum Dust Salts

// ---- 筛网（CORE/ENRCore.js · registerMesh） ----
mesh('eno:mesh_wood', 'eno_ex_woodmesh_0', 130, { group: 'eno:itemGroup.name.mesh' })  // ex_meshWood · Wood Mesh
mesh('eno:mesh_silk', 'eno_ex_silkmesh_0', 832, { group: 'eno:itemGroup.name.mesh' })  // ex_meshSilk · Silk Mesh
mesh('eno:mesh_flint', 'eno_ex_flintmesh_0', 1664, { group: 'eno:itemGroup.name.mesh' })  // ex_meshFlint · Flint Mesh
mesh('eno:mesh_iron', 'eno_ex_ironmesh_0', 3328, { group: 'eno:itemGroup.name.mesh' })  // ex_meshIron · Iron Mesh
mesh('eno:mesh_diamond', 'eno_ex_diamondmesh_0', 6656, { group: 'eno:itemGroup.name.mesh' })  // ex_meshDiamond · Diamond Mesh
mesh('eno:meshco_silk', 'eno_ex_cosilkmesh_0', 3328, { group: 'eno:itemGroup.name.mesh' })  // ex_meshcoSilk · coSilk Mesh
mesh('eno:meshco_flint', 'eno_ex_coflintmesh_0', 6656, { group: 'eno:itemGroup.name.mesh' })  // ex_meshcoFlint · coFlint Mesh
mesh('eno:meshco_iron', 'eno_ex_coironmesh_0', 13312, { group: 'eno:itemGroup.name.mesh' })  // ex_meshcoIron · coIron Mesh
mesh('eno:meshco_diamond', 'eno_ex_codiamondmesh_0', 26624, { group: 'eno:itemGroup.name.mesh' })  // ex_meshcoDiamond · coDiamond Mesh

// ---- 矿石链（CORE/ENRCore.js · EXCore.register） ----
item('eno:iron_broken', 'eno_ex_ironbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_Ironbroken · Broken Iron Ore
item('eno:nether_iron_broken', 'eno_ex_netherironbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_netherIronbroken · Nether Broken Iron Ore
item('eno:ender_iron_broken', 'eno_ex_enderironbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_enderIronbroken · Ender Broken Iron Ore
item('eno:iron_crushed', 'eno_ex_ironcrushed_0', { group: 'eno:itemGroup.name.ore_crushed' })  // ex_Ironcrushed · Crushed Iron Ore
item('eno:iron_powdered', 'eno_ex_ironpowdered_0', { group: 'eno:itemGroup.name.ore_powdered' })  // ex_IronPowdered · Powdered Iron Ore
item('eno:gold_broken', 'eno_ex_goldbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_Goldbroken · Broken Gold Ore
item('eno:nether_gold_broken', 'eno_ex_nethergoldbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_netherGoldbroken · Nether Broken Gold Ore
item('eno:ender_gold_broken', 'eno_ex_endergoldbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_enderGoldbroken · Ender Broken Gold Ore
item('eno:gold_crushed', 'eno_ex_goldcrushed_0', { group: 'eno:itemGroup.name.ore_crushed' })  // ex_Goldcrushed · Crushed Gold Ore
item('eno:gold_powdered', 'eno_ex_goldpowdered_0', { group: 'eno:itemGroup.name.ore_powdered' })  // ex_GoldPowdered · Powdered Gold Ore
item('eno:nickel_broken', 'eno_ex_nickelbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_Nickelbroken · Broken Nickel Ore
item('eno:nether_nickel_broken', 'eno_ex_nethernickelbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_netherNickelbroken · Nether Broken Nickel Ore
item('eno:ender_nickel_broken', 'eno_ex_endernickelbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_enderNickelbroken · Ender Broken Nickel Ore
item('eno:nickel_crushed', 'eno_ex_nickelcrushed_0', { group: 'eno:itemGroup.name.ore_crushed' })  // ex_Nickelcrushed · Crushed Nickel Ore
item('eno:nickel_powdered', 'eno_ex_nickelpowdered_0', { group: 'eno:itemGroup.name.ore_powdered' })  // ex_NickelPowdered · Powdered Nickel Ore
item('eno:platinum_broken', 'eno_ex_platinumbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_Platinumbroken · Broken Platinum Ore
item('eno:nether_platinum_broken', 'eno_ex_netherplatinumbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_netherPlatinumbroken · Nether Broken Platinum Ore
item('eno:ender_platinum_broken', 'eno_ex_enderplatinumbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_enderPlatinumbroken · Ender Broken Platinum Ore
item('eno:platinum_crushed', 'eno_ex_platinumcrushed_0', { group: 'eno:itemGroup.name.ore_crushed' })  // ex_Platinumcrushed · Crushed Platinum Ore
item('eno:platinum_powdered', 'eno_ex_platinumpowdered_0', { group: 'eno:itemGroup.name.ore_powdered' })  // ex_PlatinumPowdered · Powdered Platinum Ore
item('eno:aluminum_broken', 'eno_ex_aluminumbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_Aluminumbroken · Broken Aluminum Ore
item('eno:nether_aluminum_broken', 'eno_ex_netheraluminumbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_netherAluminumbroken · Nether Broken Aluminum Ore
item('eno:ender_aluminum_broken', 'eno_ex_enderaluminumbroken_0', { group: 'eno:itemGroup.name.ore_broken' })  // ex_enderAluminumbroken · Ender Broken Aluminum Ore
item('eno:aluminum_crushed', 'eno_ex_aluminumcrushed_0', { group: 'eno:itemGroup.name.ore_crushed' })  // ex_Aluminumcrushed · Crushed Aluminum Ore
item('eno:aluminum_powdered', 'eno_ex_aluminumpowdered_0', { group: 'eno:itemGroup.name.ore_powdered' })  // ex_AluminumPowdered · Powdered Aluminum Ore

// ---- 锭 ----
item('eno:ingot_platinum', 'eno_ex_ingotplatinum_0', { group: 'eno:itemGroup.name.ingots' })  // ingotPlatinum · Platinum Ingot
item('eno:ingot_aluminum', 'eno_ex_ingotaluminum_0', { group: 'eno:itemGroup.name.ingots' })  // ingotAluminum · Aluminum Ingot
item('eno:ingot_nickel', 'eno_ex_ingotnickel_0', { group: 'eno:itemGroup.name.ingots' })  // ingotNickel · Nickel Ingot
item('eno:ingot_copper', 'eno_ex_ingotcopper_0', { group: 'eno:itemGroup.name.ingots' })  // ingotCopper · Copper Ingot
item('eno:ingot_lead', 'eno_ex_ingotlead_0', { group: 'eno:itemGroup.name.ingots' })  // ingotLead · Lead Ingot
item('eno:ingot_osmium', 'eno_ex_ingotosmium_0', { group: 'eno:itemGroup.name.ingots' })  // ingotOsmium · Osmium Ingot
item('eno:ingot_silver', 'eno_ex_ingotsilver_0', { group: 'eno:itemGroup.name.ingots' })  // ingotSilver · Silver Ingot
item('eno:ingot_tin', 'eno_ex_ingottin_0', { group: 'eno:itemGroup.name.ingots' })  // ingotTin · Tin Ingot

// ---- 钩子（TOOL/Crook.js） ----
item('eno:crookwriter', 'eno_enr_crook_0', { category: 'equipment', group: 'eno:itemGroup.name.crook', stack: 1 })  // ex_crookwriter · Author Crook
crook('eno:crook_wood', 'eno_enr_crook_0', { durability: 60, speed: 1, damage: 3 }, { group: 'eno:itemGroup.name.crook' })  // ex_crookWood · Wooden Crook
crook('eno:crook_bone', 'eno_enr_crook_1', { durability: 90, speed: 1, damage: 4 }, { group: 'eno:itemGroup.name.crook' })  // ex_crookBone · Bone Crook
crook('eno:crook_reed', 'eno_enr_crook_2', { durability: 45, speed: 2, damage: 3 }, { group: 'eno:itemGroup.name.crook' })  // ex_crookReed · Sugarcane Crook
crook('eno:crook_hay', 'eno_enr_crook_3', { durability: 110, speed: 3, damage: 3 }, { group: 'eno:itemGroup.name.crook' })  // ex_crookHay · Hay Crook
crook('eno:crook_gold', 'eno_enr_crook_4', { durability: 30, speed: 12, damage: 3 }, { group: 'eno:itemGroup.name.crook' })  // ex_crookGold · Gold Crook

// ---- 锤子（TOOL/Hammer.js、Compressum） ----
hammer('eno:hammers_wood', 'eno_enr_hammers_wood_0', { durability: 60, tier: 'wooden', speed: 2, damage: 4 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersWood · Wood Hammer
hammer('eno:hammers_stone', 'eno_enr_hammers_stone_0', { durability: 132, tier: 'stone', speed: 3, damage: 5 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersStone · Stone Hammer
hammer('eno:hammers_iron', 'eno_enr_hammers_iron_0', { durability: 251, tier: 'iron', speed: 6, damage: 6 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersIron · Iron Hammer
hammer('eno:hammers_gold', 'eno_enr_hammers_gold_0', { durability: 33, tier: 'golden', speed: 12, damage: 4 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersGold · Gold Hammer
hammer('eno:hammers_diamond', 'eno_enr_hammers_diamond_0', { durability: 1562, tier: 'diamond', speed: 8, damage: 7 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersDiamond · Diamond Hammer
hammer('eno:hammers_copper', 'eno_enr_hammers_copper_0', { durability: 190, tier: 'stone', speed: 5, damage: 4 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersCopper · Copper Hammer
hammer('eno:hammers_tin', 'eno_enr_hammers_tin_0', { durability: 200, tier: 'wooden', speed: 5, damage: 3 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersTin · Tin Hammer
hammer('eno:hammers_lead', 'eno_enr_hammers_lead_0', { durability: 150, tier: 'wooden', speed: 5, damage: 3 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersLead · Lead Hammer
hammer('eno:hammers_silver', 'eno_enr_hammers_silver_0', { durability: 200, tier: 'stone', speed: 6, damage: 4 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersSilver · Silver Hammer
hammer('eno:hammers_platinum', 'eno_enr_hammers_platinum_0', { durability: 1700, tier: 'diamond', speed: 9, damage: 6 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersPlatinum · Platinum Hammer
hammer('eno:hammers_aluminum', 'eno_enr_hammers_aluminum_0', { durability: 225, tier: 'wooden', speed: 10, damage: 3 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersAluminum · Aluminum Hammer
hammer('eno:hammers_invar', 'eno_enr_hammers_invar_0', { durability: 450, tier: 'stone', speed: 7, damage: 5 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersInvar · Invar Hammer
hammer('eno:hammers_nickel', 'eno_enr_hammers_nickel_0', { durability: 300, tier: 'stone', speed: 6, damage: 4 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersNickel · Nickel Hammer

// ---- 陶瓷桶（ITEM/bucket.js） ----
item('eno:bucket_porcelain_raw', 'eno_enr_bucketporcelainraw_0', { stack: 16 })  // ex_bucketPorcelainRaw · Unfired Bucket
item('eno:bucket_porcelain_empty', 'eno_enr_bucketporcelainempty_0', { stack: 16, components: ['eno:porcelain_bucket'], liquidClipped: true })  // ex_bucketPorcelainEmpty · Bucket
item('eno:bucket_porcelain_water', 'eno_enr_bucketporcelainwater_0', { stack: 1, components: ['eno:porcelain_bucket'] })  // ex_bucketPorcelainWater · Water Bucket
item('eno:bucket_porcelain_lava', 'eno_enr_bucketporcelainlava_0', { stack: 1, components: ['eno:porcelain_bucket'] })  // ex_bucketPorcelainLava · Lava Bucket

// ---- 种子（ITEM/seeds.js） ----
item('eno:seeds_oak', 'eno_ex_seedsoak_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsOak · Acorn
item('eno:seeds_spruce', 'eno_ex_seedsspruce_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsSpruce · Spruce Seed
item('eno:seeds_birch', 'eno_ex_seedsbirch_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsBirch · Birch Seed
item('eno:seeds_jungle', 'eno_ex_seedsjungle_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsJungle · Exotic Seed
item('eno:seeds_acacia', 'eno_ex_seedsacacia_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsAcacia · Acacia Seeds
item('eno:seeds_dark_oak', 'eno_ex_seedsdarkoak_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsDarkOak · Dark Acorn
item('eno:seeds_carrot', 'eno_ex_seedscarrot_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsCarrot · Carrot Seeds
item('eno:seeds_potato', 'eno_ex_seedspotato_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsPotato · Potato Seeds
item('eno:seeds_bamboo', 'eno_ex_seedsbamboo_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsBamboo · Bamboo Seeds
item('eno:seeds_berries', 'eno_ex_seedsberries_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsBerries · Berries Seeds
item('eno:seeds_grass', 'eno_ex_seedsgrass_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsGrass · Grass Seeds
item('eno:seeds_cactus', 'eno_ex_seedscactus_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsCactus · Cactus Seeds
item('eno:seeds_canes', 'eno_ex_seedscanes_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsCanes · Sugarcane Seeds
item('eno:spores', 'eno_ex_spores_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_spores · Spores
item('eno:seeds_chorus', 'eno_ex_seedschorus_0', { category: 'nature', group: 'eno:itemGroup.name.seeds' })  // ex_seedsChorus · Chorus Seeds

// ---- 杂项 ----
animatedItem('eno:silk_worm', 'eno_silkworm_flipbook', 8)  // ex_silkWorm · Silkworm
food('eno:cooked_silk_worm', 'eno_enr_cookedsilkworm_0', 1)  // ex_cookedSilkWorm · Cooked Silkworm
item('eno:ash', 'eno_enr_ash_0')  // ex_ash · Ash
item('eno:porcelain', 'eno_enr_porcelain_0')  // ex_porcelain · Porcelain Clay
item('eno:stone_small', 'eno_enr_stonesmall_0')  // ex_stoneSmall · Small Stone
item('eno:dust_saw', 'eno_enr_dustsaw_0')  // ex_dustSaw · Saw Dust

// ---- 诱饵（ITEM/bait.js） ----
item('eno:bait_sheep', 'eno_bait_sheep_0')  // baitSheep · Sheep Bait
item('eno:bait_cow', 'eno_bait_cow_0')  // baitCow · Cow Bait
item('eno:bait_chicken', 'eno_bait_chicken_0')  // baitChicken · Chicken Bait
item('eno:bait_pig', 'eno_bait_pig_0')  // baitPig · Pig Bait
item('eno:bait_wolf', 'eno_bait_wolf_0')  // baitWolf · Wolf Bait
item('eno:bait_ocelot', 'eno_bait_ocelot_0')  // baitOcelot · Ocelot Bait

// ---- 锤子（TOOL/Hammer.js、Compressum） ----
item('eno:double_compressed_diamond_hammer', 'eno_ex_double_compressed_diamond_hammer_0')  // doublecompresseddiamondhammer · Double Compressed Diamond Hammer
hammer('eno:hammers_ore_smasher', 'eno_ex_ore_smasher_0', { durability: 2000, tier: 'diamond', speed: 8, damage: 7 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersoresmasher · Ore Smasher
hammer('eno:hammers_compressed_wood', 'eno_ex_compressed_hammer_wood_0', { durability: 540, tier: 'wooden', speed: 2, damage: 4 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersCompressedWood · CompressedWood Hammer
hammer('eno:hammers_compressed_stone', 'eno_ex_compressed_hammer_stone_0', { durability: 1188, tier: 'stone', speed: 3, damage: 5 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersCompressedStone · CompressedStone Hammer
hammer('eno:hammers_compressed_iron', 'eno_ex_compressed_hammer_iron_0', { durability: 2259, tier: 'iron', speed: 6, damage: 6 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersCompressedIron · CompressedIron Hammer
hammer('eno:hammers_compressed_gold', 'eno_ex_compressed_hammer_gold_0', { durability: 297, tier: 'golden', speed: 12, damage: 4 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersCompressedGold · CompressedGold Hammer
hammer('eno:hammers_compressed_diamond', 'eno_ex_compressed_hammer_diamond_0', { durability: 14058, tier: 'diamond', speed: 8, damage: 7 }, { group: 'eno:itemGroup.name.hammer' })  // ex_hammersCompressedDiamond · CompressedDiamond Hammer

// ---- 2.4 新增（盐、铜、远古残骸，见《与原模组的差异》）----
item('eno:copper_broken', 'eno_ex_copperbroken_0', { group: 'eno:itemGroup.name.ore_broken' })      // 破碎铜矿石（原模组 IC2 联动里的贴图）
item('eno:copper_crushed', 'eno_ex_coppercrushed_0', { group: 'eno:itemGroup.name.ore_crushed' })   // 铜矿石碎块
item('eno:copper_powdered', 'eno_ex_copperpowdered_0', { group: 'eno:itemGroup.name.ore_powdered' }) // 铜矿石粉末
item('eno:salt_crude', 'eno_salt_crude', { group: 'eno:itemGroup.name.salts' })                     // 粗盐：筛尘土 / 沙子 / 沙砾的副产物
item('eno:debris_fragment', 'eno_debris_fragment')                                                   // 远古残骸碎片：4 个合成 1 块远古残骸
mesh('eno:mesh_copper', 'eno_ex_coppermesh_0', 2500, { group: 'eno:itemGroup.name.mesh' })           // 铜网：燧石网 + 4 铜锭
mesh('eno:meshco_copper', 'eno_ex_cocoppermesh_0', 10000, { group: 'eno:itemGroup.name.mesh' })      // 重型铜网：4 张铜网
