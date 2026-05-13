import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { BonusAdminComponent } from './bonus-admin.component';
import { BonusService } from '../../services/bonus.service';
import {
  BonusRuleStatus,
  BonusRuleType,
} from '../../types/bonus.interface';

describe('BonusAdminComponent', () => {
  let fixture: ComponentFixture<BonusAdminComponent>;
  let component: BonusAdminComponent;

  const mockBonusService = {
    getBonusRules: jasmine.createSpy('getBonusRules').and.returnValue(
      of([
        {
          id: 'rule-1',
          championshipId: 'champ-1',
          type: BonusRuleType.CHAMPION,
          name: 'Old bonus name',
          config: { championPoints: 10 },
          deadline: '2026-03-06T20:00:00.000Z',
          status: BonusRuleStatus.PUBLISHED,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          picks: [],
          evaluations: [],
        },
      ]),
    ),
    updateBonusRule: jasmine.createSpy('updateBonusRule').and.returnValue(
      of({
        id: 'rule-1',
        name: 'Corrected bonus name',
      }),
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BonusAdminComponent, TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
        { provide: BonusService, useValue: mockBonusService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BonusAdminComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('championshipId', 'champ-1');
    fixture.componentRef.setInput('availableTeams', []);
    fixture.detectChanges();
  });

  afterEach(() => {
    mockBonusService.getBonusRules.calls.reset();
    mockBonusService.updateBonusRule.calls.reset();
  });

  it('should show edit action for a published bonus rule after the deadline', () => {
    const editButton = fixture.nativeElement.querySelector(
      '.btn-edit',
    ) as HTMLButtonElement;

    expect(editButton).toBeTruthy();
  });

  it('should send only the corrected name and deadline for limited bonus edits', () => {
    const rule = component.bonusRules()[0];

    component.onEditRule(rule);
    component.createForm.controls.name.setValue('Corrected bonus name');
    component.createForm.controls.deadline.setValue('2026-03-08T20:00');
    component.onUpdateBonus();

    expect(mockBonusService.updateBonusRule).toHaveBeenCalledOnceWith(
      'rule-1',
      {
        name: 'Corrected bonus name',
        deadline: new Date('2026-03-08T20:00').toISOString(),
      },
    );
  });

  it('should list only active teams for bonus evaluation', () => {
    fixture.componentRef.setInput('availableTeams', [
      { id: 'active-team', name: 'Active Team', logoUrl: '' },
      { id: 'eliminated-team', name: 'Eliminated Team', logoUrl: '' },
    ]);
    fixture.componentRef.setInput('eliminatedTeamIds', ['eliminated-team']);
    fixture.detectChanges();

    expect(component.sortedAvailableTeams()).toEqual([
      { id: 'active-team', name: 'Active Team', logoUrl: '' },
    ]);
  });
});
