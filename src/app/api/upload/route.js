import { upload } from '../utils/upload';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let uploadData = {};
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file');
      
      if (!file) {
        return Response.json({ error: 'No file provided' }, { status: 400 });
      }
      
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      uploadData = { buffer };
    } else {
      // Handle JSON upload (url or base64)
      const body = await request.json();
      uploadData = body;
    }
    
    const result = await upload(uploadData);
    
    return Response.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
