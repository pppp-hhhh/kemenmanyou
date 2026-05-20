export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const response = await $fetch(`http://localhost:8001/api/works/${id}`)
  return response
})
