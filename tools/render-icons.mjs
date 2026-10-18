// 把本模组的方块模型渲染成"物品栏风格"的立体小图标（俯视 30°、左右两个侧面），给指导书用。
// 输出到 res/textures/ui/eno_guide/*.png（已随源码提交；改了贴图或模型后运行 `node tools/render-icons.mjs` 重新生成）。
// 只用本模组自带的贴图。模型是若干个轴对齐的长方体（单位：像素，0–16），与 src-build 里各方块的模型一致。
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PNG } from 'pngjs'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(ROOT, 'res/textures/ui/eno_guide')
const SIZE = 128   // 64 时在手册里看不清细节
const cache = new Map()
function tex(rel) {
    if (!cache.has(rel)) cache.set(rel, PNG.sync.read(fs.readFileSync(path.join(ROOT, 'res/textures', rel + '.png'))))
    return cache.get(rel)
}
const B = (n) => `blocks/eno/${n}`, E = (n) => `entity/eno/${n}`

// ---------- 等轴投影：x 向右下、z 向左下、y 向上；看得见顶面、南面（左）、东面（右）----------
const COS = Math.cos(Math.PI / 6), SIN = Math.sin(Math.PI / 6), K = 1.95 * SIZE / 64
const proj = (x, y, z) => [(x - z) * COS * K + SIZE / 2, (x + z) * SIN * K - y * K + SIZE / 2 + 16 * K * 0.5 - 16 * SIN * K + 1]
const SHADE = { up: 1, south: 0.8, east: 0.62 }

/** 一个面：起点 O、u 方向边 A、v 方向边 B（三维），以及贴图上对应的区域 */
function faces(box, t) {
    const [x1, y1, z1, x2, y2, z2] = box
    const out = []
    if (t.up) out.push({ shade: SHADE.up, tex: t.up, O: [x1, y2, z1], A: [x2 - x1, 0, 0], Bv: [0, 0, z2 - z1], uv: [x1, z1, x2, z2] })
    if (t.south) out.push({ shade: SHADE.south, tex: t.south, O: [x1, y2, z2], A: [x2 - x1, 0, 0], Bv: [0, y1 - y2, 0], uv: [x1, 16 - y2, x2, 16 - y1] })
    if (t.east) out.push({ shade: SHADE.east, tex: t.east, O: [x2, y2, z2], A: [0, 0, z1 - z2], Bv: [0, y1 - y2, 0], uv: [16 - z2, 16 - y2, 16 - z1, 16 - y1] })
    return out
}

function render(parts, file) {
    const img = new PNG({ width: SIZE, height: SIZE })
    // 由远到近画：x + z 小的在后面，同一位置先画低的
    const ordered = [...parts].sort((a, b) => ((a.box[0] + a.box[3] + a.box[2] + a.box[5]) - (b.box[0] + b.box[3] + b.box[2] + b.box[5])) || (a.box[1] - b.box[1]))
    for (const p of ordered) for (const f of faces(p.box, p.tex)) {
        const t = tex(f.tex), O = proj(...f.O)
        const P1 = proj(f.O[0] + f.A[0], f.O[1] + f.A[1], f.O[2] + f.A[2]), P2 = proj(f.O[0] + f.Bv[0], f.O[1] + f.Bv[1], f.O[2] + f.Bv[2])
        const ax = P1[0] - O[0], ay = P1[1] - O[1], bx = P2[0] - O[0], by = P2[1] - O[1]
        const det = ax * by - ay * bx
        if (Math.abs(det) < 1e-6) continue
        const xs = [O[0], P1[0], P2[0], P1[0] + bx], ys = [O[1], P1[1], P2[1], P1[1] + by]
        const [u0, v0, u1, v1] = f.uv, sx = t.width / 16, sy = t.width / 16   // 动画贴图是竖长条：只取第一帧（正方形）
        for (let py = Math.max(0, Math.floor(Math.min(...ys))); py <= Math.min(SIZE - 1, Math.ceil(Math.max(...ys))); py++)
            for (let px = Math.max(0, Math.floor(Math.min(...xs))); px <= Math.min(SIZE - 1, Math.ceil(Math.max(...xs))); px++) {
                const dx = px + 0.5 - O[0], dy = py + 0.5 - O[1]
                const a = (dx * by - dy * bx) / det, b = (ax * dy - ay * dx) / det
                if (a < 0 || a >= 1 || b < 0 || b >= 1) continue
                const tu = Math.min(t.width - 1, Math.floor((u0 + a * (u1 - u0)) * sx)), tv = Math.min(t.height - 1, Math.floor((v0 + b * (v1 - v0)) * sy))
                const si = (tv * t.width + tu) * 4
                if (t.data[si + 3] < 128) continue
                const di = (py * SIZE + px) * 4
                img.data[di] = t.data[si] * f.shade; img.data[di + 1] = t.data[si + 1] * f.shade; img.data[di + 2] = t.data[si + 2] * f.shade; img.data[di + 3] = 255
            }
    }
    fs.writeFileSync(path.join(OUT, file + '.png'), PNG.sync.write(img))
}
const all = (t) => ({ up: t, south: t, east: t })
const cube = (t) => [{ box: [0, 0, 0, 16, 16, 16], tex: t }]

// ---------- 模型 ----------
const BARREL = [[2, 0, 2, 14, 1, 14], [1, 0, 1, 14, 16, 2], [1, 0, 2, 2, 16, 15], [14, 0, 1, 15, 16, 14], [2, 0, 14, 15, 16, 15]]
const barrel = (t, content) => [...BARREL.map((box) => ({ box, tex: all(t) })), ...(content ? [{ box: [2, 1, 2, 14, 14.5, 14], tex: { up: content } }] : [])]
const SIEVE = [[0, 8, 0, 16, 12, 1], [0, 8, 15, 16, 12, 16], [0, 8, 1, 1, 12, 15], [15, 8, 1, 16, 12, 15], [1, 0, 1, 2, 9, 2], [14, 0, 14, 15, 9, 15], [14, 0, 1, 15, 9, 2], [1, 0, 14, 2, 9, 15]]
const sieve = (frame, mesh) => [...SIEVE.map((box) => ({ box, tex: all(frame) })), { box: [1, 8.8, 1, 15, 9.6, 15], tex: { up: mesh } }]
const CRUCIBLE = [[0, 3, 0, 1, 16, 16], [15, 3, 0, 16, 16, 16], [1, 3, 0, 15, 16, 1], [1, 3, 15, 15, 16, 16], [0, 0, 0, 1, 3, 1], [0, 0, 15, 1, 3, 16], [15, 0, 0, 16, 3, 1], [15, 0, 15, 16, 3, 16], [1, 2, 1, 15, 4, 15]]
const crucible = (t, content) => [...CRUCIBLE.map((box) => ({ box, tex: t })), ...(content ? [{ box: [1, 4, 1, 15, 14.5, 15], tex: { up: content } }] : [])]

fs.mkdirSync(OUT, { recursive: true })
render(barrel(B('eno_planks_oak_0')), 'barrel')
render(barrel(B('eno_planks_oak_0'), E('barrel/ex_1_0')), 'barrel_compost')
render(barrel(B('eno_planks_oak_0'), E('barrel/ex_water_0')), 'barrel_water')
render(barrel(B('eno_planks_oak_0'), E('barrel/ex_waterwitch')), 'barrel_witch')
render(barrel(B('eno_planks_oak_0'), E('barrel/ex_brine')), 'barrel_brine')
render(sieve(B('eno_planks_oak_0'), B('eno_ex_sieveSilkMesh_0')), 'sieve')
render(sieve(B('eno_log_oak_0'), B('eno_ex_sievecoSilkMesh_0')), 'heavysieve')
render(crucible({ up: B('eno_enr_crucible_2'), south: B('eno_enr_crucible_1'), east: B('eno_enr_crucible_1') }), 'crucible')
render(crucible({ up: B('eno_enr_crucible_2'), south: B('eno_enr_crucible_1'), east: B('eno_enr_crucible_1') }, E('barrel/ex_lava_0')), 'crucible_lava')
render(crucible(all(B('eno_log_oak_0')), E('barrel/ex_water_0')), 'oak_crucible')
render([{ box: [0, 0, 0, 16, 8, 16], tex: { up: B('eno_ex_furnace_top_0'), south: B('eno_ex_furnace_front_off_1'), east: B('eno_ex_furnace_side_1') } }], 'furnace_half')
render(cube({ up: B('eno_ex_furnace_top_0'), south: B('eno_ex_furnace_front_on_0'), east: B('eno_ex_furnace_side_0') }), 'furnace')
render(cube({ up: B('eno_ex_damageSide_0'), south: B('eno_ex_damageFront_0'), east: B('eno_ex_damageSide_0') }), 'breaker')
render([{ box: [1, 0, 1, 15, 8, 15], tex: { up: B('eno_enr_endCake_1'), south: B('eno_enr_endCake_2'), east: B('eno_enr_endCake_2') } }], 'end_cake')
render(cube({ up: B('eno_ex_dirtEarth_0'), south: B('eno_ex_dirtEarth_1'), east: B('eno_ex_dirtEarth_1') }), 'cursed_earth')
render(cube(all(B('eno_ex_compressed_dirt_0'))), 'compressed_dirt')
render(cube(all(B('eno_ex_Irongravel_0'))), 'iron_gravel')
render(cube(all(B('eno_planks_oak_0'))), 'planks')
render(cube(all(B('eno_log_oak_0'))), 'log')
// 矿盐晶体（与 src-build/crystal.ts 的晶簇模型一致）
const CRYSTALS = [[7, 0, 7, 9, 4, 9], [7, 0, 8, 8, 6, 9], [8, 1, 7, 9, 7, 8], [7, 1, 7, 8, 7, 8], [8, 1, 8, 9, 7, 9], [7, 0, 7, 9, 5, 9], [7, 2, 11, 8, 8, 12], [8, 2, 5, 9, 8, 6], [10, 2, 8, 11, 9, 9], [4, 3, 7, 5, 8, 8]]   // 与原模组相同
for (const [m, t] of [['iron', 'eno_ore_salts_Iron_0'], ['copper', 'eno_ore_salts_copper_0'], ['gold', 'eno_ore_salts_gold_0']]) render(CRYSTALS.map((box) => ({ box, tex: all(B(t)) })), `crystal_${m}`)
console.log('[icons] 已生成', fs.readdirSync(OUT).length, '个图标 →', path.relative(ROOT, OUT))
