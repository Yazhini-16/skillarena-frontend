import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

let socket = null;

export const getSocket = () => {
  const token = Cookies.get('token');

  if (socket) {
    // If already connected with same token — reuse it
    if (socket.connected) return socket;
    // If token changed — destroy and recreate
    if (socket.auth?.token !== token) {
      socket.disconnect();
      socket = null;
    }
  }

  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      forceNew: false,  // reuse existing connection
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
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