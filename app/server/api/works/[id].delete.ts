import { ofetch } from 'ofetch'

export default defineEventHandler(async (event): Promise<any> => {
  const id = getRouterParam(event, 'id')

  const response = await ofetch(`/api/works/${id}`, {
    method: 'DELETE',
    baseURL: 'http://localhost:8001',
  })

  return response
})
