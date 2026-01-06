/* eslint-disable max-lines-per-function */
import 'react-native-worklets';

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useSpacetimeDB } from 'spacetimedb/react';

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
import { normalizeId } from '@/lib/normalize-id';
import { type Player } from '@/module_bindings/player_type';
import { useGameDataStore } from '@/store/game-data-store';
import { useSessionStore } from '@/store/session-store';

import useReducerInvoker from '../../hooks/useReducerInvoker';

export default function Lobby() {
  const router = useRouter();
  const { isGuest: isGuestParam } = useLocalSearchParams<{
    isGuest?: string;
  }>();
  const isGuest = isGuestParam === 'true';
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [pendingCreate, setPendingCreate] = useState(false);
  const [pendingJoin, setPendingJoin] = useState(false);
  const [targetGameId, setTargetGameId] = useState<bigint | null>(null);
  const spacetime = useSpacetimeDB();
  const { isActive } = spacetime;

  const identity = useSessionStore((s) => s.identity);

  //const createPlayer = useReducerInvoker('create_player');
  const createGame = useReducerInvoker('create_game');
  const createGamePlayer = useReducerInvoker('create_game_player');
  const createPlayer = useReducerInvoker('create_player');
  const joinGame = useReducerInvoker('join_game');
  const getLatestPlayer = useReducerInvoker('get_latest_player');

  const guestPlayer =
    useLatestResponse<Player>('create_player', identity) ?? null;
  const latestPlayer =
    useLatestResponse<Player>('get_latest_player', identity) ?? null;
  const existingPlayer =
    useLatestResponse<Player>('get_or_create_player', identity) ?? null;

  const currentPlayer = isGuest
    ? guestPlayer
    : (latestPlayer ?? existingPlayer);

  const currentGame = useLatestResponse('create_game', identity) ?? null;
  const currentGamePlayer =
    useLatestResponse('create_game_player', identity) ?? null;
  const setPlayerId = useSessionStore((state) => state.setPlayerId);
  const setSessionPlayer = useSessionStore((state) => state.setPlayer);
  const username = useSessionStore(
    (state) => state.username ?? state.player?.username ?? ''
  );
  const setCurrentGame = useGameDataStore((state) => state.setCurrentGame);
  const setCurrentPlayer = useGameDataStore((state) => state.setCurrentPlayer);
  const setCurrentGamePlayer = useGameDataStore(
    (state) => state.setCurrentGamePlayer
  );

  const lastPlayerIdRef = useRef<bigint | null>(currentPlayer?.id ?? null);
  const lastGameIdRef = useRef<bigint | null>(currentGame?.id ?? null);
  const lastGpIdRef = useRef<bigint | null>(currentGamePlayer?.id ?? null);

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
      if (isGuest) {
        if (currentPlayer.id === lastPlayerIdRef.current) {
          return;
        }
      }
      if (!isGuest) {
        console.log('joining with existing player: ', currentPlayer?.username);
      }

      const playerId = normalizeId(currentPlayer.id);
      const gameId = normalizeId(targetGameId);
      try {
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

    const playerId = String(currentPlayer.id);
    const gpId = String(currentGamePlayer.id);

    console.log(`Moved on with gpId ${gpId}`);

    if (pendingCreate && currentGame) {
      const gameId = String(currentGame.id);
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
      const gameId = String(targetGameId);
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

  useEffect(() => {
    console.log('is guest: ', isGuest);
  }, [isGuest]);
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
    if (isGuest) {
      createPlayer({ username });
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

        {(pendingCreate || pendingJoin) && <LoadingOverlay />}

        {mode === 'create' ? (
          <NewGameForm
            onSubmit={onCreateNewGame}
            defaultName={username !== 'undefined' ? username : ''}
          />
        ) : (
          <JoinGameForm
            onSubmit={onJoinGame}
            defaultName={username !== 'undefined' ? username : ''}
          />
        )}

        <Button
          onPress={() => router.push('/login')}
          label="Go to Login "
          className="w-1/2 self-center bg-blue-900"
        ></Button>

        {/* Legacy email/password login kept for reference */}
        {/* <LoginForm onSubmit={onSubmit} isNewGame={false} /> */}
      </SafeAreaView>
    </>
  );
}
