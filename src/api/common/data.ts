import { client } from '@/api';

export async function fetchWords(): Promise<string[]> {
  console.log('Fetching words from server...');
  const response = await client.get('/words');
  return response.data as string[];
}
