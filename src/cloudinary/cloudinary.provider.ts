import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryProvider {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('cloudinary.cloudName'),
      api_key: this.configService.get('cloudinary.apiKey'),
      api_secret: this.configService.get('cloudinary.apiSecret'),
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          },
        );

        const readableStream = new Readable({
          read() {
            this.push(file.buffer);
            this.push(null);
          },
        });

        readableStream.pipe(uploadStream);
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload file to Cloudinary');
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const publicId = this.getPublicIdFromUrl(url);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      // Swallow delete errors as the file might not exist
    }
  }

  private getPublicIdFromUrl(url: string): string | null {
    const regex = /\/v\d+\/([^/]+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
