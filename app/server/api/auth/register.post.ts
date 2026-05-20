export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const response = await $fetch<{
    access_token: string
    refresh_token: string
    user: { id: string; email: string; role: string }
  }>('http://localhost:8001/api/auth/register', {
    method: 'POST',
    body,
  })

  return {
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    user: response.user,
    expires_at: Date.now() / 1000 + 3600,
  }
})
