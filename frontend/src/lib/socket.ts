import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, '');

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  auth: (cb) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    cb({ token });
  },
});
