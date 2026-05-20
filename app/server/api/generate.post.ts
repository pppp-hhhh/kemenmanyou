export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const response = await $fetch('http://localhost:8001/api/generate', {
    method: 'POST',
    body,
  })
  return response
})
