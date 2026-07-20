-- ============================================
-- 修复 RLS 无限递归问题
-- ============================================
-- 问题：profiles 表的 admin_all_profiles 策略子查询引用了 profiles 自己，
-- 导致 PostgreSQL 评估 RLS 时陷入无限递归（错误码 42P17）。
-- 解决：创建 SECURITY DEFINER 函数 is_admin()，在函数内查询 profiles 不触发 RLS，
-- 所有策略改用 is_admin() 替代子查询。
-- ============================================

-- ============================================
-- 1. 创建 is_admin() 辅助函数（SECURITY DEFINER 绕过 RLS）
-- ============================================
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

-- 给所有用户执行权限（RLS 评估时需要）
GRANT EXECUTE ON FUNCTION public.is_admin() TO public, anon, authenticated, service_role;

-- ============================================
-- 2. 修复 profiles 表策略（消除递归）
-- ============================================
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;

-- 管理员可读所有用户（含已软删除）
CREATE POLICY "admin_all_profiles" ON profiles
  FOR SELECT USING (public.is_admin());

-- 管理员可更新/删除用户（封禁/解封/角色变更）
CREATE POLICY "admin_update_profiles" ON profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "admin_delete_profiles" ON profiles
  FOR DELETE USING (public.is_admin());

-- ============================================
-- 3. lessons 表策略（改用 is_admin）
-- ============================================
DROP POLICY IF EXISTS "admin_all_lessons" ON lessons;
CREATE POLICY "admin_all_lessons" ON lessons
  FOR ALL USING (public.is_admin());

-- ============================================
-- 4. lesson_tasks 表策略（改用 is_admin）
-- ============================================
DROP POLICY IF EXISTS "admin_read_lesson_tasks" ON lesson_tasks;
CREATE POLICY "admin_read_lesson_tasks" ON lesson_tasks
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "admin_all_lesson_tasks" ON lesson_tasks;
CREATE POLICY "admin_all_lesson_tasks" ON lesson_tasks
  FOR ALL USING (public.is_admin());

-- ============================================
-- 5. works 表策略（改用 is_admin）
-- ============================================
DROP POLICY IF EXISTS "admin_all_works" ON works;
CREATE POLICY "admin_all_works" ON works
  FOR ALL USING (public.is_admin());

-- ============================================
-- 6. work_images / work_scenes 表策略（改用 is_admin）
-- ============================================
DROP POLICY IF EXISTS "owner_all_work_images" ON work_images;
CREATE POLICY "owner_all_work_images" ON work_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM works w
      WHERE w.id = work_id AND w.user_id = auth.uid()
    ) OR public.is_admin()
  );

DROP POLICY IF EXISTS "owner_all_work_scenes" ON work_scenes;
CREATE POLICY "owner_all_work_scenes" ON work_scenes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM works w
      WHERE w.id = work_id AND w.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- ============================================
-- 7. audit_logs 表策略（改用 is_admin）
-- ============================================
DROP POLICY IF EXISTS "admin_all_audit_logs" ON audit_logs;
CREATE POLICY "admin_all_audit_logs" ON audit_logs
  FOR ALL USING (public.is_admin());

-- ============================================
-- 验证：执行后测试公开作品查询
-- ============================================
-- SELECT count(*) FROM works WHERE is_public = true AND review_status = 'approved' AND deleted_at IS NULL;
