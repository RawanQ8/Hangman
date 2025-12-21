import { useEffect, useRef } from 'react';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';

import { SEED_WORDS } from '@/data/seed-words';
import { tables } from '@/module_bindings';

import useReducerInvoker from './useReducerInvoker';

export function useSeedWords() {
  const { isActive } = useSpacetimeDB();
  const [words] = useTable(tables.word);
  const seedWordsReducer = useReducerInvoker('seed_words');
  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (!isActive || hasSeededRef.current) return;
    if (!words) return;
    if (words.length > 0) {
      hasSeededRef.current = true;
      return;
    }

    seedWordsReducer({ words: SEED_WORDS });
    hasSeededRef.current = true;
  }, [isActive, seedWordsReducer, words]);
}
