// 指导书的翻页路由（照 Sapdon 示例 guidebook_demo 的 scripts/index.ts）：
//   INDEX（分类卡）→ CAT:<分类>|p<N>（词条列表）→ ENT:<分类>:<词条>|p<N>（内容页）
//   按钮槽位：[上一页, 首页, 下一页, 条目…]；用不存在的键占位就隐藏对应按钮
// 拿到方式：第一次进入世界时送一本；也可以用书 + 木板合成。
import { world, Player } from '@minecraft/server'
import { ActionFormData } from '@minecraft/server-ui'
import { ItemStack } from '@minecraft/server'
import { GUIDE, ILLUSTRATED_LINES } from '../data/guide.js'

const ITEM = 'eno:guide_book'
const TITLE = 'sapdon_ui:guide'
const PER_ROW = 8, PER_PAGE = 16, LINES_PER_PAGE = 10
const NO_PREV = 'no_prev', NO_HOME = 'no_home', NO_NEXT = 'no_next'

function openIndex(p: Player) {
    const form = new ActionFormData().title(TITLE).body('INDEX')
    form.button(NO_PREV); form.button(NO_HOME); form.button(NO_NEXT)
    GUIDE.forEach((_, i) => form.button(`idx${i}`))
    form.show(p).then((r) => {
        if (r.canceled || r.selection === undefined) return
        const i = r.selection - 3
        if (i >= 0 && i < GUIDE.length) openCat(p, i, 0); else openIndex(p)
    })
}
function openCat(p: Player, ci: number, page: number) {
    const c = GUIDE[ci], total = c.chapters.length
    const start = page === 0 ? 0 : PER_ROW + (page - 1) * PER_PAGE
    const end = Math.min(start + (page === 0 ? PER_ROW : PER_PAGE), total)
    const hasPrev = page > 0, hasNext = end < total
    const form = new ActionFormData().title(TITLE).body(`CAT:${c.id}|p${page}`)
    form.button(hasPrev ? 'prev_button' : NO_PREV); form.button('home_button'); form.button(hasNext ? 'next_button' : NO_NEXT)
    for (let i = start; i < end; i++) form.button(`${c.id}_e${i}`)
    form.show(p).then((r) => {
        if (r.canceled || r.selection === undefined) return
        const s = r.selection
        if (s === 0 && hasPrev) openCat(p, ci, page - 1)
        else if (s === 1) openIndex(p)
        else if (s === 2 && hasNext) openCat(p, ci, page + 1)
        else if (s >= 3 && start + s - 3 < total) openEnt(p, ci, start + s - 3, page, 0)
        else openCat(p, ci, page)
    })
}
function openEnt(p: Player, ci: number, gi: number, fromPage: number, ep: number) {
    const c = GUIDE[ci], ch = c.chapters[gi]
    // 合成页不分页；图文页右边每页 ILLUSTRATED_LINES 行；文本页每页 10 行
    const per = ch.pageType === 'illustrated' ? ILLUSTRATED_LINES : LINES_PER_PAGE
    // 配方图页：每页两格（配方图若干张 + 有说明文字时再占一格）
    const pages = ch.pageType === 'crafting' ? 1 : ch.pageType === 'gallery' ? Math.max(1, Math.ceil(((ch.sheets?.length ?? 0) + (ch.lines.length ? 1 : 0)) / 2)) : Math.max(1, Math.ceil(ch.lines.length / per))
    const hasNext = ep < pages - 1
    const form = new ActionFormData().title(TITLE).body(`ENT:${c.id}:${gi}|p${ep}`)
    form.button('prev_button'); form.button('home_button'); form.button(hasNext ? 'next_button' : NO_NEXT)
    form.show(p).then((r) => {
        if (r.canceled || r.selection === undefined) return
        const s = r.selection
        if (s === 0) { if (ep > 0) openEnt(p, ci, gi, fromPage, ep - 1); else openCat(p, ci, fromPage) }
        else if (s === 1) openIndex(p)
        else if (s === 2 && hasNext) openEnt(p, ci, gi, fromPage, ep + 1)
        else openEnt(p, ci, gi, fromPage, ep)
    })
}

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
    if (itemStack.typeId === ITEM && source instanceof Player) openIndex(source)
})
// 第一次进入世界送一本
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn || player.getDynamicProperty('eno:got_guide') === true) return
    player.setDynamicProperty('eno:got_guide', true)
    player.getComponent('minecraft:inventory')?.container?.addItem(new ItemStack(ITEM, 1))
})
