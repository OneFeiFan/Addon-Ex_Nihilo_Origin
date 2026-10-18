// 熔炉配方与燃料
// 原模组的半砖熔炉直接查 InnerCore 的 Recipes.getFurnaceRecipeResult / getFuelBurnDuration（= 原版熔炉的全部配方与燃料，再加本模组的熔炉配方）。
// 基岩版脚本读不到原版配方表，所以在这里列出来。本模组的熔炉配方同时被构建期用来注册原版熔炉配方（src-build/content/recipes.ts）。
// 本文件不引用引擎接口，构建期和运行期共用。

export const SMELT: Record<string, string> = {}
/** 一次烧出几个（默认 1） */
export const SMELT_COUNT: Record<string, number> = {}
export const MOD_SMELTING: [string, string, number][] = []
const smelt = (input: string, output: string) => { SMELT[input] = output }
/** 本模组的熔炉配方（recipe.js 的 Recipes.addFurnace）；count：一次烧出几个 */
const modSmelt = (input: string, output: string, count = 1) => { smelt(input, output); if (count > 1) SMELT_COUNT[input] = count; MOD_SMELTING.push([input, output, count]) }

// ---------- 本模组 ----------
modSmelt('eno:iron_gravel', 'minecraft:iron_ingot')
modSmelt('eno:iron_sand', 'minecraft:iron_ingot')
modSmelt('eno:iron_dust', 'minecraft:iron_ingot')
modSmelt('eno:nether_iron_gravel', 'minecraft:iron_ingot')
modSmelt('eno:ender_iron_gravel', 'minecraft:iron_ingot')
modSmelt('eno:gold_gravel', 'minecraft:gold_ingot')
modSmelt('eno:gold_sand', 'minecraft:gold_ingot')
modSmelt('eno:gold_dust', 'minecraft:gold_ingot')
modSmelt('eno:nether_gold_gravel', 'minecraft:gold_ingot')
modSmelt('eno:ender_gold_gravel', 'minecraft:gold_ingot')
modSmelt('eno:silk_worm', 'eno:cooked_silk_worm')
modSmelt('eno:bucket_porcelain_raw', 'eno:bucket_porcelain_empty')
modSmelt('eno:slime_ball_black', 'minecraft:coal')
modSmelt('eno:crucible_raw', 'eno:crucible')
// 矿盐晶体：烧出 8 个锭（9 个粉盐合成 1 块，冶炼损耗 1 份；粉盐本身不能直接烧）。原模组是直接烧成金属块
modSmelt('eno:ore_salts_iron', 'minecraft:iron_ingot', 8)
modSmelt('eno:ore_salts_gold', 'minecraft:gold_ingot', 8)
modSmelt('eno:ore_salts_copper', 'minecraft:copper_ingot', 8)
// 2.4 新增
modSmelt('eno:copper_gravel', 'minecraft:copper_ingot')
modSmelt('eno:copper_sand', 'minecraft:copper_ingot')
modSmelt('eno:copper_dust', 'minecraft:copper_ingot')
modSmelt('eno:dust_saw', 'eno:ash')   // 木屑烧成灰烬（灰烬用于瓷土、卤水沉淀、和肉合成骨粉）

// ---------- 原版：矿石 ----------
for (const o of ['iron_ore', 'deepslate_iron_ore', 'raw_iron']) smelt(`minecraft:${o}`, 'minecraft:iron_ingot')
for (const o of ['gold_ore', 'deepslate_gold_ore', 'nether_gold_ore', 'raw_gold']) smelt(`minecraft:${o}`, 'minecraft:gold_ingot')
for (const o of ['copper_ore', 'deepslate_copper_ore', 'raw_copper']) smelt(`minecraft:${o}`, 'minecraft:copper_ingot')
smelt('minecraft:coal_ore', 'minecraft:coal'); smelt('minecraft:deepslate_coal_ore', 'minecraft:coal')
smelt('minecraft:diamond_ore', 'minecraft:diamond'); smelt('minecraft:deepslate_diamond_ore', 'minecraft:diamond')
smelt('minecraft:emerald_ore', 'minecraft:emerald'); smelt('minecraft:deepslate_emerald_ore', 'minecraft:emerald')
smelt('minecraft:lapis_ore', 'minecraft:lapis_lazuli'); smelt('minecraft:deepslate_lapis_ore', 'minecraft:lapis_lazuli')
smelt('minecraft:redstone_ore', 'minecraft:redstone'); smelt('minecraft:deepslate_redstone_ore', 'minecraft:redstone')
smelt('minecraft:quartz_ore', 'minecraft:quartz')
smelt('minecraft:ancient_debris', 'minecraft:netherite_scrap')

// ---------- 原版：方块 ----------
smelt('minecraft:sand', 'minecraft:glass'); smelt('minecraft:red_sand', 'minecraft:glass')
smelt('minecraft:cobblestone', 'minecraft:stone')
smelt('minecraft:stone', 'minecraft:smooth_stone')
smelt('minecraft:cobbled_deepslate', 'minecraft:deepslate')
smelt('minecraft:sandstone', 'minecraft:smooth_sandstone')
smelt('minecraft:red_sandstone', 'minecraft:smooth_red_sandstone')
smelt('minecraft:quartz_block', 'minecraft:smooth_quartz')
smelt('minecraft:basalt', 'minecraft:smooth_basalt')
smelt('minecraft:stone_bricks', 'minecraft:cracked_stone_bricks')
smelt('minecraft:nether_brick', 'minecraft:cracked_nether_bricks')
smelt('minecraft:polished_blackstone_bricks', 'minecraft:cracked_polished_blackstone_bricks')
smelt('minecraft:deepslate_bricks', 'minecraft:cracked_deepslate_bricks')
smelt('minecraft:deepslate_tiles', 'minecraft:cracked_deepslate_tiles')
smelt('minecraft:clay', 'minecraft:hardened_clay')
smelt('minecraft:wet_sponge', 'minecraft:sponge')
const COLORS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black']
for (const c of COLORS) smelt(`minecraft:${c}_terracotta`, `minecraft:${c === 'light_gray' ? 'silver' : c}_glazed_terracotta`)

// ---------- 原版：物品 ----------
smelt('minecraft:clay_ball', 'minecraft:brick')
smelt('minecraft:netherrack', 'minecraft:netherbrick')
smelt('minecraft:cactus', 'minecraft:green_dye')
smelt('minecraft:sea_pickle', 'minecraft:lime_dye')
smelt('minecraft:kelp', 'minecraft:dried_kelp')
smelt('minecraft:chorus_fruit', 'minecraft:popped_chorus_fruit')
for (const w of ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'pale_oak']) {
    for (const f of [`${w}_log`, `stripped_${w}_log`, `${w}_wood`, `stripped_${w}_wood`]) smelt(`minecraft:${f}`, 'minecraft:charcoal')
}

// ---------- 原版：食物 ----------
smelt('minecraft:potato', 'minecraft:baked_potato')
smelt('minecraft:beef', 'minecraft:cooked_beef')
smelt('minecraft:porkchop', 'minecraft:cooked_porkchop')
smelt('minecraft:chicken', 'minecraft:cooked_chicken')
smelt('minecraft:mutton', 'minecraft:cooked_mutton')
smelt('minecraft:rabbit', 'minecraft:cooked_rabbit')
smelt('minecraft:cod', 'minecraft:cooked_cod')
smelt('minecraft:salmon', 'minecraft:cooked_salmon')

// ---------- 燃料（燃烧 tick 数，与原版熔炉相同）----------
export const FUEL: Record<string, number> = {}
/** 带这些物品标签的物品按标签给燃烧时间（木头类） */
export const FUEL_TAGS: [string, number][] = [['minecraft:logs', 300], ['minecraft:planks', 300], ['minecraft:wooden_slabs', 150]]
const fuel = (item: string, ticks: number) => { FUEL[item] = ticks }
fuel('minecraft:lava_bucket', 20000)
fuel('minecraft:coal_block', 16000)
fuel('minecraft:dried_kelp_block', 4000)
fuel('minecraft:blaze_rod', 2400)
fuel('minecraft:coal', 1600)
fuel('minecraft:charcoal', 1600)
fuel('minecraft:bamboo', 50)
fuel('minecraft:stick', 100)
fuel('minecraft:bowl', 100)
fuel('minecraft:deadbush', 100)
for (const w of ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'pale_oak']) {
    fuel(`minecraft:${w}_log`, 300); fuel(`minecraft:${w}_planks`, 300); fuel(`minecraft:${w}_slab`, 150)
    fuel(`minecraft:${w}_sapling`, 100); fuel(`minecraft:${w}_fence`, 300); fuel(`minecraft:${w}_fence_gate`, 300)
    fuel(`minecraft:${w}_pressure_plate`, 300); fuel(`minecraft:${w}_button`, 100); fuel(`minecraft:${w}_trapdoor`, 300)
    fuel(`minecraft:${w}_door`, 200); fuel(`minecraft:${w}_sign`, 200); fuel(`minecraft:${w}_boat`, 1200)
}
for (const t of ['wooden_sword', 'wooden_shovel', 'wooden_pickaxe', 'wooden_axe', 'wooden_hoe']) fuel(`minecraft:${t}`, 200)
for (const b of ['crafting_table', 'bookshelf', 'chest', 'trapped_chest', 'ladder', 'jukebox', 'noteblock', 'daylight_detector', 'barrel', 'lectern', 'composter', 'cartography_table', 'fletching_table', 'smithing_table', 'loom']) fuel(`minecraft:${b}`, 300)
for (const c of COLORS) { fuel(`minecraft:${c}_wool`, 100); fuel(`minecraft:${c}_carpet`, 67) }

// ---------- 承载实体的名字（= 熔炉界面的门控键）：只由格式代码组成，显示出来是空的 ----------
export const FURNACE_NAME: Record<string, string> = {
    'eno:furnacehalf_entity': '\u00a7e\u00a7n\u00a7o\u00a71\u00a7r',
    'eno:furnace_entity': '\u00a7e\u00a7n\u00a7o\u00a72\u00a7r',
}
