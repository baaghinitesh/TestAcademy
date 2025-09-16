import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface CloudStorageConfig {
  provider: 'aws' | 'local';
  aws?: {
    region: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    cloudFrontUrl?: string;
  };
  local?: {
    uploadDir: string;
    baseUrl: string;
  };
}

interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export class CloudStorageService {
  private static instance: CloudStorageService;
  private s3Client: S3Client | null = null;
  private config: CloudStorageConfig;
  
  private constructor(config: CloudStorageConfig) {
    this.config = config;
    
    if (config.provider === 'aws' && config.aws) {
      this.s3Client = new S3Client({
        region: config.aws.region,
        credentials: {
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
        },
      });
    }
  }
  
  public static getInstance(config?: CloudStorageConfig): CloudStorageService {
    if (!CloudStorageService.instance) {
      if (!config) {
        throw new Error('Cloud storage configuration required for first initialization');
      }
      CloudStorageService.instance = new CloudStorageService(config);
    }
    return CloudStorageService.instance;
  }
  
  /**
   * Upload single file with automatic processing
   */
  public async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options: {
      folder?: string;
      generateThumbnail?: boolean;
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {}
  ): Promise<UploadResult> {
    try {
      const {
        folder = 'uploads',
        generateThumbnail = false,
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 85
      } = options;
      
      const fileExtension = path.extname(fileName);
      const baseName = path.basename(fileName, fileExtension);
      const uniqueFileName = `${baseName}_${uuidv4()}${fileExtension}`;
      const fileKey = `${folder}/${uniqueFileName}`;
      
      let processedBuffer = fileBuffer;
      let metadata: Record<string, any> = {
        originalName: fileName,
        uploadedAt: new Date().toISOString()
      };
      
      // Image processing
      if (mimeType.startsWith('image/')) {
        try {
          const imageInfo = await sharp(fileBuffer).metadata();
          metadata.dimensions = {
            width: imageInfo.width,
            height: imageInfo.height
          };
          
          // Resize if image is too large
          if (imageInfo.width && imageInfo.width > maxWidth || 
              imageInfo.height && imageInfo.height > maxHeight) {
            processedBuffer = await sharp(fileBuffer)
              .resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
              })
              .jpeg({ quality })
              .toBuffer();
          }
        } catch (error) {
          console.warn('Image processing failed, uploading original:', error);
        }
      }
      
      // Upload main file
      const uploadResult = await this.uploadToStorage(processedBuffer, fileKey, mimeType, metadata);
      
      let thumbnailUrl: string | undefined;
      
      // Generate thumbnail for images and videos
      if (generateThumbnail) {
        if (mimeType.startsWith('image/')) {
          thumbnailUrl = await this.generateImageThumbnail(fileBuffer, fileKey);
        } else if (mimeType.startsWith('video/')) {
          thumbnailUrl = await this.generateVideoThumbnail(fileBuffer, fileKey);
        }
      }
      
      return {
        success: true,
        url: uploadResult.url,
        key: fileKey,
        originalName: fileName,
        mimeType,
        size: processedBuffer.length,
        thumbnailUrl,
        metadata
      };
      
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        url: '',
        key: '',
        originalName: fileName,
        mimeType,
        size: 0
      };
    }
  }
  
  /**
   * Upload multiple files with progress tracking
   */
  public async uploadMultipleFiles(
    files: Array<{
      buffer: Buffer;
      fileName: string;
      mimeType: string;
    }>,
    options: {
      folder?: string;
      generateThumbnails?: boolean;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const { onProgress } = options;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const result = await this.uploadFile(
          file.buffer,
          file.fileName,
          file.mimeType,
          {
            ...options,
            generateThumbnail: options.generateThumbnails || false
          }
        );
        
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, files.length);
        }
        
      } catch (error) {
        console.error(`Failed to upload ${file.fileName}:`, error);
        results.push({
          success: false,
          url: '',
          key: '',
          originalName: file.fileName,
          mimeType: file.mimeType,
          size: 0
        });
      }
    }
    
    return results;
  }
  
  /**
   * Upload to actual storage (AWS S3 or local)
   */
  private async uploadToStorage(
    buffer: Buffer,
    key: string,
    mimeType: string,
    metadata: Record<string, any>
  ): Promise<{ url: string }> {
    if (this.config.provider === 'aws' && this.s3Client && this.config.aws) {
      return this.uploadToS3(buffer, key, mimeType, metadata);
    } else if (this.config.provider === 'local' && this.config.local) {
      return this.uploadToLocal(buffer, key, mimeType);
    } else {
      throw new Error('No valid storage provider configured');
    }
  }
  
  /**
   * Upload to AWS S3
   */
  private async uploadToS3(
    buffer: Buffer,
    key: string,
    mimeType: string,
    metadata: Record<string, any>
  ): Promise<{ url: string }> {
    if (!this.s3Client || !this.config.aws) {
      throw new Error('S3 client not configured');
    }
    
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.config.aws.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          ...metadata,
          originalName: metadata.originalName,
          uploadedAt: metadata.uploadedAt
        },
        ServerSideEncryption: 'AES256'
      }
    });
    
    await upload.done();
    
    const url = this.config.aws.cloudFrontUrl
      ? `${this.config.aws.cloudFrontUrl}/${key}`
      : `https://${this.config.aws.bucketName}.s3.${this.config.aws.region}.amazonaws.com/${key}`;
    
    return { url };
  }
  
  /**
   * Upload to local storage
   */
  private async uploadToLocal(
    buffer: Buffer,
    key: string,
    mimeType: string
  ): Promise<{ url: string }> {
    if (!this.config.local) {
      throw new Error('Local storage not configured');
    }
    
    const filePath = path.join(this.config.local.uploadDir, key);
    const directory = path.dirname(filePath);
    
    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, buffer);
    
    const url = `${this.config.local.baseUrl}/${key}`;
    return { url };
  }
  
  /**
   * Generate image thumbnail
   */
  private async generateImageThumbnail(
    imageBuffer: Buffer,
    originalKey: string
  ): Promise<string | undefined> {
    try {
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 75 })
        .toBuffer();
      
      const thumbnailKey = originalKey.replace(/\.[^.]+$/, '_thumb.jpg');
      const result = await this.uploadToStorage(
        thumbnailBuffer,
        thumbnailKey,
        'image/jpeg',
        { isThumbnail: true }
      );
      
      return result.url;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return undefined;
    }
  }
  
  /**
   * Generate video thumbnail
   */
  private async generateVideoThumbnail(
    videoBuffer: Buffer,
    originalKey: string
  ): Promise<string | undefined> {
    try {
      // This is a simplified version - in production you'd use a proper video processing service
      // For now, return a placeholder or implement with ffmpeg if needed
      return undefined;
    } catch (error) {
      console.error('Video thumbnail generation failed:', error);
      return undefined;
    }
  }
  
  /**
   * Delete file from storage
   */
  public async deleteFile(key: string): Promise<boolean> {
    try {
      if (this.config.provider === 'aws' && this.s3Client && this.config.aws) {
        const command = new DeleteObjectCommand({
          Bucket: this.config.aws.bucketName,
          Key: key
        });
        await this.s3Client.send(command);
      } else if (this.config.provider === 'local' && this.config.local) {
        const filePath = path.join(this.config.local.uploadDir, key);
        await fs.unlink(filePath);
      }
      
      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }
  
  /**
   * Get signed URL for direct client upload (S3 only)
   */
  public async getSignedUploadUrl(
    key: string,
    mimeType: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    if (this.config.provider !== 'aws' || !this.s3Client || !this.config.aws) {
      return null;
    }
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.aws.bucketName,
        Key: key,
        ContentType: mimeType
      });
      
      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Signed URL generation error:', error);
      return null;
    }
  }
  
  /**
   * Get file metadata
   */
  public async getFileMetadata(key: string): Promise<any> {
    try {
      if (this.config.provider === 'aws' && this.s3Client && this.config.aws) {
        const command = new HeadObjectCommand({
          Bucket: this.config.aws.bucketName,
          Key: key
        });
        const response = await this.s3Client.send(command);
        
        return {
          size: response.ContentLength,
          lastModified: response.LastModified,
          contentType: response.ContentType,
          metadata: response.Metadata
        };
      } else if (this.config.provider === 'local' && this.config.local) {
        const filePath = path.join(this.config.local.uploadDir, key);
        const stats = await fs.stat(filePath);
        
        return {
          size: stats.size,
          lastModified: stats.mtime,
          contentType: 'application/octet-stream' // Would need to determine from extension
        };
      }
    } catch (error) {
      console.error('Get file metadata error:', error);
      return null;
    }
  }
  
  /**
   * Cleanup old files (for maintenance)
   */
  public async cleanupOldFiles(olderThanDays: number = 30): Promise<number> {
    try {
      // This is a simplified version - in production you'd implement proper cleanup
      // based on file metadata and usage tracking
      console.log(`Cleanup would remove files older than ${olderThanDays} days`);
      return 0;
    } catch (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
  }
}

/**
 * File processing utilities
 */
export class FileProcessor {
  
  /**
   * Process PDF file for text extraction
   */
  public static async processPDF(buffer: Buffer): Promise<{
    text?: string;
    pageCount?: number;
    thumbnailBuffer?: Buffer;
  }> {
    try {
      // This would typically use a library like pdf-parse or pdf2pic
      // For now, return a placeholder
      return {
        text: 'PDF text extraction not implemented',
        pageCount: 1
      };
    } catch (error) {
      console.error('PDF processing error:', error);
      return {};
    }
  }
  
  /**
   * Process image for optimization
   */
  public static async processImage(
    buffer: Buffer,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<Buffer> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      format = 'jpeg'
    } = options;
    
    try {
      let processor = sharp(buffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      
      switch (format) {
        case 'jpeg':
          processor = processor.jpeg({ quality });
          break;
        case 'png':
          processor = processor.png({ quality });
          break;
        case 'webp':
          processor = processor.webp({ quality });
          break;
      }
      
      return await processor.toBuffer();
    } catch (error) {
      console.error('Image processing error:', error);
      return buffer;
    }
  }
  
  /**
   * Validate file type and size
   */
  public static validateFile(
    mimeType: string,
    size: number,
    allowedTypes: string[] = [],
    maxSizeMB: number = 10
  ): { isValid: boolean; error?: string } {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`
      };
    }
    
    // Check file type if restrictions are set
    if (allowedTypes.length > 0 && !allowedTypes.includes(mimeType)) {
      return {
        isValid: false,
        error: `File type ${mimeType} not allowed`
      };
    }
    
    return { isValid: true };
  }
}

export default CloudStorageService;