// InnerCore BlockRenderer 盒子（0–1 方块坐标）→ 基岩版方块几何体
// 用 Sapdon 的 BlockModel 生成 UV（它负责 up/down 面的负 uv_size 约定，见 Sapdon known-pitfalls §10.1），
// 再给每个面补上 material_instance —— BlockModel 不支持按面指定材质实例。
import { BlockModel, GRegistry } from '@sapdon/core'

export type Box = [x1: number, y1: number, z1: number, x2: number, y2: number, z2: number]
export interface FaceMaterials { up: string, down: string, side: string, north?: string, south?: string }
type Rect = [number, number, number, number]
const r = (v: number) => +v.toFixed(4)
const FACES = ['north', 'east', 'south', 'west', 'up', 'down'] as const

/** 按"盒子在各面上的投影"取方块贴图区域（与 InnerCore addBox 使用方块贴图时一致；整块时等于原版 cube 的取法） */
function projectedRects([x1, y1, z1, x2, y2, z2]: number[]): Record<string, Rect> {
    const w = r(x2 - x1), h = r(y2 - y1), d = r(z2 - z1)
    return {
        north: [r(16 - x2), r(16 - y2), w, h],
        south: [x1, r(16 - y2), w, h],
        west: [z1, r(16 - y2), d, h],
        east: [r(16 - z2), r(16 - y2), d, h],
        up: [r(16 - x2), r(16 - z2), w, d],
        down: [r(16 - x2), r(16 - z2), w, d],
    }
}

export class MaterialModel {
    private model: BlockModel
    private materials: { bone: string, material: string | FaceMaterials }[] = []
    constructor(private identifier: string) { this.model = new BlockModel({ identifier }) }
    /** material：整根骨骼用同一个材质实例，或按面指定 { up, down, side } */
    bone(name: string, material: string | FaceMaterials, boxes: Box[]) {
        this.model.bone(name)
        for (const b of boxes) {
            const p = b.map((v) => +(v * 16).toFixed(4))
            this.model.cube({ origin: [p[0] - 8, p[1], p[2] - 8], size: [r(p[3] - p[0]), r(p[4] - p[1]), r(p[5] - p[2])], uv: projectedRects(p) as any })
        }
        this.materials.push({ bone: name, material })
        return this
    }
    toJson() {
        const json: any = this.model.toJson()
        for (const bone of json['minecraft:geometry'][0].bones) {
            const material = this.materials.find((m) => m.bone === bone.name)!.material
            const pick = (f: string) => typeof material === 'string' ? material : f === 'up' ? material.up : f === 'down' ? material.down : f === 'north' && material.north ? material.north : f === 'south' && material.south ? material.south : material.side
            for (const cube of bone.cubes) for (const f of FACES) if (cube.uv[f]) cube.uv[f].material_instance = pick(f)
        }
        return json
    }
    register(name: string) { const json = this.toJson(); GRegistry.register(name, 'resource', 'models/blocks/', { toObject: () => json } as any); return this }
}

// ---------- 逐像素模型：把贴图里不透明的像素挤出成小方块（用于原模组的"物品模型""植物交叉面片"）----------
// 不依赖贴图透明度渲染：真机上 alpha_test 的透明像素显示成了黑色（诱饵）。
import fs from 'fs'
import { PNG } from 'pngjs'

/** 读取贴图，返回不透明像素的坐标（u 向右、v 向下） */
export function opaquePixels(pngPath: string) {
    const png = PNG.sync.read(fs.readFileSync(pngPath))
    const out: [number, number][] = []
    for (let v = 0; v < png.height; v++) for (let u = 0; u < png.width; u++) if (png.data[(v * png.width + u) * 4 + 3] >= 128) out.push([u, v])
    return { width: png.width as number, height: png.height as number, pixels: out }
}
const texel = (u: number, v: number) => {
    const f = { uv: [u, v], uv_size: [1, 1] }
    return { up: { uv: [u + 1, v + 1], uv_size: [-1, -1] }, down: { uv: [u + 1, v + 1], uv_size: [-1, -1] }, north: f, south: f, east: f, west: f }
}
/** 平躺在地上的物品模型：size 像素见方、厚度为一个像素格（原模组 Animation.Item） */
export function flatItemCubes(pngPath: string, size: number) {
    const { width, pixels } = opaquePixels(pngPath)
    const s = size / width
    return pixels.map(([u, v]) => ({ origin: [-size / 2 + u * s, 0, -size / 2 + v * s], size: [s, s, s], uv: texel(u, v) }))
}
/** 植物的"井"字形四片竖直面片：分别位于 x = 4、12 像素与 z = 4、12 像素（原模组 chorussproutHelper.setPlantModel） */
export function crossPlaneCubes(pngPath: string) {
    const { width, height, pixels } = opaquePixels(pngPath)
    const s = 16 / width, t = 0.02
    const cubes: any[] = []
    for (const [u, v] of pixels) {
        const a = u * s, y = (height - 1 - v) * s
        for (const p of [4, 12]) {
            cubes.push({ origin: [p - 8 - t / 2, y, a - 8], size: [t, s, s], uv: texel(u, v) })   // 平行于 z 轴的面片
            cubes.push({ origin: [a - 8, y, p - 8 - t / 2], size: [s, s, t], uv: texel(u, v) })   // 平行于 x 轴的面片
        }
    }
    return { width, height, cubes }
}
