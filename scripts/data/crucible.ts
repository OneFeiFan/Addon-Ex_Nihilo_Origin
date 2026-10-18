// 坩埚的数据：可熔化的方块、热源、木坩埚的输入、内容物贴图
// 对应原模组：BLOCKS/MACHINE/crucible.js（Crucible.dataSet("crucible" / "energy")）、Compressum/CompressedBlock/Oak_Crucible.js
// 本文件不引用引擎接口，构建期（内容物实体的贴图表）和运行期共用。

export const CRUCIBLE_TEXTURES: string[] = []
const tex = (path: string) => { CRUCIBLE_TEXTURES.push(path); return CRUCIBLE_TEXTURES.length - 1 }
export const TEX = {
    stone: tex('textures/blocks/stone'),
    cobblestone: tex('textures/blocks/cobblestone'),
    gravel: tex('textures/blocks/gravel'),
    lava: (() => { const first = tex('textures/entity/eno/barrel/ex_lava_0'); for (let i = 1; i < 20; i++) tex(`textures/entity/eno/barrel/ex_lava_${i}`); return first })(),   // 20 帧，每帧 8 tick
    water: (() => { const first = tex('textures/entity/eno/barrel/ex_water_0'); for (let i = 1; i < 32; i++) tex(`textures/entity/eno/barrel/ex_water_${i}`); return first })(),   // 32 帧，每帧 1 tick（原模组木坩埚用静态的 Water 贴图，作者要求加动画）
    leaf: tex('textures/entity/eno/crucible/leaf_0'),
}

/** 动画贴图：编号 → [帧数, 每帧 tick 数] */
export const ANIMATED: Record<number, [number, number]> = { [TEX.lava]: [20, 8], [TEX.water]: [32, 1] }

// ---------- 坩埚：可熔化的方块（工作量、显示的方块、每单位热量每 tick 产出的岩浆）----------
export const MELT: Record<string, { work: number, texture: number, base: number }> = {}
const meltable = (item: string, work: number, texture: number, base: number) => { MELT[item] = { work, texture, base } }
meltable('minecraft:stone', 2500, TEX.stone, 0.0001)
meltable('minecraft:cobblestone', 2500, TEX.cobblestone, 0.0001)
meltable('minecraft:gravel', 2500, TEX.gravel, 0.0001)

// ---------- 坩埚下方的热源（Crucible.dataSet("energy")）----------
export const HEAT: Record<string, number> = {}
const heat = (block: string, energy: number) => { HEAT[block] = energy }
heat('minecraft:flowing_lava', 3)   // 原 ID 10
heat('minecraft:lava', 2.5)         // 原 ID 11
heat('minecraft:torch', 1)
heat('minecraft:fire', 1.5)

// ---------- 木坩埚：树苗、树叶化成水（工作量、每 tick 产出的水）----------
export const OAK_INPUT: Record<string, { work: number, water: number }> = {}
const oakInput = (item: string, work: number, water: number) => { OAK_INPUT[item] = { work, water } }
for (const w of ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak']) oakInput(`minecraft:${w}_sapling`, 125, 0.001)
for (const w of ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak']) oakInput(`minecraft:${w}_leaves`, 250, 0.001)
