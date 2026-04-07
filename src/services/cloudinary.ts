import cloudinary from '../lib/cloudinary';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
}

export interface CloudinaryDeleteResult {
  result: string;
  public_id: string;
}

export class CloudinaryService {
  private static instance: CloudinaryService;

  static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  // Upload image to Cloudinary
  async uploadImage(
    file: File | Buffer | string,
    options?: {
      folder?: string;
      publicId?: string;
      tags?: string[];
      transformation?: string;
      overwrite?: boolean;
    }
  ): Promise<CloudinaryUploadResult> {
    try {
      const uploadOptions: any = {
        folder: options?.folder || 'ecommerce/products',
        resource_type: 'image',
        overwrite: options?.overwrite ?? true,
      };

      if (options?.publicId) {
        uploadOptions.public_id = options.publicId;
      }

      if (options?.tags) {
        uploadOptions.tags = options.tags.join(',');
      }

      if (options?.transformation) {
        uploadOptions.transformation = options.transformation;
      }

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          file instanceof File ? file.path || file : file,
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result as CloudinaryUploadResult);
            }
          }
        );
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  // Upload multiple images
  async uploadMultipleImages(
    files: (File | Buffer | string)[],
    options?: {
      folder?: string;
      tags?: string[];
      transformation?: string;
    }
  ): Promise<CloudinaryUploadResult[]> {
    const uploadPromises = files.map(file => 
      this.uploadImage(file, options)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple upload error:', error);
      throw error;
    }
  }

  // Delete image from Cloudinary
  async deleteImage(publicId: string): Promise<CloudinaryDeleteResult> {
    try {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(
          publicId,
          { resource_type: 'image' },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result as CloudinaryDeleteResult);
            }
          }
        );
      });
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  // Delete multiple images
  async deleteMultipleImages(publicIds: string[]): Promise<CloudinaryDeleteResult[]> {
    const deletePromises = publicIds.map(publicId => 
      this.deleteImage(publicId)
    );

    try {
      return await Promise.all(deletePromises);
    } catch (error) {
      console.error('Multiple delete error:', error);
      throw error;
    }
  }

  // Generate optimized image URL
  getOptimizedUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: number;
      format?: string;
      gravity?: string;
      zoom?: number;
    }
  ): string {
    try {
      const transformationOptions: any = {};

      if (options?.width) transformationOptions.width = options.width;
      if (options?.height) transformationOptions.height = options.height;
      if (options?.crop) transformationOptions.crop = options.crop;
      if (options?.quality) transformationOptions.quality = options.quality;
      if (options?.format) transformationOptions.format = options.format;
      if (options?.gravity) transformationOptions.gravity = options.gravity;
      if (options?.zoom) transformationOptions.zoom = options.zoom;

      return cloudinary.url(publicId, {
        transformation: transformationOptions,
        secure: true,
      });
    } catch (error) {
      console.error('Cloudinary URL generation error:', error);
      return '';
    }
  }

  // Generate responsive image URLs for different breakpoints
  getResponsiveUrls(
    publicId: string,
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1536],
    options?: {
      height?: number;
      crop?: string;
      quality?: number;
      format?: string;
    }
  ): { width: number; url: string }[] {
    return breakpoints.map(width => ({
      width,
      url: this.getOptimizedUrl(publicId, {
        ...options,
        width,
      }),
    }));
  }

  // Generate thumbnail URL
  getThumbnailUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: number;
    }
  ): string {
    return this.getOptimizedUrl(publicId, {
      width: options?.width || 150,
      height: options?.height || 150,
      crop: options?.crop || 'fill',
      quality: options?.quality || 80,
      gravity: 'auto',
    });
  }

  // Generate product gallery URLs
  getProductGalleryUrls(
    publicId: string,
    options?: {
      mainImage?: { width?: number; height?: number };
      thumbnail?: { width?: number; height?: number };
      zoom?: { width?: number; height?: number };
    }
  ) {
    return {
      main: this.getOptimizedUrl(publicId, {
        width: options?.mainImage?.width || 800,
        height: options?.mainImage?.height || 800,
        crop: 'fill',
        quality: 90,
        gravity: 'auto',
      }),
      thumbnail: this.getThumbnailUrl(publicId, options?.thumbnail),
      zoom: this.getOptimizedUrl(publicId, {
        width: options?.zoom?.width || 1200,
        height: options?.zoom?.height || 1200,
        crop: 'fill',
        quality: 95,
        gravity: 'auto',
      }),
      responsive: this.getResponsiveUrls(publicId, [400, 600, 800, 1000, 1200]),
    };
  }

  // Extract public ID from Cloudinary URL
  extractPublicId(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = filename.split('.')[0];
      
      // Reconstruct the public ID with folder structure
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1) {
        const folderPath = urlParts.slice(uploadIndex + 2, -1).join('/');
        return folderPath ? `${folderPath}/${publicId}` : publicId;
      }
      
      return publicId;
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }

  // Validate if URL is a Cloudinary URL
  isCloudinaryUrl(url: string): boolean {
    return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
  }

  // Get image info from Cloudinary
  async getImageInfo(publicId: string): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        cloudinary.api.resource(
          publicId,
          { resource_type: 'image' },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
      });
    } catch (error) {
      console.error('Cloudinary image info error:', error);
      throw error;
    }
  }

  // Create image folder
  async createFolder(folderPath: string): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        cloudinary.api.create_folder(
          folderPath,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
      });
    } catch (error) {
      console.error('Cloudinary folder creation error:', error);
      throw error;
    }
  }

  // List images in folder
  async listImagesInFolder(
    folderPath: string,
    options?: {
      maxResults?: number;
      nextCursor?: string;
    }
  ): Promise<any> {
    try {
      const listOptions: any = {
        type: 'upload',
        prefix: folderPath,
        max_results: options?.maxResults || 500,
      };

      if (options?.nextCursor) {
        listOptions.next_cursor = options.nextCursor;
      }

      return new Promise((resolve, reject) => {
        cloudinary.api.resources(
          listOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
      });
    } catch (error) {
      console.error('Cloudinary list images error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const cloudinaryService = CloudinaryService.getInstance();

// Helper functions for common use cases
export const uploadProductImages = async (
  images: File[],
  productId?: string
): Promise<string[]> => {
  const folder = `ecommerce/products${productId ? `/${productId}` : ''}`;
  const results = await cloudinaryService.uploadMultipleImages(images, {
    folder,
    tags: ['product', 'ecommerce'],
  });

  return results.map(result => result.secure_url);
};

export const deleteProductImages = async (imageUrls: string[]): Promise<void> => {
  const publicIds = imageUrls
    .map(url => cloudinaryService.extractPublicId(url))
    .filter((id): id is string => id !== null);

  if (publicIds.length > 0) {
    await cloudinaryService.deleteMultipleImages(publicIds);
  }
};

export const getProductImageUrls = (publicId: string) => {
  return cloudinaryService.getProductGalleryUrls(publicId);
};
