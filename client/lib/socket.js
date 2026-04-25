import { io } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5000';

export const socket = typeof window !== 'undefined' 
  ? io(URL, { autoConnect: false }) 
  : { connected: false, on: () => {}, off: () => {}, emit: () => {}, connect: () => {}, disconnect: () => {} };
