// 由 tools/gen_sieve_comp.mjs 生成，请勿手改。改了 scripts/data/sieve.ts 的掉落表或网的倍率后重新运行：
//   node --experimental-strip-types tools/gen_sieve_comp.mjs
// 筛子补偿系数：[可筛方块][网的倍率] → 基础概率要乘的系数（抵消"空手保护"强制出货多出来的量，长期平均不变）
export const SIEVE_COMP: Record<string, Record<string, number>> = {
    "minecraft:dirt": {
        "1": 1,
        "2": 1,
        "1.1": 1,
        "1.2": 1,
        "1.5": 1,
        "1.35": 1
    },
    "minecraft:sand": {
        "1": 0.773,
        "2": 0.992,
        "1.1": 0.843,
        "1.2": 0.889,
        "1.5": 0.956,
        "1.35": 0.933
    },
    "minecraft:gravel": {
        "1": 0.976,
        "2": 1,
        "1.1": 0.985,
        "1.2": 0.991,
        "1.5": 1,
        "1.35": 0.996
    },
    "minecraft:soul_sand": {
        "1": 0.693,
        "2": 1,
        "1.1": 0.85,
        "1.2": 0.928,
        "1.5": 1,
        "1.35": 1
    },
    "eno:dust": {
        "1": 0.965,
        "2": 1,
        "1.1": 0.978,
        "1.2": 0.985,
        "1.5": 0.995,
        "1.35": 0.993
    },
    "eno:gravel_nether": {
        "1": 0.871,
        "2": 1,
        "1.1": 0.914,
        "1.2": 0.94,
        "1.5": 0.985,
        "1.35": 0.968
    },
    "eno:gravel_ender": {
        "1": 0.281,
        "2": 1,
        "1.1": 0.623,
        "1.2": 0.771,
        "1.5": 0.954,
        "1.35": 0.895
    },
    "eno:compressed_dirt": {
        "2": 1,
        "1.1": 1,
        "1.2": 1,
        "1.5": 1,
        "1.35": 1
    },
    "eno:compressed_dust": {
        "2": 1,
        "1.1": 0.978,
        "1.2": 0.985,
        "1.5": 0.995,
        "1.35": 0.993
    },
    "eno:compressed_sand": {
        "2": 0.992,
        "1.1": 0.843,
        "1.2": 0.889,
        "1.5": 0.956,
        "1.35": 0.933
    },
    "eno:compressed_gravel": {
        "2": 1,
        "1.1": 0.985,
        "1.2": 0.991,
        "1.5": 1,
        "1.35": 0.996
    },
    "eno:compressed_soulsand": {
        "2": 1,
        "1.1": 0.85,
        "1.2": 0.928,
        "1.5": 1,
        "1.35": 1
    }
}
export const sieveComp = (input: string, mult: number) => SIEVE_COMP[input]?.[String(mult)] ?? 1
