import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
  secure: true
});

async function uploadToCloudinary({
  url,
  buffer,
  base64
}) {
  try {
    if (url) {
      // For URL uploads, upload from URL
      const result = await cloudinary.uploader.upload(url, {
        folder: 'carlyhub/products',
        resource_type: 'auto'
      });
      return {
        url: result.secure_url,
        mimeType: result.resource_type === 'image' ? `image/${result.format}` : result.resource_type
      };
    }

    if (base64) {
      // For base64 uploads
      const result = await cloudinary.uploader.upload(base64, {
        folder: 'carlyhub/products',
        resource_type: 'auto'
      });
      return {
        url: result.secure_url,
        mimeType: result.resource_type === 'image' ? `image/${result.format}` : result.resource_type
      };
    }

    if (buffer) {
      // For buffer uploads, create a data URL first
      const base64String = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(base64String, {
        folder: 'carlyhub/products',
        resource_type: 'auto'
      });
      return {
        url: result.secure_url,
        mimeType: result.resource_type === 'image' ? `image/${result.format}` : result.resource_type
      };
    }

    throw new Error('No valid upload data provided');
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

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
    } else if (contentType.includes('application/json')) {
      // Handle JSON upload (url or base64)
      const body = await request.json();
      uploadData = body;
    } else if (contentType.includes('application/octet-stream')) {
      // Handle raw buffer upload
      const buffer = Buffer.from(await request.arrayBuffer());
      uploadData = { buffer };
    } else {
      return Response.json(
        { error: 'Unsupported content type' },
        { status: 400 }
      );
    }

    const result = await uploadToCloudinary(uploadData);

    return Response.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// Important: Export other methods as 405
export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}