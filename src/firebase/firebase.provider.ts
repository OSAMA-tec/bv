import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import type { Storage } from 'firebase-admin/storage';

@Injectable()
export class FirebaseProvider {
  private bucket: ReturnType<Storage['bucket']>;

  constructor(private configService: ConfigService) {
    if (!admin.apps.length) {
      const projectId = this.configService.get('firebase.projectId');
      const clientEmail = this.configService.get('firebase.clientEmail');
      const privateKey = this.configService
        .get('firebase.privateKey')
        ?.replace(/\\n/g, '\n');
      const storageBucket =
        this.configService.get('firebase.storageBucket') ||
        `${projectId}.appspot.com`;

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing Firebase configuration');
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      });
    }
    this.bucket = admin.storage().bucket();
  }

  async uploadFile(file: Express.Multer.File, path: string): Promise<string> {
    try {
      const buffer = file.buffer;
      const fileUpload = this.bucket.file(path);

      await fileUpload.save(buffer, {
        contentType: file.mimetype,
        public: true,
      });

      return fileUpload.publicUrl();
    } catch (error) {
      console.error('Firebase upload error:', error);
      throw new Error('Failed to upload file to Firebase');
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const fileName = url.split('/').pop();
      if (fileName) {
        await this.bucket.file(fileName).delete();
      }
    } catch (error) {
      console.error('Firebase delete error:', error);
      // Swallow delete errors as the file might not exist
    }
  }
}
