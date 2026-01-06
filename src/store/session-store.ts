import { useEffect } from 'react';
import { type Identity } from 'spacetimedb';
import { useTable } from 'spacetimedb/react';
import { create } from 'zustand';

import { createSelectors } from '@/lib/utils';
import { type DbConnection, tables } from '@/module_bindings';
import { type Player } from '@/module_bindings/player_type';

type SessionDataState = {
  identity: Identity | null;
  connection: DbConnection | null;
  playerId: bigint | null;
  player: Player | null;
  username: string | null;
  isGuest: boolean;
  authState: 'guest' | 'identified' | 'authed' | null;
  setIdentity: (identity: Identity) => void;
  setConnection: (conn: DbConnection) => void;
  setPlayerId: (playerId: bigint | null) => void;
  setPlayer: (player: Player | null) => void;
  setUsername: (username: string | null) => void;
  setIsGuest: (isGuest: boolean) => void;
  reset: () => void;
};

const _useSessionStore = create<SessionDataState>((set) => ({
  identity: null,
  connection: null,
  playerId: null,
  player: null,
  username: null,
  isGuest: true,
  authState: null,
  setIdentity: (identity) => set({ identity }),
  setConnection: (connection) => set({ connection }),
  setPlayerId: (playerId) => set({ playerId }),
  setPlayer: (player) => set({ player, username: player?.username ?? null }),
  setUsername: (username) => set({ username }),
  setIsGuest: (isGuest) => set({ isGuest }),
  reset: () =>
    set({
      identity: null,
      connection: null,
      playerId: null,
      player: null,
      username: null,
      isGuest: true,
      authState: null,
    }),
}));

export const useSessionStore = createSelectors(_useSessionStore);

// Keep the session store's player in sync with the players table when a playerId is set.
export function useSessionPlayerSync() {
  const [players] = useTable(tables.player) ?? [];
  const playerId = useSessionStore.use.playerId();
  const player = useSessionStore.use.player();
  const setPlayer = useSessionStore.use.setPlayer();

  useEffect(() => {
    if (!playerId) {
      if (player) setPlayer(null);
      return;
    }

    const match =
      players?.find((p: Player) => BigInt(p.id) === BigInt(playerId)) ?? null;

    if (match && (!player || match.id !== player.id)) {
      setPlayer(match);
      console.log('match: ', match);
    }
  }, [playerId, player, players, setPlayer]);
}
