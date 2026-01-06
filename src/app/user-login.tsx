import { useRouter } from 'expo-router';

import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
export default function Login() {
  const router = useRouter();

  const onJoinGuest = () => {
    router.push({
      pathname: '/(app)',
    });
  };

  return (
    <>
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1 items-center justify-center p-4">
        <View className="mb-4 items-center">
          <Text className="text-3xl font-bold">Hangman</Text>
        </View>

        <View className="mb-4 flex-row justify-center gap-3">
          <Button
            className={`flex-1  bg-blue-900`}
            label="Create Account"
            onPress={() => {}}
          />
          <Button
            className={`flex-1  bg-blue-900`}
            label="Log In"
            onPress={() => {}}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
