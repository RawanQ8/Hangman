export const client = new SpacetimeDBClient({
  // You’ll replace this with your actual SpacetimeDB URL
  url: 'wss://maincloud.spacetimedb.com',
  database: 'hangman',
});

export default client;
