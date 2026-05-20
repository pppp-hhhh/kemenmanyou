export default defineEventHandler(async (event) => {
  const response = await $fetch('http://localhost:8001/api/works/public')
  return response
})
