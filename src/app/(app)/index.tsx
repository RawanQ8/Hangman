/* eslint-disable max-lines-per-function */
import 'react-native-worklets';

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';

import type { CreateFormProps, JoinFormProps } from '@/components/login-form';
import { JoinGameForm, NewGameForm } from '@/components/login-form';
import {
  Button,
  FocusAwareStatusBar,
  LoadingOverlay,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { useLatestResponse } from '@/hooks/useLatestResponse';
import { parseReducerError, shallowEqualIdentity, useAuth } from '@/lib';
import { normalizeId } from '@/lib/normalize-id';
import { tables } from '@/module_bindings';
import { type Player } from '@/module_bindings/player_type';
import { useGameDataStore } from '@/store/game-data-store';
import { useSessionStore } from '@/store/session-store';

import useReducerInvoker from '../../hooks/useReducerInvoker';

const watchedReducers = new Set([
  'join_game',
  'create_game',
  'create_game_player',
  'create_player',
]);

export default function Lobby() {
  const router = useRouter();
  const { userType: playerTypeParam } = useLocalSearchParams<{
    userType?: string;
  }>();
  const isGuest = useAuth.use.status() === 'guest';
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [pendingCreate, setPendingCreate] = useState(false);
  const [pendingJoin, setPendingJoin] = useState(false);
  const [targetGameId, setTargetGameId] = useState<bigint | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const spacetime = useSpacetimeDB();
  const { isActive } = spacetime;
  const [responses] = useTable(tables.reducerResponse) ?? [];

  const identity = useSessionStore((s) => s.identity);

  const createGame = useReducerInvoker('create_game');
  const createGamePlayer = useReducerInvoker('create_game_player');
  const createPlayer = useReducerInvoker('create_player');
  const joinGame = useReducerInvoker('join_game');
  const getLatestPlayer = useReducerInvoker('get_latest_player');

  // const newPlayer =
  //   useLatestResponse<Player>('create_player', identity) ?? null;
  // const latestPlayer =
  //   useLatestResponse<Player>('create_player', identity) ?? null;
  const existingPlayer =
    useLatestResponse<Player>('get_player_by_username', identity) ?? null;
  const newPlayer =
    useLatestResponse<Player>('create_player', identity) ?? null;
  const currentPlayer = isGuest ? newPlayer : existingPlayer;

  useEffect(() => {
    console.log('user type was: ', playerTypeParam);
    console.log('Current Player is now: ', currentPlayer);
  }, [currentPlayer, playerTypeParam]);

  useEffect(() => {
    if (isGuest) {
    }
  }, [isGuest]);

  const currentGame = useLatestResponse('create_game', identity) ?? null;
  const currentGamePlayer =
    useLatestResponse('create_game_player', identity) ?? null;
  const setPlayerId = useSessionStore((state) => state.setPlayerId);
  const setSessionPlayer = useSessionStore((state) => state.setPlayer);
  const username = useSessionStore(
    (state) => state.username ?? state.player?.username ?? ''
  );
  //const playerId = useSessionStore((state) => state.player?.id);
  const setCurrentGame = useGameDataStore((state) => state.setCurrentGame);
  const setCurrentPlayer = useGameDataStore((state) => state.setCurrentPlayer);
  const setCurrentGamePlayer = useGameDataStore(
    (state) => state.setCurrentGamePlayer
  );

  const lastPlayerIdRef = useRef<bigint | null>(currentPlayer?.id ?? null);
  const lastGameIdRef = useRef<bigint | null>(currentGame?.id ?? null);
  const lastGpIdRef = useRef<bigint | null>(currentGamePlayer?.id ?? null);
  const lastErrorIdRef = useRef<bigint | null>(null);

  //create a game player when necessary data is fetched
  useEffect(() => {
    if (!currentPlayer || !currentGame) {
      console.log(
        'cant create gamePlayer: missing game or player',
        currentPlayer,
        currentGame
      );
      return;
    }

    if (currentPlayer.error) {
      console.warn(currentPlayer.error);
      return;
    }
    if (currentGame.error) {
      console.warn(currentGame.error);
      return;
    }

    // CREATE FLOW: wait for both player and game from reducers
    if (pendingCreate) {
      if (!currentGame) {
        console.log('cant create gamePlayer: missing game');
        return;
      }
      // Ignore the previous response so we only act on fresh reducer outputs
      const playerIsFresh = currentPlayer.id !== lastPlayerIdRef.current;
      const gameIsFresh = currentGame.id !== lastGameIdRef.current;

      // wait until BOTH are fresh
      if (isGuest) {
        console.log('user is guest');
        if (!(playerIsFresh && gameIsFresh)) {
          console.log('cant create gamePlayer: stale game or player ');
          return;
        }
      }

      if (!isGuest) {
        if (!gameIsFresh) return;
        console.log('sticking with same user: ', currentPlayer.username);
      }

      const playerId = normalizeId(currentPlayer.id);
      const gameId = normalizeId(currentGame.id);

      console.log('creating a game player in use effect (create)');

      createGamePlayer({
        playerId,
        gameId,
        isFirst: true,
      });
      return;
    }

    // JOIN FLOW: we only need the new player and the target game ID typed by the user
    if (pendingJoin) {
      if (!targetGameId) return;
      const playerIsFresh = currentPlayer.id !== lastPlayerIdRef.current;

      if (isGuest) {
        console.log(`guest with id: ${currentPlayer?.id}`);
        if (!playerIsFresh) {
          console.log('player is stale, cant create game player');
          return;
        }
      }
      if (!isGuest) {
        console.log('joining with existing player: ', currentPlayer?.username);
      }

      if (currentPlayer.error) {
        console.warn(currentPlayer.error);
        return;
      }
      const playerId = normalizeId(currentPlayer.id);
      const gameId = normalizeId(targetGameId);
      try {
        console.log(`attempting to join game ${gameId} as player ${playerId}`);
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
    }
  }, [
    currentPlayer,
    currentGame,
    createGamePlayer,
    pendingJoin,
    targetGameId,
    joinGame,
    pendingCreate,
    identity,
    isGuest,
  ]);

  useEffect(() => {
    if (!currentPlayer) return;
    setPlayerId(currentPlayer.id);
    setSessionPlayer(currentPlayer);
    setCurrentPlayer(currentPlayer);
  }, [currentPlayer, setCurrentPlayer, setPlayerId, setSessionPlayer]);

  //set the current players and game when pending create or join change
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
    if (currentGamePlayer.id === lastGpIdRef.current) {
      console.log(`Still in old game player: ${currentGamePlayer.id}`);
      return;
    }
    if (!currentGamePlayer) {
      console.log('Cant find game player');
      return;
    }

    const playerId = String(currentPlayer.id);
    const gpId = String(currentGamePlayer.id);

    console.log(`Moved on with gpId ${gpId}`);

    if (pendingCreate && currentGame) {
      const gameId = String(currentGame.id);
      if (currentGame.error || currentGamePlayer.error) {
        console.warn(currentGame.error || currentGamePlayer.error);
        alert(currentGame.error || currentGamePlayer.error);
        setPendingCreate(false);
        return;
      }
      console.log(`creating game with ids: ${gameId}, ${playerId} and ${gpId}`);
      router.replace({
        pathname: '/home',
        params: {
          gameId,
          gpId,
          playerId,
        },
      });

      // Mark these as the last-used responses
      lastPlayerIdRef.current = currentPlayer.id;
      lastGameIdRef.current = currentGame.id ?? 0;
      lastGpIdRef.current = currentGamePlayer.id;
      setPendingCreate(false);
    }

    // JOIN FLOW: use the game ID typed by the user
    if (pendingJoin && targetGameId) {
      const gameId = String(targetGameId);
      console.log('attempt to join game', targetGameId);
      if (currentGame.error) {
        console.warn(currentGame.error);
        alert(currentGame.error);
        setPendingCreate(false);
        return;
      }
      console.log(`joining game with ids: ${gameId}, ${playerId} and ${gpId}`);
      router.replace({
        pathname: '/home',
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

  useEffect(() => {
    console.log('is guest: ', isGuest);
  }, [isGuest]);

  const authStatus = useAuth.use.status();
  useEffect(() => {
    console.log('[lobby] auth status: ', authStatus);
  }, [authStatus]);

  const onCreateNewGame: CreateFormProps['onSubmit'] = async (data) => {
    if (!isActive) {
      console.log('Not connected to SpacetimeDB yet');
      return;
    }
    setErrorMessage(null);

    // Snapshot previous IDs before firing reducers
    lastPlayerIdRef.current = currentPlayer?.id ?? null;
    lastGameIdRef.current = currentGame?.id ?? null;
    lastGpIdRef.current = currentGamePlayer?.id ?? null;

    setPendingCreate(true);
    setPendingJoin(false);

    const username = data.name.trim();
    console.log('username:', username);
    if (isGuest) {
      createPlayer({ username });
      getLatestPlayer({ username });
    } else getLatestPlayer({ username });
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
    setErrorMessage(null);

    const username = data.name.trim();
    const gameId = BigInt(data.id);

    setPendingJoin(true);
    setPendingCreate(false);
    setTargetGameId(gameId);
    console.log('username:', username);

    if (isGuest) {
      createPlayer({ username });
    } else getLatestPlayer({ username });
  };

  useEffect(() => {
    const hasPending = pendingCreate || pendingJoin;
    if (!hasPending) return;

    const currentMode = pendingCreate ? 'create' : 'join';
    const timeout = setTimeout(() => {
      setPendingCreate(false);
      setPendingJoin(false);
      setErrorMessage(
        currentMode === 'create'
          ? 'Game creation timed out. Please try again.'
          : 'Unable to join game. Check the code and try again.'
      );
    }, 8000);

    return () => clearTimeout(timeout);
  }, [pendingCreate, pendingJoin]);

  useEffect(() => {
    if (!pendingCreate && !pendingJoin) return;
    if (!responses || responses.length === 0) return;

    for (const row of responses) {
      if (!watchedReducers.has(row.reducer)) continue;
      if (identity && !shallowEqualIdentity(row.identity, identity)) continue;
      if (lastErrorIdRef.current && row.id <= lastErrorIdRef.current) continue;

      lastErrorIdRef.current = row.id;
      const parsedError = parseReducerError(row.payload);
      if (!parsedError) continue;

      setPendingCreate(false);
      setPendingJoin(false);
      setErrorMessage(parsedError);
      break;
    }
  }, [identity, pendingCreate, pendingJoin, responses]);

  useEffect(() => {
    if (!errorMessage) return;
    alert(errorMessage);
  }, [errorMessage]);

  return (
    <>
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1 p-5">
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

        {(pendingCreate || pendingJoin) && <LoadingOverlay />}

        {mode === 'create' ? (
          <NewGameForm
            onSubmit={onCreateNewGame}
            defaultName={
              username !== 'undefined' ? (!isGuest ? username : '') : ''
            }
            nameLocked={!isGuest}
          />
        ) : (
          <JoinGameForm
            onSubmit={onJoinGame}
            defaultName={username !== 'undefined' ? username : ''}
            nameLocked={!isGuest}
          />
        )}
        {errorMessage && (
          <Text className="mt-2 text-center text-red-600">{errorMessage}</Text>
        )}
        <Button
          onPress={() => router.push('/login')}
          label="Go to Login "
          className="mt-6 w-1/2 self-center bg-blue-900"
        ></Button>
      </SafeAreaView>
    </>
  );
}
