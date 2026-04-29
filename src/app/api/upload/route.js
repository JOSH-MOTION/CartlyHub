import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dlng6dqtl';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'eccomerce';

// Configure Cloudinary SDK if keys are available
if (CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
  });
}

async function uploadToCloudinary({ url, buffer, base64 }) {
  try {
    // If we have API keys, use the Cloudinary SDK (Signed Upload)
    if (CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      let result;
      if (url) {
        result = await cloudinary.uploader.upload(url, {
          folder: 'cartlyhub/products',
          resource_type: 'auto'
        });
      } else if (base64) {
        result = await cloudinary.uploader.upload(base64, {
          folder: 'cartlyhub/products',
          resource_type: 'auto'
        });
      } else if (buffer) {
        const base64String = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        result = await cloudinary.uploader.upload(base64String, {
          folder: 'cartlyhub/products',
          resource_type: 'auto'
        });
      }

      if (result) {
        return {
          url: result.secure_url,
          mimeType: result.resource_type === 'image' ? `image/${result.format}` : result.resource_type
        };
      }
    }

    // Fallback: Direct REST API Upload (Unsigned Upload)
    // This works using the upload_preset and doesn't require an API key
    console.log('Using fallback unsigned upload to Cloudinary');
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    const formData = new FormData();
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    if (url) {
      formData.append('file', url);
    } else if (base64) {
      formData.append('file', base64);
    } else if (buffer) {
      const blob = new Blob([buffer]);
      formData.append('file', blob);
    }

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Direct upload failed');
    }

    const result = await response.json();
    return {
      url: result.secure_url,
      mimeType: result.resource_type === 'image' ? `image/${result.format}` : result.resource_type
    };

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    let uploadData = {};

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 }
      );
    }

    const result = await uploadToCloudinary(uploadData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}