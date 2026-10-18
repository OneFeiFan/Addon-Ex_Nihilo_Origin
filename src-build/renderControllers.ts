// 渲染控制器：统一写进一个原版 JSON 文件。
// 不用 Sapdon 的 AddonRenderController(Group)：它的 registerTexturesArray 嵌套写反、序列化会丢掉 part_visibility，
// 多个 Group 实例在真机构建里还出现了互相覆盖（只剩最后一个文件）。
import { GRegistry } from '@sapdon/core'

const controllers: Record<string, any> = {}
let registered = false

/**
 * 一个按实体属性选贴图的渲染控制器。visibleBones：只显示这些骨骼，值可以是 Molang 条件
 * （高度为 0 时要把骨骼藏起来：缩放到 0 的立方体仍会画出一个压扁的面）
 */
export function textureController(name: string, textureCount: number, textureIndexQuery: string, visibleBones?: Record<string, boolean | string>, animated?: Record<number, [number, number]>) {
    const id = `controller.render.${name}`
    controllers[id] = {
        arrays: { textures: { 'Array.t': Array.from({ length: textureCount }, (_, i) => `Texture.t${i}`) } },
        geometry: 'Geometry.default',
        materials: [{ '*': 'Material.default' }],
        textures: [`Array.t[${frameIndex(textureIndexQuery, animated)}]`],
        ...(visibleBones ? { part_visibility: [{ '*': false }, ...Object.entries(visibleBones).map(([b, v]) => ({ [b]: v }))] } : {}),
    }
    if (!registered) {
        registered = true
        GRegistry.register('eno_render_controllers', 'resource', 'render_controllers/', { toObject: () => ({ format_version: '1.8.0', render_controllers: controllers }) } as any)
    }
    return id
}

/**
 * 帧动画（原模组 *.anim.<每帧 tick>.png）：动画贴图拆成连续的 N 张，属性指向第一张；
 * 渲染时按 q.life_time 加上帧号 floor(时间 / 每帧时长) mod N。（0.15.0 用 uv_anim 平移 UV，真机上不生效、整条贴图被压扁显示）
 */
function frameIndex(indexQuery: string, animated?: Record<number, [number, number]>) {
    let expr = indexQuery
    for (const [idx, [frames, ticks]] of Object.entries(animated ?? {}))
        expr = `(${indexQuery} == ${idx} ? ${idx} + math.mod(math.floor(q.life_time * ${20 / ticks}), ${frames}) : ${expr})`
    return expr
}
