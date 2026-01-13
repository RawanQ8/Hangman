/* eslint-disable unicorn/filename-case */
import { useSyncExternalStore } from 'react';

import { connectionStore } from '@/store/connection-store';

export function useConnection() {
  const connection = useSyncExternalStore(
    (callback) => connectionStore.subscribe(callback),
    () => connectionStore.getSnapshot(),
    () => connectionStore.getServerSnapshot()
  );
  return connection;
}
