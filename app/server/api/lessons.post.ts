export default defineEventHandler(async (event): Promise<any> => {
  const body = await readBody(event)

  const response = await $fetch('/api/lessons', {
    method: 'POST',
    body,
    baseURL: 'http://localhost:8001',
  })

  return response
})
