// 筛子 / 重型筛
// 对应原模组：CORE/SieveCore.js（Sieve.addSieve / registerMesh / Sieve.sieve）
import { sieveGroup, sieve } from '../sieve.js'

// 每组：可装的网（按顺序编号 1..n）与可筛方块的内容物贴图（eno_v_* 为原版方块贴图），顺序即方块状态的取值
sieveGroup('ex', {
    meshes: [
        { id: 'eno:mesh_wood', texture: 'eno_ex_sieveWoodMesh_0' },
        { id: 'eno:mesh_silk', texture: 'eno_ex_sieveSilkMesh_0' },
        { id: 'eno:mesh_flint', texture: 'eno_ex_sieveFlintMesh_0' },
        { id: 'eno:mesh_iron', texture: 'eno_ex_sieveIronMesh_0' },
        { id: 'eno:mesh_diamond', texture: 'eno_ex_sieveDiamondMesh_0' },
        { id: 'eno:mesh_copper', texture: 'eno_ex_sieveCopperMesh_0' },   // 2.4 新增；排在最后，已放置的筛子里的网编号不变
    ],
    contents: ['eno_v_dirt', 'eno_v_sand', 'eno_v_gravel', 'eno_v_soul_sand', 'eno_ex_dust_0', 'eno_ex_gravelNether_0', 'eno_ex_gravelEnder_0'],   // 2.4：粗盐方块移除
})
sieveGroup('co', {
    meshes: [
        { id: 'eno:meshco_silk', texture: 'eno_ex_sievecoSilkMesh_0' },
        { id: 'eno:meshco_flint', texture: 'eno_ex_sievecoFlintMesh_0' },
        { id: 'eno:meshco_iron', texture: 'eno_ex_sievecoIronMesh_0' },
        { id: 'eno:meshco_diamond', texture: 'eno_ex_sievecoDiamondMesh_0' },
        { id: 'eno:meshco_copper', texture: 'eno_ex_sievecoCopperMesh_0' },
    ],
    contents: ['eno_ex_compressed_dirt_0', 'eno_ex_compressed_dust_0', 'eno_ex_compressed_sand_0', 'eno_ex_compressed_gravel_0', 'eno_ex_compressed_soul_sand_0'],
})

sieve('eno:heavysieve_oak', 'eno_log_oak_0', 'co')  // ex_heavysieve_oak · Heavy Oak Sieve
sieve('eno:heavysieve_spruce', 'eno_log_spruce_0', 'co')  // ex_heavysieve_spruce · Heavy Spruce Sieve
sieve('eno:heavysieve_birch', 'eno_log_birch_0', 'co')  // ex_heavysieve_birch · Heavy Birch Sieve
sieve('eno:heavysieve_jungle', 'eno_log_jungle_0', 'co')  // ex_heavysieve_jungle · Heavy Jungle Sieve
sieve('eno:heavysieve_acacia', 'eno_log_acacia_0', 'co')  // ex_heavysieve_acacia · Heavy Acacia Sieve
sieve('eno:heavysieve_big_oak', 'eno_log_big_oak_0', 'co')  // ex_heavysieve_big_oak · Heavy Dark Oak Sieve
sieve('eno:sieve_birch', 'eno_planks_birch_0', 'ex')  // ex_sieve_birch · Birch Sieve
sieve('eno:sieve_acacia', 'eno_planks_acacia_0', 'ex')  // ex_sieve_acacia · Acacia Sieve
sieve('eno:sieve_big_oak', 'eno_planks_big_oak_0', 'ex')  // ex_sieve_big_oak · Big Oak Sieve
sieve('eno:sieve_jungle', 'eno_planks_jungle_0', 'ex')  // ex_sieve_jungle · Jungle Sieve
sieve('eno:sieve_spruce', 'eno_planks_spruce_0', 'ex')  // ex_sieve_spruce · Spruce Sieve
sieve('eno:sieve_oak', 'eno_planks_oak_0', 'ex')  // ex_sieve_oak · Oak Sieve
