import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, configure, post } from '../src/api';

beforeEach(() => {
  jest.clearAllMocks();
});
afterEach(() => {
  jest.useRealTimers();
});

test('normalizes connection and sends session token without persisting it', async () => {
  await configure('https://study.example/api/', 'session-token');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    'studyspace.apiUrl',
    'https://study.example/api',
  );
  globalThis.fetch = jest.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: async () => ({ reviews: 2 }),
  });
  await post('/flashcards/cards/1/review', { rating: 'good', version: 0 });
  expect(fetch).toHaveBeenCalledWith(
    'https://study.example/api/flashcards/cards/1/review',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ rating: 'good', version: 0 }),
    }),
  );
  const options = (fetch as jest.Mock).mock.calls[0][1];
  expect(options.headers.get('Authorization')).toBe('Bearer session-token');
  expect(
    JSON.stringify((AsyncStorage.setItem as jest.Mock).mock.calls),
  ).not.toContain('session-token');
});
test('surfaces ownership and stale review errors', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    status: 409,
    ok: false,
    json: async () => ({ detail: 'This card changed. Reopen the deck.' }),
  });
  await expect(api('/flashcards/cards/1/review')).rejects.toThrow(
    'This card changed. Reopen the deck.',
  );
});
test('handles invalid response, network failure and timeout distinctly', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: async () => {
      throw new Error('not json');
    },
  });
  await expect(api('/analytics')).rejects.toThrow('invalid response');
  globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('offline'));
  await expect(api('/analytics')).rejects.toThrow('Cannot reach');
  jest.useFakeTimers();
  globalThis.fetch = jest.fn().mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () =>
          reject(Object.assign(new Error(), { name: 'AbortError' })),
        );
      }),
  );
  // Attach the assertion before advancing the timeout to avoid an unhandled rejection.
  // eslint-disable-next-line jest/valid-expect
  const check = expect(api('/analytics')).rejects.toThrow('timed out');
  await jest.advanceTimersByTimeAsync(120000);
  await check;
});
test('validates connection before saving', async () => {
  await expect(configure('not-a-url', '')).rejects.toThrow('ending in /api');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});
