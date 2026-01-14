/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, TextInput } from 'react-native';
//import Confetti from 'react-native-confetti';
import { useTable } from 'spacetimedb/react';

import hangman0 from '@/assets/hangman/hangman0.png';
import hangman1 from '@/assets/hangman/hangman1.png';
import hangman2 from '@/assets/hangman/hangman2.png';
import hangman3 from '@/assets/hangman/hangman3.png';
import hangman4 from '@/assets/hangman/hangman4.png';
import hangman5 from '@/assets/hangman/hangman5.png';
import hangman6 from '@/assets/hangman/hangman6.png';
import { Button, Text, View } from '@/components/ui';
import { useLatestResponse } from '@/hooks/useLatestResponse';
import useReducerInvoker from '@/hooks/useReducerInvoker';
import { tables } from '@/module_bindings';
import { useGameDataStore } from '@/store/game-data-store';
import { useSessionStore } from '@/store/session-store';

import { type GamePlayer } from '../module_bindings/game_player_type';
import { type Game } from '../module_bindings/game_type';
import { type Word } from '../module_bindings/word_type';
import ConfettiOverlay from './confetti-overlay';

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
    <Pressable className={'appearance-none'} onPress={() => onPress(letter)}>
      <Text className={`m-1 rounded border border-gray-200 p-3 ${statusStyle}`}>
        {letter}
      </Text>
    </Pressable>
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
    <View className={`mt-3 space-y-2 rounded p-4`}>
      {rows.map((row, i) => (
        <View key={`${row}_${i}`} className="flex-row justify-center space-x-2">
          {row.map((key) => (
            <KeyboardKey
              key={key}
              letter={key}
              status={
                guessedLetters.includes(key)
                  ? correctLetters.includes(key)
                    ? 'present'
                    : 'absent'
                  : locked
                    ? 'locked'
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
    <View className="mt-2 flex-row">
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

function safeParsePayload(payload: string): any | null {
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// eslint-disable-next-line max-lines-per-function
export default function Hangman({
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
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [wordObject, setWordObject] = useState<Word | null>(null);
  const [wordScore, setWordScore] = useState(0);

  const currentGame = useGameDataStore.use.currentGame();
  const currentPlayer = useSessionStore.use.player();
  const username = useSessionStore.use.username() ?? '';
  const currentGamePlayer: GamePlayer =
    useGameDataStore.use.currentGamePlayer();
  const identity = useSessionStore.use.identity();

  const setCurrentGame = useGameDataStore((state) => state.setCurrentGame);
  const setCurrentGamePlayer = useGameDataStore(
    (state) => state.setCurrentGamePlayer
  );

  const makeGuess = useReducerInvoker('make_guess');
  const fetchGame = useReducerInvoker('get_game');
  const fetchGamePlayer = useReducerInvoker('get_game_player');
  const fetchWord = useReducerInvoker('get_word');
  const fetchWordLength = useReducerInvoker('get_word_length');
  //const switchTurns = useReducerInvoker('switch_turns');

  const latestGameResponse = useLatestResponse<Game>('get_game', identity);
  const latestGamePlayerResponse = useLatestResponse<GamePlayer>(
    'get_game_player',
    identity
  );
  const latestWordResponse = useLatestResponse<Word>('get_word', identity);
  const latestWordLengthResponse = useLatestResponse<Word>(
    'get_word_length',
    identity
  );
  //console.log('in game:', gameId, playerId, gpId);

  const resolvedGameId = gameId ?? currentGame?.id;
  const resolvedGamePlayerId = gpId ?? currentGamePlayer?.id;
  const lastResponseIdRef = useRef<bigint | null>(null);
  const lastRequestedWordIdRef = useRef<bigint | null>(null);

  //const spacetime = useSpacetimeDB();

  // When switching game, refresh
  useEffect(() => {
    console.log('Entered new game');
    setWon(false);
    setLost(false);
    setShowConfetti(false);
    lastResponseIdRef.current = null;
    lastRequestedWordIdRef.current = null;
    setWordObject(null);
  }, [gameId, gpId]);

  useEffect(() => {
    console.log('HANGMAN FIRST RENDER', {
      gameId,
      gpId,
      playerId,
      types: {
        gameId: typeof gameId,
        gpId: typeof gpId,
        playerId: typeof playerId,
      },
      store: {
        currentGameId: currentGame?.id,
        currentGpId: currentGamePlayer?.id,
      },
    });
    return () => {
      setWon(false);
      setLost(false);
      setShowConfetti(false);
      lastResponseIdRef.current = null;
      lastRequestedWordIdRef.current = null;
      setWordObject(null);
    };
  }, []);

  const [responses] = useTable(tables.reducerResponse) ?? [];
  const [guesses] = useTable(tables.guess) ?? [];

  let wrongGuessCount = 0;

  //Get necessary variables from db
  const wordId: bigint = currentGame?.word_id ?? 0n;
  const word =
    wordObject && wordId !== 0n && sameId(wordObject.id, wordId)
      ? wordObject.word
      : '';

  //const isCurrentTurn = currentGamePlayer.is_current_turn;
  const gameStatus = currentGame?.status ?? '';
  const isCurrentGamePlayer = sameId(
    currentGamePlayer?.id,
    resolvedGamePlayerId
  );

  // Guessing Logic: Retrieve guesses from DB
  const userGuessRecords = guesses.filter(
    (g) => g.gpId === resolvedGamePlayerId
  );
  const guessedLetters = userGuessRecords.map((g) => g.letter);

  const correctLetters = userGuessRecords
    .filter((r) => r.isCorrect)
    .map((g) => g.letter);

  const wrongLetters = userGuessRecords
    .filter((r) => !r.isCorrect)
    .map((g) => g.letter);

  wrongGuessCount = wrongLetters.length;

  const lettersToGuess = Array.from(String(word)).map((c) => c.toUpperCase());

  const displayedLetters = lettersToGuess.map((letter) =>
    correctLetters.includes(letter) ? letter : '_'
  );

  //fetch updated records
  useEffect(() => {
    if (!resolvedGameId || !resolvedGamePlayerId) return;
    const relevantReducers = new Set([
      'make_guess',
      'game_status',
      'join_game',
    ]);
    let newestRelevant: bigint | null = null;
    const lastSeen = lastResponseIdRef.current ?? 0n;
    //console.log(responses);
    for (const row of responses) {
      if (BigInt(row.id) <= lastSeen) continue;
      if (!relevantReducers.has(row.reducer)) continue;
      const payload = safeParsePayload(row.payload);
      const isThisGame =
        row.reducer === 'join_game'
          ? BigInt(payload.id) === BigInt(resolvedGameId) // join_game emits game JSON (id)
          : BigInt(payload.game_id) === BigInt(resolvedGameId);
      if (!isThisGame) continue;
      if (newestRelevant === null || row.id > newestRelevant) {
        newestRelevant = row.id;
      }

      console.log('approved row: ', row.reducer, row.payload);
    }

    if (newestRelevant === null) return;

    if (
      lastResponseIdRef.current !== null &&
      newestRelevant <= lastResponseIdRef.current
    )
      return;
    lastResponseIdRef.current = newestRelevant;

    console.log('FETCHING GAME AND PLAYER');
    fetchGame({ id: resolvedGameId });
    fetchGamePlayer({ gpId: resolvedGamePlayerId });
  }, [
    responses,
    resolvedGameId,
    resolvedGamePlayerId,
    fetchGame,
    fetchGamePlayer,
    wordId,
    identity,
    gpId,
  ]);

  //update current game
  useEffect(() => {
    if (!latestGameResponse || !resolvedGamePlayerId) return;
    if (!sameId(latestGameResponse.id, currentGame.id)) return;

    console.log('game updated to: ', latestGameResponse);
    setCurrentGame(latestGameResponse);
  }, [latestGameResponse, setCurrentGame]);

  useEffect(() => {
    setWon(isCurrentGamePlayer ? currentGamePlayer?.is_winner : false);
    setLost(isCurrentGamePlayer ? currentGamePlayer?.is_loser : false);
  }, [currentGamePlayer.is_winner, currentGamePlayer.is_loser]);

  useEffect(() => {
    console.log(
      `starting won state is: ${won} and lost state is: ${lost} current game player ${currentGamePlayer.id}`
    );
    console.log(
      ` ${isCurrentGamePlayer ? currentGamePlayer?.is_winner : false}`
    );

    if (!won) return;
    console.log('handling game won');
    setShowConfetti(true);
    const timeout = setTimeout(() => {
      setShowConfetti(false);
      console.log('removed confetti');
    }, 3000);
    console.log(`Won state is: ${won} and lost state is: ${lost}`);
    return () => clearTimeout(timeout);
  }, [won, lost]);

  //update current game player
  useEffect(() => {
    if (!latestGamePlayerResponse || !resolvedGamePlayerId) return;
    if (!sameId(latestGamePlayerResponse.id, resolvedGamePlayerId)) return;

    setCurrentGamePlayer(latestGamePlayerResponse);
  }, [latestGamePlayerResponse, resolvedGamePlayerId, setCurrentGamePlayer]);

  useEffect(() => {
    if (!wordId || wordId === 0n) {
      setWordObject(null);
      lastRequestedWordIdRef.current = null;
      return;
    }
    if (wordObject && sameId(wordObject.id, wordId)) return;
    if (
      lastRequestedWordIdRef.current &&
      sameId(lastRequestedWordIdRef.current, wordId)
    )
      return;
    console.log('trying to fetch word with id: ', wordId);
    lastRequestedWordIdRef.current = wordId;
    fetchWord({ id: BigInt(wordId) });
  }, [fetchWord, wordId, wordObject]);

  useEffect(() => {
    if (!latestWordResponse) return;
    if (!wordId || wordId === 0n) return;
    if (!sameId(latestWordResponse.id, wordId)) return;
    setWordObject(latestWordResponse);
  }, [latestWordResponse, setWordObject, wordId]);

  useEffect(() => {
    if (wordObject) {
      //console.log(`word object is: `, wordObject);
      setWordScore(wordObject.score);
      console.log('word score: ', wordObject.score);
    }
    return;
  }, [wordObject]);

  // functions to handle game moves
  const onKeyPress = (letter: string) => {
    console.log('handling key press');
    if (!resolvedGameId || !(gameStatus === 'in_progress')) return;
    if (won || lost) return;
    handleGuess(letter);
  };

  const handleGuess = useCallback(
    (letter: string) => {
      console.log(`trying to make guess with letter: ${letter}`);
      const normalizedLetter = letter.trim().toUpperCase();
      if (!word || !normalizedLetter || !resolvedGamePlayerId) return;
      makeGuess({
        gamePlayerId: resolvedGamePlayerId,
        gameId: resolvedGameId,
        guess: normalizedLetter,
      });
      //switchTurns({ currentGpId: resolvedGamePlayerId });
    },
    [resolvedGamePlayerId, resolvedGameId, makeGuess, word]
  );

  if (!currentGame) return <Text>Loading Game …</Text>;
  if (!currentPlayer) return <Text>Loading Player …</Text>;
  if (!currentGamePlayer) return <Text>Loading Game Player …</Text>;

  // console.log('current player ', currentPlayer);
  // console.log('current game ', currentGame);
  // console.log('current game player ', currentGamePlayer);
  // console.log('current player turn: ', isCurrentTurn);
  // console.log('current word: ', word);
  // console.log('gpid: ', currentGamePlayer.id);

  //if (gameWon) setShowConfetti(true);

  return (
    <>
      <View className="flex-1 items-center justify-center gap-3">
        {/* <Text className="text-2xl text-blue-800">Hangman Game</Text> */}
        <ConfettiOverlay
          visible={showConfetti}
          onDone={() => setShowConfetti(false)}
        />

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
          {/* <Text className="text-2xl font-semibold text-blue-900">
            {resolvedGamePlayerId?.toString?.() ?? ''}
          </Text> */}
          {gameStatus === 'waiting' && (
            <View className="items-center rounded-full border border-blue-100 bg-white/80 px-3 py-1">
              <Text className="text-sm text-blue-800">
                <Text className="">Waiting for next player</Text>
              </Text>
            </View>
          )}
        </View>
        {won && (
          <>
            <Text className="mb-3 text-xl font-bold text-blue-800">
              Congratulations You Win!
            </Text>
            <Text className="mb-3 text-lg font-bold text-black">
              You earned {wordScore} points!
            </Text>
            <View className="flex flex-row">
              <Text className="text-xl ">Correct Word: </Text>
              <Text className="mb-3 text-xl font-semibold text-green-800">
                {word.toUpperCase()}
              </Text>
            </View>
          </>
        )}
        {lost && (
          <>
            <Text className="mb-3 text-xl font-semibold text-red-800">
              You Lost 😢
            </Text>
            <View className="flex flex-row">
              <Text className="text-xl ">Correct Word: </Text>
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
            locked={!(gameStatus === 'in_progress')}
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
            editable={!won && !lost}
          />
        )}
        <Button
          className="mt-4 rounded-lg bg-blue-900"
          onPress={() => {
            setWon(false);
            setLost(false);
            setShowConfetti(false);
            router.replace('/(app)');
          }}
        >
          <Text className="text-white">
            {won || lost ? 'New Game' : 'Start Over'}
          </Text>
        </Button>
      </View>
    </>
  );
}
