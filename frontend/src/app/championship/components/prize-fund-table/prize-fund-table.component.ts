import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PrizeFundResult, PrizeWinner } from '../../types/prize-fund.interface';
import {
  formatMinorUnits,
  formatPrizePercent,
} from '../../utils/prize-fund.util';

@Component({
  selector: 'app-prize-fund-table',
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (result().winners.length === 0) {
      <p class="empty-state">
        {{ 'championship.prizeFund.empty' | translate }}
      </p>
    } @else {
      <div class="table-wrapper">
        <table class="prize-winners-table">
          <caption>
            {{
              'championship.prizeFund.tableCaption' | translate
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col" class="rank-col">
                {{ 'championship.prizeFund.place' | translate }}
              </th>
              <th scope="col" class="participant-col">
                {{ 'championship.prizeFund.participant' | translate }}
              </th>
              <th scope="col" class="share-col">
                {{ 'championship.prizeFund.share' | translate }}
              </th>
              <th scope="col" class="money-col">
                {{ 'championship.prizeFund.amount' | translate }}
              </th>
            </tr>
          </thead>
          <tbody>
            @for (winner of result().winners; track winner.userId) {
              <tr
                [class.place-first]="winner.place === 1"
                [class.place-second]="winner.place === 2"
                [class.place-third]="winner.place === 3"
              >
                <td class="rank">
                  <span
                    class="rank-pill"
                    [class.rank-pill--gold]="winner.place === 1"
                    [class.rank-pill--silver]="winner.place === 2"
                    [class.rank-pill--bronze]="winner.place === 3"
                    >{{ winner.place }}</span
                  >
                </td>
                <td>
                  <div class="user-info">
                    @if (shouldRenderUserAvatar(winner)) {
                      <img
                        class="user-avatar"
                        [src]="winner.userImage"
                        alt=""
                        (error)="onUserAvatarError(winner.userImage)"
                      />
                    } @else {
                      <span class="user-avatar-placeholder" aria-hidden="true">
                        {{ getUserInitial(winner.username) }}
                      </span>
                    }
                    <span class="username">{{ winner.username }}</span>
                  </div>
                </td>
                <td class="share">{{ percent(winner.amountMinorUnits) }}</td>
                <td class="money">{{ money(winner.amountMinorUnits) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .table-wrapper {
      overflow-x: auto;
      max-width: 100%;
      overscroll-behavior-x: contain;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }
    caption {
      text-align: left;
      color: var(--ts-text-secondary);
      padding: var(--ts-space-4);
    }
    th {
      padding: 14px 16px;
      background: #f5f8fa;
      color: #395266;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      border-bottom: 1px solid #dde5eb;
    }
    th,
    td {
      text-align: left;
    }
    td {
      padding: 13px 16px;
      border-bottom: 1px solid #e9eff3;
      font-size: 0.9rem;
    }
    tbody tr {
      transition: background-color var(--ts-transition-fast);
    }
    tbody tr:hover {
      background: #f8fbfd;
    }
    tbody tr.place-first {
      background: rgba(16, 185, 129, 0.2);
    }
    tbody tr.place-second {
      background: rgba(16, 185, 129, 0.1);
    }
    tbody tr.place-third {
      background: rgba(16, 185, 129, 0.05);
    }
    tbody tr.place-first:hover {
      background: rgba(16, 185, 129, 0.28);
    }
    tbody tr.place-second:hover {
      background: rgba(16, 185, 129, 0.18);
    }
    tbody tr.place-third:hover {
      background: rgba(16, 185, 129, 0.1);
    }
    tbody tr:last-child td {
      border-bottom: 0;
    }
    .username {
      overflow-wrap: anywhere;
      min-width: 0;
      font-weight: 700;
      color: #0f172a;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: var(--ts-space-3);
    }
    .user-avatar,
    .user-avatar-placeholder {
      width: 38px;
      height: 38px;
      border-radius: var(--ts-radius-pill);
      border: 1px solid var(--ts-border);
      flex-shrink: 0;
    }
    .user-avatar {
      object-fit: cover;
    }
    .user-avatar-placeholder {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #13b982;
      color: #fff;
      font-size: 0.88rem;
      font-weight: 700;
    }
    .rank,
    .rank-col,
    .share,
    .share-col {
      text-align: center;
    }
    .share {
      white-space: nowrap;
      font-weight: 700;
      color: #334155;
    }
    .rank-pill {
      min-width: 34px;
      min-height: 30px;
      padding: 2px 8px;
      border-radius: var(--ts-radius-pill);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.86rem;
      font-weight: 700;
      border: 1px solid #d4dce3;
      color: #334155;
      background: #f8fafc;
    }
    .rank-pill--gold {
      border-color: rgba(245, 158, 11, 0.45);
      background: rgba(245, 158, 11, 0.18);
      color: #92400e;
    }
    .rank-pill--silver {
      border-color: rgba(100, 116, 139, 0.4);
      background: rgba(148, 163, 184, 0.2);
      color: #334155;
    }
    .rank-pill--bronze {
      border-color: rgba(180, 83, 9, 0.35);
      background: rgba(217, 119, 6, 0.16);
      color: #9a3412;
    }
    .money {
      white-space: nowrap;
      font-weight: 800;
      color: #0f5f4c;
      background: rgba(16, 185, 129, 0.08);
    }
    .money,
    .money-col {
      text-align: right;
      border-left: 1px solid #d7e7df;
    }
    .money-col {
      background: #ecfdf5;
      color: #0f5f4c;
    }
    .empty-state {
      padding: var(--ts-space-4);
      text-align: center;
      color: var(--ts-text-secondary);
    }
    @media (max-width: 767px) {
      th,
      td {
        padding: 10px 8px;
      }
      th {
        font-size: 0.63rem;
      }
      .user-avatar,
      .user-avatar-placeholder {
        width: 32px;
        height: 32px;
      }
    }
    @media (max-width: 430px) {
      th,
      td {
        padding: 10px 5px;
      }
      th {
        font-size: 0.6rem;
      }
      td {
        font-size: 0.8rem;
      }
      .user-info {
        gap: var(--ts-space-2);
      }
      .user-avatar,
      .user-avatar-placeholder {
        width: 24px;
        height: 24px;
        font-size: 0.68rem;
      }
      .rank-pill {
        min-width: 28px;
        min-height: 28px;
        padding: 2px 4px;
        font-size: 0.78rem;
      }
    }
  `,
})
export class PrizeFundTableComponent {
  private readonly translate = inject(TranslateService);
  readonly result = input.required<PrizeFundResult>();
  private readonly brokenAvatarUrls = signal(new Set<string>());

  shouldRenderUserAvatar(winner: PrizeWinner): boolean {
    const image = winner.userImage?.trim();
    return !!image && !this.brokenAvatarUrls().has(image);
  }

  getUserInitial(username: string): string {
    return username.trim().charAt(0).toUpperCase() || '?';
  }

  onUserAvatarError(image: string | null): void {
    if (image)
      this.brokenAvatarUrls.update((urls) => new Set(urls).add(image.trim()));
  }

  money(amount: bigint): string {
    return formatMinorUnits(amount, this.translate.currentLang);
  }

  percent(amount: bigint): string {
    return formatPrizePercent(
      amount,
      this.result().totalMinorUnits,
      this.translate.currentLang,
    );
  }
}
