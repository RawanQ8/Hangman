import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';
import { useSpacetimeDB } from 'spacetimedb/react';

import { SafeAreaView, Text } from '@/components/ui';

import Hangman from '../../components/hangman';

export default function Home() {
  const params = useLocalSearchParams<{
    gameId?: string;
    playerId?: string;
    gpId?: string;
  }>();

  const { isActive: connected } = useSpacetimeDB();
  console.log('recieved data: ', params);

  const gameIdToSend = BigInt(params.gameId ? params.gameId : 0);
  console.log('type of game id to send', typeof gameIdToSend);
  const playerIdToSend = BigInt(params.playerId ? params.playerId : 0);
  const gpIdToSend = BigInt(params.gpId ? params.gpId : 0);

  return (
    <>
      <SafeAreaView className="flex-1">
        <ScrollView
          className="scroll-m-1 px-4"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {connected ? (
            <Hangman
              //key={renderKey}
              gameId={gameIdToSend}
              playerId={playerIdToSend}
              gpId={gpIdToSend}
            />
          ) : (
            <Text className="bg-emerald-400">Connecting to SpacetimeDB...</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
