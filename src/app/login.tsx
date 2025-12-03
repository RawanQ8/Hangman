/* eslint-disable max-lines-per-function */
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';

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
import { useAuth } from '@/lib';

export default function Login() {
  const router = useRouter();
  const signIn = useAuth.use.signIn();
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const onCreateNewGame: CreateFormProps['onSubmit'] = async (data) => {
    try {
      const res = await client.post('/game', { playerName: data.name });
      const game = res.data;

      signIn({ access: 'access-token', refresh: 'refresh-token' });

      router.push({
        pathname: '/(app)',
        params: { gameId: String(game.id) },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.log(
          'create game error',
          err.response?.status,
          err.response?.data
        );
      }
      console.log('Front end error creating game', err);
    }
  };

  const onJoinGame: JoinFormProps['onSubmit'] = async (data) => {
    try {
      console.log(data);
      const res = await client.post(`/game/${data.id}`, {
        playerName: data.name,
      });
      const game = res.data;

      signIn({ access: 'access-token', refresh: 'refresh-token' });

      router.push({
        pathname: '/(app)',
        params: { gameId: String(game.id) },
      });
    } catch (err) {
      //console.log('Front end error creating game', err);
      if (axios.isAxiosError(err)) {
        console.log(
          'create game error',
          err.response?.status,
          err.response?.data
        );
        console.log(
          'create game error',
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
