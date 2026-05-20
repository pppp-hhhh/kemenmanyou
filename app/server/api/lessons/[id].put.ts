export default defineEventHandler(async (event): Promise<any> => {
  const body = await readBody(event)
  const id = getRouterParam(event, 'id')

  const response = await $fetch(`/api/lessons/${id}`, {
    method: 'PUT',
    body,
    baseURL: 'http://localhost:8001',
  })

  return response
})
