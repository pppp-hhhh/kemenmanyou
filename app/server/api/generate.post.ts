import { requireLogin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireLogin(event)
  const body = await readBody(event)
  const response = await $fetch(`${useRuntimeConfig().pythonBackendUrl}/api/generate`, {
    method: 'POST',
    body,
  })
  return response
})
