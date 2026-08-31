/**
 * 主题颜色 Composable
 *
 * 在 Vue 组件中使用：
 *   const { styleBadge, reviewBadge, formatDate } = useThemeColors()
 *   <span :class="styleBadge(work.style)">{{ work.style }}</span>
 */
import {
  styleColors,
  reviewStatusColors,
  reviewStatusLabels,
  auditActionColors,
  formatDate as _formatDate,
  formatDateLong as _formatDateLong,
  formatAgo as _formatAgo,
  getThumbnail as _getThumbnail,
} from '~/utils/colors'

export const useThemeColors = () => {
  /** 获取画风的 Tailwind badge 类名 */
  const styleBadge = (style: string): string =>
    styleColors[style] || 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'

  /** 获取审核状态的 Tailwind badge 类名 */
  const reviewBadge = (status: string): string =>
    reviewStatusColors[status] || reviewStatusColors.pending

  /** 获取审核状态中文名 */
  const reviewLabel = (status: string): string =>
    reviewStatusLabels[status] || status

  /** 获取审计操作的 Tailwind badge 类名 */
  const auditBadge = (action: string): string => {
    if (action.includes('approve')) return auditActionColors.approve
    if (action.includes('delete') || action.includes('ban')) return auditActionColors.delete
    if (action.includes('role')) return auditActionColors.role
    return auditActionColors.default
  }

  return {
    styleColors,
    styleBadge,
    reviewBadge,
    reviewLabel,
    auditBadge,
    formatDate: _formatDate,
    formatDateLong: _formatDateLong,
    formatAgo: _formatAgo,
    getThumbnail: _getThumbnail,
  }
}
