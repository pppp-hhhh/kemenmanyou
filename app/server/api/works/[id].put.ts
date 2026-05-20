import { ofetch } from 'ofetch'

export default defineEventHandler(async (event): Promise<any> => {
  const body = await readBody(event)
  const id = getRouterParam(event, 'id')

  const response = await ofetch(`/api/works/${id}`, {
    method: 'PUT',
    body,
    baseURL: 'http://localhost:8001',
  })

  return response
})
