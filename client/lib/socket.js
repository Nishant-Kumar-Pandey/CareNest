import { io } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5000';

export const socket = io(URL, {
  autoConnect: false // We will manually connect when a user logs in
});
