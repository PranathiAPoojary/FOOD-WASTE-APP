export type UserRole = 'donor' | 'recipient' | 'volunteer' | 'admin';

export interface User {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  organization?: string | null;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean;
  createdAt?: string;
}

export type FoodCategory =
  | 'Prepared Meals'
  | 'Produce'
  | 'Bakery'
  | 'Dairy'
  | 'Pantry'
  | 'Other';

export type DonationStatus =
  | 'available'
  | 'claimed'
  | 'in_transit'
  | 'completed'
  | 'cancelled';

export interface Donation {
  id: number;
  donorId: number;
  donorUid: string;
  title: string;
  description: string;
  category: FoodCategory | string;
  quantity: string;
  servings: number;
  expiryDate: string;
  pickupLocation: string;
  pickupWindow: string;
  dietaryInfo?: string | null;
  storageCondition?: 'Ambient' | 'Refrigerated' | 'Frozen' | string;
  status: DonationStatus;
  imageUrl?: string | null;
  recipientId?: number | null;
  volunteerId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  donorName?: string;
  donorEmail?: string;
  donorOrg?: string;
  donorPhone?: string;
}

export interface Claim {
  id: number;
  donationId: number;
  recipientId: number;
  recipientUid: string;
  requestedServings: number;
  urgency: 'Urgent' | 'Standard' | 'Flexible' | string;
  notes?: string | null;
  status: 'pending' | 'approved' | 'picked_up' | 'delivered' | 'cancelled' | string;
  createdAt?: string;
  donationTitle?: string;
  donationCategory?: string;
  donationLocation?: string;
  recipientName?: string;
  recipientOrg?: string;
  recipientPhone?: string;
}

export interface Delivery {
  id: number;
  donationId: number;
  claimId?: number | null;
  volunteerId: number;
  volunteerUid: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | string;
  pickupTime?: string | null;
  deliveryTime?: string | null;
  deliveryNotes?: string | null;
  createdAt?: string;
  donationTitle?: string;
  pickupLocation?: string;
  pickupWindow?: string;
  volunteerName?: string;
  volunteerPhone?: string;
}

export interface ImpactMetrics {
  totalMealsRescued: number;
  co2DivertedKg: number;
  activeDonors: number;
  activeRecipients: number;
  totalDonationsCount: number;
  totalUsersCount: number;
}
