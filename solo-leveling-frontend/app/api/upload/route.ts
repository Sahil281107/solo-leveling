export async function POST(request: Request) {
  try {
    // For now, just return a success response
    // File upload will be handled by backend
    return new Response(JSON.stringify({ 
      message: 'Upload endpoint - use backend for file upload',
      url: '/uploads/default.png'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}