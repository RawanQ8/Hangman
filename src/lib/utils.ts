import { Linking } from 'react-native';
import type { StoreApi, UseBoundStore } from 'zustand';

export function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url));
}

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  let store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (let k of Object.keys(store.getState())) {
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }

  return store;
};

export const shallowEqualIdentity = (
  a: Record<string, unknown> | null,
  b: Record<string, unknown> | null
) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};

export const parseReducerError = (payload: string) => {
  if (!payload) return null;

  try {
    const parsed = JSON.parse(payload);
    if (parsed && typeof parsed === 'object' && 'Err' in parsed) {
      const err = (parsed as Record<string, unknown>).Err;
      if (typeof err === 'string') return err;
      return JSON.stringify(err);
    }
    if (typeof parsed === 'string') {
      return parsed.toLowerCase().includes('error') ? parsed : null;
    }
  } catch {
    const lower = payload.toLowerCase();
    if (
      lower.includes('error') ||
      lower.includes('fail') ||
      lower.includes('not found')
    ) {
      return payload;
    }
  }
  return null;
};
