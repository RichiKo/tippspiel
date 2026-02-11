export enum MembershipStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

export interface Membership {
  id: string;
  userId: number;
  championshipId: string;
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
    image: string | null;
  };
  championship?: {
    id: string;
    name: string;
    description?: string;
    image: string;
    isPublic: boolean;
    isActive: boolean;
  };
}

export interface JoinResponse {
  membership: Membership;
  message: string;
}

export interface MembershipResponse {
  membership: Membership | null;
}
