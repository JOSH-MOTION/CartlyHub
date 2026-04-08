import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
  secure: true
});

async function upload({
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

export { upload };
export default upload;