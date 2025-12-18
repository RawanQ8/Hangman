/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSpacetimeDB } from 'spacetimedb/react';

import type { CreateFormProps, JoinFormProps } from '@/components/login-form';
import { JoinGameForm, NewGameForm } from '@/components/login-form';
import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { useLatestResponse } from '@/hooks/useLatestResponse';
import { normalizeId } from '@/lib/normalize-id';
import { useGameDataStore } from '@/store/game-data-store';

import { reducers, tables } from '../../module_bindings';

type ReducerParams = Record<string, unknown>;

const toCamel = (name: string) =>
  name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const reducersLookup = reducers as Record<string, any>;
const tablesList = Object.values(tables as Record<string, any>);

const getReducerSchema = (name: string) => {
  const camel = toCamel(name);
  return reducersLookup[camel] ?? reducersLookup[name];
};

function useReducerInvoker(name: string) {
  const schema = useMemo(() => getReducerSchema(name), [name]);
  const { getConnection, isActive } = useSpacetimeDB();
  const queueRef = useRef<ReducerParams[]>([]);

  const run = useCallback(
    (params: ReducerParams = {}) => {
      if (!schema) {
        console.error(`Reducer schema not found for ${name}`);
        return;
      }
      const conn = getConnection();
      if (!conn) {
        queueRef.current.push(params);
        return;
      }
      conn.callReducerWithParams(
        schema.name,
        schema.paramsType,
        params,
        'FullUpdate'
      );
      console.log('In reducer with: ', name);
    },
    [schema, getConnection, name]
  );

  useEffect(() => {
    if (!isActive || queueRef.current.length === 0 || !schema) {
      return;
    }
    const pending = queueRef.current.splice(0);
    for (const payload of pending) {
      run(payload);
    }
  }, [isActive, run, schema]);

  return run;
}

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [pendingCreate, setPendingCreate] = useState(false);
  const [pendingJoin, setPendingJoin] = useState(false);
  const [targetGameId, setTargetGameId] = useState<bigint | null>(null);
  const spacetime = useSpacetimeDB();
  const { isActive, identity } = spacetime;

  const connection = spacetime.getConnection?.();
  if (connection) {
    for (const tableDef of tablesList) {
      const snake = tableDef.name;
      const camel = tableDef.accessorName ?? snake;
      if (snake === camel) continue;
      const hasSnake = Object.prototype.hasOwnProperty.call(
        connection.db,
        snake
      );
      if (hasSnake) continue;
      const descriptor = Object.getOwnPropertyDescriptor(connection.db, camel);
      if (!descriptor) continue;
      Object.defineProperty(connection.db, snake, descriptor);
    }
  }

  const createPlayer = useReducerInvoker('create_player');
  const createGame = useReducerInvoker('create_game');
  const createGamePlayer = useReducerInvoker('create_game_player');
  const joinGame = useReducerInvoker('join_game');

  const currentPlayer = useLatestResponse('create_player');
  const currentGame = useLatestResponse('create_game');
  const currentGamePlayer = useLatestResponse('create_game_player');
  const setCurrentGame = useGameDataStore((state) => state.setCurrentGame);
  const setCurrentPlayer = useGameDataStore((state) => state.setCurrentPlayer);
  const setCurrentGamePlayer = useGameDataStore(
    (state) => state.setCurrentGamePlayer
  );

  const lastPlayerIdRef = useRef<bigint | null>(currentPlayer?.id ?? null);
  const lastGameIdRef = useRef<bigint | null>(currentGame?.id ?? null);
  const lastGpIdRef = useRef<bigint | null>(currentGamePlayer?.id ?? null);

  console.log('identity: ', identity);
  console.log('is active: ', isActive);
  // console.log('current player ', currentPlayer);
  // console.log('current game ', currentGame);
  // console.log('current game player ', currentGamePlayer);

  //create a game player when necessary data is fetched
  useEffect(() => {
    //if (!pendingCreate) return;
    if (!currentPlayer || !currentGame) return;

    // Ignore old responses: only act when IDs change
    if (currentPlayer.id === lastPlayerIdRef.current) {
      console.log('old player still');
      return;
    }
    if (pendingCreate) {
      if (currentGame.id === lastGameIdRef.current) {
        console.log('old game still');
        return;
      }

      const playerId = normalizeId(currentPlayer.id);
      const gameId = normalizeId(currentGame.id);

      console.log('creating a game player in use effect (create)');

      createGamePlayer({
        playerId,
        gameId,
        isFirst: true,
      });
    } else if (pendingJoin) {
      const playerId = normalizeId(currentPlayer.id);
      const gameId = normalizeId(targetGameId);
      try {
        console.log('trying to join game');
        joinGame({ gameId, playerId });
      } catch (err) {
        console.error(err);
      }

      console.log('creating a game player in use effect (join)');

      createGamePlayer({
        playerId,
        gameId,
        isFirst: false,
      });
      //joinGame({ game_id: gameId, player_id: playerId });
    }
  }, [
    pendingCreate,
    currentPlayer,
    currentGame,
    createGamePlayer,
    pendingJoin,
    targetGameId,
    joinGame,
  ]);

  useEffect(() => {
    if (!pendingCreate && !pendingJoin) return;
    if (currentPlayer) {
      setCurrentPlayer(currentPlayer);
    }
  }, [currentPlayer, pendingCreate, pendingJoin, setCurrentPlayer]);

  useEffect(() => {
    if (!pendingCreate && !pendingJoin) return;
    if (currentGame) {
      setCurrentGame(currentGame);
    }
  }, [currentGame, pendingCreate, pendingJoin, setCurrentGame]);

  useEffect(() => {
    if (!pendingCreate && !pendingJoin) return;
    if (currentGamePlayer) {
      setCurrentGamePlayer(currentGamePlayer);
    }
  }, [currentGamePlayer, pendingCreate, pendingJoin, setCurrentGamePlayer]);

  //go to game page when all data is fetched
  useEffect(() => {
    if (!currentPlayer || !currentGamePlayer) return;
    // Ignore old gamePlayer: only react to new IDs
    if (currentGamePlayer.id === lastGpIdRef.current) return;
    console.log('fresh player and game player detected');

    const playerId = normalizeId(currentPlayer.id);
    const gpId = normalizeId(currentGamePlayer.id);

    if (pendingCreate && currentGame) {
      const gameId = normalizeId(currentGame.id);
      console.log(`creating game with ids: ${gameId}, ${playerId} and ${gpId}`);
      router.push({
        pathname: '/(app)/home',
        params: {
          gameId,
          gpId,
          playerId,
        },
      });

      // Mark these as the last-used responses
      lastPlayerIdRef.current = currentPlayer.id;
      lastGameIdRef.current = currentGame.id;
      lastGpIdRef.current = currentGamePlayer.id;
      setPendingCreate(false);
    }

    // JOIN FLOW: use the game ID typed by the user
    if (pendingJoin && targetGameId) {
      // If GamePlayer has a gameId field, optionally ensure it matches targetGameId:
      // if (normalizeId(currentGamePlayer.gameId) !== normalizeId(targetGameId)) return;
      const gameId = normalizeId(targetGameId);
      console.log(`joining game with ids: ${gameId}, ${playerId} and ${gpId}`);

      router.push({
        pathname: '/(app)/home',
        params: {
          gameId,
          gpId,
          playerId,
        },
      });
      lastPlayerIdRef.current = currentPlayer.id;
      lastGpIdRef.current = currentGamePlayer.id;
      setPendingJoin(false);
    }
  }, [
    currentPlayer,
    currentGamePlayer,
    currentGame,
    pendingCreate,
    pendingJoin,
    targetGameId,
    router,
  ]);

  const onCreateNewGame: CreateFormProps['onSubmit'] = async (data) => {
    if (!isActive) {
      console.log('Not connected to SpacetimeDB yet');
      return;
    }

    // Snapshot previous IDs before firing reducers
    lastPlayerIdRef.current = currentPlayer?.id ?? null;
    lastGameIdRef.current = currentGame?.id ?? null;
    lastGpIdRef.current = currentGamePlayer?.id ?? null;

    setPendingCreate(true);
    setPendingJoin(false);

    const username = data.name.trim();
    console.log('username:', username);

    createPlayer({ username });
    createGame();
  };

  const onJoinGame: JoinFormProps['onSubmit'] = async (data) => {
    if (!isActive) {
      console.log('Not connected to SpacetimeDB yet');
      return;
    }

    // Snapshot previous IDs before firing reducers
    lastPlayerIdRef.current = currentPlayer?.id ?? null;
    lastGpIdRef.current = currentGamePlayer?.id ?? null;

    const username = data.name.trim();
    const gameId = BigInt(data.id);

    setPendingJoin(true);
    setPendingCreate(false);
    setTargetGameId(gameId);
    console.log('username:', username);

    createPlayer({ username });
  };

  return (
    <>
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1 p-4">
        <View className="mb-4 items-center">
          <Text className="text-3xl font-bold">Hangman</Text>
          <Text className="text-gray-600">
            Create a game or join an existing one.
          </Text>
        </View>

        <View className="mb-4 flex-row justify-center gap-3">
          <Button
            className={`flex-1 ${mode === 'create' ? 'bg-blue-900' : 'bg-gray-400'}`}
            label="Create Game"
            onPress={() => setMode('create')}
          />
          <Button
            className={`flex-1 ${mode === 'join' ? 'bg-blue-900' : 'bg-gray-400'}`}
            label="Join Game"
            onPress={() => setMode('join')}
          />
        </View>

        {mode === 'create' ? (
          <NewGameForm onSubmit={onCreateNewGame} />
        ) : (
          <JoinGameForm onSubmit={onJoinGame} />
        )}

        {/* Legacy email/password login kept for reference */}
        {/* <LoginForm onSubmit={onSubmit} isNewGame={false} /> */}
      </SafeAreaView>
    </>
  );
}
