// Import  global CSS file
import '../../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SpacetimeDBProvider, useSpacetimeDB } from 'spacetimedb/react';

import { APIProvider } from '@/api';
import { useConnection } from '@/hooks/useConnection';
import { hydrateAuth, loadSelectedTheme } from '@/lib';
import { clearReconnectTimer, setReconnectFn } from '@/lib/connection-events';
import {
  onConnect,
  onConnectError,
  onDisconnect,
} from '@/lib/connection-handlers';
import { getItem } from '@/lib/storage';
import { useThemeConfig } from '@/lib/use-theme-config';

import { DbConnection, tables } from '../module_bindings';
export { ErrorBoundary } from 'expo-router';

hydrateAuth();
//useAuth.use.status();
loadSelectedTheme();
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

const token = getItem<string>('auth_token') || undefined;
//const token = String(useAuth.getState().token) || undefined;

const connectionBuilder = DbConnection.builder()
  .withUri('wss://maincloud.spacetimedb.com') // where `spacetime start` is running
  // IMPORTANT: this must match the database/module name printed by `spacetime publish`
  // For now, if you followed the quickstart, it’s usually "chat-server" or similar.
  .withModuleName(
    'c200a021190b1eb70959bdcf083e89b768009b188bfef4fa9e4cb14440318a9f'
  )
  // React Native lacks `DecompressionStream`, so disable gzip to avoid runtime errors.
  .withCompression('none')
  .withToken(token)
  .onConnect(onConnect)
  .onDisconnect(onDisconnect)
  .onConnectError(onConnectError);

const tablesList = Object.values(tables as Record<string, any>);

function TableAccessorsSync() {
  const spacetime = useSpacetimeDB();

  useEffect(() => {
    const connection = spacetime.getConnection?.();
    if (!connection) return;

    for (const tableDef of tablesList) {
      const snake = tableDef.name;
      const camel = tableDef.accessorName ?? snake;
      if (snake === camel) continue;
      if (Object.prototype.hasOwnProperty.call(connection.db, snake)) continue;

      const descriptor = Object.getOwnPropertyDescriptor(connection.db, camel);
      if (!descriptor) continue;

      Object.defineProperty(connection.db, snake, descriptor);
    }
  }, [spacetime, spacetime.isActive]);

  return null;
}

function ConnectionStatusBanner() {
  const { isActive } = useSpacetimeDB();
  const connection = useConnection();

  const showBanner =
    !isActive || !connection.isConnected || Boolean(connection.error);
  if (!showBanner) return null;

  const message = connection.error
    ? 'Connection lost. Reconnecting to SpacetimeDB...'
    : 'Reconnecting to SpacetimeDB...';

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    console.log('Weird fix but ok');
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <Providers>
      <Stack initialRouteName="login">
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{
            headerShown: true,
            headerBackButtonMenuEnabled: false,
            headerBackVisible: false,
            title: 'Login',
          }}
        />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen
          name="home"
          options={{
            headerShown: false,
            title: 'Hangman',
          }}
        />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  const [connectionKey, setConnectionKey] = useState(0);

  useEffect(() => {
    const forceReconnectNow = () => {
      clearReconnectTimer();
      setConnectionKey((key) => key + 1);
    };

    setReconnectFn(forceReconnectNow);
    return () => setReconnectFn(null);
  }, []);

  return (
    <GestureHandlerRootView
      style={styles.container}
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <SpacetimeDBProvider
            key={connectionKey}
            connectionBuilder={connectionBuilder}
          >
            <TableAccessorsSync />
            <APIProvider>
              <BottomSheetModalProvider>
                <ConnectionStatusBanner />
                {children}
                <FlashMessage position="top" />
              </BottomSheetModalProvider>
            </APIProvider>
          </SpacetimeDBProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fcd34d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#713f12',
    fontWeight: '600',
  },
});
