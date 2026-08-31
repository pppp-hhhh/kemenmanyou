-- ============================================
-- 补充缺失的 RPC 函数
-- 用于在 Supabase Dashboard 手动创建的 RPC 纳入版本控制
-- 可重复执行（CREATE OR REPLACE）
-- ============================================

-- ============================================
-- 0. 扩展 audit_action ENUM（补充 invite_code_generate）
-- ============================================
-- 若 ENUM 缺失 invite_code_generate 值，写审计日志会失败
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'invite_code_generate'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_action')
  ) THEN
    ALTER TYPE audit_action ADD VALUE 'invite_code_generate';
  END IF;
END $$;

-- ============================================
-- 1. get_current_user - 一次查询拿到 user + profile
-- ============================================
-- 用途：Server 端鉴权核心，通过 JWT 拿到完整用户信息（id/email/role/status/profile）
-- 调用方式：POST /rest/v1/rpc/get_current_user
-- 返回：profiles 行（包含 role/status/display_name/avatar_url/created_at 等）
--      若未登录或用户不存在则返回 NULL
CREATE OR REPLACE FUNCTION public.get_current_user()
RETURNS public.profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.*
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.deleted_at IS NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user() TO public, anon, authenticated, service_role;

-- ============================================
-- 2. write_audit_log - 管理员操作审计日志写入
-- ============================================
-- 用途：记录管理员操作（审核作品、封禁用户等）
-- 调用方式：POST /rest/v1/rpc/write_audit_log
-- 入参：
--   p_action audit_action - 操作类型
--   p_target_type text - 'works' / 'lessons' / 'users'
--   p_target_id integer - 目标 ID
--   p_detail jsonb - 变更详情
-- 返回：插入行的 id
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action audit_action,
  p_target_type text,
  p_target_id integer DEFAULT NULL,
  p_detail jsonb DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id integer;
BEGIN
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, detail)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_detail)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.write_audit_log(
  audit_action, text, integer, jsonb
) TO public, anon, authenticated, service_role;
