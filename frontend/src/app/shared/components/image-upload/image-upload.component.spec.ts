import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { of } from 'rxjs';
import { ImageUploadComponent } from './image-upload.component';
import { UploadService } from '../../services/upload.service';

describe('ImageUploadComponent', () => {
  let fixture: ComponentFixture<ImageUploadComponent>;
  let uploadService: jasmine.SpyObj<UploadService>;

  beforeEach(async () => {
    uploadService = jasmine.createSpyObj<UploadService>('UploadService', [
      'uploadImage',
    ]);
    uploadService.uploadImage.and.returnValue(
      of({ url: '/uploads/teams/team.svg' }),
    );

    await TestBed.configureTestingModule({
      imports: [
        ImageUploadComponent,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      providers: [{ provide: UploadService, useValue: uploadService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageUploadComponent);
    fixture.componentRef.setInput('uploadCategory', 'teams');
    fixture.detectChanges();
  });

  it('should upload SVG files for team logos', () => {
    const input = fixture.nativeElement.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg"></svg>'],
      'team.svg',
      {
        type: 'image/svg+xml',
      },
    );

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    input.dispatchEvent(new Event('change'));

    expect(uploadService.uploadImage).toHaveBeenCalledOnceWith(file, 'teams');
  });
});
