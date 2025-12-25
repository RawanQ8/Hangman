import { type Identity } from 'spacetimedb';

export type LeaderboardEntry = {
  identity: Identity | null;
  id: string | number | bigint;
  username: string;
  score: number;
};
