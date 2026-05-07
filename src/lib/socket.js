import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

let socket = null;

const createSocket = () => {
  const token = Cookies.get('token');

  if (!token) return null;

  const s = io(process.env.NEXT_PUBLIC_WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  s.on('connect', () => {
    console.log('Socket connected:', s.id);
  });

  s.on('connect_error', (err) => {
    console.error('Socket error:', err.message);
  });

  s.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return s;
};

export const connectSocket = () => {
  const token = Cookies.get('token');

  if (!token) {
    console.warn('No token available for socket connection');
    return null;
  }

  // If socket exists and is connected with same token — reuse
  if (socket && socket.connected && socket.auth?.token === token) {
    return socket;
  }

  // If token changed or socket doesn't exist — create new
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = createSocket();
  if (socket && !socket.connected) {
    socket.connect();
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};