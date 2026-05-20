export default defineEventHandler(async (event): Promise<any> => {
  const id = getRouterParam(event, 'id')

  const response = await $fetch(`/api/lessons/${id}`, {
    method: 'DELETE',
    baseURL: 'http://localhost:8001',
  })

  return response
})
