// 指导书：Sapdon 的手册系统（SapdonGuideBook，示例 guidebook_demo）生成界面；内容在 scripts/data/guide.ts
// 在 Sapdon 的四种页型（文本 / 合成 / 聚焦 / 图片）之外加了一种"图文页"（illustrated）：
//   左页 = 标题 + 插图（可以是逐帧动画），右页 = 文字（每页 6 行，超出自动分页）。
//   插图由 tools/render_guide.py 生成（res/textures/ui/eno_guide/fig_*.png，多帧竖着拼成长图），
//   动画：每帧一张图片叠在一起，用 JSON UI 的透明度动画（alpha）轮流显示，循环播放。
// 还有一种"配方图页"（gallery）：把一类配方画成 JEI 风格的图（tools/render_jei.py 生成）。
import { SapdonGuideBook, ItemAPI, ItemCategory, ItemComponent, ItemTextureManager, GRegistry, Panel, StackPanel, Label, Text, Image, Sprite, Layout, Control, UIElement } from '@sapdon/core'
import { GUIDE, FIG_W, FIG_H, ILLUSTRATED_LINES } from '../scripts/data/guide.js'
import { registered, shapeless, tag } from './api.js'

export const GUIDE_ITEM = 'eno:guide_book'
const NS = 'eno_guide'   // 手册界面文件的命名空间（= SapdonGuideBook 标识符 eno:guide → eno_guide）

// ---- 图文页：替换 SapdonGuideBook 的词条页生成，只接管 illustrated，其他页型交回 Sapdon ----
const proto = SapdonGuideBook.prototype as any
const sapdonEntPages = proto.entPages
proto.entPages = function (this: any, c: any, gi: number) {
    const ch = c.chapters[gi]
    if (ch.pageType === 'gallery') return galleryPages.call(this, c, gi)
    if (ch.pageType !== 'illustrated') return sapdonEntPages.call(this, c, gi)
    const pageCount = Math.max(1, Math.ceil(ch.lines.length / ILLUSTRATED_LINES))
    const pages: any[] = []
    for (let ep = 0; ep < pageCount; ep++) {
        const id = `${c.id}_${gi}_p${ep}`
        const page = new Panel(`ent_${id}`).setLayout(new Layout().setSize(['95%', '90%'])).setControl(new Control().setLayer(5))
        this.gateLayout(page, `ENT:${c.id}:${gi}|p${ep}`)
        const spread = new StackPanel(`ent_spread_${id}`, undefined).setOrientation('horizontal').setLayout(new Layout().setSize(['100%', '100%']))
        // 左页：空白 5 / 标题 10 / 分割线 5 / 插图 75
        const left = new StackPanel(`ent_left_${id}`, undefined).setOrientation('vertical').setLayout(new Layout().setSize(['100%', '100%']))
        left.addStack(['100%', '5%'], new Panel(`ent_sp1_${id}`))
        left.addStack(['100%', '10%'], new Label(`ent_title_${id}`, undefined).setText(new Text().setText(ch.name).setColor([0, 0, 0]).setTextAlignment('center')))
        left.addStack(['100%', '5%'], new UIElement(`ent_div_${id}`, undefined, 'settings_common.option_group_section_divider'))
        // 插图区：固定 144×96（帧的 3:2 比例）。0.15 版的问题：keep_ratio 按整张竖长图算比例 → 细长条；
        // 改成"%x"后在真机上更窄；flip_book 挂在 uv 上不播放，只显示第一帧。
        // 现在每一帧都是一张单独的图片（静态 uv 取各自那一帧——这在真机上是好的），叠在一起，
        // 用透明度动画轮流显示：第 i 帧先隐藏 i 帧时长、显示 1 帧时长、再隐藏到一轮结束，循环。
        const img = new Panel(`ent_fig_${id}`).setLayout(new Layout().setSize([144, 96]).setAnchorTo('center'))
        const n = ch.figure.frames
        for (let f = 0; f < n; f++) {
            const frame = new Image(`ent_fig_${id}_f${f}`, undefined)
                .setSprite(new Sprite().setTexture(`textures/ui/eno_guide/fig_${ch.figure.name}`).setUV([0, f * FIG_H]).setUVSize([FIG_W, FIG_H]))
                .setLayout(new Layout().setSize(['100%', '100%']))
            if (n > 1) frame.setControl(new Control().setAlpha(f === 0 ? 1 : 0).setAnimations([`@${NS}.fig_${ch.figure.name}_${f}_a`]))
            img.addControl(frame)
        }
        left.addStack(['100%', '75%'], img)
        // 右页：空白 5 / 文字每行 14
        const right = new StackPanel(`ent_right_${id}`, undefined).setOrientation('vertical').setLayout(new Layout().setSize(['100%', '100%']))
        right.addStack(['100%', '5%'], new Panel(`ent_sp2_${id}`))
        for (let i = ep * ILLUSTRATED_LINES; i < Math.min((ep + 1) * ILLUSTRATED_LINES, ch.lines.length); i++) {
            right.addStack(['100%', '14%'], new Label(`ent_line_${id}_${i}`, undefined).setText(new Text().setText(ch.lines[i]).setColor([0, 0, 0]).setTextAlignment('left')))
        }
        spread.addStack(['50%', '100%'], left)
        spread.addStack(['50%', '100%'], right)
        page.addControl(spread)
        pages.push(page)
    }
    return pages
}

// ---- 配方图页（gallery）：像 PC 版 JEI 那样把一类配方画成图（tools/render_jei.py 生成 jei_*.png，288×288）----
// 每页两格：左格在标题下面，右格占整个右半页；一格放一张配方图，最后若还有说明文字，就放在最后一格里。
function galleryPages(this: any, c: any, gi: number) {
    const ch = c.chapters[gi]
    const cells: ({ sheet: string } | { lines: string[] })[] = ch.sheets.map((sheet: string) => ({ sheet }))
    if (ch.lines.length) cells.push({ lines: ch.lines })
    const pages: any[] = []
    for (let ep = 0; ep * 2 < cells.length; ep++) {
        const id = `${c.id}_${gi}_p${ep}`
        const page = new Panel(`ent_${id}`).setLayout(new Layout().setSize(['95%', '90%'])).setControl(new Control().setLayer(5))
        this.gateLayout(page, `ENT:${c.id}:${gi}|p${ep}`)
        const spread = new StackPanel(`ent_spread_${id}`, undefined).setOrientation('horizontal').setLayout(new Layout().setSize(['100%', '100%']))
        const left = new StackPanel(`ent_left_${id}`, undefined).setOrientation('vertical').setLayout(new Layout().setSize(['100%', '100%']))
        left.addStack(['100%', '3%'], new Panel(`ent_sp1_${id}`))
        left.addStack(['100%', '9%'], new Label(`ent_title_${id}`, undefined).setText(new Text().setText(ch.name).setColor([0, 0, 0]).setTextAlignment('center')))
        const right = new StackPanel(`ent_right_${id}`, undefined).setOrientation('vertical').setLayout(new Layout().setSize(['100%', '100%']))
        right.addStack(['100%', '6%'], new Panel(`ent_sp2_${id}`))
        const fill = (col: any, cell: any, k: string) => {
            if (!cell) return
            if ('sheet' in cell) {
                col.addStack(['100%', '86%'], new Panel(`ent_jeibox_${id}_${k}`).setLayout(new Layout().setSize(['100%', '100%']))
                    .addControl(new Image(`ent_jei_${id}_${k}`, undefined).setSprite(new Sprite().setTexture(`textures/ui/eno_guide/jei_${cell.sheet}`))
                        .setLayout(new Layout().setSize([144, 144]).setAnchorTo('top_middle').setAnchorFrom('top_middle'))))
            } else cell.lines.forEach((ln: string, i: number) => col.addStack(['100%', '13%'],
                new Label(`ent_line_${id}_${k}_${i}`, undefined).setText(new Text().setText(ln).setColor([0, 0, 0]).setTextAlignment('left'))))
        }
        fill(left, cells[ep * 2], 'l')
        fill(right, cells[ep * 2 + 1], 'r')
        spread.addStack(['50%', '100%'], left)
        spread.addStack(['50%', '100%'], right)
        page.addControl(spread)
        pages.push(page)
    }
    return pages
}

// ---- 逐帧动画：把透明度动画定义追加到手册的界面文件里（Sapdon 的界面系统没有写动画定义的接口）----
function injectAnimations() {
    const anims: Record<string, any> = {}
    const hold = (alpha: number, duration: number, next: string) => ({ anim_type: 'alpha', from: alpha, to: alpha, duration, next: `@${NS}.${next}` })
    for (const c of GUIDE) for (const ch of c.chapters) if (ch.figure && ch.figure.frames > 1) {
        const { name, frames: n, fps } = ch.figure, dt = 1 / fps
        for (let f = 0; f < n; f++) {
            const k = `fig_${name}_${f}`
            // 一轮 = n 帧时长：前 f 帧隐藏 → 显示 1 帧 → 剩下的隐藏 → 回到开头（没有时长为 0 的段）
            const segs: [number, number][] = []
            if (f > 0) segs.push([0, f * dt])
            segs.push([1, dt])
            if (n - 1 - f > 0) segs.push([0, (n - 1 - f) * dt])
            segs.forEach(([a, d], i) => { anims[`${k}_${'abc'[i]}`] = hold(a, Math.round(d * 1000) / 1000, `${k}_${'abc'[(i + 1) % segs.length]}`) })
        }
    }
    const register = GRegistry.register
    GRegistry.register = function (name: string, root: string, path: string, data: any) {
        if (root === 'resource' && path === 'ui/' && name === NS) {
            const inner = data
            data = { toObject: () => ({ ...(typeof inner.toObject === 'function' ? inner.toObject() : inner), ...anims }) }
        }
        return register.call(GRegistry, name, root, path, data)
    }
}

export function registerGuide() {
    injectAnimations()
    new SapdonGuideBook('eno:guide', [320, 207]).build(GUIDE as any)
    ItemTextureManager.registerTexture('eno_guide_book', 'textures/items/book_written')   // 借用原版成书的图标
    ItemAPI.createItem(GUIDE_ITEM, ItemCategory.Items, 'eno_guide_book', {} as any).addComponent(ItemComponent.combineComponents(ItemComponent.setMaxStackSize(1)))
    registered.add(GUIDE_ITEM)
    shapeless(GUIDE_ITEM, 1, ['minecraft:book', tag('minecraft:planks')])   // 书 + 任意木板
}
