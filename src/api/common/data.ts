import { client } from '@/api';

export async function fetchWord(id: number): Promise<string> {
  console.log('Fetching word from server...');
  const res = await client.get(`/game/${id}`);
  const word = res.data.word.toUpperCase();
  console.log(word);
  return word as string;
}

export async function fetchPlayerGuess(id: number): Promise<string[]> {
  console.log('Fetching users guesses');
  const res = await client.get(`/game/gp/${id}`);
  const guessArr = res.data;
  return guessArr as string[];
}

export async function submitGuess(
  gameId: number,
  guess: string
): Promise<void> {
  const normalizedGuess = guess.trim().toUpperCase();
  if (!normalizedGuess) {
    return;
  }

  await client.post(`/game/${gameId}/${normalizedGuess}`);
}
