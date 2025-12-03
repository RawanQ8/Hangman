import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

export const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export default client;
