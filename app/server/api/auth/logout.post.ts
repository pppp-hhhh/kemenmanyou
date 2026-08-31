export default defineEventHandler(async () => {
  return { status: 'success', message: '已登出（客户端请清除 token）' }
})
