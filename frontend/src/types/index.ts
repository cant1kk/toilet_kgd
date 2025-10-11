export interface Toilet {
  id?: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'free' | 'paid' | 'purchase_required';
  price?: string;
  description?: string;
  approved: boolean;
  created_at?: string;
}

export interface Admin {
  id: number;
  username: string;
}

export interface User {
  id: number;
  telegram_id?: number;
  username: string;
  isAdmin?: boolean;
}

export interface ToiletFormData {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  type: 'free' | 'paid' | 'purchase_required';
  price?: string;
  description?: string;
}