export interface Round {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  championshipId: string;
  createdAt: Date;
}

export interface CreateRoundDto {
  name: string;
  startDate: Date;
  endDate?: Date;
}

export interface UpdateRoundDto {
  name?: string;
  startDate?: Date;
  endDate?: Date;
}
