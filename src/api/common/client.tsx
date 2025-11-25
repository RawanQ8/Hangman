import axios from 'axios';
import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:3000';

export const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const socket = io(`${BASE_URL}/game`, {
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on('disconnect', () => {
  console.log(socket.id); // undefined
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

export default client;
