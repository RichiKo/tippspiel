import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ArchiveService } from './archive.service';

describe('ArchiveService', () => {
  let service: ArchiveService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ArchiveService],
    });

    service = TestBed.inject(ArchiveService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('loads archive entries', () => {
    service.getArchiveEntries().subscribe((entries) => {
      expect(entries.length).toBe(1);
      expect(entries[0].championshipName).toBe('WM Tipps 2026');
    });

    const req = httpMock.expectOne('/api/archive');
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'archive-1',
        championshipName: 'WM Tipps 2026',
        year: 2026,
        firstPlaceUserId: 1,
        firstPlaceManualName: null,
        firstPlaceDisplayName: 'Anna',
        firstPlacePoints: 22541,
        secondPlaceUserId: null,
        secondPlaceManualName: 'Gastspieler',
        secondPlaceDisplayName: 'Gastspieler',
        secondPlacePoints: 18698,
        thirdPlaceUserId: 2,
        thirdPlaceManualName: null,
        thirdPlaceDisplayName: 'Ben',
        thirdPlacePoints: 12256,
        createdAt: '2026-05-13T10:00:00.000Z',
        updatedAt: '2026-05-13T10:00:00.000Z',
      },
    ]);
  });

  it('creates archive entries', () => {
    const payload = {
      championshipName: 'EM Tipps 2024',
      year: 2024,
      firstPlace: { userId: 1, points: 22541 },
      secondPlace: { manualName: 'Gastspieler', points: 18698 },
      thirdPlace: { userId: 2, points: 12256 },
    };

    service.createArchiveEntry(payload).subscribe();

    const req = httpMock.expectOne('/api/archive');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'archive-1', ...payload });
  });

  it('loads archive user options', () => {
    service.getArchiveUserOptions().subscribe((users) => {
      expect(users).toEqual([{ id: 1, username: 'Anna', image: null }]);
    });

    const req = httpMock.expectOne('/api/users/archive-options');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, username: 'Anna', image: null }]);
  });
});
