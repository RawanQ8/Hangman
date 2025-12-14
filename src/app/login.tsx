import { useRouter } from 'expo-router';
import React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';

export default function Login() {
  const router = useRouter();

  const onJoin = () => {
    router.push({
      pathname: '/(app)',
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
            className={`flex-1  bg-blue-900`}
            label="Enter Game"
            onPress={onJoin}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
