# 无中生有·起源 2.3.2 基岩版移植（Sapdon）

给玩家看的改动说明见 `与原模组的差异.md`。

## 构建

完整步骤见 **`编译教程.md`**。简要：

```bash
npm install          # 安装依赖（Sapdon 3.7.0 来自 npm），会自动执行 sapdon lib
npm run release      # 构建 + 测试 + 打包 → dev/eno-port.mcaddon
```

项目是完整的：贴图、语言文件、音效都在 `res/` 里，不依赖原模组文件，也没有构建前置步骤。

## 目录

| 路径 | 内容 |
|---|---|
| `main.ts` | 构建入口：按顺序载入内容定义，最后写出创造分组与方块音效 |
| `src-build/api.ts` | 构建期 API：`item` / `food` / `hammer` / `crook` / `mesh` / `animatedItem` / `block` / `shaped` / `shapeless` / `furnace` / `creativeGroup` |
| `src-build/content/items.ts` | 全部物品，一行一个（行末注释是原模组 ID 与英文名） |
| `src-build/content/blocks.ts` | 全部静态方块 |
| `src-build/content/sieves.ts` | 筛子：两组网与可筛方块、12 个筛子方块 |
| `src-build/content/barrels.ts` | 木桶 23 种 |
| `src-build/content/crucibles.ts` | 生坩埚、坩埚、木坩埚 6 种 |
| `src-build/content/baits.ts` | 诱饵放在地上后的方块 |
| `src-build/content/misc.ts` | 诅咒之土、末影蛋糕、紫颂苗、方块破坏机 |
| `src-build/content/furnace.ts` | 半砖熔炉（Sapdon `createTileBlock` + `ContainerUISystem`） |
| `src-build/content/recipes.ts` | 全部配方；注释掉的是机器类配方（对应方块尚未实现） |
| `src-build/content/groups.ts` | 创造模式分组 |
| `src-build/sieve.ts`、`barrel.ts`、`crucible.ts`、`geometry.ts`、`renderControllers.ts` | 机器的模型与渲染（木桶、坩埚的内容物由实体显示） |
| `scripts/mechanics/` | 运行期机制：筛子、木桶、坩埚、陶瓷桶、种子、诱饵、诅咒之土、末影蛋糕、紫颂苗、半砖熔炉与熔炉、方块破坏机、矿石粉碎锤、指导书、锤子、钩子、蚕与寄生树叶、工具耐久 |
| `scripts/data/` | 运行期数据：锤子转换表（`transformation(...)`）、筛子掉落（`addSieved(...)`）、木桶堆肥与液体配方（`compost(...)`、`liquidRecipe(...)`）、坩埚（`meltable(...)`、`heat(...)`、`oakInput(...)`）、熔炉配方与燃料（`smelt(...)`、`fuel(...)`）、提示行数 |
| `scripts/lib/` | 与引擎无关的规则（纯函数，有单元测试） |
| `res/` | 贴图（`textures/items/eno`、`textures/blocks/eno`）、语言文件（`texts/*.lang`，简体中文与英文）、音效 |
| `tests/` | 单元测试 |
| `src-build/guide.ts`、`scripts/data/guide.ts`、`scripts/mechanics/guide.ts` | 指导书（Sapdon `SapdonGuideBook`）：界面、内容、翻页路由 |
| `tools/render-icons.mjs`、`tools/render_guide.py` | 指导书的立体图标与插图 / 动画生成器（产物已提交在 `res/textures/ui/eno_guide/`；插图里的原版方块与物品贴图取自 Mojang 的 bedrock-samples，缓存在 `tools/vanilla/`） |
| `tools/gen_sieve_comp.mjs` | 筛子补偿系数生成器（改了筛子掉落表或网的倍率后运行，输出 `scripts/data/sieveComp.ts`） |
| `tools/verify.mjs` | 自动验收：检查构建产物的翻译、贴图、音效、配方引用、模型 UV 等 |

内容的写法对应原模组：`item(...)` ≈ `Item.createItem`，`hammer(...)` ≈ `ToolAPI.setTool`，`block(...)` ≈ `Block.createBlock`，`shaped(...)` ≈ `Recipes.addShaped`，`addSieved(...)` ≈ `Sieve.addSieved`，`transformation(...)` ≈ `EXCore.transformation`。

## 目标版本

基岩版 1.26.50 及以上（`@minecraft/server` 2.10.0、`@minecraft/server-ui` 2.2.0），不需要实验开关。

## 状态（2.3.2 正式版）

- 已实现：全部物品、静态方块、可用配方、创造分组、筛子 12 种、木桶 23 种（堆肥、液体、桶内配方、下雨积水；暂缺漏斗）、坩埚与木坩埚（暂缺漏斗）、陶瓷桶、种子、诱饵、诅咒之土、末影蛋糕、紫颂苗、半砖熔炉与熔炉、方块破坏机、矿石粉碎锤、指导书、锤子、钩子、蚕与寄生树叶、工具耐久、蚕的动态图标、进入世界提示。
- 矿砾 / 矿砂 / 矿尘在原模组里有重力；基岩版暂时做成普通方块。等 26.60 正式发布、`onNeighborChanged` 转为稳定接口后再做（之前验证过的方案：引擎通知下方变空 → 遮挡 2 tick → 用结构文件放出原版下落方块）。
- 未实现（作者决定暂不做）：蒸发皿（原模组无合成配方）、世界核心与破碎维度（含压缩黑曜石传送门）、漏斗与自动化、六种自动机器（Compressum/Machine）。ProjectE / IC2 / Forestry 兼容模块依赖其他 InnerCore 模组，不适用。

## Sapdon 与原版能力的分工

能用 Sapdon 的都用 Sapdon：物品、方块、配方、创造分组、方块模型、动态图标用 `@sapdon/core`；方块 / 物品自定义组件用 `@sapdon/runtime` 的 `registerBlockComponent` / `registerItemComponent`。

Sapdon 没有的才直接用原版：战利品表、`blocks.json` 音效、方块动态属性、世界事件（破坏 / 实体生成）。

### 发现的 Sapdon 问题（项目里已绕过，待反馈）

- `AddonRenderController.registerTexturesArray` 把 arrays 的嵌套写反了，产物渲染控制器无效；序列化会丢掉 `part_visibility`。项目改为自己写渲染控制器（`src-build/renderControllers.ts`）。
- `EntityComponent.setDamageSensor` 不写 `cause`。
- `BasicEntity.addComponentGroup` / `addEvent` 要求传 Map，但序列化时内层 Map 变成 `{}`。
- `BlockModel` 不支持按面指定 `material_instance`。
- `registerBuiltinComponents()` 一次注册全部内置组件，项目没用到的会各在内容日志报一条"未被使用"的警告（来自 Sapdon，保留）。
- `registerBlockComponent` 的已知事件表里没有 `onNeighborChanged`（26.60 新增）。
- OC 组件（`@EntitySpawned` + `BaseComponent.onTick`）在 26.50 真机上没有被调度执行，原因待查。
- 内置 `sapdon:fallingblock` 是调试半成品；内置 `crop` 生长没有上限检查。
- 没有 lang、`sound_definitions.json`、战利品表、NBT 结构文件的生成能力。
