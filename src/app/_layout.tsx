// Import  global CSS file
import '../../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { type Identity } from 'spacetimedb';
import { SpacetimeDBProvider } from 'spacetimedb/react';

import { APIProvider } from '@/api';
import { hydrateAuth, loadSelectedTheme } from '@/lib';
import { getItem, setItem } from '@/lib/storage';
import { useThemeConfig } from '@/lib/use-theme-config';

import { DbConnection, type ErrorContext } from '../module_bindings';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(app)',
};

hydrateAuth();
loadSelectedTheme();
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

const onConnect = (conn: DbConnection, identity: Identity, token: string) => {
  console.log(
    'Connected to SpacetimeDB with identity:',
    identity.toHexString()
  );
  // Store auth token so we can reconnect with same identity
  // Persist the auth token using native storage (localStorage is not available in RN)
  setItem('auth_token', token);
};

const onDisconnect = () => {
  console.log('Disconnected from SpacetimeDB');
};

const onConnectError = (_ctx: ErrorContext, err: Error) => {
  console.error('*** onConnectError fired ***', err);

  // If it's a normal Error, log message
  if (err instanceof Error) {
    console.error('Spacetime error message:', err.message);
  } else {
    // It’s likely a generic Event from WebSocket. Log its target.
    // @ts-expect-error – we know target is probably a WebSocket
    const ws = err.target;
    console.error('WebSocket readyState:', ws?.readyState, 'URL:', ws?.url);
  }
};

const connectionBuilder = DbConnection.builder()
  .withUri('wss://maincloud.spacetimedb.com') // where `spacetime start` is running
  // IMPORTANT: this must match the database/module name printed by `spacetime publish`
  // For now, if you followed the quickstart, it’s usually "chat-server" or similar.
  .withModuleName(
    'c200a021190b1eb70959bdcf083e89b768009b188bfef4fa9e4cb14440318a9f'
  )
  .withToken(getItem<string>('auth_token') || undefined)
  .onConnect(onConnect)
  .onDisconnect(onDisconnect)
  .onConnectError(onConnectError);

export default function RootLayout() {
  return (
    <Providers>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        {/* <Stack.Screen name="onboarding" options={{ headerShown: false }} /> */}
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView
      style={styles.container}
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
            <APIProvider>
              <BottomSheetModalProvider>
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
});
