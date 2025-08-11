import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private supabase;
  private readonly uploadDir = 'uploads';
  private readonly maxFileSize: number;
  private readonly allowedTypes: string[];

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('supabase.url'),
      this.configService.get('supabase.serviceRoleKey'),
    );

    this.maxFileSize = this.configService.get('upload.maxFileSize') || 5242880; // 5MB default
    this.allowedTypes = this.configService.get('upload.allowedTypes')?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create upload directory:', error);
    }
  }

  async uploadToSupabase(
    file: Express.Multer.File,
    bucket: string = 'products',
    folder: string = 'images',
  ): Promise<UploadResult> {
    this.validateFile(file);

    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;

    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error('Supabase upload error:', error);
        throw new BadRequestException('Failed to upload file to Supabase');
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        url: urlData.publicUrl,
        filename: fileName,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      this.logger.error('Upload error:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  async uploadMultipleToSupabase(
    files: Express.Multer.File[],
    bucket: string = 'products',
    folder: string = 'images',
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file =>
      this.uploadToSupabase(file, bucket, folder),
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error('Multiple upload error:', error);
      throw new BadRequestException('Failed to upload one or more files');
    }
  }

  async uploadToLocal(
    file: Express.Multer.File,
    subfolder: string = 'products',
  ): Promise<UploadResult> {
    this.validateFile(file);

    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
    const subfolderPath = path.join(this.uploadDir, subfolder);
    const filePath = path.join(subfolderPath, fileName);

    try {
      // Ensure subfolder exists
      await mkdir(subfolderPath, { recursive: true });

      // Write file
      await writeFile(filePath, file.buffer);

      const baseUrl = this.configService.get('app.baseUrl') || 'http://localhost:3000';
      const fileUrl = `${baseUrl}/${filePath.replace(/\\/g, '/')}`;

      return {
        url: fileUrl,
        filename: fileName,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      this.logger.error('Local upload error:', error);
      throw new BadRequestException('Failed to save file locally');
    }
  }

  async deleteFromSupabase(
    fileName: string,
    bucket: string = 'products',
  ): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        this.logger.error('Supabase delete error:', error);
        throw new BadRequestException('Failed to delete file from Supabase');
      }

      this.logger.log(`File deleted successfully: ${fileName}`);
    } catch (error) {
      this.logger.error('Delete error:', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  async deleteFromLocal(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        this.logger.log(`Local file deleted: ${filePath}`);
      }
    } catch (error) {
      this.logger.error('Local delete error:', error);
      throw new BadRequestException('Failed to delete local file');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedTypes.join(', ')}`,
      );
    }
  }

  // Utility method to get optimized image URL (for future CDN integration)
  getOptimizedImageUrl(
    originalUrl: string,
    width?: number,
    height?: number,
    quality?: number,
  ): string {
    // For now, return original URL
    // In the future, this can be enhanced with image optimization services
    let optimizedUrl = originalUrl;

    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality) params.set('q', quality.toString());

    if (params.toString()) {
      optimizedUrl += `?${params.toString()}`;
    }

    return optimizedUrl;
  }

  // Generate multiple sizes for responsive images
  async generateImageSizes(
    file: Express.Multer.File,
    sizes: { name: string; width?: number; height?: number }[] = [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'small', width: 300 },
      { name: 'medium', width: 600 },
      { name: 'large', width: 1200 },
    ],
  ): Promise<Record<string, UploadResult>> {
    // For now, upload original and return same URL for all sizes
    // In the future, this can be enhanced with actual image resizing
    const uploadResult = await this.uploadToSupabase(file);
    
    const results: Record<string, UploadResult> = {};
    sizes.forEach(size => {
      results[size.name] = {
        ...uploadResult,
        url: this.getOptimizedImageUrl(uploadResult.url, size.width, size.height),
      };
    });

    return results;
  }
}
