// 诅咒之土、末影蛋糕、紫颂苗
// 对应原模组：BLOCKS/cruseearth.js、BLOCKS/endercake.js、BLOCKS/chorussprout.js
import { cursedEarth, endCake, chorusSprout, blockBreaker } from '../misc.js'

cursedEarth('eno:dirt_earth', 'eno_ex_dirtEarth_0', 'eno_ex_dirtEarth_2', 'eno_ex_dirtEarth_1')  // ex_dirtEarth · Cursed Earth
endCake('eno:end_cake', { down: 'eno_enr_endCake_0', up: 'eno_enr_endCake_1', side: 'eno_enr_endCake_2' })  // ex_endCake · End Cake
// 紫颂苗：原模组的 ex_chorusSprout、ex_chorusSprout1~3 四个方块合成一个，四个生长阶段用方块状态表示
chorusSprout('eno:chorus_sprout', ['eno_enr_chorusSprout_0', 'eno_enr_chorusSprout_1', 'eno_enr_chorusSprout_2', 'eno_enr_chorusSprout_3'])

// 方块破坏机（对应原模组 BLOCKS/MACHINE/damage.js；原模组的 ex_damage1~3 是另外三个朝向，这里合并成一个方块的朝向状态）
blockBreaker('eno:damage0', 'eno_ex_damageSide_0', 'eno_ex_damageFront_0')  // ex_damage0 · Damage（方块破坏机）
