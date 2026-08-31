// 本地 JSON 文件数据库（过渡期替代 Supabase；回迁云端参考 init_supabase.sql）
// 库文件：项目根目录 ./data/app.db.json（Git 忽略 data/）
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

interface BaseDoc { created_at: string; updated_at: string; deleted_at?: string | null }
export interface UserDoc extends BaseDoc {
  id: string; email: string; display_name?: string | null; avatar_url?: string | null
  password_hash?: string; password_salt?: string
  role: 'user' | 'admin'; status: 'active' | 'banned'
  last_login_at?: string | null; work_count?: number
}
export interface LessonDoc extends BaseDoc { id: number; title: string; content: string; grade?: string | null; source?: string | null }
export interface WorkDoc extends BaseDoc {
  id: number; title: string; custom_title?: string; custom_content?: string
  thumbnail?: string; style: string; is_public: boolean
  review_status: 'pending' | 'approved' | 'rejected'
  author_id: string; author_name?: string; tags?: string; view_count: number; text_id?: number
}
export interface WorkImageDoc extends BaseDoc { id: number; work_id: number; index: number; url: string }
// WorkSceneDoc 扩展分镜结构（真漫画）：panels/page 为可选字段，旧行零改动可读
export interface WorkSceneDoc extends BaseDoc {
  id: number; work_id: number; index: number; description_cn: string; prompt_en: string
  panels?: any[] | null
  page?: any | null
}
export interface AuditLogDoc extends BaseDoc {
  id: number; admin_id?: string; action: string; target_type: string
  target_id?: number | null; detail?: any
}
// 浏览历史：每用户每作品一行 upsert 去重；不设 deleted_at，清空=物理删除（不入 Doc 联合类型）
export interface ViewHistoryDoc {
  id: number; user_id: string; work_id: number
  first_viewed_at: string; last_viewed_at: string; times: number
  work_title: string; thumbnail: string | null
  created_at: string; updated_at: string
}
export type Doc = UserDoc | LessonDoc | WorkDoc | WorkImageDoc | WorkSceneDoc | AuditLogDoc
interface DB {
  users: UserDoc[]; lessons: LessonDoc[]; works: WorkDoc[]
  work_images: WorkImageDoc[]; work_scenes: WorkSceneDoc[]; audit_logs: AuditLogDoc[]
  view_histories: ViewHistoryDoc[]
  next_ids: Record<string, number>
}
const DB_DIR = path.resolve(process.cwd(), '..', 'data')
const DB_FILE = path.join(DB_DIR, 'app.db.json')
let _lock: Promise<any> = Promise.resolve()
const EMPTY: DB = {
  users: [], lessons: [], works: [], work_images: [], work_scenes: [], audit_logs: [],
  view_histories: [],
  next_ids: { lessons: 1, works: 1, work_images: 1, work_scenes: 1, audit_logs: 1, view_histories: 1 },
}
function load(): DB {
  try {
    if (!fs.existsSync(DB_FILE)) return clone(EMPTY)
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as DB
    // 修复：原写法 !(k as string) in db 因优先级变成 (!(k)) in db，回填条件恒为 false（旧库缺键永不补齐）；现对整个 in 表达式取反
    for (const k of Object.keys(EMPTY as any)) { if (!((k as string) in db)) (db as any)[k] = clone((EMPTY as any)[k]) }
    return db
  } catch { return clone(EMPTY) }
}
function save(db: DB) {
  fs.mkdirSync(DB_DIR, { recursive: true })
  const tmp = DB_FILE + '.' + crypto.randomBytes(4).readUInt32BE(0).toString(16) + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, DB_FILE)
}
function clone<T>(o: T): T { return JSON.parse(JSON.stringify(o)) }
export function nowISO() { return new Date().toISOString() }
export async function tx<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const p = _lock.then(async () => { const db = load(); const r = await (fn(db) as any); save(db); return r })
  _lock = p.catch(() => {})
  return await p
}
export function where<T extends Doc>(docs: T[], cond: (d: T) => boolean): T[] { return docs.filter(d => !d.deleted_at && cond(d)) }
export function count<T extends Doc>(docs: T[]): number { return docs.filter(d => !d.deleted_at).length }
export function countIf<T extends Doc>(docs: T[], cond: (d: T) => boolean): number { return docs.filter(d => !d.deleted_at && cond(d)).length }
export function orderBy<T extends Doc>(docs: T[], field: keyof T, desc = true): T[] {
  return [...docs].sort((a, b) => { const va = (a[field] as any) || '', vb = (b[field] as any) || ''; const c = String(va).localeCompare(String(vb)); return desc ? -c : c })
}
export function findUserByEmail(email: string): UserDoc | undefined { return load().users.find(u => !u.deleted_at && u.email === email) }
export function findUserById(id: string): UserDoc | undefined { return load().users.find(u => !u.deleted_at && u.id === id) }
export async function createUser({ email, display_name, avatar_url, password_hash, password_salt }: {
  email: string; display_name?: string; avatar_url?: string; password_hash?: string; password_salt?: string
}): Promise<UserDoc> {
  return await tx(db => {
    const now = nowISO()
    const u: UserDoc = {
      id: crypto.randomUUID(), email, display_name: display_name || null, avatar_url: avatar_url || null,
      password_hash, password_salt, role: 'user', status: 'active', work_count: 0,
      created_at: now, updated_at: now, deleted_at: null
    }
    db.users.push(u)
    return u
  })
}
export async function patchUser(id: string, patch: Partial<Pick<UserDoc, 'display_name' | 'avatar_url' | 'last_login_at' | 'status' | 'role'>>): Promise<UserDoc | null> {
  return await tx(db => {
    const u = db.users.find(x => x.id === id && !x.deleted_at)
    if (!u) return null
    for (const k of ['display_name','avatar_url','last_login_at','status','role'] as const) { if (patch[k] !== undefined) (u as any)[k] = patch[k] }
    u.updated_at = nowISO()
    return u
  })
}
export async function addLesson(title: string, content: string, grade?: string | null, source?: string | null): Promise<LessonDoc> {
  return await tx(db => { const id = db.next_ids.lessons++; const now = nowISO(); const l: LessonDoc = { id, title, content, grade: grade ?? null, source: source ?? null, created_at: now, updated_at: now, deleted_at: null }; db.lessons.push(l); return l })
}
export async function updateLesson(id: number, patch: { title?: string; content?: string; grade?: string | null; source?: string | null }): Promise<LessonDoc | null> {
  return await tx(db => { const l = db.lessons.find(x => x.id === id && !x.deleted_at); if (!l) return null; if (patch.title !== undefined) l.title = patch.title; if (patch.content !== undefined) l.content = patch.content; if (patch.grade !== undefined) l.grade = patch.grade; if (patch.source !== undefined) l.source = patch.source; l.updated_at = nowISO(); return l })
}
export async function softDeleteLesson(id: number): Promise<boolean> { return await tx(db => { const l = db.lessons.find(x => x.id === id && !x.deleted_at); if (!l) return false; l.deleted_at = nowISO(); return true }) }
export async function addWork(doc: Omit<WorkDoc, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'review_status' | 'view_count'>): Promise<WorkDoc> {
  return await tx(db => {
    const id = db.next_ids.works++; const now = nowISO()
    const w: WorkDoc = { id, ...doc, review_status: 'pending', view_count: 0, created_at: now, updated_at: now, deleted_at: null }
    db.works.push(w)
    const author = db.users.find(u => u.id === doc.author_id)
    if (author) { author.work_count = (author.work_count || 0) + 1; author.updated_at = now }
    return w
  })
}
export async function getWork(id: number): Promise<WorkDoc | null> { return await tx(db => db.works.find(w => w.id === id && !w.deleted_at) || null) }
export async function updateWork(id: number, patch: Partial<Pick<WorkDoc, 'title' | 'custom_title' | 'custom_content' | 'thumbnail' | 'style' | 'tags' | 'is_public'>>): Promise<WorkDoc | null> {
  return await tx(db => { const w = db.works.find(x => x.id === id && !x.deleted_at); if (!w) return null; for (const k of ['title','custom_title','custom_content','thumbnail','style','tags','is_public'] as const) { if (patch[k] !== undefined) (w as any)[k] = patch[k] }; w.updated_at = nowISO(); return w })
}
export async function softDeleteWork(id: number): Promise<boolean> { return await tx(db => { const w = db.works.find(x => x.id === id && !x.deleted_at); if (!w) return false; w.deleted_at = nowISO(); return true }) }
export async function updateWorkStatus(id: number, status: 'approved' | 'rejected'): Promise<WorkDoc | null> { return await tx(db => { const w = db.works.find(x => x.id === id && !x.deleted_at); if (!w) return null; w.review_status = status; w.updated_at = nowISO(); return w }) }
export async function incrementWorkView(id: number): Promise<number | null> { return await tx(db => { const w = db.works.find(x => x.id === id && !x.deleted_at); if (!w) return null; w.view_count = (w.view_count || 0) + 1; return w.view_count }) }

// —— 浏览历史（每用户每作品一行 upsert 去重；30 分钟幂等窗口）——
const VIEW_IDEMPOTENT_MS = 30 * 60 * 1000
// 兼容旧库文件：缺 view_histories 集合或计数器时就地补齐（首次写回即完成迁移）
function healViewHistories(db: DB) {
  if (!Array.isArray(db.view_histories)) db.view_histories = []
  if (!Number.isFinite(Number(db.next_ids.view_histories)) || Number(db.next_ids.view_histories) < 1) db.next_ids.view_histories = 1
}
export async function recordWorkView(userId: string, workId: number): Promise<{ viewCount: number; recorded: boolean }> {
  return await tx<{ viewCount: number; recorded: boolean }>(db => {
    const w = db.works.find(x => x.id === workId && !x.deleted_at)
    if (!w) return { viewCount: 0, recorded: false } // 作品不存在或已软删：不记录
    healViewHistories(db)
    let nextId = Number(db.next_ids.view_histories)
    const now = nowISO()
    let row = db.view_histories.find(v => v.user_id === userId && v.work_id === workId)
    if (row && Date.now() - new Date(row.last_viewed_at).getTime() < VIEW_IDEMPOTENT_MS) {
      row.last_viewed_at = now; row.updated_at = now // 幂等窗口内重复浏览：仅刷新时间，不计次不加浏览量
      return { viewCount: w.view_count || 0, recorded: false }
    }
    if (!row) { // 首次浏览：建行并快照标题/封面
      row = { id: nextId++, user_id: userId, work_id: workId, first_viewed_at: now, last_viewed_at: now, times: 0, work_title: w.title, thumbnail: w.thumbnail ?? null, created_at: now, updated_at: now }
      db.view_histories.push(row)
      db.next_ids.view_histories = nextId
    }
    row.times += 1; row.last_viewed_at = now; row.updated_at = now
    w.view_count = (w.view_count || 0) + 1 // 双轨同事务：历史 times 与 works.view_count 同步自增
    return { viewCount: w.view_count, recorded: true }
  })
}
export interface ViewHistoryItem { workId: number; workTitle: string; thumbnail: string | null; lastViewedAt: string; firstViewedAt: string; times: number }
export function getViewHistory(userId: string, page = 1, pageSize = 20): { items: ViewHistoryItem[]; total: number; page: number; pageSize: number } {
  if (!Number.isFinite(page) || page < 1) page = 1
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 20
  const list = (load().view_histories || []).filter(v => v.user_id === userId).sort((a, b) => b.last_viewed_at.localeCompare(a.last_viewed_at))
  const total = list.length; const offset = (page - 1) * pageSize
  const items: ViewHistoryItem[] = list.slice(offset, offset + pageSize).map(v => ({ workId: v.work_id, workTitle: v.work_title, thumbnail: v.thumbnail, lastViewedAt: v.last_viewed_at, firstViewedAt: v.first_viewed_at, times: v.times }))
  return { items, total, page, pageSize }
}
export async function clearViewHistory(userId: string, workIds?: number[]): Promise<number> {
  return await tx<number>(db => {
    healViewHistories(db)
    // workIds 缺省=清空该用户全部；显式数组（可为空）=仅物理删除指定作品的记录
    const ids = Array.isArray(workIds) ? new Set(workIds.map(Number).filter(n => Number.isFinite(n))) : null
    const before = db.view_histories.length
    db.view_histories = db.view_histories.filter(v => !(v.user_id === userId && (!ids || ids.has(v.work_id))))
    return before - db.view_histories.length
  })
}
export async function batchAddWorkAssets(work_id: number, images: { index: number; url: string }[], scenes: { index: number; description_cn: string; prompt_en: string; panels?: any[] | null; page?: any | null }[]): Promise<void> {
  await tx(db => {
    const now = nowISO()
    for (const img of images) { const id = db.next_ids.work_images++; db.work_images.push({ id, work_id, ...img, created_at: now, updated_at: now, deleted_at: null }) }
    for (const sc of scenes) { const id = db.next_ids.work_scenes++; db.work_scenes.push({ id, work_id, ...sc, created_at: now, updated_at: now, deleted_at: null }) }
  })
}
export async function addAuditLog(doc: Omit<AuditLogDoc, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<void> {
  await tx(db => { const id = db.next_ids.audit_logs++; const now = nowISO(); db.audit_logs.push({ id, ...doc, created_at: now, updated_at: now, deleted_at: null }) })
}
export function getUsers(page = 1, pageSize = 20, status?: string, search?: string): { data: UserDoc[]; total: number } {
  let list = load().users.filter(u => !u.deleted_at)
  if (status && status !== 'all') list = list.filter(u => u.status === status)
  if (search) { const q = search.toLowerCase(); list = list.filter(u => u.email.toLowerCase().includes(q) || (u.display_name || '').toLowerCase().includes(q)) }
  list = orderBy(list, 'created_at', true); const total = list.length; const offset = (page - 1) * pageSize
  return { data: list.slice(offset, offset + pageSize), total }
}
export function getLessons(): LessonDoc[] { return orderBy(load().lessons.filter(l => !l.deleted_at), 'created_at', true) }
export function getPublicWorks(page = 1, pageSize = 20): { data: WorkDoc[]; total: number } {
  const list = orderBy(load().works.filter(w => !w.deleted_at && w.is_public && w.review_status === 'approved'), 'view_count', true)
  const total = list.length; const offset = (page - 1) * pageSize
  return { data: list.slice(offset, offset + pageSize), total }
}
export function getMyWorks(userId: string, page = 1, pageSize = 20): { data: WorkDoc[]; total: number } {
  const list = orderBy(load().works.filter(w => !w.deleted_at && w.author_id === userId), 'created_at', true)
  const total = list.length; const offset = (page - 1) * pageSize
  return { data: list.slice(offset, offset + pageSize), total }
}
export function getAllWorks(page = 1, pageSize = 20): { data: WorkDoc[]; total: number } {
  const list = orderBy(load().works.filter(w => !w.deleted_at), 'created_at', true)
  const total = list.length; const offset = (page - 1) * pageSize
  return { data: list.slice(offset, offset + pageSize), total }
}
export function getWorksFilter(page = 1, pageSize = 20, reviewStatus?: string, search?: string): { data: WorkDoc[]; total: number } {
  let list = load().works.filter(w => !w.deleted_at)
  if (reviewStatus && reviewStatus !== 'all') list = list.filter(w => w.review_status === reviewStatus)
  if (search) { const q = search.toLowerCase(); list = list.filter(w => w.title.toLowerCase().includes(q)) }
  list = orderBy(list, 'created_at', true); const total = list.length; const offset = (page - 1) * pageSize
  return { data: list.slice(offset, offset + pageSize), total }
}
export function getWorkAssets(workId: number): { images: WorkImageDoc[]; scenes: WorkSceneDoc[] } {
  const db = load()
  return { images: db.work_images.filter(x => x.work_id === workId && !x.deleted_at).sort((a, b) => a.index - b.index), scenes: db.work_scenes.filter(x => x.work_id === workId && !x.deleted_at).sort((a, b) => a.index - b.index) }
}
export function getAuditLogs(page = 1, pageSize = 20, action?: string): { data: AuditLogDoc[]; total: number } {
  let list = load().audit_logs.filter(a => !a.deleted_at)
  if (action && action !== 'all') list = list.filter(a => a.action === action)
  list = orderBy(list, 'created_at', true); const total = list.length; const offset = (page - 1) * pageSize
  return { data: list.slice(offset, offset + pageSize), total }
}
export function getAuditActions(): string[] { const s = new Set(load().audit_logs.filter(a => !a.deleted_at).map(a => a.action)); return [...s].sort() }
export function getRecentAuditLogs(limit = 10): AuditLogDoc[] { return orderBy(load().audit_logs.filter(a => !a.deleted_at), 'created_at', true).slice(0, limit) }
export function getAdminStats(): {
  total_users: number; active_users: number; banned_users: number
  total_works: number; pending_works: number; approved_works: number; rejected_works: number
  total_lessons: number
  daily_works: { date: string; total: number; approved: number; pending: number }[]
} {
  const db = load()
  const users = db.users.filter(u => !u.deleted_at), works = db.works.filter(w => !w.deleted_at)
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); const cutoff = sevenDaysAgo.toISOString().slice(0, 10)
  const map: Record<string, { total: number; approved: number; pending: number }> = {}
  for (const w of works) { const d = w.created_at.slice(0, 10); if (d >= cutoff) { if (!map[d]) map[d] = { total: 0, approved: 0, pending: 0 }; map[d].total++; if (w.review_status === 'approved') map[d].approved++; if (w.review_status === 'pending') map[d].pending++ } }
  return {
    total_users: users.length, active_users: countIf(users, u => u.status === 'active'), banned_users: countIf(users, u => u.status === 'banned'),
    total_works: works.length, pending_works: countIf(works, w => w.review_status === 'pending'), approved_works: countIf(works, w => w.review_status === 'approved'), rejected_works: countIf(works, w => w.review_status === 'rejected'),
    total_lessons: count(db.lessons),
    daily_works: Object.entries(map).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date))
  }
}
