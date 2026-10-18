// INF-14 进入世界时的 5 条提示（原版在 toast 界面出现时发送）
import { world, RawMessage } from '@minecraft/server'
import { WELCOME_LINES } from './data/welcome.js'

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn) return
    WELCOME_LINES.forEach((lineCount, i) => {
        const rawtext: RawMessage[] = []
        for (let j = 1; j <= lineCount; j++) {
            if (j > 1) rawtext.push({ text: '\n' })
            rawtext.push({ translate: `eno.welcome.${i + 1}.${j}` })
        }
        player.sendMessage({ rawtext })
    })
})
