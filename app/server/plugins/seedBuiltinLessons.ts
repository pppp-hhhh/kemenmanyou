// Nitro 启动插件：在服务启动时幂等导入内置课文，保证首次运行即存在于课文库。
// 通过 seedBuiltinLessons()（内部走 local-db 的 addLesson）写入，不直接改 data/app.db.json。
import { seedBuiltinLessons } from '~~/server/utils/seedLessons'

export default defineNitroPlugin(async () => {
  try {
    const { inserted, skipped } = await seedBuiltinLessons()
    if (inserted > 0) {
      console.log(`[seed-builtin-lessons] 已导入 ${inserted} 篇内置课文，跳过 ${skipped} 篇`)
    } else {
      console.log(`[seed-builtin-lessons] 无新增内置课文（已存在 ${skipped} 篇）`)
    }
  } catch (e) {
    // 种子失败不应阻断服务启动，记录即可。
    console.error('[seed-builtin-lessons] 内置课文导入失败：', e)
  }
})
