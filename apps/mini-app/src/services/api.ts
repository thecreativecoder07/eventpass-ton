import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Telegram auth token
api.interceptors.request.use((config) => {
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.initData) {
    config.headers['X-Telegram-Init-Data'] = tg.initData;
  }
  return config;
});

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
  basePrice: number;
  maxTickets: number;
  ticketsSold: number;
  status: string;
}

export interface Ticket {
  id: string;
  tokenId: number;
  eventId: string;
  tier: number;
  seatInfo: string;
  paymentChain: string;
  pricePaid: number;
  checkedIn: boolean;
  mintedAt: string;
}

export const eventApi = {
  list: () => api.get<Event[]>('/events').then((r) => r.data),
  get: (id: string) => api.get<Event>(`/events/${id}`).then((r) => r.data),
};

export const ticketApi = {
  myTickets: () => api.get<Ticket[]>('/tickets/my').then((r) => r.data),
};
