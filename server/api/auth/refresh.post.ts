export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { refresh_token } = body

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  const response = await $fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Content-Type': 'application/json',
    },
    body: {
      refresh_token,
    },
  })

  return response
})
