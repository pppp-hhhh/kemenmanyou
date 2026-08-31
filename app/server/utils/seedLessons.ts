// 内置课文种子逻辑：将公版课文（内置库）以幂等方式导入本地 JSON 后端。
// 仅通过 local-db.ts 的 addLesson() 写入，绝不直接触碰 data/app.db.json。
import { addLesson, getLessons } from '~~/server/utils/local-db'
import { builtinLessons } from '~~/server/data/builtinLessons'

export interface SeedResult {
  inserted: number
  skipped: number
}

/**
 * 幂等导入内置课文。
 * - 以 title 作为去重标记，仅当库中（未被软删除）不存在同名课文时才插入。
 * - 每次调用返回 { inserted, skipped }，重复调用不会产生重复课文。
 * - 尊重软删除与自增计数器：addLesson() 内部经由事务锁 + next_ids.lessons 自增落盘。
 */
export async function seedBuiltinLessons(): Promise<SeedResult> {
  const existing = getLessons()
  const existingTitles = new Set(existing.map((l) => l.title))
  let inserted = 0
  let skipped = 0
  for (const lesson of builtinLessons) {
    if (existingTitles.has(lesson.title)) {
      skipped++
      continue
    }
    // grade/source 采用 `?? null` 之外的显式值；若缺失将按 null 处理。
    await addLesson(lesson.title, lesson.content, lesson.grade, lesson.source)
    inserted++
    // 首次插入后无法立刻在内存里反映到 getLessons()（其每次重新 load），
    // 但 title 标记已加入集合，避免同一批内重复插入同名项。
    existingTitles.add(lesson.title)
  }
  return { inserted, skipped }
}
