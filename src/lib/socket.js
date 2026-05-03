import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

let socket = null;

export const getSocket = () => {
  const token = Cookies.get('token');

  // Always recreate socket if token changed
  if (socket && socket.auth?.token !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Force a new connection per session
      forceNew: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id, '| User token prefix:', token?.slice(0, 20));
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });
  }

  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};