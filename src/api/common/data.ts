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

export async function fetchUsername(id: number): Promise<string> {
  const res = await client.get(`/player/${id}`);
  return res.data.username as string;
}

export async function fetchTurn(gpId: number): Promise<boolean> {
  const turnRes = await client.get(`/game/${gpId}/current-turn`);
  return turnRes.data.isTurn as boolean;
}

export async function fetchPlayerStatus(gpId: number): Promise<string> {
  const statusRes = await client.get(`/game/${gpId}/player-status`);
  return statusRes.data.status;
}

export async function fetchGameStatus(gameId: number): Promise<string> {
  const res = await client.get(`/game/${gameId}/status`);
  return res.data.status;
}

export async function submitGuess(gpId: number, guess: string): Promise<void> {
  const normalizedGuess = guess.trim().toUpperCase();
  if (!normalizedGuess) {
    return;
  }
  await client.post(`/game/${gpId}/${normalizedGuess}`);
}
