// 由 tools/gen_sieve_comp.mjs 生成，请勿手改。改了 scripts/data/sieve.ts 的掉落表或网的倍率后重新运行：
//   node --experimental-strip-types tools/gen_sieve_comp.mjs
// 筛子补偿系数：[可筛方块][网的倍率] → 基础概率要乘的系数（抵消"空手保护"强制出货多出来的量，长期平均不变）
export const SIEVE_COMP: Record<string, Record<string, number>> = {
    "minecraft:dirt": {
        "1": 1,
        "2": 1,
        "1.1": 1,
        "1.2": 1,
        "1.5": 1
    },
    "minecraft:sand": {
        "1": 0.773,
        "2": 0.992,
        "1.1": 0.843,
        "1.2": 0.889,
        "1.5": 0.956
    },
    "minecraft:gravel": {
        "1": 0.981,
        "2": 1,
        "1.1": 0.989,
        "1.2": 0.995,
        "1.5": 1
    },
    "minecraft:soul_sand": {
        "1": 0.718,
        "2": 1,
        "1.1": 0.858,
        "1.2": 0.934,
        "1.5": 0.996
    },
    "eno:dust": {
        "1": 0.965,
        "2": 1,
        "1.1": 0.978,
        "1.2": 0.985,
        "1.5": 0.995
    },
    "eno:gravel_nether": {
        "1": 0.871,
        "2": 1,
        "1.1": 0.914,
        "1.2": 0.94,
        "1.5": 0.985
    },
    "eno:gravel_ender": {
        "1": 0.281,
        "2": 1,
        "1.1": 0.623,
        "1.2": 0.771,
        "1.5": 0.954
    },
    "minecraft:red_sand": {
        "1": 0.831,
        "2": 0.993,
        "1.1": 0.886,
        "1.2": 0.917,
        "1.5": 0.971
    },
    "eno:crushed_deepslate": {
        "1": 0.956,
        "2": 1,
        "1.1": 0.974,
        "1.2": 0.978,
        "1.5": 0.995
    },
    "eno:crushed_tuff": {
        "1": 1,
        "2": 1,
        "1.1": 1,
        "1.2": 1,
        "1.5": 1
    },
    "eno:compressed_dirt": {
        "2": 1,
        "1.1": 1,
        "1.2": 1,
        "1.5": 1
    },
    "eno:compressed_dust": {
        "2": 1,
        "1.1": 0.978,
        "1.2": 0.985,
        "1.5": 0.995
    },
    "eno:compressed_sand": {
        "2": 0.992,
        "1.1": 0.843,
        "1.2": 0.889,
        "1.5": 0.956
    },
    "eno:compressed_gravel": {
        "2": 1,
        "1.1": 0.989,
        "1.2": 0.995,
        "1.5": 1
    },
    "eno:compressed_soulsand": {
        "2": 1,
        "1.1": 0.858,
        "1.2": 0.934,
        "1.5": 0.996
    }
}
export const sieveComp = (input: string, mult: number) => SIEVE_COMP[input]?.[String(mult)] ?? 1
