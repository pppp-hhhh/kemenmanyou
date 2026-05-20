export default defineEventHandler(async () => {
  const response = await $fetch('http://localhost:8001/api/lessons', {
    method: 'GET',
  })
  return response
})
