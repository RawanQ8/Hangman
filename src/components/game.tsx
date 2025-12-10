/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRouter } from 'expo-router';
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
import { reducers, tables } from '@/module_bindings';

import hangman0 from '../../assets/hangman/hangman0.png';
import hangman1 from '../../assets/hangman/hangman1.png';
import hangman2 from '../../assets/hangman/hangman2.png';
import hangman3 from '../../assets/hangman/hangman3.png';
import hangman4 from '../../assets/hangman/hangman4.png';
import hangman5 from '../../assets/hangman/hangman5.png';
import hangman6 from '../../assets/hangman/hangman6.png';

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
      statusStyle = 'bg-gray-300';
      break;
    default:
      statusStyle = 'bg-white';
  }

  return (
    <TouchableOpacity onPress={() => onPress(letter)}>
      <Text className={`m-1 rounded border border-gray-300 p-3 ${statusStyle}`}>
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

type ReducerParams = Record<string, unknown>;

const toCamel = (name: string) =>
  name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const reducersLookup = reducers as Record<string, any>;
const tablesList = Object.values(tables as Record<string, any>);

const getReducerSchema = (name: string) => {
  const camel = toCamel(name);
  return reducersLookup[camel] ?? reducersLookup[name];
};

function useReducerInvoker(name: string) {
  const schema = useMemo(() => getReducerSchema(name), [name]);
  const { getConnection, isActive } = useSpacetimeDB();
  const queueRef = useRef<ReducerParams[]>([]);

  const run = useCallback(
    (params: ReducerParams = {}) => {
      if (!schema) {
        console.error(`Reducer schema not found for ${name}`);
        return;
      }
      const conn = getConnection();
      if (!conn) {
        queueRef.current.push(params);
        return;
      }
      conn.callReducerWithParams(
        schema.name,
        schema.paramsType,
        params,
        'FullUpdate'
      );
      console.log('In reducer with: ', name);
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
  const [wrongGuessCount, setWrongGuessCount] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [correctLetters, setCorrectLetters] = useState<string[]>([]);
  const [wrongLetters, setWrongLetters] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [derivedIds, setDerivedIds] = useState<{
    gameId?: bigint;
    playerId?: bigint;
    gamePlayerId?: bigint;
  }>({});

  // if (!gameId) {
  //   gameId = 0n;
  //   playerId = 0n;
  //   gpId = 0n;
  // }
  console.log('in game:', gameId, playerId, gpId);

  const resolvedGameId = gameId ?? derivedIds.gameId;
  const resolvedPlayerId = playerId ?? derivedIds.playerId;
  const resolvedGamePlayerId = gpId ?? derivedIds.gamePlayerId;

  const spacetime = useSpacetimeDB();
  //const { isActive, identity } = spacetime;

  const connection = spacetime.getConnection?.();
  if (connection) {
    for (const tableDef of tablesList) {
      const snake = tableDef.name;
      const camel = tableDef.accessorName ?? snake;
      if (snake === camel) continue;
      const hasSnake = Object.prototype.hasOwnProperty.call(
        connection.db,
        snake
      );
      if (hasSnake) continue;
      const descriptor = Object.getOwnPropertyDescriptor(connection.db, camel);
      if (!descriptor) continue;
      Object.defineProperty(connection.db, snake, descriptor);
    }
  }

  const [players] = useTable(tables.player);
  const [games] = useTable(tables.game);
  const [gamePlayers] = useTable(tables.gamePlayer);
  const [responses] = useTable(tables.reducerResponse);
  const [guesses] = useTable(tables.guess);

  const currentGame = useMemo(() => {
    if (gameId) {
      return games.find((g) => g.id === gameId);
    }
    return games.find((g) => g.status !== 'won' && g.status !== 'lost');
  }, [games, gameId]);

  const currentPlayer = useMemo(() => {
    if (playerId) {
      console.log('looking for player id: ', playerId);
      const out = players.find((p) => p.id === playerId);
      console.log('output of player search: ', out);
      return out;
    }
  }, [players, playerId]);

  console.log('current player object is: ', currentPlayer);

  const currentGamePlayer = useMemo(() => {
    if (resolvedGamePlayerId) {
      return gamePlayers.find((gp) => gp.id === resolvedGamePlayerId);
    }
  }, [gamePlayers, resolvedGamePlayerId]);

  const word = currentGame?.word || '';
  console.log('word is: ', word);
  const username = currentPlayer?.username || '';

  const isCurrentTurn = currentGamePlayer?.isCurrentTurn;

  //const getPlayerStatus = useReducerInvoker('get_player_status');
  //const getGameStatus = useReducerInvoker('get_game_status');

  const gameStatus = currentGame?.status;
  // const playerStatus = useMemo(() => {
  //   getPlayerStatus({ gpId });
  // }, [gamePlayers, gpId]);
  console.log('game status is: ', gameStatus);
  //console.log('player status is: ', playerStatus);

  const lettersToGuess = Array.from(word);

  const displayedLetters = lettersToGuess.map((letter) =>
    correctLetters.includes(letter) ? letter : '_'
  );

  const onKeyPress = (letter: string) => {
    if (!gameId || !isCurrentTurn || !(gameStatus === 'in_progress')) return;
    if (gameWon || gameLost) return;
    handleGuess(letter);
  };

  const submitMove = useCallback(
    async (letter: string) => {
      if (!gpId) return;
      try {
        console.log(`GP ${gpId} making guess: ${letter}`);
        //await submitGuess(gpId, letter);
      } catch (err) {
        console.error('Error submitting guess', err);
      }
    },
    [gpId]
  );

  const handleGuess = useCallback(
    (letter: string) => {
      const normalizedLetter = letter.trim().toUpperCase();
      if (!word || !normalizedLetter) return;
      let guessApplied = false;
      setGuessedLetters((prevGuessed) => {
        if (prevGuessed.includes(normalizedLetter)) return prevGuessed;

        guessApplied = true;
        const isCorrect = word.includes(normalizedLetter);
        if (isCorrect) {
          setCorrectLetters((prev) => [...prev, normalizedLetter]);
        } else {
          setWrongGuessCount((prev) => prev + 1);
          setWrongLetters((prev) => [...prev, normalizedLetter]);
        }
        return [...prevGuessed, normalizedLetter];
      });

      if (guessApplied) {
        void submitMove(normalizedLetter);
      }
    },
    [submitMove, word]
  );

  useEffect(() => {
    const guessCorrect =
      lettersToGuess.every((letter) => correctLetters.includes(letter)) &&
      wrongGuessCount < 6 &&
      lettersToGuess.length > 0;

    if (guessCorrect && !gameWon) {
      setGameWon(true);
      setShowConfetti(true);
    }
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(confettiTimer);
  }, [correctLetters, gameWon, lettersToGuess, wrongGuessCount]);

  useEffect(() => {
    if (wrongGuessCount >= 6 && !gameLost) {
      setGameLost(true);
    }
  }, [wrongGuessCount, gameLost]);

  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      if (currentGamePlayer?.isWinner) {
        setGameWon(true);
        return;
      }
      setGameLost(true);
    }
  }, [currentGamePlayer?.isWinner, gameStatus]);

  const router = useRouter();

  return (
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
      <Text>Game ID: {gameId}</Text>
      <Text>Player: {username}</Text>
      {/* <Text>GP: {gpId}</Text> */}
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
              {word}
            </Text>
          </View>
        </>
      )}

      <DisplayHangmanImage wrongGuessCount={wrongGuessCount} />
      <DisplayWrongLetters wrongGuessedLetters={wrongLetters} />
      <Text className="text-4xl font-bold tracking-widest">
        {displayedLetters.join(' ')}
      </Text>

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
  );
}
