import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, TextInput } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import ToggleSwitch from 'toggle-switch-react-native';

//import Confetti from 'react-native-confetti';
import hangman0 from '@/../assets/hangman/hangman0.png';
import hangman1 from '@/../assets/hangman/hangman1.png';
import hangman2 from '@/../assets/hangman/hangman2.png';
import hangman3 from '@/../assets/hangman/hangman3.png';
import hangman4 from '@/../assets/hangman/hangman4.png';
import hangman5 from '@/../assets/hangman/hangman5.png';
import hangman6 from '@/../assets/hangman/hangman6.png';
import { socket } from '@/api/common/client';
import { fetchWords } from '@/api/common/data';
import { Button, TouchableOpacity, View } from '@/components/ui';
import { Text } from '@/components/ui/text';

const ALPHABET = 'QWERTYUIOPASDFGHJKLZXCVBNM'.split('').sort();

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

// eslint-disable-next-line max-lines-per-function
export default function Game({ gameId }) {
  const [wrongGuessCount, setWrongGuessCount] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [correctLetters, setCorrectLetters] = useState<string[]>([]);
  const [wrongLetters, setWrongLetters] = useState<string[]>([]);
  const [wordToGuess, setWordToGuess] = useState('');
  const [isUserPlaying, setIsUserPlaying] = useState<boolean>(true);

  const [currentGuess, setCurrentGuess] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  //const [playerCount, setPlayerCount] = useState(2);
  const [isComputerOnly, setIsComputerOnly] = useState(false);
  const [gameState, setGameState] = useState(null);
  const lettersToGuess = Array.from(wordToGuess);

  const {
    data: wordList = [],
    isLoading: isLoadingWords,
    error: wordsError,
  } = useQuery<string[]>({
    queryFn: fetchWords,
    queryKey: ['words', 'default'],
    staleTime: 1000 * 60 * 5,
  });

  const getNewWordToGuess = useCallback(async (): Promise<void> => {
    if (wordList.length === 0) {
      return;
    }
    try {
      const randomIndex = Math.floor(Math.random() * wordList.length);
      const newWord = wordList[randomIndex].toUpperCase();
      setWordToGuess(newWord);
    } catch (error) {
      console.log('Error fetching word: ', error);
    }
  }, [wordList]);

  const displayedLetters = lettersToGuess.map((letter) =>
    correctLetters.includes(letter) ? letter : '_'
  );

  const refreshGame = () => {
    setIsComputerOnly(false);
    setWrongGuessCount(0);
    setWrongLetters([]);
    setGuessedLetters([]);
    setCorrectLetters([]);
    if (gameLost || gameWon || wordToGuess === '') {
      getNewWordToGuess();
    } else {
      setWordToGuess('');
    }
    setGameWon(false);
    setGameLost(false);
  };

  const onKeyPress = (letter: string) => {
    if (!isUserPlaying) return;
    if (isLoadingWords || wordsError) return;
    if (gameWon || gameLost) return;
    handleGuess(letter);
  };

  const handleGuess = useCallback(
    (letter: string) => {
      let guessApplied = false;
      setGuessedLetters((prevGuessed) => {
        if (prevGuessed.includes(letter)) return prevGuessed;

        guessApplied = true;
        const isCorrect = wordToGuess.includes(letter);
        if (isCorrect) {
          setCorrectLetters((prev) => [...prev, letter]);
        } else {
          setWrongGuessCount((prev) => prev + 1);
          setWrongLetters((prev) => [...prev, letter]);
        }

        return [...prevGuessed, letter];
      });

      if (isMultiplayer && guessApplied) {
        setIsUserPlaying((current) => !current);
      }

      makeMove(letter);
    },
    [isMultiplayer, wordToGuess]
  );

  const cpuPlay = useCallback(() => {
    if (gameWon || gameLost || wrongGuessCount >= 6) return;

    const possibleGuesses = ALPHABET.filter(
      (letter: string) => !guessedLetters.includes(letter)
    );

    if (possibleGuesses.length === 0) return;

    const guessIndex = Math.floor(Math.random() * possibleGuesses.length);
    const guess = possibleGuesses[guessIndex];
    setCurrentGuess(guess);
    console.log('guess: ', guess);
    handleGuess(guess);
  }, [gameLost, gameWon, guessedLetters, handleGuess, wrongGuessCount]);

  useEffect(() => {
    if (wordList && wordList.length > 1 && wordToGuess === '') {
      getNewWordToGuess();
    }
  }, [wordList, wordToGuess, getNewWordToGuess]);

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
  }, [wrongGuessCount, gameLost, wordToGuess]);

  useEffect(() => {
    if (isMultiplayer) {
      //if (!isUserPlaying) cpuPlay();
      if (!isUserPlaying) {
        console.log('Cpu playing');
        setTimeout(() => {
          setIsUserPlaying((current) => !current);
          cpuPlay();
        }, 1000);
      }
    }
  }, [isUserPlaying, isMultiplayer]);

  useEffect(() => {
    if (!isComputerOnly) return;
    if (gameWon || gameLost || wrongGuessCount >= 6) {
      setIsComputerOnly(false);
      //setTimeout(refreshGame, 3500);
      return;
    }
    const timer = setTimeout(() => {
      cpuPlay();
    }, 1000);
    return () => clearTimeout(timer);
  }, [cpuPlay, gameLost, gameWon, isComputerOnly, wrongGuessCount]);

  useEffect(() => {
    socket.emit('join-game', gameId);

    const handleGameState = (state) => {
      console.log('received game state:', JSON.stringify(state));
      setGameState(state);
    };

    const handleGameUpdate = ({ gameId: id, playerId, guess }) => {
      console.log('received game update:', id, playerId, guess);
      // For now, you can just log or (later) call handleGuess(guess)
    };

    socket.on('game-state', handleGameState);
    socket.on('make-move', handleGameUpdate);

    return () => {
      socket.off('game-state', handleGameState);
      socket.off('make-move', handleGameUpdate);
    };
  }, [gameId]);

  const makeMove = (guess) => {
    socket.emit('make-move', { gameId, guess });
  };

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
              {wordToGuess}
            </Text>
          </View>
        </>
      )}
      {isMultiplayer && (
        <Text className="text-xl tracking-widest text-blue-800">
          {' '}
          Multiplayer mode
        </Text>
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
          locked={!isUserPlaying}
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
          editable={!gameWon && !gameLost && isUserPlaying}
        />
      )}
      <Button className="mt-4 rounded-lg bg-blue-900" onPress={refreshGame}>
        <Text className="text-white">
          {gameWon || gameLost ? 'New Game' : 'Start Over'}
        </Text>
      </Button>
      <ToggleSwitch
        isOn={!showKeyboard}
        onColor="green"
        offColor="gray"
        label="Hide Keyboard"
        labelStyle={{ color: 'black', fontWeight: '400' }}
        size="large"
        onToggle={() => setShowKeyboard(!showKeyboard)}
      />
      <ToggleSwitch
        isOn={isMultiplayer}
        onColor="blue"
        offColor="gray"
        label="Multiplayer"
        labelStyle={{ color: 'black', fontWeight: '400' }}
        size="large"
        onToggle={() => {
          setIsMultiplayer((current) => !current);
          refreshGame();
        }}
      />
      <ToggleSwitch
        isOn={isComputerOnly}
        onColor="green"
        offColor="gray"
        label="Computer only game"
        labelStyle={{ color: 'black', fontWeight: '400' }}
        size="large"
        onToggle={() => {
          setIsComputerOnly((current) => !current);
          setIsMultiplayer(false);
          //refreshGame();
        }}
      />
      <Button
        className="mt-4 rounded-lg bg-green-800"
        onPress={() => setIsComputerOnly((current) => !current)}
      >
        <Text className="font-bold text-white">Let Computer Play</Text>
      </Button>
    </View>
  );
}
