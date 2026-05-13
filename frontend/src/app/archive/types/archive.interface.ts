export type ArchiveWinnerSource = 'user' | 'manual';

export interface ArchiveWinnerPayload {
  userId?: number | null;
  manualName?: string | null;
  points: number;
}

export interface CreateArchiveEntryRequest {
  championshipName: string;
  year: number;
  firstPlace: ArchiveWinnerPayload;
  secondPlace: ArchiveWinnerPayload;
  thirdPlace: ArchiveWinnerPayload;
}

export type UpdateArchiveEntryRequest = CreateArchiveEntryRequest;

export interface ArchiveEntry {
  id: string;
  championshipName: string;
  year: number;
  firstPlaceUserId: number | null;
  firstPlaceManualName: string | null;
  firstPlaceDisplayName: string;
  firstPlacePoints: number;
  firstPlaceUser?: ArchiveWinnerUser | null;
  secondPlaceUserId: number | null;
  secondPlaceManualName: string | null;
  secondPlaceDisplayName: string;
  secondPlacePoints: number;
  secondPlaceUser?: ArchiveWinnerUser | null;
  thirdPlaceUserId: number | null;
  thirdPlaceManualName: string | null;
  thirdPlaceDisplayName: string;
  thirdPlacePoints: number;
  thirdPlaceUser?: ArchiveWinnerUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArchiveWinnerUser {
  id: number;
  username: string;
  image: string | null;
}

export interface ArchiveUserOption {
  id: number;
  username: string;
  image: string | null;
}
