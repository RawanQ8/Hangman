'use client';

import { DbConnection } from '@/module_bindings';

import { cleanupConnectionListener } from './connection-events';
import { onConnect, onConnectError, onDisconnect } from './connection-handlers';
import { getItem } from './storage';
import { cleanupSubscriptionListener } from './subscription-events';

let singleConnection: DbConnection | null = null;

export const getDbConnection = (): DbConnection | null => {
  console.log('hello from ', singleConnection);
  const isSSR = typeof window === 'undefined';
  if (isSSR) {
    throw new Error('Cannot use SpacetimeDB on the server.');
  }

  if (singleConnection) return singleConnection;
  singleConnection = buildDbConnection();
  console.log('built connection: ', singleConnection?.isActive);
  return buildDbConnection();
};

const buildDbConnection = () => {
  console.log('Building connection ...');
  return DbConnection.builder()
    .withUri('wss://maincloud.spacetimedb.com')
    .withModuleName(
      'c200a021190b1eb70959bdcf083e89b768009b188bfef4fa9e4cb14440318a9f'
    )
    .withCompression('none')
    .withToken(getItem<string>('auth_token') || undefined)
    .onConnect(onConnect)
    .onDisconnect(onDisconnect)
    .onConnectError(onConnectError);
};

export const disconnectDbConnection = () => {
  if (singleConnection) {
    console.log('Disconnecting from SpacetimeDB ...');
    singleConnection.disconnect();
    singleConnection = null;
  }
  cleanupConnectionListener();
  cleanupSubscriptionListener();
};
