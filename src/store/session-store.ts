import { type Identity } from 'spacetimedb';
import { create } from 'zustand';

import { createSelectors } from '@/lib/utils';
import { type DbConnection } from '@/module_bindings';

type SessionDataState = {
  identity: Identity | null;
  connection: DbConnection | null;
  setIdentity: (identity: Identity) => void;
  setConnection: (conn: DbConnection) => void;
  reset: () => void;
};

const _useSessionStore = create<SessionDataState>((set) => ({
  identity: null,
  connection: null,
  setIdentity: (identity) => set({ identity }),
  setConnection: (connection) => set({ connection }),
  reset: () =>
    set({
      identity: null,
      connection: null,
    }),
}));

export const useSessionStore = createSelectors(_useSessionStore);
