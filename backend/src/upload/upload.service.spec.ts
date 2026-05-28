import { UploadService, UploadedFile } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(() => {
    service = new UploadService();
  });

  it('should accept SVG images', () => {
    const file: UploadedFile = {
      filename: 'team.svg',
      originalname: 'team.svg',
      mimetype: 'image/svg+xml',
      size: 1024,
    };

    expect(() => service.validateFile(file)).not.toThrow();
  });
});
