'use client';

import { useEffect } from 'react';

import {
  disconnectDbConnection,
  getDbConnection,
} from '@/lib/connection-factory';

const MySpacetimeDBProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    getDbConnection();
    return () => disconnectDbConnection();
  }, []);

  return <>{children}</>;
};

export default MySpacetimeDBProvider;
