import { ofetch } from 'ofetch'

export default defineEventHandler(async (event): Promise<any> => {
  const id = getRouterParam(event, 'id')

  // 走 Python 后端的软删除（已更新 deleted_at）
  const response = await ofetch(`/api/works/${id}`, {
    method: 'DELETE',
    baseURL: 'http://localhost:8001',
  })

  return response
})
