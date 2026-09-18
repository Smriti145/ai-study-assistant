import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api'
    : 'http://localhost:8000/api'
  : '';
let base = DEFAULT_URL;
let token = '';

export async function loadConnection() {
  const saved = await AsyncStorage.getItem('studyspace.apiUrl');
  if (saved && (__DEV__ || saved.startsWith('https://'))) base = saved;
  return base;
}
export async function configure(url: string, accessToken: string) {
  const normalized = url.trim().replace(/\/$/, '');
  if (!/^https?:\/\/[^\s]+\/api$/.test(normalized))
    throw new Error('Enter a backend URL ending in /api.');
  if (!__DEV__ && !normalized.startsWith('https://'))
    throw new Error('Release builds require HTTPS.');
  await AsyncStorage.setItem('studyspace.apiUrl', normalized);
  base = normalized;
  // Session tokens stay in memory. Never store provider keys in the app.
  token = accessToken.trim();
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!base) throw new Error('Set your backend URL in Connection.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => null);
    if (!response.ok)
      throw new Error(
        typeof data?.detail === 'string'
          ? data.detail
          : `Request failed (${response.status}). Check your input and connection.`,
      );
    if (!data) throw new Error('The backend returned an invalid response.');
    return data as T;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError')
      throw new Error('Request timed out. Please try again.');
    if (e instanceof TypeError)
      throw new Error(
        'Cannot reach the backend. Check Connection and your network.',
      );
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
export const post = <T>(path: string, body: unknown) =>
  api<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
export type Solution = {
  id: number;
  problem: string;
  subject: string;
  hint: string;
  steps: string[];
  answer: string;
  verification: string;
};
export type Card = {
  id: number;
  front: string;
  back: string;
  due_at: string;
  version: number;
};
export type Deck = { id: number; title: string; cards: Card[] };
export type DeckSummary = {
  id: number;
  title: string;
  due: number;
  total: number;
};
export type Insights = {
  attempts: number;
  accuracy: number | null;
  solutions: number;
  reviews: number;
  streak: number;
  active_days: number;
  subjects: { subject: string; score: number | null; attempts: number }[];
  review_ratings: Record<string, number>;
  activity: { activity: string; date: string; result: string }[];
};
