import {
    MinecraftMain,
    MinecraftGameInstance,
    registerBuiltinComponents,
} from '@sapdon/runtime'

import './custom_components/index.js'
import './welcome.js'
import './mechanics/hammer.js'
import './mechanics/crook.js'
import './mechanics/toolDurability.js'
import './mechanics/sieve.js'
import './mechanics/infested.js'
import './mechanics/barrel.js'
import './mechanics/crucible.js'
import './mechanics/porcelainBucket.js'
import './mechanics/seeds.js'
import './mechanics/bait.js'
import './mechanics/misc.js'
import './mechanics/furnace.js'
import './mechanics/oreSmasher.js'
import './mechanics/fertilizer.js'
import './mechanics/guide.js'

// Sapdon 内置组件（熔炉的承载实体生成 sapdon:block_with_entity 用到它）。
// 本模组没用到的内置组件会在内容日志里各报一条"未被使用"的警告——来自 Sapdon，按作者决定保留
registerBuiltinComponents()

@MinecraftMain
export class Main extends MinecraftGameInstance {
    
}