/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { router } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Image, TextInput } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';

import { Button, Text, TouchableOpacity, View } from '@/components/ui';
import { useLatestResponse } from '@/hooks/useLatestResponse';
import { reducers, tables } from '@/module_bindings';
import { useGameDataStore } from '@/store/game-data-store';

import hangman0 from '../../assets/hangman/hangman0.png';
import hangman1 from '../../assets/hangman/hangman1.png';
import hangman2 from '../../assets/hangman/hangman2.png';
import hangman3 from '../../assets/hangman/hangman3.png';
import hangman4 from '../../assets/hangman/hangman4.png';
import hangman5 from '../../assets/hangman/hangman5.png';
import hangman6 from '../../assets/hangman/hangman6.png';
import { type GamePlayer } from '../module_bindings/game_player_type';
import { type Game } from '../module_bindings/game_type';

const KeyboardKey = ({
  letter,
  status,
  onPress,
}: {
  letter: string;
  status?: 'default' | 'present' | 'absent' | 'locked';
  onPress: (letter: string) => void;
}) => {
  let statusStyle = '';
  switch (status) {
    case 'present':
      statusStyle = 'bg-green-500';
      break;
    case 'absent':
      statusStyle = 'bg-yellow-500';
      break;
    case 'locked':
      statusStyle = 'bg-gray-100';
      break;
    default:
      statusStyle = 'bg-white';
  }

  return (
    <TouchableOpacity onPress={() => onPress(letter)}>
      <Text className={`m-1 rounded border border-gray-200 p-3 ${statusStyle}`}>
        {letter}
      </Text>
    </TouchableOpacity>
  );
};

const DisplayKeyboard = ({
  onKeyPress,
  guessedLetters,
  correctLetters,
  locked = false,
}: {
  guessedLetters: string[];
  correctLetters: string[];
  onKeyPress: (letter: string) => void;
  locked: boolean;
}) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  return (
    <View className={`mt-8 space-y-2 rounded p-4`}>
      {rows.map((row, i) => (
        <View key={`${row}_${i}`} className="flex-row justify-center space-x-2">
          {row.map((key) => (
            <KeyboardKey
              key={key}
              letter={key}
              status={
                locked
                  ? 'locked'
                  : guessedLetters.includes(key)
                    ? correctLetters.includes(key)
                      ? 'present'
                      : 'absent'
                    : 'default'
              }
              onPress={onKeyPress}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const DisplayHangmanImage = ({
  wrongGuessCount,
}: {
  wrongGuessCount: number;
}) => {
  // Placeholder for hangman image based on wrong guesses
  const hangmanImages = [
    hangman0,
    hangman1,
    hangman2,
    hangman3,
    hangman4,
    hangman5,
    hangman6,
  ];
  return (
    <View className="size-48 items-center justify-center">
      <Image
        source={hangmanImages[wrongGuessCount]}
        className="resize-contain size-52 "
      />
    </View>
  );
};

const DisplayWrongLetters = ({
  wrongGuessedLetters,
}: {
  wrongGuessedLetters: string[];
}) => {
  return (
    <View className="mt-4 flex-row space-x-2">
      {wrongGuessedLetters.map((letter, index) => (
        <Text key={`wrong-${letter}-${index}`} className="text-lg">
          <Text className="text-red-700">{letter}</Text>
          <Text className="text-gray-800">, </Text>
        </Text>
      ))}
    </View>
  );
};

const DisplayLettersToGuess = ({
  displayedLetters,
}: {
  displayedLetters: string[];
}) => {
  return (
    <Text className="text-4xl font-bold tracking-widest">
      {displayedLetters.join(' ')}
    </Text>
  );
};

type ReducerParams = Record<string, unknown>;
const sameId = (a: any, b: any) => {
  if (a == null || b == null) return false;
  const norm = (x: any) => {
    if (typeof x === 'bigint') return x.toString();
    if (typeof x === 'number') return x.toString();
    if (typeof x === 'string') return x;
    if (typeof x === 'object') {
      if ('value' in x) return String((x as any).value);
      if ('toString' in x) return String(x);
    }
    return String(x);
  };
  return norm(a) === norm(b);
};

const toCamel = (name: string) =>
  name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const reducersLookup = reducers as Record<string, any>;
const tablesList = Object.values(tables as Record<string, any>);

const getReducerSchema = (name: string) => {
  const camel = toCamel(name);
  return reducersLookup[camel] ?? reducersLookup[name];
};

const shallowEqual = (
  a: Record<string, unknown> | null,
  b: Record<string, unknown> | null
) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};

function useReducerInvoker(name: string) {
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
      if (!conn) {
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
        console.error(err);
      }
    },
    [schema, getConnection, name]
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

// eslint-disable-next-line max-lines-per-function
export default function Game({
  gameId,
  playerId,
  gpId,
}: {
  gameId: bigint;
  playerId: bigint;
  gpId: bigint;
}) {
  const [currentGuess, setCurrentGuess] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true);

  const currentGame = useGameDataStore.use.currentGame();
  const currentPlayer = useGameDataStore.use.currentPlayer();
  const currentGamePlayer: GamePlayer =
    useGameDataStore.use.currentGamePlayer();

  const setCurrentGame = useGameDataStore((state) => state.setCurrentGame);
  const setCurrentPlayer = useGameDataStore((state) => state.setCurrentPlayer);
  const setCurrentGamePlayer = useGameDataStore(
    (state) => state.setCurrentGamePlayer
  );

  const makeGuess = useReducerInvoker('make_guess');
  const switchTurns = useReducerInvoker('switch_turns');
  const fetchGame = useReducerInvoker('get_game');
  const fetchGamePlayer = useReducerInvoker('get_game_player');
  const latestGameResponse = useLatestResponse<Game>('get_game');
  const latestGamePlayerResponse =
    useLatestResponse<GamePlayer>('get_game_player');

  console.log('in game:', gameId, playerId, gpId);

  const resolvedGameId = gameId ?? currentGame?.id;
  const resolvedPlayerId = playerId ?? currentPlayer?.id;
  const resolvedGamePlayerId = gpId ?? currentGamePlayer?.id;
  const lastResponseIdRef = useRef<bigint | null>(null);

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
  }, [spacetime]);

  const [responses = []] = useTable(tables.reducerResponse) ?? [];
  const [guesses = []] = useTable(tables.guess) ?? [];
  let wrongGuessCount = 0;

  //Get necessary variables from db
  const word = currentGame.word || '';
  const username = currentPlayer.username || '';
  const isCurrentTurn = currentGamePlayer.is_current_turn;
  const gameStatus = currentGame.status;
  const gameWon = currentGamePlayer.is_winner;
  const gameLost = currentGamePlayer.is_loser;

  // Guessing Logic: Retrieve guesses from DB
  const userGuessRecords = guesses.filter(
    (g) => g.gameId === resolvedGameId && g.playerId === resolvedPlayerId
  );
  const guessedLetters = userGuessRecords.map((g) => g.letter);
  console.log(guessedLetters);

  const correctLetters = userGuessRecords
    .filter((r) => r.isCorrect)
    .map((g) => g.letter);

  const wrongLetters = userGuessRecords
    .filter((r) => !r.isCorrect)
    .map((g) => g.letter);

  console.log('correct letters: ', correctLetters);

  wrongGuessCount = wrongLetters.length;

  console.log('game status is: ', gameStatus);

  const lettersToGuess = Array.from(word).map((c) => c.toUpperCase());

  const displayedLetters = lettersToGuess.map((letter) =>
    correctLetters.includes(letter) ? letter : '_'
  );

  //fetch updated records
  useEffect(() => {
    if (!resolvedGameId || !resolvedGamePlayerId) return;
    const relevantReducers = new Set([
      'make_guess',
      'switch_turns',
      'join_game',
    ]);
    console.log('new response');
    let newestRelevant: bigint | null = null;
    for (const row of responses) {
      if (!relevantReducers.has(row.reducer)) continue;
      if (newestRelevant === null || row.id > newestRelevant) {
        newestRelevant = row.id;
      }
    }

    if (newestRelevant === null) return;
    if (
      lastResponseIdRef.current !== null &&
      newestRelevant <= lastResponseIdRef.current
    )
      return;

    lastResponseIdRef.current = newestRelevant;
    fetchGame({ id: resolvedGameId });
    fetchGamePlayer({ gpId: resolvedGamePlayerId });
  }, [
    responses,
    resolvedGameId,
    resolvedGamePlayerId,
    fetchGame,
    fetchGamePlayer,
  ]);

  //update current game
  useEffect(() => {
    if (
      latestGameResponse &&
      currentGame?.id &&
      sameId(latestGameResponse.id, currentGame.id)
    ) {
      console.log('Setting current game: ', latestGameResponse);
      setCurrentGame(latestGameResponse);
    }
  }, [currentGame?.id, latestGameResponse, setCurrentGame]);

  //update current game player
  useEffect(() => {
    console.log('latest game player now: ', latestGamePlayerResponse);
    if (
      latestGamePlayerResponse &&
      resolvedGamePlayerId &&
      sameId(latestGamePlayerResponse.id, resolvedGamePlayerId)
    ) {
      const mergedPlayer = currentGamePlayer
        ? {
            ...currentGamePlayer,
            ...latestGamePlayerResponse,
            id: currentGamePlayer.id,
          }
        : ({
            ...latestGamePlayerResponse,
            id: resolvedGamePlayerId,
          } as GamePlayer);

      console.log('Merged player: ', mergedPlayer);
      console.log('Comparison player: ', currentGamePlayer);

      if (shallowEqual(currentGamePlayer, mergedPlayer)) return;

      console.log('Setting current game player: ', latestGamePlayerResponse);
      setCurrentGamePlayer(mergedPlayer);
    }
  }, [
    currentGamePlayer,
    latestGamePlayerResponse,
    resolvedGamePlayerId,
    setCurrentGamePlayer,
  ]);

  // functions to handle game moves
  const onKeyPress = (letter: string) => {
    if (!resolvedGameId || !isCurrentTurn || !(gameStatus === 'in_progress'))
      return;
    if (gameWon || gameLost) return;
    handleGuess(letter);
  };

  const handleGuess = useCallback(
    (letter: string) => {
      console.log(`trying to make guess with letter: ${letter}`);
      const normalizedLetter = letter.trim().toUpperCase();
      if (!word || !normalizedLetter || !resolvedGamePlayerId) return;
      makeGuess({
        gamePlayerId: resolvedGamePlayerId,
        guess: normalizedLetter,
      });
      switchTurns({ currentGpId: resolvedGamePlayerId });
    },
    [resolvedGamePlayerId, makeGuess, switchTurns, word]
  );

  if (!currentGame) return <Text>Loading Game …</Text>;
  if (!currentPlayer) return <Text>Loading Player …</Text>;
  if (!currentGamePlayer) return <Text>Loading Game Player …</Text>;

  console.log('current player ', currentPlayer);
  console.log('current game ', currentGame);
  console.log('current game player ', currentGamePlayer);
  console.log('current player turn: ', isCurrentTurn);
  console.log('current word: ', word);
  console.log('gpid: ', currentGamePlayer.id);

  return (
    <>
      <View className="flex-1 items-center justify-center gap-3">
        {/* <Text className="text-2xl text-blue-800">Hangman Game</Text> */}
        {showConfetti && (
          <ConfettiCannon
            count={200}
            origin={{ x: -10, y: 0 }}
            autoStart={true}
            fadeOut={true}
            explosionSpeed={350}
          />
        )}
        <View className="mb-4 w-full items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Text className="text-xs uppercase tracking-[3px] text-blue-700">
            Game Code
          </Text>
          <Text className="text-2xl font-semibold text-blue-900">
            {resolvedGameId?.toString?.() ?? ''}
          </Text>
          <View className="items-center rounded-full border border-blue-100 bg-white/80 px-3 py-1">
            <Text className="text-sm text-blue-800">
              Playing as <Text className="font-semibold">{username}</Text>
            </Text>
          </View>
        </View>
        {gameWon && (
          <Text className="mb-3 text-xl font-bold text-blue-800">
            Congratulations You Win!
          </Text>
        )}
        {gameLost && (
          <>
            <Text className="mb-3 text-xl font-semibold text-red-800">
              You Lost 😢
            </Text>
            <View className="flex flex-row">
              <Text className="mb-3 text-xl ">Correct Word: </Text>
              <Text className="mb-3 text-xl font-semibold text-green-800">
                {word.toUpperCase()}
              </Text>
            </View>
          </>
        )}

        <DisplayHangmanImage wrongGuessCount={wrongGuessCount} />
        <DisplayLettersToGuess displayedLetters={displayedLetters} />
        <DisplayWrongLetters wrongGuessedLetters={wrongLetters} />

        {showKeyboard ? (
          <DisplayKeyboard
            onKeyPress={onKeyPress}
            guessedLetters={guessedLetters}
            correctLetters={correctLetters}
            locked={!isCurrentTurn || !(gameStatus === 'in_progress')}
          />
        ) : (
          <TextInput
            placeholder="A"
            value={currentGuess}
            onChangeText={setCurrentGuess}
            className="mb-5 mt-4 w-20 rounded border
             border-gray-300 p-6 text-center text-xl"
            maxLength={1}
            onSubmitEditing={() => {
              onKeyPress(currentGuess);
              setCurrentGuess('');
            }}
            autoFocus={true}
            autoCapitalize="characters"
            editable={!gameWon && !gameLost && isCurrentTurn}
          />
        )}
        <Button
          className="mt-4 rounded-lg bg-blue-900"
          onPress={() => {
            router.push('/(app)');
          }}
        >
          <Text className="text-white">
            {gameWon || gameLost ? 'New Game' : 'Start Over'}
          </Text>
        </Button>
      </View>
    </>
  );
}
