export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  const response = await $fetch<{ id: string; email: string; role: string }>('http://localhost:8001/api/auth/me', {
    headers: authHeader ? { Authorization: authHeader } : {},
  })

  return response
})
