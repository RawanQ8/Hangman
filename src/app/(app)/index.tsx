import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSpacetimeDB } from 'spacetimedb/react';

import { FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { normalizeId } from '@/lib/normalize-id';

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
  const [renderKey, setRenderKey] = useState(0);

  const { isActive: connected } = useSpacetimeDB();

  useEffect(() => {
    if (!params?.gameId || !params?.playerId || !params?.gpId) return;

    const parsedGame = normalizeId(params.gameId);
    const parsedPlayer = normalizeId(params.playerId);
    const parsedGP = normalizeId(params.gpId);

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

  useEffect(() => {
    // Force re-render when connection state changes
    setRenderKey((k) => k + 1);
    console.log('in use effect: ', renderKey);
    console.log(connected);
  }, [connected]);

  return (
    <>
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1">
        <ScrollView
          className="scroll-m-1 px-4"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {connected ? (
            <Game
              key={renderKey}
              gameId={gameId}
              playerId={playerId}
              gpId={gpId}
            />
          ) : (
            <Text className="bg-emerald-400">Connecting to SpacetimeDB...</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
