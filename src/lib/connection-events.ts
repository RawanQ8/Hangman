import { type Identity } from 'spacetimedb';

export const connectionStatus = {
  isConnected: false,
  isSubscribed: false,
  error: null as Error | null,
  identity: null as Identity | null,
  retryAttempt: 0,
  nextRetryInMs: null as number | null,
  lastErrorAt: null as number | null,
};

const listeners = new Set<() => void>();
let reconnectFn: (() => void) | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export const onConnectionChange = (callback: () => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export const notifyConnectionEstablished = () => {
  listeners.forEach((callback) => callback());
};
export const notifyConnectionDisconnected = () => {
  listeners.forEach((callback) => callback());
};
export const notifyConnectionError = () => {
  listeners.forEach((callback) => callback());
};

export const cleanupConnectionListener = () => {
  listeners.clear();
};

export const setReconnectFn = (fn: (() => void) | null) => {
  reconnectFn = fn;
};

export const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  connectionStatus.nextRetryInMs = null;
};

export const requestReconnect = () => {
  clearReconnectTimer();
  reconnectFn?.();
};

export const scheduleReconnectRequest = (delayMs: number) => {
  clearReconnectTimer();
  connectionStatus.nextRetryInMs = delayMs;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    requestReconnect();
  }, delayMs);
};
