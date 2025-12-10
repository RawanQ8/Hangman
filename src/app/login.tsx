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

import { reducers, tables } from '../module_bindings';

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

  console.log('identity: ', identity);
  console.log('is active: ', isActive);
  // console.log('players ', players);
  // console.log('games ', games);
  // console.log('gamePlayers ', gamePlayers);
  // console.log('first reducer: ', responses[0]);

  const onCreateNewGame: CreateFormProps['onSubmit'] = async (data) => {
    if (!isActive) {
      console.log('Not connected to SpacetimeDB yet');
      return;
    }

    const username = data.name.trim();
    console.log('username: ', username);

    // const player = await createPlayer({ username });
    // const game = await createGame();
    // console.log(`Player object ${player} and game object ${game} created`);

    await createPlayer({ username });
    await createGame();

    console.log('done creating player and game');
    console.log('newest player 2: ', currentPlayer);
    const currentPlayerId = normalizeId(currentPlayer.id);
    console.log('created player id');
    const currentGameId = normalizeId(currentGame.id);

    //console.log('cleaned Game id', currentGameId);
    //console.log('type of Game id', typeof currentGameId);

    console.log(`Player: ${currentPlayerId} and Game ${currentGameId}`);

    try {
      if (Number.isNaN(currentPlayerId) || Number.isNaN(currentGameId)) {
        throw new Error('Invalid player or game id');
      }
      createGamePlayer({
        playerId: currentPlayerId,
        gameId: currentGameId,
        isFirst: true,
      });
    } catch (err) {
      console.error(err);
    }

    //console.log('gp: ', currentGamePlayer);
    const gpId = currentGamePlayer.id;
    console.log('gpId: ', gpId);

    // const stringifiedGameId = currentGameId.toString();
    // const stringifiedGpId = gpId.toString();
    // const stringifiedPlayerId = currentPlayerId.toString();
    //console.log('Type of strinigified id: ', typeof stringifiedGameId);

    router.push({
      pathname: '/(app)',
      params: {
        gameId: currentGame.id || 0n,
        gpId: gpId || 0n,
        playerId: currentPlayer.id || 0n,
      },
    });
  };

  const onJoinGame: JoinFormProps['onSubmit'] = async (data) => {
    if (!isActive) {
      console.log('Not connected to SpacetimeDB yet');
      return;
    }

    const username = data.name.trim();
    console.log('username: ', username);
    const gameId = data.id;
    console.log('gameId: ', gameId);

    createPlayer({ username });

    const currentPlayerId = normalizeId(currentPlayer.id);

    const currentGameId = normalizeId(gameId);
    console.log('normalized game id: ', currentGameId);
    joinGame({ username: username, gameId: currentGameId });

    try {
      if (Number.isNaN(currentPlayerId) || Number.isNaN(currentGameId)) {
        console.log('throwing err');
        throw new Error('Invalid player or game id');
      }
      console.log('trying to create game player');
      createGamePlayer({
        playerId: currentPlayerId,
        gameId: currentGameId,
        isFirst: false,
      });
    } catch (err) {
      console.error(err);
    }
    console.log('gp: ', currentGamePlayer);
    const gpId = currentGamePlayer.id;
    console.log('gpId: ', gpId);

    router.push({
      pathname: '/(app)',
      params: {
        gameId: String(currentGameId) || '0',
        gpId: String(gpId) || '0',
        playerId: String(currentPlayerId) || '0',
      },
    });
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
