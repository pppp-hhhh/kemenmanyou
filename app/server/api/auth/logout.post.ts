export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  await $fetch('http://localhost:8001/api/auth/logout', {
    method: 'POST',
    headers: authHeader ? { Authorization: authHeader } : {},
  })
  return { status: 'success' }
})
