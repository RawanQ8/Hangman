import { Redirect, SplashScreen, Tabs } from 'expo-router';
import React, { useCallback, useEffect } from 'react';

import { Feed as FeedIcon } from '@/components/ui/icons';
import { useIsFirstTime } from '@/lib';

export default function TabLayout() {
  const [isFirstTime] = useIsFirstTime();
  const hideSplash = useCallback(async () => {
    //console.log('Hiding splash');
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
          title: 'Home',
          tabBarIcon: ({ color }) => <FeedIcon color={color} />,
          tabBarButtonTestID: 'feed-tab',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'LeaderBoard',
          tabBarIcon: ({ color }) => <FeedIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
