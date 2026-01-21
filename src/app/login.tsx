/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useSpacetimeDB } from 'spacetimedb/react';

import {
  CreateAccountForm,
  type FormType,
  LoginForm,
} from '@/components/login-form';
import {
  Button,
  FocusAwareStatusBar,
  LoadingOverlay,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { useLatestResponse } from '@/hooks/useLatestResponse';
import useReducerInvoker from '@/hooks/useReducerInvoker';
import { useAuth } from '@/lib';
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
  const register = useReducerInvoker('auth_register');
  const login = useReducerInvoker('auth_login');
  const setUsername = useSessionStore((state) => state.setUsername);
  const setPlayer = useSessionStore((state) => state.setPlayer);
  const setPlayerId = useSessionStore((state) => state.setPlayerId);
  const setGuest = useAuth((state) => state.setGuest);
  const username = useSessionStore((state) => state.username ?? '');
  const [activeTab, setActiveTab] = useState<AuthTab>('create');
  const [pending, setPending] = useState(false);
  const [pendingType, setPendingType] = useState<'login' | 'register' | null>(
    null
  );
  const [newUsername, setNewUsername] = useState('');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoginRef = useRef<any>(null);
  const lastRegisterRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const { identity } = useSpacetimeDB();

  const latestLogin = useLatestResponse('auth_login', identity ?? null);
  const latestRegister = useLatestResponse('auth_register', identity ?? null);

  const loginIsNew = lastLoginRef.current !== latestLogin;
  const registerIsNew = lastRegisterRef.current !== latestRegister;

  const signIn = useAuth((state) => state.signIn);

  const handleRegister = (data: FormType) => {
    const username = data.name.trim();
    const password = data.password.trim();
    setPendingType('register');

    try {
      register({ username: username, password: password });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPending(true);

      if (latestRegister.error) {
        console.warn(latestRegister.error);
        alert('Error occurred creating account');
        setPending(false);
        return;
      }
      setUsername(username);
      signIn(latestRegister.access_token);

      createPlayer({ username: username });
      getPlayer({ username: username });

      console.log('register response: ', latestRegister);

      timeoutRef.current = setTimeout(() => {
        router.replace({
          pathname: '/(app)',
          params: { isGuest: 'false', userType: 'new' },
        });
        setPending(false);
      }, 900);
    } catch (e) {
      console.warn(e);
      alert('Error occurred when registering');
    }
  };

  const handleLogin = (data: FormType) => {
    const username = data.name.trim();
    const password = data.password.trim();
    setNewUsername(username);
    setPendingType('login');

    try {
      login({ username: username, password: password });
      setPending(true);
    } catch (e) {
      alert(`Error ${e} occurred when logging in`);
    }
  };

  const onJoinGuest = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    console.log('creating guest player');
    createPlayer({});
    setUsername('');
    setPlayer(null);
    setPlayerId(null);
    setGuest();
    router.replace({
      pathname: '/(app)',
      params: { isGuest: 'true' },
    });
  };

  useEffect(() => {
    if (!pending) return;
    console.log('[login] detected changes, in useEffect');

    if (pendingType === 'login') {
      if (!loginIsNew) {
        console.log('stale login, leaving effect');
        return;
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (latestLogin.error) {
        console.warn(latestLogin.error);
        alert(`Login error: ${latestLogin.error}`);
        setPending(false);
        lastLoginRef.current = latestLogin;
        return;
      }

      console.log('login response: ', latestLogin.access_token);
      signIn(latestLogin.access_token);

      setUsername(newUsername);
      getPlayer({ username: newUsername });

      timeoutRef.current = setTimeout(() => {
        router.replace({
          pathname: '/(app)',
          params: { isGuest: 'false', userType: 'login' },
        });
        setPending(false);
      }, 900);
      lastLoginRef.current = latestLogin;
    }
    if (pendingType === 'register') {
      if (!registerIsNew) {
        return;
      }
      lastRegisterRef.current = latestRegister;
    }
  }, [
    pending,
    activeTab,
    latestLogin,
    latestRegister,
    pendingType,
    loginIsNew,
    registerIsNew,
    signIn,
    setUsername,
    newUsername,
    getPlayer,
    router,
    username,
  ]);

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

                {activeTab === 'login' ? (
                  <LoginForm
                    onSubmit={handleLogin}
                    defaultName={username}
                    title={TAB_COPY[activeTab].title}
                    subtitle={TAB_COPY[activeTab].subtitle}
                    ctaLabel={TAB_COPY[activeTab].ctaLabel}
                  />
                ) : (
                  <CreateAccountForm
                    onSubmit={handleRegister}
                    defaultName={username}
                    title={TAB_COPY[activeTab].title}
                    subtitle={TAB_COPY[activeTab].subtitle}
                    ctaLabel={TAB_COPY[activeTab].ctaLabel}
                  />
                )}
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
