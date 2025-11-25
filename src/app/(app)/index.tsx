import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import { FocusAwareStatusBar, SafeAreaView } from '@/components/ui';

import Game from '../../components/game';

export default function Hangman() {
  const params = useLocalSearchParams<{ gameId?: string }>();
  const [gameId, setGameId] = useState(0);

  useEffect(() => {
    if (!params?.gameId) return;
    const parsed = Number(params.gameId);
    if (!Number.isNaN(parsed)) {
      setGameId(parsed);
    }
  }, [params?.gameId]);

  return (
    <>
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1">
        <ScrollView
          className="scroll-m-2 px-4"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Game gameId={gameId} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
