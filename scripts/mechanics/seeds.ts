// 种子：逐行对照 ITEM/seeds.js 的 ItemUse 回调。只对方块顶面、且上方是空气时生效
//   · 树苗种子、胡萝卜 / 马铃薯 / 竹子 / 甜浆果种子：点草方块、泥土、耕地 → 在上方种下（草方块、泥土上会播放筛子的声音）
//   · 草种：点泥土 → 变成草方块
//   · 甘蔗种子：点草方块、泥土、沙子 → 上方长出甘蔗（原模组不检查水源）
//   · 孢子：点草方块、泥土 → 变成菌丝
//   · 仙人掌种子：点沙子 → 上方长出仙人掌
//   · 紫颂种子：点末地石 → 上方长出紫颂苗（原模组写成了仙人掌种子，紫颂种子本身没有用处；作者确认是写错了）
// 原模组的 setCarriedItem(count - 1)：创造模式同样消耗。
import { world, system, BlockPermutation, Player } from '@minecraft/server'
import { consumeMainhand } from '../lib/tool.js'

const PLANT: Record<string, string> = {
    'eno:seeds_oak': 'minecraft:oak_sapling', 'eno:seeds_spruce': 'minecraft:spruce_sapling', 'eno:seeds_birch': 'minecraft:birch_sapling',
    'eno:seeds_jungle': 'minecraft:jungle_sapling', 'eno:seeds_acacia': 'minecraft:acacia_sapling', 'eno:seeds_dark_oak': 'minecraft:dark_oak_sapling',
    'eno:seeds_carrot': 'minecraft:carrots', 'eno:seeds_potato': 'minecraft:potatoes', 'eno:seeds_bamboo': 'minecraft:bamboo_sapling', 'eno:seeds_berries': 'minecraft:sweet_berry_bush',
}
const SOIL = new Set(['minecraft:grass_block', 'minecraft:dirt'])
const SAND = new Set(['minecraft:sand', 'minecraft:red_sand'])   // 原模组按方块 ID 12 判断，包含红沙

const resolve = (...ids: string[]) => { for (const id of ids) { try { return BlockPermutation.resolve(id) } catch { } } return undefined }

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    const item = ev.itemStack?.typeId
    if (!item || !ev.isFirstEvent || ev.blockFace !== 'Up' || !(item in PLANT || item === 'eno:seeds_grass' || item === 'eno:seeds_canes' || item === 'eno:spores' || item === 'eno:seeds_cactus' || item === 'eno:seeds_chorus')) return
    const { block, player } = ev
    const above = block.above()
    if (!above || above.typeId !== 'minecraft:air') return
    const ground = block.typeId
    let action: (() => void) | undefined, sound = false
    if (SOIL.has(ground)) {
        if (item === 'eno:seeds_grass' && ground === 'minecraft:dirt') { action = () => block.setType('minecraft:grass_block'); sound = true }
        if (PLANT[item]) { action = () => above.setPermutation(BlockPermutation.resolve(PLANT[item])); sound = true }
    }
    if (ground === 'minecraft:farmland' && PLANT[item]) action = () => above.setPermutation(BlockPermutation.resolve(PLANT[item]))
    if (item === 'eno:seeds_canes' && (SOIL.has(ground) || SAND.has(ground))) action = () => { const p = resolve('minecraft:reeds', 'minecraft:sugar_cane'); if (p) above.setPermutation(p) }
    if (item === 'eno:spores' && SOIL.has(ground)) action = () => block.setType('minecraft:mycelium')
    if (item === 'eno:seeds_cactus' && SAND.has(ground)) action = () => above.setType('minecraft:cactus')
    if (item === 'eno:seeds_chorus' && ground === 'minecraft:end_stone') action = () => above.setType('eno:chorus_sprout')
    if (!action) return
    ev.cancel = true
    system.run(() => {
        action!()
        consumeMainhand(player as Player)
        if (sound) player.dimension.playSound('eno.sieve', player.location)
    })
})
