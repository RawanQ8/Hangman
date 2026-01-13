/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';

import { type FormType, LoginForm } from '@/components/login-form';
import {
  Button,
  FocusAwareStatusBar,
  LoadingOverlay,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import useReducerInvoker from '@/hooks/useReducerInvoker';
import { useSessionStore } from '@/store/session-store';
//import { CreatePlayer } from '@/module_bindings';

type AuthTab = 'login' | 'create';

const TAB_COPY: Record<
  AuthTab,
  { label: string; title: string; subtitle: string; ctaLabel: string }
> = {
  login: {
    label: 'Login',
    title: 'Welcome back',
    subtitle: 'Pick up right where you left off.',
    ctaLabel: 'Login',
  },
  create: {
    label: 'Create Account',
    title: 'Create your player',
    subtitle: 'Lock in your username so you can keep your streak alive.',
    ctaLabel: 'Create account',
  },
};

export default function Login() {
  const router = useRouter();
  const getPlayer = useReducerInvoker('get_player_by_username');
  const createPlayer = useReducerInvoker('create_player');
  const setUsername = useSessionStore((state) => state.setUsername);
  const setPlayer = useSessionStore((state) => state.setPlayer);
  const setPlayerId = useSessionStore((state) => state.setPlayerId);
  const username = useSessionStore((state) => state.username ?? '');
  const [activeTab, setActiveTab] = useState<AuthTab>('create');
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleAuth = (data: FormType) => {
    const trimmedName = data.name.trim();
    let newPlayer = false;
    if (!trimmedName) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPending(true);
    setUsername(trimmedName);

    if (activeTab === 'create') {
      createPlayer({ username: trimmedName });
      getPlayer({ username: trimmedName });
      newPlayer = true;
    } else {
      getPlayer({ username: trimmedName });
    }
    const userType = newPlayer ? 'new' : 'login';

    if (userType === 'new') {
      timeoutRef.current = setTimeout(() => {
        router.push({
          pathname: '/(app)',
          params: { isGuest: 'false', userType: 'new' },
        });
        setPending(false);
      }, 900);
    } else {
      timeoutRef.current = setTimeout(() => {
        router.push({
          pathname: '/(app)',
          params: { isGuest: 'false', userType: 'login' },
        });
        setPending(false);
      }, 900);
    }
  };

  const onJoinGuest = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    console.log('creating guest player');
    createPlayer({});
    setUsername('');
    setPlayer(null);
    setPlayerId(null);
    router.push({
      pathname: '/(app)',
      params: { isGuest: 'true' },
    });
  };

  return (
    <>
      <FocusAwareStatusBar />
      <SafeAreaView className="relative flex-1 bg-blue-100">
        <View className="pointer-events-none absolute inset-0 overflow-hidden">
          <View className="absolute -top-10 right-[-20] size-52 rounded-full bg-blue-600/30" />
          <View className="absolute -left-16 bottom-[-60] size-60 rounded-full bg-purple-400/30" />
        </View>

        <ScrollView
          className="z-10 flex-1"
          contentContainerClassName="flex-grow"
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-5 py-6">
            <View className="mb-8">
              <Text className="text-4xl font-extrabold text-black">
                Hangman
              </Text>
              <Text className="mt-2 text-lg text-slate-800">
                Challenge your mind, track your streaks, and climb the
                leaderboard.
              </Text>
            </View>

            <View className="flex-1 gap-6">
              <View className="shrink-0 rounded-3xl border border-white/10 bg-white/95 p-4 shadow-2xl dark:bg-neutral-900/95">
                <View className="mb-4 flex-row justify-center gap-4 rounded-full p-1 px-4 text-slate-800">
                  {(['create', 'login'] as AuthTab[]).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <Button
                        key={TAB_COPY[tab].label}
                        className={` rounded-lg p-1  text-black ${isActive ? 'bg-transparent font-bold' : 'bg-transparent font-normal'}`}
                        onPress={() => setActiveTab(tab)}
                        label={TAB_COPY[tab].label}
                      >
                        <Text
                          className={`${isActive ? 'font-semibold text-blue-700' : 'font-normal text-black'}`}
                        >
                          {TAB_COPY[tab].label}
                        </Text>
                      </Button>
                    );
                  })}
                </View>

                <LoginForm
                  onSubmit={handleAuth}
                  defaultName={username}
                  title={TAB_COPY[activeTab].title}
                  subtitle={TAB_COPY[activeTab].subtitle}
                  ctaLabel={TAB_COPY[activeTab].ctaLabel}
                />
              </View>

              <View className="shrink-0">
                <Button
                  className="bg-slate-900/60"
                  textClassName="text-white"
                  label="Join as Guest"
                  onPress={onJoinGuest}
                />
                <Text className="mt-3 text-center text-sm text-slate-800">
                  Want to save your progress? Create an account and keep your
                  wins synced.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
        {pending && <LoadingOverlay />}
      </SafeAreaView>
    </>
  );
}
