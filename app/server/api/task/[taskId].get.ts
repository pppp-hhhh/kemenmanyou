import { requireLogin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireLogin(event)
  const taskId = getRouterParam(event, 'taskId')
  const response = await $fetch(`${useRuntimeConfig().pythonBackendUrl}/api/task/${taskId}`)
  return response
})
