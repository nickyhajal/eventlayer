export function crossOriginResponse(request: Request, data: any, status = 200) {
  const response = new Response(typeof data === 'object' ? JSON.stringify(data) : data, { status })
  response.headers.append('Access-Control-Allow-Origin', request.headers.get('Origin') || '')
  response.headers.append('Access-Control-Allow-Credentials', 'true')
  return response
}
