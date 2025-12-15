import { create } from 'zustand';

import { createSelectors } from '@/lib/utils';
import type { Game, GamePlayer, Player } from '@/module_bindings';

type GameDataState = {
  currentGame: Game | null;
  currentPlayer: Player | null;
  currentGamePlayer: GamePlayer | null;
  setCurrentGame: (game: Game | null) => void;
  setCurrentPlayer: (player: Player | null) => void;
  setCurrentGamePlayer: (gamePlayer: GamePlayer | null) => void;
  reset: () => void;
};

const _useGameDataStore = create<GameDataState>((set) => ({
  currentGame: null,
  currentPlayer: null,
  currentGamePlayer: null,
  setCurrentGame: (currentGame) => set({ currentGame }),
  setCurrentPlayer: (currentPlayer) => set({ currentPlayer }),
  setCurrentGamePlayer: (currentGamePlayer) => set({ currentGamePlayer }),
  reset: () =>
    set({
      currentGame: null,
      currentPlayer: null,
      currentGamePlayer: null,
    }),
}));

export const useGameDataStore = createSelectors(_useGameDataStore);
