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
  const [allFetched, setAllFetched] = useState(false);
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

  let currentPlayerId = null;
  let currentGameId = null;

  if (currentPlayer) {
    currentPlayerId = normalizeId(currentPlayer.id);
    console.log('created player id');
  }
  if (currentGame) {
    currentGameId = normalizeId(currentGame.id);
  }

  console.log('identity: ', identity);
  console.log('is active: ', isActive);
  console.log('current player ', currentPlayer);
  console.log('current game ', currentGame);
  console.log('current game player ', currentGamePlayer);

  if (currentGame && currentGamePlayer && currentPlayer) {
    console.log('fetched all info!');
  }

  useEffect(() => {
    if (!pendingCreate) return;
    if (!currentPlayer || !currentGame) return;

    createGamePlayer({
      playerId: currentPlayerId,
      gameId: currentGameId,
      isFirst: true,
    });
  }, [
    currentPlayer,
    currentGameId,
    currentGame,
    createGamePlayer,
    currentPlayerId,
    pendingCreate,
  ]);

  useEffect(() => {
    if (currentGame && currentGamePlayer && currentPlayer) {
      console.log('fetched all data successfully');
      setAllFetched(true);
      const gpId = currentGamePlayer.id;
      console.log('gpId: ', gpId);

      if (pendingCreate && currentGame) {
        console.log('creating game');
        router.push({
          pathname: '/(app)/home',
          params: {
            gameId: currentGame.id || 0n,
            gpId: gpId || 0n,
            playerId: currentPlayer.id || 0n,
          },
        });
        setPendingCreate(false);
      }

      if (pendingJoin && targetGameId) {
        console.log('joining game');
        router.push({
          pathname: '/(app)/home',
          params: {
            gameId: Number(targetGameId) || 0,
            gpId: gpId || 0n,
            playerId: currentPlayer.id || 0n,
          },
        });
        setPendingJoin(false);
      }
    }
  }, [
    allFetched,
    currentGame,
    currentGamePlayer,
    currentPlayer,
    pendingCreate,
    pendingJoin,
    router,
    targetGameId,
  ]);

  const onCreateNewGame: CreateFormProps['onSubmit'] = async (data) => {
    if (!isActive) {
      console.log('Not connected to SpacetimeDB yet');
      return;
    }
    setPendingCreate(true);
    setPendingJoin(false);

    const username = data.name.trim();
    console.log('username: ', username);

    createPlayer({ username });
    createGame();

    console.log('done creating player and game');
    console.log('newest player: ', currentPlayer);
  };

  const onJoinGame: JoinFormProps['onSubmit'] = async (data) => {
    if (!isActive) {
      console.log('Not connected to SpacetimeDB yet');
      return;
    }
    const username = data.name.trim();
    const gameId = BigInt(data.id);
    setPendingJoin(true);
    setPendingCreate(false);
    setTargetGameId(gameId);
    console.log('username: ', username);

    createPlayer({ username });
    console.log('newest player: ', currentPlayer);

    joinGame({ username, gameId });
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
