import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'node:path';
import { UploadedFile as UploadedFileModel, UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('team-logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, join(process.cwd(), 'uploads', 'teams'));
        },
        filename: (req, file, cb) => {
          const uploadService = new UploadService();
          const filename = uploadService.generateFilename(file.originalname);
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/svg+xml',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Ungültiger Dateityp. Erlaubt sind nur: JPG, PNG, WebP, SVG',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadTeamLogo(@UploadedFile() file: UploadedFileModel) {
    if (!file) {
      throw new BadRequestException('Keine Datei hochgeladen');
    }

    try {
      this.uploadService.validateFile(file);
      const url = this.uploadService.getUploadPath('teams', file.filename);
      return { url };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('user-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, join(process.cwd(), 'uploads', 'users'));
        },
        filename: (req, file, cb) => {
          const uploadService = new UploadService();
          const filename = uploadService.generateFilename(file.originalname);
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Ungültiger Dateityp. Erlaubt sind nur: JPG, PNG, WebP',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadUserImage(@UploadedFile() file: UploadedFileModel) {
    if (!file) {
      throw new BadRequestException('Keine Datei hochgeladen');
    }

    try {
      this.uploadService.validateFile(file);
      const url = this.uploadService.getUploadPath('users', file.filename);
      return { url };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('championship-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, join(process.cwd(), 'uploads', 'championships'));
        },
        filename: (req, file, cb) => {
          const uploadService = new UploadService();
          const filename = uploadService.generateFilename(file.originalname);
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Ungültiger Dateityp. Erlaubt sind nur: JPG, PNG, WebP',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadChampionshipImage(@UploadedFile() file: UploadedFileModel) {
    if (!file) {
      throw new BadRequestException('Keine Datei hochgeladen');
    }

    try {
      this.uploadService.validateFile(file);
      const url = this.uploadService.getUploadPath(
        'championships',
        file.filename,
      );
      return { url };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
