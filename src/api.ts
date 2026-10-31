import { Donation, Claim, Delivery, User, ImpactMetrics } from './types.ts';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error) {
        errorMsg = errorJson.error;
      }
    } catch {
      // Use fallback errorMsg
    }
    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Health & Diagnostics
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<{
      status: string;
      service: string;
      database: string;
      databaseName?: string;
      databaseTime?: string;
      error?: string;
    }>(res);
  },

  async getMetrics(): Promise<ImpactMetrics> {
    const res = await fetch(`${API_BASE}/metrics`);
    return handleResponse<ImpactMetrics>(res);
  },

  // Donations CRUD
  async getDonations(filter?: { status?: string; category?: string; donorId?: number }): Promise<Donation[]> {
    const params = new URLSearchParams();
    if (filter?.status && filter.status !== 'all') params.append('status', filter.status);
    if (filter?.category && filter.category !== 'all') params.append('category', filter.category);
    if (filter?.donorId) params.append('donorId', String(filter.donorId));

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/donations${query}`);
    return handleResponse<Donation[]>(res);
  },

  async getDonationById(id: number): Promise<Donation> {
    const res = await fetch(`${API_BASE}/donations/${id}`);
    return handleResponse<Donation>(res);
  },

  async createDonation(data: Partial<Donation>, token?: string): Promise<Donation> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/donations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<Donation>(res);
  },

  async updateDonation(id: number, data: Partial<Donation>, token?: string): Promise<Donation> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/donations/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<Donation>(res);
  },

  async deleteDonation(id: number, token?: string): Promise<{ success: boolean }> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/donations/${id}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Claims CRUD
  async getClaims(): Promise<Claim[]> {
    const res = await fetch(`${API_BASE}/claims`);
    return handleResponse<Claim[]>(res);
  },

  async createClaim(data: Partial<Claim>, token?: string): Promise<Claim> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/claims`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<Claim>(res);
  },

  async updateClaimStatus(id: number, status: string, token?: string): Promise<Claim> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/claims/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    return handleResponse<Claim>(res);
  },

  // Deliveries CRUD
  async getDeliveries(): Promise<Delivery[]> {
    const res = await fetch(`${API_BASE}/deliveries`);
    return handleResponse<Delivery[]>(res);
  },

  async createDelivery(data: Partial<Delivery>, token?: string): Promise<Delivery> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/deliveries`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<Delivery>(res);
  },

  async updateDeliveryStatus(id: number, status: string, notes?: string, token?: string): Promise<Delivery> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/deliveries/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, deliveryNotes: notes }),
    });
    return handleResponse<Delivery>(res);
  },

  // Users & Admin
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`);
    return handleResponse<User[]>(res);
  },

  async syncUser(userData: Partial<User>, token?: string): Promise<User> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/users/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });
    return handleResponse<User>(res);
  },

  async updateUser(id: number, data: Partial<User>, token?: string): Promise<User> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  async deleteUser(id: number, token?: string): Promise<{ success: boolean }> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async getAdminDiagnostics(): Promise<{
    database: string;
    connected: boolean;
    stats: {
      total_users: string | number;
      total_donations: string | number;
      total_claims: string | number;
      total_deliveries: string | number;
    };
  }> {
    const res = await fetch(`${API_BASE}/admin/diagnostics`, { method: 'POST' });
    return handleResponse(res);
  },
};
