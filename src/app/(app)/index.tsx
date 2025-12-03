import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import { FocusAwareStatusBar, SafeAreaView } from '@/components/ui';

import Game from '../../components/game';

export default function Hangman() {
  const params = useLocalSearchParams<{
    gameId?: string;
    playerId?: string;
    gpId?: string;
  }>();
  const [gameId, setGameId] = useState(0);
  const [gpId, setGpId] = useState(0);
  const [playerId, setPlayerId] = useState(0);

  useEffect(() => {
    if (!params?.gameId || !params?.playerId || !params?.gpId) return;

    const parsedGame = Number(params.gameId);
    const parsedPlayer = Number(params.playerId);
    const parsedGP = Number(params.gpId);

    if (!Number.isNaN(parsedGame)) {
      setGameId(parsedGame);
    }
    if (!Number.isNaN(parsedPlayer)) {
      setPlayerId(parsedPlayer);
    }
    if (!Number.isNaN(parsedGP)) {
      setGpId(parsedGP);
    }
  }, [params?.gameId]);

  return (
    <>
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1">
        <ScrollView
          className="scroll-m-1 px-4"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Game gameId={gameId} playerId={playerId} gpId={gpId} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
