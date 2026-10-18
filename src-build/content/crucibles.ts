// 坩埚
// 对应原模组：BLOCKS/MACHINE/crucible.js、Compressum/CompressedBlock/Oak_Crucible.js（CrucibleAPI.registerCrucible）
import { crucible, oakCrucible } from '../crucible.js'

crucible('eno:crucible_raw', { down: 'eno_enr_uncrucible_0', up: 'eno_enr_uncrucible_2', side: 'eno_enr_uncrucible_1', floor: 'eno_enr_uncrucible_0' }, 'raw')  // ex_crucibleRaw · Raw Crucible
crucible('eno:crucible', { down: 'eno_enr_crucible_0', up: 'eno_enr_crucible_2', side: 'eno_enr_crucible_1', floor: 'eno_enr_crucible_0' }, 'porcelain')  // ex_crucible · Crucible
oakCrucible('eno:crucible_oak', 'eno_log_oak_0')  // ex_crucible_oak · Oak Crucible
oakCrucible('eno:crucible_spruce', 'eno_log_spruce_0')  // ex_crucible_spruce · Spruce Crucible
oakCrucible('eno:crucible_birch', 'eno_log_birch_0')  // ex_crucible_birch · Birch Crucible
oakCrucible('eno:crucible_jungle', 'eno_log_jungle_0')  // ex_crucible_jungle · Jungle Crucible
oakCrucible('eno:crucible_acacia', 'eno_log_acacia_0')  // ex_crucible_acacia · Acacia Crucible
oakCrucible('eno:crucible_big_oak', 'eno_log_big_oak_0')  // ex_crucible_big_oak · Dark Oak Crucible
