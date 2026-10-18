// 半砖熔炉
// 对应原模组：BLOCKS/MACHINE/furnace.js、furnaceadvance.js
import { halfFurnace, fullFurnace } from '../furnace.js'

halfFurnace('eno:furnacehalf', { top: 'eno_ex_furnace_top_0', side: 'eno_ex_furnace_side_1', front: 'eno_ex_furnace_front_off_1', frontLit: 'eno_ex_furnace_front_on_1' })  // ex_furnacehalf · Furnace Half
fullFurnace('eno:furnace', { top: 'eno_ex_furnace_top_0', side: 'eno_ex_furnace_side_0', front: 'eno_ex_furnace_front_off_0', frontLit: 'eno_ex_furnace_front_on_0' })  // ex_furnace · Furnace（潜行把半砖熔炉叠到半砖熔炉上得到）
