-- ============================================
-- 课文漫游 数据库初始化脚本 v4 (完全重构版)
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- ============================================
-- 0. 清理旧对象
-- ============================================
DROP VIEW IF EXISTS work_stats CASCADE;
DROP VIEW IF EXISTS lesson_stats CASCADE;
DROP VIEW IF EXISTS user_stats CASCADE;
DROP VIEW IF EXISTS admin_stats_view CASCADE;

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS work_scenes CASCADE;
DROP TABLE IF EXISTS work_images CASCADE;
DROP TABLE IF EXISTS lesson_tasks CASCADE;
DROP TABLE IF EXISTS works CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS work_review_status CASCADE;
DROP TYPE IF EXISTS lesson_task_status CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;

-- ============================================
-- 1. ENUM 类型定义
-- ============================================
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'banned');
CREATE TYPE work_review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE lesson_task_status AS ENUM ('pending', 'splitting', 'completed', 'failed');
CREATE TYPE audit_action AS ENUM (
  'work_approve', 'work_reject', 'work_delete', 'work_batch_approve', 'work_batch_reject', 'work_batch_delete',
  'lesson_delete', 'lesson_batch_delete',
  'user_role_change', 'user_ban', 'user_unban'
);

-- ============================================
-- 2. profiles 表（用户资料 + 状态 + 统计）
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  status user_status DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  work_count INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);
-- idx_profiles_email 删除：email 不是查询条件

-- ============================================
-- 3. lessons 表（内置课文库，纯素材）
-- ============================================
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  grade TEXT,                       -- 年级：小学/初中/高中
  source TEXT,                      -- 来源：人教版/苏教版/自定义
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_user_id ON lessons(user_id);
CREATE INDEX idx_lessons_created_at ON lessons(created_at DESC);
CREATE INDEX idx_lessons_grade ON lessons(grade);
-- 删除 idx_lessons_status：lessons 表不再有 status 字段
-- 删除 ai_prompt 字段：从未被使用

-- ============================================
-- 4. lesson_tasks 表（长漫生成任务，独立于 lessons）
-- ============================================
CREATE TABLE lesson_tasks (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status lesson_task_status DEFAULT 'pending',
  image_url TEXT,                   -- 拼图最终结果 URL
  error_message TEXT,               -- 失败原因
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lesson_tasks_status ON lesson_tasks(status);
CREATE INDEX idx_lesson_tasks_user_id ON lesson_tasks(user_id);
CREATE INDEX idx_lesson_tasks_lesson_id ON lesson_tasks(lesson_id);
CREATE INDEX idx_lesson_tasks_created_at ON lesson_tasks(created_at DESC);

-- ============================================
-- 5. works 表（用户作品，带审核 + 软删除 + 标签）
-- ============================================
CREATE TABLE works (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  text_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
  custom_content TEXT,
  thumbnail TEXT,
  scenes JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  style TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  review_status work_review_status DEFAULT 'pending',
  reject_reason TEXT,               -- 拒绝原因
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,                 -- 作者名冗余（避免 join）
  tags TEXT[],                      -- 标签数组
  view_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ,           -- 软删除
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 复合索引：高频查询优化
CREATE INDEX idx_works_user_created ON works(user_id, created_at DESC);
CREATE INDEX idx_works_user_review ON works(user_id, review_status);
CREATE INDEX idx_works_review_status ON works(review_status);
CREATE INDEX idx_works_is_public ON works(is_public);
CREATE INDEX idx_works_public_approved ON works(is_public, review_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_works_text_id ON works(text_id);
CREATE INDEX idx_works_created_at ON works(created_at DESC);
CREATE INDEX idx_works_tags ON works USING GIN(tags);
CREATE INDEX idx_works_author_name ON works(author_name);

-- ============================================
-- 6. work_images 表（作品图片规范化，可选使用）
-- ============================================
CREATE TABLE work_images (
  id SERIAL PRIMARY KEY,
  work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_work_images_work_id ON work_images(work_id);
CREATE INDEX idx_work_images_sort ON work_images(work_id, sort_order);

-- ============================================
-- 7. work_scenes 表（作品场景规范化，可选使用）
-- ============================================
CREATE TABLE work_scenes (
  id SERIAL PRIMARY KEY,
  work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
  description_cn TEXT,
  prompt_en TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_work_scenes_work_id ON work_scenes(work_id);
CREATE INDEX idx_work_scenes_sort ON work_scenes(work_id, sort_order);

-- ============================================
-- 8. audit_logs 表（管理员操作日志）
-- ============================================
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  target_type TEXT NOT NULL,        -- 'works' / 'lessons' / 'users'
  target_id INTEGER,
  detail JSONB,                     -- 变更详情
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);

-- ============================================
-- 9. 启用 RLS（行级安全策略）
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9.1 is_admin() 辅助函数（SECURITY DEFINER 绕过 RLS 递归）
-- ============================================
-- 关键：在 profiles 表的 RLS 策略中，子查询引用 profiles 会导致无限递归（42P17）。
-- 用 SECURITY DEFINER 函数封装查询，函数内部不触发 RLS。
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'admin' AND deleted_at IS NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO public, anon, authenticated, service_role;

-- ============================================
-- 10. profiles 表策略
-- ============================================
-- 任何人可读未删除的 profiles（显示作者信息）
CREATE POLICY "anyone_read_profiles" ON profiles
  FOR SELECT USING (deleted_at IS NULL);

-- 用户只能更新自己的 profile（且不能改 role/status）
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 用户创建自己的 profile
CREATE POLICY "users_insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 管理员可读所有用户（含已软删除）
CREATE POLICY "admin_all_profiles" ON profiles
  FOR SELECT USING (public.is_admin());

-- 管理员可更新/删除用户（封禁/解封/角色变更）
CREATE POLICY "admin_update_profiles" ON profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "admin_delete_profiles" ON profiles
  FOR DELETE USING (public.is_admin());

-- ============================================
-- 11. lessons 表策略
-- ============================================
-- 任何人可读未删除的课文（课文库公开）
CREATE POLICY "anyone_read_lessons" ON lessons
  FOR SELECT USING (deleted_at IS NULL);

-- 认证用户可创建课文
CREATE POLICY "users_insert_lessons" ON lessons
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 用户更新自己的课文
CREATE POLICY "owner_update_lessons" ON lessons
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户删除自己的课文（软删除）
CREATE POLICY "owner_delete_lessons" ON lessons
  FOR DELETE USING (auth.uid() = user_id);

-- 管理员操作所有课文
CREATE POLICY "admin_all_lessons" ON lessons
  FOR ALL USING (public.is_admin());

-- ============================================
-- 12. lesson_tasks 表策略
-- ============================================
-- 用户可读自己的长漫任务
CREATE POLICY "users_read_own_lesson_tasks" ON lesson_tasks
  FOR SELECT USING (auth.uid() = user_id);

-- 管理员可读所有长漫任务
CREATE POLICY "admin_read_lesson_tasks" ON lesson_tasks
  FOR SELECT USING (public.is_admin());

-- 认证用户可创建长漫任务
CREATE POLICY "users_insert_lesson_tasks" ON lesson_tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 用户更新自己的长漫任务
CREATE POLICY "owner_update_lesson_tasks" ON lesson_tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- 管理员操作所有长漫任务
CREATE POLICY "admin_all_lesson_tasks" ON lesson_tasks
  FOR ALL USING (public.is_admin());

-- ============================================
-- 13. works 表策略
-- ============================================
-- 所有人读已审核通过的公开作品
CREATE POLICY "anyone_read_approved_works" ON works
  FOR SELECT USING (is_public = true AND review_status = 'approved' AND deleted_at IS NULL);

-- 用户读自己的所有作品（含未删除的）
CREATE POLICY "users_read_own_works" ON works
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

-- 认证用户创建作品
CREATE POLICY "users_insert_works" ON works
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 用户更新自己的作品
CREATE POLICY "owner_update_works" ON works
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户删除自己的作品（软删除）
CREATE POLICY "owner_delete_works" ON works
  FOR DELETE USING (auth.uid() = user_id);

-- 管理员操作所有作品
CREATE POLICY "admin_all_works" ON works
  FOR ALL USING (public.is_admin());

-- ============================================
-- 14. work_images / work_scenes 表策略（跟随 works）
-- ============================================
CREATE POLICY "anyone_read_work_images" ON work_images
  FOR SELECT USING (true);

CREATE POLICY "owner_all_work_images" ON work_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM works w
      WHERE w.id = work_id AND w.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "anyone_read_work_scenes" ON work_scenes
  FOR SELECT USING (true);

CREATE POLICY "owner_all_work_scenes" ON work_scenes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM works w
      WHERE w.id = work_id AND w.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- ============================================
-- 15. audit_logs 表策略
-- ============================================
CREATE POLICY "admin_all_audit_logs" ON audit_logs
  FOR ALL USING (public.is_admin());

-- ============================================
-- 16. 通用函数：updated_at 自动维护
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_lessons_updated_at ON lessons;
CREATE TRIGGER trigger_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_lesson_tasks_updated_at ON lesson_tasks;
CREATE TRIGGER trigger_lesson_tasks_updated_at
  BEFORE UPDATE ON lesson_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_works_updated_at ON works;
CREATE TRIGGER trigger_works_updated_at
  BEFORE UPDATE ON works
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 17. 自动创建 profile 的 trigger（注册时）
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 18. works 软删除（用 BEFORE DELETE 触发器拦截 DELETE）
-- ============================================
CREATE OR REPLACE FUNCTION public.soft_delete_work()
RETURNS TRIGGER AS $$
BEGIN
  -- 只标记删除，不实际删除
  UPDATE works SET deleted_at = NOW() WHERE id = OLD.id AND deleted_at IS NULL;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_works_soft_delete ON works;
CREATE TRIGGER trigger_works_soft_delete
  BEFORE DELETE ON works
  FOR EACH ROW EXECUTE FUNCTION public.soft_delete_work();

-- ============================================
-- 19. works.view_count 原子自增函数
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_work_view(work_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE works SET view_count = view_count + 1 WHERE id = work_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 20. 统计视图（重新设计，使用软删除过滤）
-- ============================================
CREATE OR REPLACE VIEW work_stats AS
SELECT
  COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_works,
  COUNT(*) FILTER (WHERE review_status = 'approved' AND deleted_at IS NULL) AS approved_works,
  COUNT(*) FILTER (WHERE review_status = 'pending' AND deleted_at IS NULL) AS pending_works,
  COUNT(*) FILTER (WHERE review_status = 'rejected' AND deleted_at IS NULL) AS rejected_works,
  COUNT(*) FILTER (WHERE is_public = true AND deleted_at IS NULL) AS public_works
FROM works;

CREATE OR REPLACE VIEW lesson_stats AS
SELECT
  COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_lessons
FROM lessons;

CREATE OR REPLACE VIEW user_stats AS
SELECT
  COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_users,
  COUNT(*) FILTER (WHERE role = 'admin' AND deleted_at IS NULL) AS admin_count,
  COUNT(*) FILTER (WHERE role = 'user' AND deleted_at IS NULL) AS user_count,
  COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL) AS active_count,
  COUNT(*) FILTER (WHERE status = 'banned' AND deleted_at IS NULL) AS banned_count
FROM profiles;

CREATE OR REPLACE VIEW lesson_task_stats AS
SELECT
  COUNT(*) AS total_tasks,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_tasks,
  COUNT(*) FILTER (WHERE status = 'splitting') AS splitting_tasks,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_tasks,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_tasks
FROM lesson_tasks;

-- ============================================
-- 21. 管理员统一统计视图
-- ============================================
CREATE OR REPLACE VIEW admin_stats_view AS
SELECT
  (SELECT total_works FROM work_stats) AS total_works,
  (SELECT approved_works FROM work_stats) AS approved_works,
  (SELECT pending_works FROM work_stats) AS pending_works,
  (SELECT rejected_works FROM work_stats) AS rejected_works,
  (SELECT total_lessons FROM lesson_stats) AS total_lessons,
  (SELECT total_users FROM user_stats) AS total_users,
  (SELECT active_count FROM user_stats) AS active_users,
  (SELECT banned_count FROM user_stats) AS banned_users;

-- ============================================
-- 22. 可选：插入示例课文数据
-- ============================================
INSERT INTO lessons (title, content, grade, source) VALUES
  ('荷塘月色', '曲曲折折的荷塘上面，弥望的是田田的叶子。叶子出水很高，像亭亭的舞女的裙。层层的叶子中间，零星地点缀着些白花，有袅娜地开着的，有羞涩地打着朵儿的；正如一粒粒的明珠，又如碧天里的星星，又如刚出浴的美人。', '高中', '人教版'),
  ('背影', '我与父亲不相见已二年余了，我最不能忘记的是他的背影。那年冬天，祖母死了，父亲的差使也交卸了，正是祸不单行的日子。', '初中', '人教版'),
  ('春', '盼望着，盼望着，东风来了，春天的脚步近了。一切都像刚睡醒的样子，欣欣然张开了眼。山朗润起来了，水涨起来了，太阳的脸红起来了。', '初中', '人教版'),
  ('小石潭记', '从小丘西行百二十步，隔篁竹，闻水声，如鸣珮环，心乐之。伐竹取道，下见小潭，水尤清冽。', '初中', '人教版'),
  ('桃花源记', '晋太元中，武陵人捕鱼为业。缘溪行，忘路之远近。忽逢桃花林，夹岸数百步，中无杂树，芳草鲜美，落英缤纷。', '初中', '人教版')
ON CONFLICT DO NOTHING;

-- ============================================
-- 23. 设置管理员（执行后手动改邮箱）
-- ============================================
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
