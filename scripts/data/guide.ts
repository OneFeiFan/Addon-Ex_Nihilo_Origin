// 指导书的内容（构建期生成界面、运行期做翻页路由，两边共用这一份）
// 写法照 Sapdon 示例 guidebook_demo：分类 → 词条 → 内容页。
//   · 文本页（默认）：每行不要太长（半页约 16 个汉字），每页 10 行（左右各 5 行），超出自动分页
//   · 合成页（pageType: 'crafting'）：3×3 合成格 + 产物 + 几行说明（最多 5 行，不分页）
//   · 图文页（pageType: 'illustrated'，用 illustrated(...) 写）：左边插图（可以是动画），右边文字，每页 6 行
//   · 配方图页（pageType: 'gallery'，用 gallery(...) 写）：像 JEI 一样的配方图，每页两张
// 图标、合成格都是贴图路径（不带扩展名）：原版贴图 textures/items/…、textures/blocks/…；
// 本模组的物品贴图 textures/items/eno/（文件名全小写），方块贴图 textures/blocks/eno/，
// 方块的立体小图标 textures/ui/eno_guide/（平铺的方块贴图做图标不好看）。

export interface GuideChapter {
    name: string, icon: string, lines: string[]
    pageType?: 'text' | 'crafting' | 'illustrated' | 'gallery'
    craft?: { grid: string[], output: string }
    sheets?: string[]
    figure?: { name: string, frames: number, fps: number }
}
/** 图文页的插图：每帧大小（与 tools/render_guide.py 的 W、H 一致）、右页每页行数 */
export const FIG_W = 192, FIG_H = 128, ILLUSTRATED_LINES = 6
export interface GuideCategory { id: string, title: string, icon: string, introLines: string[], chapters: GuideChapter[] }

const item = (n: string) => `textures/items/eno/${n}`
const block = (n: string) => `textures/blocks/eno/${n}`
const v = (n: string) => `textures/items/${n}`        // 原版物品贴图
const vb = (n: string) => `textures/blocks/${n}`      // 原版方块贴图
/** 方块的立体小图标（tools/render-icons.mjs 用本模组贴图渲染，放在 res/textures/ui/eno_guide/） */
const ui = (n: string) => `textures/ui/eno_guide/${n}`
/** 合成页：pattern 是 3 行字符串（不足 3 行 / 3 列按空补齐），keys 把字符映射到贴图 */
function craft(name: string, icon: string, pattern: string[], keys: Record<string, string>, output: string, lines: string[]): GuideChapter {
    const rows = [...pattern, '', '', ''].slice(0, 3).map((r) => r.padEnd(3, ' ').slice(0, 3))
    return { name, icon, pageType: 'crafting', craft: { grid: rows.join('').split('').map((c) => keys[c] ?? ''), output }, lines }
}

/** 配方图页（像 PC 版 JEI）：sheets 是 tools/render_jei.py 生成的 jei_<名字>.png；每页两张，说明文字（可选）排在最后一格 */
function gallery(name: string, icon: string, sheets: string[], lines: string[] = []): GuideChapter {
    return { name, icon, lines, pageType: 'gallery', sheets }
}
/** 图文页：figure 是 tools/render_guide.py 生成的插图名、帧数（要与生成器一致）、每秒帧数 */
function illustrated(name: string, icon: string, figure: [string, number, number], lines: string[]): GuideChapter {
    return { name, icon, lines, pageType: 'illustrated', figure: { name: figure[0], frames: figure[1], fps: figure[2] } }
}
const FIG = {
    crook: ['crook', 20, 8], compost: ['compost', 27, 8], sieve: ['sieve', 24, 8], hammer: ['hammer', 21, 8], ore: ['ore', 1, 1],
    crucible: ['crucible', 16, 6], oakCrucible: ['oak_crucible', 16, 6], barrelRecipe: ['barrel_recipe', 12, 6], furnace: ['furnace', 14, 6],
    infested: ['infested', 17, 6], breaker: ['breaker', 12, 6], salt: ['salt', 30, 6],
} as Record<string, [string, number, number]>

const STICK = v('stick'), PLANKS = ui('planks'), LOG = ui('log'), COBBLE = vb('cobblestone')

export const GUIDE: GuideCategory[] = [
    // ======================== 入门 ========================
    {
        id: 'start', title: '入门', icon: item('eno_enr_crook_0'),
        introLines: ['欢迎来到无中生有·起源！', '世界里只有一棵树和一小块土，', '其余的一切都要从无到有。', '按这一章的顺序一步步展开。'],
        chapters: [
            { name: '这是什么模组', icon: v('book_written'), lines: ['这是一个"空岛"玩法的模组：', '世界里没有矿石、泥土、沙子，', '只有一棵树和一小块土。', '你要用树叶、树苗做出泥土，', '再从泥土、沙砾里筛出', '种子、矿物，一步步扩张。', '本书按进度介绍每一样东西。', '书丢了可以用', '书 + 任意木板 合成。'] },
            illustrated('第一步：钩子与树苗', item('eno_enr_crook_0'), FIG.crook, ['4 根木棍合成木钩子。', '用钩子挖树叶，挖得更快，', '还会额外掉落树苗、苹果，', '偶尔掉出蚕。', '先把树苗种下，', '让树越来越多。', '木头留着做木板、木桶、筛子。']),
            illustrated('第二步：木桶堆肥', ui('barrel_compost'), FIG.compost, ['木板和木台阶合成木桶。', '把树苗、树叶、食物、腐肉等', '右键放进木桶堆肥，', '装满后自动发酵，', '约 50 秒后变成泥土，', '右键取出。', '泥土既能种树，', '也是筛子最重要的原料。']),
            illustrated('第三步：筛子', item('eno_ex_woodmesh_0'), FIG.sieve, ['木板和木棍合成筛子，', '9 根木棍合成一张木网，', '手持网右键装到筛子上。', '手持泥土右键放进去，', '连续右键 14 次筛完：', '必出 2–4 个小石子，', '还可能出各种种子。', '4 个小石子合成 1 个圆石。']),
            illustrated('第四步：锤子', item('eno_enr_hammers_stone_0'), FIG.hammer, ['用圆石和木棍做一把石锤。', '用锤子挖方块会变成下一级：', '圆石 → 沙砾', '沙砾 → 沙子', '沙子 → 尘土', '沙砾、沙子、尘土', '都能放进筛子，', '筛出煤、燧石和各种矿物。']),
            illustrated('第五步：矿物与冶炼', item('eno_ex_ironbroken_0'), FIG.ore, ['筛沙砾得到破碎矿石：', '铜最多，其次是铁和金。', '4 个合成一块矿石沙砾，', '放进熔炉烧成锭。', '8 个石台阶合成半砖熔炉，', '煤和木炭都能当燃料。', '先用铜做铜锤、铜网，', '再攒铁做铁网、铁桶。']),
            illustrated('第六步：水与岩浆', ui('crucible_lava'), FIG.crucible, ['原木和木台阶合成木坩埚，', '放入树苗、树叶慢慢化成水。', '黏土球 + 骨粉 = 瓷土，', '瓷土做成坩埚，下面放火把，', '放入圆石就能熔出岩浆。', '水和岩浆倒进木桶，', '可以做黏土、黑曜石、', '地狱岩、末地石。']),
            { name: '第七步：之后', icon: item('eno_ex_diamondmesh_0'), lines: ['更好的网掉落更多：', '线网、燧石网、铜网、', '铁网、钻石网。', '筛矿时偶尔出粗盐，', '溶成卤水、加灰烬，', '能沉淀出更多的金属。', '9 个方块合成压缩方块，', '放进重型筛一次顶 6 次。', '下界、末地沙砾', '有独特的产出。'] },
        ],
    },
    // ======================== 工具 ========================
    {
        id: 'tools', title: '工具', icon: item('eno_enr_hammers_wood_0'),
        introLines: ['钩子、锤子、筛网、陶瓷桶', '是推进的核心工具。'],
        chapters: [
            craft('钩子的合成', item('eno_enr_crook_0'), ['nn', 'n', 'n'], { n: STICK }, item('eno_enr_crook_0'),
                ['4 根木棍摆成钩子形状。', '换成骨头、金锭、甘蔗，', '就是骨钩、金钩、甘蔗钩。', '干草钩：小麦 + 铁栏杆。']),
            gallery('钩子的掉落', item('eno_enr_crook_2'), ['crook_oak'], ['左边是挖橡树叶、丛林树叶', '时的额外掉落和概率：', '木钩 / 骨钩、金钩、', '干草钩 / 甘蔗钩依次变好。', '白桦、深色橡木也掉苹果，', '云杉会多掉一个树苗。']),
            craft('锤子的合成', item('eno_enr_hammers_stone_0'), [' w', ' hw', 'h'], { w: COBBLE, h: STICK }, item('eno_enr_hammers_stone_0'),
                ['圆石 + 木棍，按图摆放。', '换成铜锭就是铜锤：', '耐久 190、速度 5，', '接近铁锤，铜又很多。']),
            illustrated('锤子的用法', item('eno_enr_hammers_iron_0'), FIG.hammer, ['用锤子挖下面的方块', '会掉落下一级的东西：', '圆石 → 沙砾', '沙砾 → 沙子', '沙子、红沙 → 尘土', '原木 → 4 个木屑', '矿石沙砾 → 矿石碎块', '矿石沙子 → 矿石粉末', '矿石每次掉 4–7 个：', '7 个 3%，6 个 12%，', '5 个 20%，4 个 65%']),
            gallery('锤子的配方', item('eno_enr_hammers_iron_0'), ['hammer_basic', 'hammer_compressed', 'hammer_ore'], ['数字是掉落的数量。', '矿石每次掉 4–7 个：', '7 个 3%，6 个 12%，', '5 个 20%，4 个 65%。', '镍、铂、铝矿石同理。']),
            { name: '压缩锤', icon: item('eno_ex_compressed_hammer_iron_0'), lines: ['9 把同种锤子合成压缩锤，', '更耐用。', '任何锤子都能把压缩方块', '锤成 9 个下一级：', '压缩圆石 → 9 沙砾', '压缩沙砾 → 9 沙子', '压缩沙子 → 9 尘土', '压缩地狱岩 → 9 下界沙砾', '压缩末地石 → 9 末地沙砾'] },
            { name: '矿石粉碎锤', icon: item('eno_ex_ore_smasher_0'), lines: ['一把很耐用的锤子。', '右键地面：从背包取 4 个', '破碎矿石 / 矿石碎块 /', '矿石粉末，直接在点的位置', '放出一块矿石沙砾 /', '矿石沙子 / 矿石尘土，', '省去合成这一步。'] },
            craft('筛网的合成', item('eno_ex_coppermesh_0'), ['b b', 'bob', 'b b'], { b: v('copper_ingot'), o: item('eno_ex_flintmesh_0') }, item('eno_ex_coppermesh_0'),
                ['木网 9 木棍；线网 9 线', '线网 + 4 燧石 → 燧石网', '燧石网 + 4 铜锭 → 铜网', '铜网 + 4 铁锭 → 铁网', '铁网 + 4 钻石 → 钻石网']),
            { name: '各种网的区别', icon: item('eno_ex_ironmesh_0'), lines: ['网越好，每样掉落的概率', '按倍率提高，耐久也越高：', '木网 ×1.0，耐久 130', '线网 ×1.1，耐久 832', '燧石网 ×1.2，耐久 1664', '铜网 ×1.35，耐久 2500', '铁网 ×1.5，耐久 3328', '钻石网 ×2.0，耐久 6656', '每筛完一次耐久减 1，', '4 张同种网 → 重型网'] },
            { name: '陶瓷桶', icon: item('eno_enr_bucketporcelainempty_0'), lines: ['瓷土 = 黏土球 + 骨粉，', '或 黏土球 + 2 个灰烬。', '3 个瓷土摆成桶的形状，', '得到生陶瓷桶，', '放进熔炉烧成陶瓷桶。', '用法和铁桶一样：', '装水、装岩浆、倒出，', '也能和木桶、坩埚配合。'] },
        ],
    },
    // ======================== 筛子 ========================
    {
        id: 'sieve', title: '筛子', icon: ui('sieve'),
        introLines: ['筛子是获得资源的主要途径。', '下面列出每种方块能筛出什么。', '所有概率都还要加上网的加成。'],
        chapters: [
            craft('筛子的合成', ui('sieve'), ['n n', 'nnn', 'm m'], { n: PLANKS, m: STICK }, ui('sieve'),
                ['木板 + 木棍，按图摆放。', '6 种木板各做一种，效果相同。', '原木 + 木棍同样摆法', '做出重型筛。']),
            illustrated('使用方法', item('eno_ex_woodmesh_0'), FIG.sieve, ['① 手持网右键，装上网。', '② 手持可筛的方块右键，', '   放进去（一次一个）。', '③ 连续右键 14 次，', '   筛完后掉出东西。', '同一种方块不会连续', '两次什么都不出；', '想要的东西也不会', '一直都不出。', '挖掉筛子时网会掉出来。']),
            gallery('筛泥土与沙砾', item('eno_enr_stonesmall_0'), ['sieve_dirt', 'sieve_gravel']),
            gallery('筛沙子与尘土', v('flint'), ['sieve_sand', 'sieve_dust']),
            gallery('灵魂沙、下界与末地', v('quartz'), ['sieve_soul_sand', 'sieve_nether', 'sieve_ender'], ['下界沙砾：金、石英、萤石，', '还有远古残骸碎片，', '4 个合成一块远古残骸。', '末地沙砾：陨铁、紫颂种子、', '末影珍珠。', '它们由锤子锤压缩地狱岩、', '压缩末地石得到。']),
            gallery('重型筛的掉落', ui('heavysieve'), ['heavy_dirt', 'heavy_gravel'], ['压缩沙子、压缩尘土、', '压缩灵魂沙同理：', '掉落种类与普通方块相同，', '每次数量更多。']),
            { name: '重型筛', icon: ui('heavysieve'), lines: ['原木 + 木棍做成，', '要装重型网', '（4 张同种网合成）。', '只能筛压缩方块：', '压缩泥土、沙砾、沙子、', '尘土、灵魂沙。', '每筛一次相当于', '普通筛子筛 6 次。'] },
        ],
    },
    // ======================== 木桶 ========================
    {
        id: 'barrel', title: '木桶', icon: ui('barrel'),
        introLines: ['木桶用来堆肥做泥土，', '也能装液体做各种东西。'],
        chapters: [
            craft('木桶的合成', ui('barrel'), ['n n', 'n n', 'ntn'], { n: PLANKS, t: PLANKS }, ui('barrel'),
                ['木板 ×6 + 木台阶 ×1。', '6 种木桶、石桶、', '16 种颜色的玻璃桶，', '用法都一样。']),
            illustrated('堆肥', ui('barrel_compost'), FIG.compost, ['右键放入可堆肥的东西：', '树苗、树叶、花、高草、', '小麦、生熟肉和鱼、', '苹果、西瓜、南瓜、', '胡萝卜、马铃薯、腐肉、', '蘑菇、仙人掌、甘蔗、', '竹子、海带、海泡菜、', '线、木屑、蚕……', '每种占的体积不同，', '装满后发酵约 50 秒。']),
            gallery('能堆肥的东西', ui('barrel_compost'), ['compost_1', 'compost_2', 'compost_3'], ['数字是装满一桶需要几个：', '×8 就是 8 个装满。', '装满后约 50 秒变成泥土。']),
            { name: '液体与雨水', icon: ui('barrel_water'), lines: ['空木桶时，手持水桶或', '岩浆桶右键倒进去。', '手持空桶右键取出液体。', '露天下雨时，空木桶', '会慢慢接满雨水；', '沙漠、热带草原、恶地、', '冰雪地区不下雨，接不到。', '木桶装岩浆会被烧掉！', '岩浆请用石桶或玻璃桶。'] },
            illustrated('桶内配方', v('clay_ball'), FIG.barrelRecipe, ['桶里有 1 桶液体时：', '水 + 尘土 → 黏土', '水 + 牛奶 → 50 秒后出', '  2 个粘液球', '岩浆 + 红石 → 地狱岩', '岩浆 + 萤石粉 → 末地石', '岩浆、上方是水 → 黑曜石', '女巫水 + 沙子 → 灵魂沙', '产物右键取出。']),
            gallery('桶内配方一览', v('clay_ball'), ['barrel_liquid', 'barrel_witch']),
            illustrated('盐：卤水与粉盐', item('eno_salt_crude'), FIG.salt, ['筛尘土、沙子、沙砾时', '偶尔会出粗盐。', '一桶水里一个一个放入', '4 个粗盐：水面浮起盐壳，', '每放一个长大一圈。', '放够 4 个后盐壳慢慢', '碎开、化掉，约 20 秒', '变成浑浊的卤水。', '再放 1 个灰烬（草木灰），', '约 10 秒后泛起絮状物，', '最后沉成一层结晶：', '右键取出粉盐，', '桶里留下一桶清水。']),
            gallery('盐的配方一览', item('eno_ex_irondustsalts_0'), ['salt'], ['沉淀出的粉盐每桶至少一样，', '铁、铜、金按左边的概率。', '9 个同种粉盐合成矿盐晶体，', '晶体放进熔炉烧出 8 个锭', '（冶炼损耗 1 份）。', '粉盐本身不能直接烧。']),
            { name: '女巫水', icon: ui('barrel_witch'), lines: ['装满水的木桶', '放在菌丝方块上，', '50 秒后变成女巫水。', '途中移走菌丝会失败，', '水会冒烟消失。', '孢子右键泥土或草方块', '可以得到菌丝。'] },
        ],
    },
    // ======================== 坩埚 ========================
    {
        id: 'crucible', title: '坩埚', icon: ui('crucible_lava'),
        introLines: ['坩埚熔化圆石得到岩浆，', '木坩埚把树叶化成水。'],
        chapters: [
            craft('瓷土', item('eno_enr_porcelain_0'), ['ba'], { b: v('clay_ball'), a: v('dye_powder_white') }, item('eno_enr_porcelain_0'),
                ['黏土球 + 骨粉 → 瓷土', '也可以用 2 个灰烬代替骨粉', '（木屑放进熔炉烧成灰烬）。', '瓷土用来做坩埚和陶瓷桶。']),
            craft('坩埚的合成', ui('crucible'), ['n n', 'n n', 'nnn'], { n: item('eno_enr_porcelain_0') }, ui('crucible'),
                ['7 个瓷土 → 生坩埚，', '放进熔炉烧成坩埚。']),
            illustrated('熔出岩浆', ui('crucible_lava'), FIG.crucible, ['放入圆石、石头或沙砾。', '坩埚下方要有热源：', '火把 1、火 1.5、', '岩浆 2.5、流动岩浆 3', '（数值越大熔得越快）。', '每块方块共熔出 1/4 桶，', '最多存 10 桶。', '手持空桶右键取出岩浆。']),
            gallery('坩埚的配方与热源', ui('crucible_lava'), ['crucible', 'crucible_heat'], []),
            craft('木坩埚的合成', ui('oak_crucible'), ['a a', 'a a', 'aca'], { a: LOG, c: PLANKS }, ui('oak_crucible'),
                ['原木 ×7 + 木台阶 ×1，', '6 种木头各一种。']),
            illustrated('化出水', ui('oak_crucible'), FIG.oakCrucible, ['木坩埚里放入树苗或树叶，', '不需要热源，', '慢慢化成水，', '最多存 1 桶。', '手持空桶右键取出。']),
            gallery('木坩埚的配方', ui('oak_crucible'), ['oak_crucible'], ['8 个树苗或 4 片树叶', '化出 1 桶水；', '其他树种的树苗、树叶', '同样可以。']),
        ],
    },
    // ======================== 冶炼与矿物 ========================
    {
        id: 'ore', title: '冶炼', icon: item('eno_ex_ironbroken_0'),
        introLines: ['矿物有三种形态：', '矿石沙砾、矿石沙子、矿石尘土，', '都能直接熔炼成锭。'],
        chapters: [
            illustrated('矿物的来源', item('eno_ex_ironbroken_0'), FIG.ore, ['筛沙砾 → 破碎矿石', '筛沙子 → 矿石碎块', '筛尘土 → 矿石粉末', '各 4 个合成一块', '矿石沙砾 / 沙子 / 尘土。', '锤矿石沙砾 → 矿石碎块', '锤矿石沙子 → 矿石粉末', '（锤一块得 4–7 个）', '铜、铁、金都有，', '铜最多，金最少。']),
            craft('矿石沙砾的合成', ui('iron_gravel'), ['nn', 'nn'], { n: item('eno_ex_ironbroken_0') }, ui('iron_gravel'),
                ['4 个破碎矿石 → 矿石沙砾', '矿石碎块、矿石粉末', '同样 4 个合成。', '也可以用矿石粉碎锤。']),
            gallery('熔炉配方', v('iron_ingot'), ['smelt_ore', 'smelt_other']),
            craft('半砖熔炉', ui('furnace_half'), ['aaa', 'a a', 'aaa'], { a: vb('stone_slab_top') }, ui('furnace_half'),
                ['8 个石台阶 → 半砖熔炉', '用法和原版熔炉一样，', '速度慢一半。']),
            illustrated('熔炉', ui('furnace'), FIG.furnace, ['手持半砖熔炉，潜行右键', '另一个半砖熔炉：', '两块合成一整块熔炉，', '里面的东西会保留。', '熔炉有上下两条熔炼线，', '共用一个燃料格，', '速度和原版熔炉一样。', '拆熔炉要用镐子敲。']),
            { name: '压缩方块', icon: ui('compressed_dirt'), lines: ['9 个方块合成压缩方块：', '圆石、石头、泥土、沙砾、', '沙子、尘土、燧石、地狱岩、', '末地石、下界沙砾、', '末地沙砾、黑曜石……', '压缩方块可以放进重型筛，', '或用锤子锤成 9 个下一级。'] },
        ],
    },
    // ======================== 植物与生物 ========================
    {
        id: 'life', title: '植物与生物', icon: item('eno_ex_seedsoak_0'),
        introLines: ['种子、蚕、诱饵和', '一些会"活动"的方块。'],
        chapters: [
            { name: '种子', icon: item('eno_ex_seedsoak_0'), lines: ['对着方块顶面右键种下：', '树种子 → 草方块 / 泥土上种树苗', '胡萝卜、马铃薯、竹子、', '  甜浆果种子 → 种在土上', '草种 → 泥土变草方块', '孢子 → 泥土、草方块变菌丝', '甘蔗种子 → 土或沙子上长甘蔗', '仙人掌种子 → 沙子上长仙人掌', '紫颂种子 → 末地石上长紫颂苗'] },
            illustrated('蚕与寄生树叶', item('eno_enr_silkworm_0'), FIG.infested, ['用钩子挖树叶偶尔得到蚕。', '手持蚕右键任意树叶，', '树叶会慢慢被寄生、变白，', '还会传染给周围的树叶。', '挖寄生树叶：', '  10% 掉 2 根线，', '  32.5% 掉 1 根线；', '用剪刀剪下得到它本身。', '线可以做线网。', '蚕放进熔炉烤熟能吃。']),
            { name: '诱饵的合成', icon: item('eno_bait_sheep_0'), lines: ['无序合成：', '羊诱饵：草种 + 小麦', '牛诱饵：2 个小麦', '猪诱饵：2 个胡萝卜', '鸡诱饵：2 个小麦种子', '狼诱饵：生牛肉 + 骨头', '豹猫诱饵：火药 + 生鳕鱼'] },
            { name: '诱饵的用法', icon: item('eno_bait_cow_0'), lines: ['手持诱饵右键方块顶面放下。', '以诱饵为中心 11×11×11 内', '要有至少 9 个草方块', '和 4 格静止的水，', '并且你要走到 5 格以外。', '条件满足后平均约 100 秒', '引来一只对应的动物，', '诱饵随之消失。'] },
            { name: '紫颂苗', icon: block('eno_enr_chorusSprout_3'), lines: ['紫颂种子种在末地石上，', '分 4 个阶段慢慢长大，', '可以用骨粉催熟。', '挖掉掉落紫颂种子。'] },
            { name: '灰烬', icon: item('eno_enr_ash_0'), lines: ['锤原木得到木屑，', '木屑放进熔炉烧成灰烬。', '灰烬的用途：', '  2 个灰烬代替骨粉做瓷土；', '  卤水里加灰烬沉淀粉盐；', '  1 个灰烬 + 1 份肉', '  → 2 个骨粉。'] },
            { name: '诅咒之土', icon: ui('cursed_earth'), lines: ['放在黑暗处（亮度 ≤ 4）', '约 500 秒后成熟，', '向周围的泥土、草方块蔓延，', '并定期生成僵尸、骷髅、', '苦力怕、蜘蛛、女巫、末影人。', '见光（亮度 ≥ 8）会退化成', '泥土，还可能着火。', '动物踩上去会招来闪电。', '精准采集才能拿回它本身。'] },
        ],
    },
    // ======================== 其他 ========================
    {
        id: 'others', title: '其他', icon: ui('end_cake'),
        introLines: ['末影蛋糕、方块破坏机，', '以及关于本模组的说明。'],
        chapters: [
            craft('末影蛋糕', ui('end_cake'), ['nnn', 'aba', 'nnn'], { n: v('ender_eye'), a: v('cake'), b: v('apple_golden') }, ui('end_cake'),
                ['末影之眼 ×6、蛋糕 ×2、', '金苹果 ×1。', '右键吃一口就去往末地，', '一共能吃 6 口。']),
            craft('方块破坏机', ui('breaker'), ['cac', 'aba', 'cac'], { a: COBBLE, b: v('iron_pickaxe'), c: v('redstone_dust') }, ui('breaker'),
                ['圆石 ×4、红石 ×4、铁镐 ×1。', '放下时正面朝向你，', '每 2.5 秒挖掉正面前方的', '一个方块，掉落同铁镐挖。']),
            illustrated('方块破坏机的工作', ui('breaker'), FIG.breaker, ['正面（有圆孔的一面）', '朝向要挖的方块。', '每 2.5 秒挖一次，', '掉落和用铁镐挖的一样，', '箱子会连同里面的东西', '一起掉出来。', '不挖空气、液体和基岩', '这类不可破坏的方块。']),
            { name: '关于本模组', icon: v('book_written'), lines: ['本模组移植自 InnerCore 的', '无中生有·起源 2.3.2，', '2.4 起重新设计了筛子、盐、铜', '（原作：Hunter(强颜欢笑)、', '  非凡、桃乐丝）。', '与原模组的差异见随附的', '《与原模组的差异》文档。'] },
        ],
    },
]
