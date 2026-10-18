// 无中生有·起源 基岩版移植 —— 构建入口
// 内容逐条定义在 src-build/content/ 下（写法对应原模组的 Item.createItem / Block.createBlock / Recipes.addShaped），
// 这里按顺序载入，最后统一写出创造分组与方块音效。
import { registry } from '@sapdon/core'
import './src-build/content/items.js'
import './src-build/content/blocks.js'
import './src-build/content/sieves.js'
import './src-build/content/barrels.js'
import './src-build/content/crucibles.js'
import './src-build/content/baits.js'
import './src-build/content/misc.js'
import './src-build/content/furnace.js'
import './src-build/content/recipes.js'
import './src-build/content/groups.js'
import { finish, registered } from './src-build/api.js'
import { registerGuide } from './src-build/guide.js'

registerGuide()
finish()
console.log(`[eno] 已注册 ${registered.size} 个物品 / 方块`)
registry.submit()
