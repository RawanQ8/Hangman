/* eslint-disable unicorn/filename-case */
import { useSpacetimeDB, useTable } from 'spacetimedb/react';

import { tables } from '@/module_bindings';

import { type GamePlayer } from '../module_bindings/game_player_type';
import { type Game } from '../module_bindings/game_type';
import { type Player } from '../module_bindings/player_type';

export function useLatestResponse<T = Game | GamePlayer | Player>(
  reducerName: string
): T | null {
  const { identity } = useSpacetimeDB();
  const [responses] = useTable(tables.reducerResponse);

  if (!identity) return null;

  // Scan once for the newest row for this identity/reducer (avoid ordering issues)
  const myIdentity = identity.toHexString();
  const latest = responses.reduce<(typeof responses)[number] | undefined>(
    (latestSoFar, row) => {
      if (
        row.identity.toHexString() !== myIdentity ||
        row.reducer !== reducerName
      ) {
        return latestSoFar;
      }
      if (!latestSoFar || row.id > latestSoFar.id) {
        return row;
      }
      return latestSoFar;
    },
    undefined
  );

  if (!latest) return null;

  try {
    return JSON.parse(latest?.payload) as T;
  } catch {
    return null;
  }
}
