/* eslint-disable unicorn/filename-case */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSpacetimeDB } from 'spacetimedb/react';

import { reducers } from '../module_bindings';

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
  const queueRef = useRef<ReducerParams[]>([]);

  const run = useCallback(
    (params: ReducerParams = {}) => {
      console.log(`In reducer ${name} with params: `, params);
      if (!schema) {
        console.error(`Reducer schema not found for ${name}`);
        return;
      }
      const conn = getConnection();
      // Wait until the websocket is fully active before sending,
      // otherwise spacetimedb tries to send on a closed socket.
      if (!conn || !isActive) {
        queueRef.current.push(params);
        return;
      }
      try {
        conn.callReducerWithParams(
          schema.name,
          schema.paramsType,
          params,
          'FullUpdate'
        );
      } catch (err) {
        console.log(params);
        console.error(err);
      }
    },
    [schema, getConnection, isActive, name]
  );

  useEffect(() => {
    if (!isActive || queueRef.current.length === 0 || !schema) {
      return;
    }
    const pending = queueRef.current.splice(0);
    for (const payload of pending) {
      run(payload);
    }
  }, [isActive, run, schema]);

  return run;
}
