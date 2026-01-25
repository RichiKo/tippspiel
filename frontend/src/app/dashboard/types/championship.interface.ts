export interface Championship {
  id: string;
  name: string;
  description?: string;
  image: string;
  isPublic: boolean;
  isActive: boolean;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}
