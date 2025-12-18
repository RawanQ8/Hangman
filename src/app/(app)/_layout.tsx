import { Redirect, SplashScreen, Tabs } from 'expo-router';
import React, { useCallback, useEffect } from 'react';

import { Feed as FeedIcon } from '@/components/ui/icons';
import { useIsFirstTime } from '@/lib';

export default function TabLayout() {
  const [isFirstTime] = useIsFirstTime();
  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => {
      hideSplash();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [hideSplash]);

  if (isFirstTime) {
    return <Redirect href="/onboarding" />;
  }
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Login',
          tabBarIcon: ({ color }) => <FeedIcon color={color} />,
          tabBarButtonTestID: 'feed-tab',
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Play',
          tabBarIcon: ({ color }) => <FeedIcon color={color} />,
          tabBarButtonTestID: 'feed-tab',
        }}
      />
    </Tabs>
  );
}
