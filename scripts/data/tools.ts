// 锤子 / 钩子的运行期数据
// 对应原模组：TOOL/Hammer.js（EXCore.transformation）、TOOL/Crook.js

export interface HammerRule { out: string, count: number | 'ore' }
export const HAMMER_TABLE: Record<string, HammerRule> = {}
/** 锤子挖 from 时掉落 count 个 out；count 为 'ore' 时按 3% / 12% / 20% / 65% 出 7 / 6 / 5 / 4 个 */
const transformation = (from: string, out: string, count: number | 'ore') => { HAMMER_TABLE[from] = { out, count } }

transformation('minecraft:cobblestone', 'minecraft:gravel', 1)
transformation('minecraft:gravel', 'minecraft:sand', 1)
transformation('minecraft:sand', 'eno:dust', 1)
transformation('minecraft:red_sand', 'eno:dust', 1)
transformation('minecraft:oak_log', 'eno:dust_saw', 4)
transformation('minecraft:spruce_log', 'eno:dust_saw', 4)
transformation('minecraft:birch_log', 'eno:dust_saw', 4)
transformation('minecraft:jungle_log', 'eno:dust_saw', 4)
transformation('minecraft:acacia_log', 'eno:dust_saw', 4)
transformation('minecraft:dark_oak_log', 'eno:dust_saw', 4)
transformation('eno:compressed_cobblestone', 'minecraft:gravel', 9)
transformation('eno:compressed_gravel', 'minecraft:sand', 9)
transformation('eno:compressed_sand', 'eno:dust', 9)
transformation('eno:compressed_netherrack', 'eno:gravel_nether', 9)
transformation('eno:compressed_endstone', 'eno:gravel_ender', 9)
transformation('eno:iron_gravel', 'eno:iron_crushed', 'ore')
transformation('eno:iron_sand', 'eno:iron_powdered', 'ore')
transformation('eno:copper_gravel', 'eno:copper_crushed', 'ore')   // 2.4
transformation('eno:copper_sand', 'eno:copper_powdered', 'ore')
transformation('eno:gold_gravel', 'eno:gold_crushed', 'ore')
transformation('eno:gold_sand', 'eno:gold_powdered', 'ore')
transformation('eno:nickel_gravel', 'eno:nickel_crushed', 'ore')
transformation('eno:nickel_sand', 'eno:nickel_powdered', 'ore')
transformation('eno:platinum_gravel', 'eno:platinum_crushed', 'ore')
transformation('eno:platinum_sand', 'eno:platinum_powdered', 'ore')
transformation('eno:aluminum_gravel', 'eno:aluminum_crushed', 'ore')
transformation('eno:aluminum_sand', 'eno:aluminum_powdered', 'ore')

/** 被当作锤子的物品（原 EXCore.isHammer） */
export const HAMMERS: string[] = [
    'eno:hammers_wood',
    'eno:hammers_stone',
    'eno:hammers_iron',
    'eno:hammers_gold',
    'eno:hammers_diamond',
    'eno:hammers_copper',
    'eno:hammers_tin',
    'eno:hammers_lead',
    'eno:hammers_silver',
    'eno:hammers_platinum',
    'eno:hammers_aluminum',
    'eno:hammers_invar',
    'eno:hammers_nickel',
    'eno:hammers_ore_smasher',
    'eno:hammers_compressed_wood',
    'eno:hammers_compressed_stone',
    'eno:hammers_compressed_iron',
    'eno:hammers_compressed_gold',
    'eno:hammers_compressed_diamond',
]

/** 钩子（作者之钩不参与额外掉落，与原模组一致） */
export const CROOK = {
    wood: 'eno:crook_wood', bone: 'eno:crook_bone', gold: 'eno:crook_gold', hay: 'eno:crook_hay', reed: 'eno:crook_reed',
}
