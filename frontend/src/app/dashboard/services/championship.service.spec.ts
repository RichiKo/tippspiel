import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ChampionshipService } from './championship.service';

describe('ChampionshipService prize funds', () => {
  let service: ChampionshipService;
  let http: HttpTestingController;
  const configuration = {
    entryFeeMinorUnits: '10000',
    prizeFundRule: {
      tieMode: 'share_equal_points' as const,
      prizeAmountsMinorUnits: ['0', '0', '0'],
    },
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChampionshipService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads configuration using an encoded championship id', () => {
    service
      .getPrizeFund('champ/id')
      .subscribe((value) => expect(value).toEqual(configuration));
    const req = http.expectOne('/api/championships/champ%2Fid/prize-fund');
    expect(req.request.method).toBe('GET');
    req.flush(configuration);
  });

  it('saves only configuration without calculated amounts', () => {
    service
      .updatePrizeFund('champ-1', configuration)
      .subscribe((value) => expect(value).toEqual(configuration));
    const req = http.expectOne('/api/championships/champ-1/prize-fund');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(configuration);
    req.flush(configuration);
  });
});
