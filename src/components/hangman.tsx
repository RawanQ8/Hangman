/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, TextInput } from 'react-native';
//import Confetti from 'react-native-confetti';
import ConfettiCannon from 'react-native-confetti-cannon';
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

import { type GamePlayer } from '../module_bindings/game_player_type';
import { type Game } from '../module_bindings/game_type';
import { type Word } from '../module_bindings/word_type';

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
// const shallowEqual = (
//   a: Record<string, unknown> | null,
//   b: Record<string, unknown> | null
// ) => {
//   if (a === b) return true;
//   if (!a || !b) return false;
//   const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
//   for (const key of keys) {
//     if (a[key] !== b[key]) return false;
//   }
//   return true;
// };

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
  const currentPlayer = useGameDataStore.use.currentPlayer();
  const currentGamePlayer: GamePlayer =
    useGameDataStore.use.currentGamePlayer();

  const setCurrentGame = useGameDataStore((state) => state.setCurrentGame);
  const setCurrentPlayer = useGameDataStore((state) => state.setCurrentPlayer);
  const setCurrentGamePlayer = useGameDataStore(
    (state) => state.setCurrentGamePlayer
  );

  const makeGuess = useReducerInvoker('make_guess');
  //const switchTurns = useReducerInvoker('switch_turns');
  const fetchGame = useReducerInvoker('get_game');
  const fetchGamePlayer = useReducerInvoker('get_game_player');
  const fetchWord = useReducerInvoker('get_word');

  const latestGameResponse = useLatestResponse<Game>('get_game', null);
  const latestGamePlayerResponse = useLatestResponse<GamePlayer>(
    'get_game_player',
    null
  );
  const latestWordResponse = useLatestResponse<Word>('get_word', null);
  //console.log('in game:', gameId, playerId, gpId);

  const resolvedGameId = gameId ?? currentGame?.id;
  const resolvedPlayerId = playerId ?? currentPlayer?.id;
  const resolvedGamePlayerId = gpId ?? currentGamePlayer?.id;
  //console.log('resolved game player id: ', resolvedGamePlayerId);
  const lastResponseIdRef = useRef<bigint | null>(null);
  const lastRequestedWordIdRef = useRef<bigint | null>(null);

  //const spacetime = useSpacetimeDB();

  // When switching games/players, clear transient UI state and reset reducer tracking
  useEffect(() => {
    setWon(false);
    setLost(false);
    setShowConfetti(false);
    lastResponseIdRef.current = null;
    lastRequestedWordIdRef.current = null;
    setWordObject(null);
  }, [resolvedGameId, resolvedGamePlayerId]);

  const [responses] = useTable(tables.reducerResponse) ?? [];
  const [guesses] = useTable(tables.guess) ?? [];

  let wrongGuessCount = 0;

  //Get necessary variables from db
  const wordId: bigint = currentGame?.word_id ?? 0n;
  const username = currentPlayer?.username ?? '';
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
  const gameWon = isCurrentGamePlayer ? currentGamePlayer?.is_winner : false;
  const gameLost = isCurrentGamePlayer ? currentGamePlayer?.is_loser : false;

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
      'switch_turn',
      'join_game',
    ]);
    let newestRelevant: bigint | null = null;
    for (const row of responses) {
      if (!relevantReducers.has(row.reducer)) continue;
      const payload = JSON.parse(row.payload) || '';
      //console.log('payload: ', payload);

      if (row.reducer === 'make_guess') {
        if (BigInt(payload.gp_id) === BigInt(resolvedGamePlayerId)) {
          //console.log(resolvedGamePlayerId);
          //console.log('matching gpIds for paylaod: ', payload);
        }
      }

      if (row.reducer === 'join_game') {
        const toJoinId = BigInt(payload.id);
        //console.log(`${toJoinId} trying to join game: ${resolvedGameId}`);
        if (toJoinId !== resolvedGameId) continue;
      }
      if (newestRelevant === null || row.id > newestRelevant) {
        newestRelevant = row.id;
      }
    }

    if (newestRelevant === null) return;
    //levant: ', newestRelevant);
    //console.log('latest response: ', lastResponseIdRef.current);

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
  ]);

  //update current game
  useEffect(() => {
    if (
      latestGameResponse &&
      currentGame?.id &&
      sameId(latestGameResponse.id, currentGame.id)
    ) {
      console.log('game updated to: ', latestGameResponse);
      setCurrentGame(latestGameResponse);
    }
  }, [currentGame?.id, latestGameResponse, setCurrentGame]);

  useEffect(() => {
    console.log(`game won is: ${gameWon} and game lost is: ${gameLost}`);
    if (gameWon) {
      console.log('handling game won');
      setWon(true);
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        console.log('removed confetti');
      }, 3000);
    }
    if (gameLost) {
      setLost(true);
    }
    console.log(`Won state is: ${won} and lost state is: ${lost}`);
  }, [gameWon, gameLost]);

  //update current game player
  useEffect(() => {
    if (
      latestGamePlayerResponse &&
      resolvedGamePlayerId &&
      sameId(latestGamePlayerResponse.id, resolvedGamePlayerId)
    ) {
      setCurrentGamePlayer(latestGamePlayerResponse);
    }
  }, [
    currentGamePlayer,
    latestGamePlayerResponse,
    resolvedGamePlayerId,
    setCurrentGamePlayer,
  ]);

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
      console.log(`word object is: `, wordObject);
      setWordScore(wordObject.score);
      console.log('word score: ', wordObject.score);
    }
    return;
  }, [wordObject]);

  // functions to handle game moves
  const onKeyPress = (letter: string) => {
    console.log('handling key press');
    if (!resolvedGameId || !(gameStatus === 'in_progress')) return;
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
      //switchTurns({ currentGpId: resolvedGamePlayerId });
    },
    [resolvedGamePlayerId, makeGuess, word]
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
        {showConfetti && (
          <>
            <ConfettiCannon
              count={200}
              autoStart={true}
              fadeOut={true}
              origin={{ x: 0, y: 0 }}
            />
            <Text>Yaaaayyyyyy</Text>
          </>
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
          <Text className="text-2xl font-semibold text-blue-900">
            {resolvedGamePlayerId?.toString?.() ?? ''}
          </Text>
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
            router.push('/(app)');
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
