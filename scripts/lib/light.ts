// 亮度（诅咒之土、木桶结冰共用）
import { world, Dimension, Vector3 } from '@minecraft/server'

/** 方块光：基岩版接口只有总亮度和天空光，方块光按"总亮度高出天空光的部分"估算 */
export function blockLight(dim: Dimension, at: Vector3) {
    try { const total = dim.getLightLevel(at), sky = dim.getSkyLightLevel(at); return total > sky ? total : 0 } catch { return 0 }
}
/** 原模组 World.getLightLevel 计入昼夜：天空光按时间减弱（夜里减 11）；取它和方块光中较大的 */
export function brightness(dim: Dimension, at: Vector3) {
    let sky = 0
    try { sky = dim.getSkyLightLevel(at) } catch { return 0 }
    const t = world.getTimeOfDay()
    const darken = t < 12000 ? 0 : t < 13800 ? (t - 12000) / 1800 * 11 : t < 22200 ? 11 : t < 24000 ? (24000 - t) / 1800 * 11 : 0
    return Math.max(blockLight(dim, at), Math.round(sky - darken))
}
