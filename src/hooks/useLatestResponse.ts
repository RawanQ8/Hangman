/* eslint-disable unicorn/filename-case */
import { useEffect, useRef, useState } from 'react';
import { type Identity } from 'spacetimedb';
import { useTable } from 'spacetimedb/react';

import { tables } from '@/module_bindings';

import { type GamePlayer } from '../module_bindings/game_player_type';
import { type Game } from '../module_bindings/game_type';
import { type Player } from '../module_bindings/player_type';

const shallowEqual = (
  a: Record<string, unknown> | Identity | null,
  b: Record<string, unknown> | Identity | null
) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};

export function useLatestResponse<T = Game | GamePlayer | Player | Player[]>(
  reducerName: string,
  currentIdentity: Identity | null
): T | null {
  const [responses] = useTable(tables.reducerResponse) ?? [];
  const lastSeenIdRef = useRef<bigint | null>(null);
  const lastReducerRef = useRef<string | null>(null);
  const [latestPayload, setLatestPayload] = useState<T | null>(null);

  useEffect(() => {
    if (lastReducerRef.current !== reducerName) {
      lastSeenIdRef.current = null;
      lastReducerRef.current = reducerName;
    }

    let newestRowId: bigint | null = null;
    let newestPayload: T | null = null;

    const rows = responses ?? [];
    if (rows.length === 0) {
      return;
    }

    for (const row of rows) {
      if (row.reducer !== reducerName) {
        continue;
      }

      if (row.reducer !== 'create_game' && currentIdentity) {
        if (!shallowEqual(row.identity, currentIdentity)) {
          continue;
        }
      }

      if (lastSeenIdRef.current !== null && row.id <= lastSeenIdRef.current) {
        continue; // already handled or stale
      }
      if (newestRowId === null || row.id > newestRowId) {
        try {
          newestPayload = JSON.parse(row.payload) as T;
          newestRowId = row.id;
        } catch (err) {
          // ignore parse errors, keep looking
          console.log('error found: ', err);
        }
      }
    }

    if (newestRowId !== null && newestPayload !== null) {
      lastSeenIdRef.current = newestRowId;
      setLatestPayload(newestPayload);
    }
  }, [currentIdentity, reducerName, responses]);
  return latestPayload;
}
