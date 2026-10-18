// 诱饵方块（物品在 items.ts）
// 对应原模组：bait.js（BaitAPI.registerBait）
import { baitBlock } from '../bait.js'

for (const a of ['Sheep', 'Cow', 'Chicken', 'Pig', 'Wolf', 'Ocelot']) {
    baitBlock(`eno:bait_block_${a.toLowerCase()}`, `eno_bait_${a}_0`, `eno:bait_${a.toLowerCase()}`)   // baitB<动物>
}
