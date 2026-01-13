import { type Identity } from 'spacetimedb';

import { type DbConnection, type ErrorContext } from '@/module_bindings';
import { useSessionStore } from '@/store/session-store';

import {
  connectionStatus,
  notifyConnectionDisconnected,
  notifyConnectionError,
  notifyConnectionEstablished,
} from './connection-events';
import { setItem } from './storage';
import {
  notifySubscriptionApplied,
  notifySubscriptionError,
} from './subscription-events';

export const subscribeToQueries = (conn: DbConnection, queries: string[]) => {
  conn
    ?.subscriptionBuilder()
    .onApplied(() => {
      console.log('Spacetime DB subscribed to queries');
      connectionStatus.isSubscribed = true;
      notifySubscriptionApplied();
    })
    .onError((ctx: ErrorContext) => {
      console.warn('Error subscribing to SpacetimeDB', ctx.event);
      connectionStatus.isSubscribed = false;
      notifySubscriptionError();
    })
    .subscribe(queries);
};

export const onConnect = (
  conn: DbConnection,
  identity: Identity,
  token: string
) => {
  console.log('Connected to SpacetimeDB');

  const { setIdentity, setConnection } = useSessionStore.getState();
  setIdentity(identity);
  setConnection(conn);

  connectionStatus.isConnected = true;
  connectionStatus.error = null;
  connectionStatus.identity = identity;
  setItem('auth_token', token);

  notifyConnectionEstablished();
  //subscribeToQueries(conn, ['SELECT * FROM player']);
};

export const onDisconnect = () => {
  console.warn('Disconnected from SpacetimeDB');
  connectionStatus.isConnected = false;
  connectionStatus.isSubscribed = false;
  notifyConnectionDisconnected();
};

export const onConnectError = (_ctx: ErrorContext, err: Error) => {
  console.log('*** onConnectError fired ***', err);

  // If it's a normal Error, log message
  if (err instanceof Error) {
    console.log('Spacetime error message:', err.message);
  }
  connectionStatus.isConnected = false;
  connectionStatus.isSubscribed = false;
  connectionStatus.error = err;
  notifyConnectionError();
};
