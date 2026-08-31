import { requireLogin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireLogin(event)
  const formData = await readFormData(event)
  const response = await $fetch<{ url: string }>(`${useRuntimeConfig().pythonBackendUrl}/api/upload`, {
    method: 'POST',
    body: formData,
  })
  return response
})
