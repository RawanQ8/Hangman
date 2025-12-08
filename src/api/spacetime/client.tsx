import { SpacetimeDBClient } from '@clockworklabs/spacetimedb';
import { useSpacetimeDB } from 'spacetimedb/react';

const { isActive: connected } = useSpacetimeDB();

const connectionBuilder = DbConnection.builder()
  .withUri('wss://maincloud.spacetimedb.com') // where `spacetime start` is running
  // IMPORTANT: this must match the database/module name printed by `spacetime publish`
  // For now, if you followed the quickstart, it’s usually "chat-server" or similar.
  .withModuleName(
    'c200a021190b1eb70959bdcf083e89b768009b188bfef4fa9e4cb14440318a9f'
  )
  //.withToken(localStorage.getItem("auth_token") || undefined)
  .onConnect(onConnect)
  .onDisconnect(onDisconnect)
  .onConnectError(onConnectError);

export const client = new SpacetimeDBClient({
  // You’ll replace this with your actual SpacetimeDB URL
  url: 'wss://maincloud.spacetimedb.com',
  database: 'hangman',
});

export default client;
