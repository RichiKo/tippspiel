import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Membership,
  MembershipStatus,
  JoinResponse,
  MembershipResponse,
} from '../types/membership.interface';

@Injectable({ providedIn: 'root' })
export class MembershipService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  // Join Championship (public direkt, private request)
  joinChampionship(championshipId: string): Observable<JoinResponse> {
    return this.http.post<JoinResponse>(
      `${this.baseUrl}/championships/${championshipId}/join`,
      {},
    );
  }

  // Get own membership status for a championship
  getMembershipStatus(championshipId: string): Observable<MembershipResponse> {
    return this.http.get<MembershipResponse>(
      `${this.baseUrl}/championships/${championshipId}/membership`,
    );
  }

  // Get all own memberships
  getUserMemberships(): Observable<{ memberships: Membership[] }> {
    return this.http.get<{ memberships: Membership[] }>(
      `${this.baseUrl}/user/memberships`,
    );
  }

  // Admin: Get all members of a championship
  getChampionshipMembers(
    championshipId: string,
    status?: MembershipStatus,
  ): Observable<{ members: Membership[] }> {
    let url = `${this.baseUrl}/championships/${championshipId}/members`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get<{ members: Membership[] }>(url);
  }

  // Admin: Get pending membership requests
  getPendingMemberships(
    championshipId: string,
  ): Observable<{ pendingRequests: Membership[] }> {
    return this.http.get<{ pendingRequests: Membership[] }>(
      `${this.baseUrl}/championships/${championshipId}/members/pending`,
    );
  }

  // Admin: Approve membership
  approveMembership(
    membershipId: string,
  ): Observable<{ membership: Membership }> {
    return this.http.put<{ membership: Membership }>(
      `${this.baseUrl}/memberships/${membershipId}/approve`,
      {},
    );
  }

  // Admin: Reject membership
  rejectMembership(
    membershipId: string,
  ): Observable<{ membership: Membership }> {
    return this.http.put<{ membership: Membership }>(
      `${this.baseUrl}/memberships/${membershipId}/reject`,
      {},
    );
  }

  // Admin: Remove membership
  removeMembership(membershipId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/memberships/${membershipId}`,
    );
  }
}
