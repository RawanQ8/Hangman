/* eslint-disable unicorn/filename-case */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSpacetimeDB } from 'spacetimedb/react';

import { reducers } from '../module_bindings';
import { useConnection } from './useConnection';

type ReducerParams = Record<string, unknown>;

const toCamel = (name: string) =>
  name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const reducersLookup = reducers as Record<string, any>;

const getReducerSchema = (name: string) => {
  const camel = toCamel(name);
  return reducersLookup[camel] ?? reducersLookup[name];
};

export default function useReducerInvoker(name: string) {
  const schema = useMemo(() => getReducerSchema(name), [name]);
  const { getConnection, isActive } = useSpacetimeDB();
  const connection = useConnection();
  const queueRef = useRef<ReducerParams[]>([]);

  const run = useCallback(
    (params: ReducerParams = {}) => {
      console.log(`In reducer ${name} with params: `, params);
      if (!schema) {
        console.error(`Reducer schema not found for ${name}`);
        return;
      }
      const conn = getConnection();
      const ready =
        Boolean(conn) &&
        isActive &&
        connection.isConnected &&
        !connection.error;
      if (!ready) {
        console.warn(
          `Connection not ready (isActive=${isActive}, connected=${connection.isConnected}, hasError=${Boolean(connection.error)}), deferring reducer ${name}`
        );
        queueRef.current.push(params);
        return;
      }
      try {
        conn?.callReducerWithParams(
          schema.name,
          schema.paramsType,
          params,
          'FullUpdate'
        );
      } catch (err) {
        console.log(params);
        console.error(err);
        // If the socket slipped into a bad state mid-call, re-queue the work
        // so it can run once the connection is healthy again.
        queueRef.current.push(params);
      }
    },
    [
      schema,
      getConnection,
      isActive,
      name,
      connection.error,
      connection.isConnected,
    ]
  );

  useEffect(() => {
    if (
      !isActive ||
      queueRef.current.length === 0 ||
      !schema ||
      connection.error ||
      !connection.isConnected
    ) {
      return;
    }
    const pending = queueRef.current.splice(0);
    for (const payload of pending) {
      run(payload);
    }
  }, [connection.error, connection.isConnected, isActive, run, schema]);

  return run;
}
