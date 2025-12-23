import { useRouter } from 'expo-router';
import React from 'react';

import { Cover } from '@/components/new-cover';
import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { useIsFirstTime } from '@/lib/hooks';

export default function Onboarding() {
  const [_, setIsFirstTime] = useIsFirstTime();
  const router = useRouter();
  return (
    <View className="flex h-full items-center  justify-center">
      <FocusAwareStatusBar />
      <View className="w-full flex-1">
        <Cover />
      </View>
      <View className="justify-end">
        <Text className="my-3 text-center text-5xl font-bold">Hangman</Text>

        <Text className="mb-2 text-center text-lg text-gray-600">
          Challenge your mind. Outsmart your friends.
        </Text>

        <Text className="my-1 pt-6 text-left text-lg">
          🎮 Real-time multiplayer game
        </Text>
        <Text className="my-1 text-left text-lg">
          🧠 Sharpen your logic and word skills
        </Text>
        <Text className="my-1 text-left text-lg">
          🔥 Turn-based strategy, not just guessing
        </Text>
        <Text className="my-1 text-left text-lg">
          🏆 Compete, win, and climb the leaderboard
        </Text>
      </View>
      <SafeAreaView className="mt-6">
        <Button
          label="Let's Get Started "
          onPress={() => {
            setIsFirstTime(false);
            router.replace('/(app)');
          }}
        />
      </SafeAreaView>
    </View>
  );
}
