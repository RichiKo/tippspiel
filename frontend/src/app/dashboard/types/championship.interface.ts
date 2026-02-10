export interface Championship {
  id: string;
  name: string;
  description?: string;
  image: string;
  isPublic: boolean;
  isActive: boolean;
  eliminatedTeamIds?: string[];
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}
