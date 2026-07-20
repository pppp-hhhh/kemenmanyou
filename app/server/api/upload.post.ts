export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)
  const response = await $fetch<{ url: string }>('http://localhost:8001/api/upload', {
    method: 'POST',
    body: formData,
  })
  return response
})
