/* eslint-disable max-lines-per-function */
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  useReducer as useStdbReducer,
  useSpacetimeDB,
  useTable,
} from 'spacetimedb/react';

import { client } from '@/api';
import type { CreateFormProps, JoinFormProps } from '@/components/login-form';
import { JoinGameForm, NewGameForm } from '@/components/login-form';
import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';

import { reducers, tables } from '../module_bindings';

type PendingCreation = {
  username: string;
  playerSnapshot: Set<string>;
  gameSnapshot: Set<string>;
  playerId?: bigint;
  gameId?: bigint;
  requestedGamePlayer?: boolean;
};

export default function Login() {
  const router = useRouter();
  //const signIn = useAuth.use.signIn();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [pendingCreate, setPendingCreate] = useState<PendingCreation | null>(
    null
  );

  const { identity, isActive } = useSpacetimeDB();

  const createPlayer = useStdbReducer(reducers.createPlayer);
  const createGame = useStdbReducer(reducers.createGame);
  const createGamePlayer = useStdbReducer(reducers.createGamePlayer);
  //const joinGameReducer = useStdbReducer(reducers.joinGame);

  const [players] = useTable(tables.player);
  console.log('players:', players);
  const [games] = useTable(tables.game);
  console.log('games:', games);
  const [gamePlayers] = useTable(tables.gamePlayer);

  console.log('identity: ', identity);
  console.log('is active: ', isActive);

  const onCreateNewGame: CreateFormProps['onSubmit'] = async (data) => {
    if (!isActive) {
      console.log('Not connected to SpacetimeDB yet');
      return;
    }

    const username = data.name.trim();
    console.log('username: ', username);
    const playerSnapshot = new Set(players.map((p) => p.id.toString()));
    const gameSnapshot = new Set(games.map((g) => g.id.toString()));

    setPendingCreate({
      username,
      playerSnapshot,
      gameSnapshot,
    });

    createPlayer({ username });
    createGame();
  };

  useEffect(() => {
    if (!pendingCreate) {
      return;
    }

    let updated = pendingCreate;

    if (!pendingCreate.playerId) {
      const newPlayer = players.find(
        (p) =>
          !pendingCreate.playerSnapshot.has(p.id.toString()) &&
          p.username.toLowerCase() === pendingCreate.username.toLowerCase()
      );
      if (newPlayer) {
        updated = { ...updated, playerId: BigInt(newPlayer.id) };
      }
    }

    if (!pendingCreate.gameId) {
      const newGame = games.find(
        (g) => !pendingCreate.gameSnapshot.has(g.id.toString())
      );
      if (newGame) {
        updated = { ...updated, gameId: BigInt(newGame.id) };
      }
    }

    if (updated !== pendingCreate) {
      setPendingCreate(updated);
    }
  }, [games, pendingCreate, players]);

  useEffect(() => {
    if (
      !pendingCreate ||
      pendingCreate.requestedGamePlayer ||
      !pendingCreate.playerId ||
      !pendingCreate.gameId
    ) {
      return;
    }

    createGamePlayer({
      playerId: pendingCreate.playerId,
      gameId: pendingCreate.gameId,
      isFirst: true,
    });

    setPendingCreate((prev) =>
      prev ? { ...prev, requestedGamePlayer: true } : prev
    );
  }, [createGamePlayer, pendingCreate]);

  useEffect(() => {
    if (
      !pendingCreate?.requestedGamePlayer ||
      !pendingCreate.playerId ||
      !pendingCreate.gameId
    ) {
      return;
    }

    const gamePlayer = gamePlayers.find(
      (gp) =>
        gp.playerId === pendingCreate.playerId &&
        gp.gameId === pendingCreate.gameId
    );

    if (!gamePlayer) {
      return;
    }

    router.push({
      pathname: '/(app)',
      params: {
        gameId: String(gamePlayer.gameId),
        gpId: String(gamePlayer.id),
        playerId: String(gamePlayer.playerId),
      },
    });
    setPendingCreate(null);
  }, [gamePlayers, pendingCreate, router]);

  const onJoinGame: JoinFormProps['onSubmit'] = async (data) => {
    try {
      //id = Number(data.id);
      //const game = joinGameReducer({ gameId: id, player_name: data.name });
      console.log('Data given: ', data);
      const res = await client.post(`/game/${data.id}`, {
        playerName: data.name,
      });

      console.log('Data recieved:', res.data);
      const gamePlayer = res.data.gpId;
      const gameId = res.data.gameId;
      const playerId = res.data.playerId;

      //signIn({ access: 'access-token', refresh: 'refresh-token' });

      router.push({
        pathname: '/(app)',
        params: {
          gameId: String(gameId),
          gpId: gamePlayer,
          playerId: playerId,
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.log(
          'join game error',
          err.response?.status,
          err.response?.data
        );
      }
    }
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
