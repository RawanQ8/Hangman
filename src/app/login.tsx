import { useRouter } from 'expo-router';
import React, { useState } from 'react';

import { LoginForm } from '@/components/login-form';
import {
  Button,
  FocusAwareStatusBar,
  LoadingOverlay,
  SafeAreaView,
  View,
} from '@/components/ui';
import useReducerInvoker from '@/hooks/useReducerInvoker';
import { useSessionStore } from '@/store/session-store';
//import { CreatePlayer } from '@/module_bindings';

export default function Login() {
  const router = useRouter();
  const getOrCreatePlayer = useReducerInvoker('get_or_create_player');
  const setUsername = useSessionStore((state) => state.setUsername);
  const [pendingJoin, setPendingJoin] = useState(false);

  const onJoin = (data: Event) => {
    setPendingJoin(true);
    const username = data.name;
    console.log('recieved username: ', username);
    setUsername(username);
    getOrCreatePlayer({ username });
    setTimeout(() => {
      router.push({
        pathname: '/(app)',
        params: { isGuest: 'false' },
      });
    }, 1000);
    setPendingJoin(false);
  };

  const onJoinGuest = () => {
    setUsername('');
    router.push({
      pathname: '/(app)',
      params: { isGuest: 'true' },
    });
  };

  return (
    <>
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1 p-4">
        <LoginForm onSubmit={onJoin} />
        {pendingJoin && <LoadingOverlay />}

        <View className="mb-4 flex-row justify-center gap-3">
          <Button
            className={`flex-1  bg-blue-900`}
            label="Join as Guest"
            onPress={onJoinGuest}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
