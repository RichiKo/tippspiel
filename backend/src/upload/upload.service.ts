import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
  ];

  private readonly maxSizeBytes = 2 * 1024 * 1024; // 2MB

  validateFile(file: UploadedFile): void {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(
        'Ungültiger Dateityp. Erlaubt sind nur: JPG, PNG, WebP, SVG',
      );
    }

    if (file.size > this.maxSizeBytes) {
      throw new Error('Datei ist zu groß. Maximal 2MB sind erlaubt');
    }
  }

  generateFilename(originalFilename: string): string {
    const ext = extname(originalFilename);
    const uuid = randomUUID();
    return `${uuid}${ext}`;
  }

  getUploadPath(
    category: 'teams' | 'users' | 'championships',
    filename: string,
  ): string {
    return `/uploads/${category}/${filename}`;
  }
}
