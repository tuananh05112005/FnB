// src/lib/socket.js - kết nối Socket.IO client
import { io } from 'socket.io-client';

// URL base từ env (đã có trong api.js)
const socket = io(
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  {
    transports: ['websocket'],
  }
);
export const onCategorySettingsUpdated = (callback) => {
  socket.on('categorySettingsUpdated', callback);
};

export const offCategorySettingsUpdated = (callback) => {
  socket.off('categorySettingsUpdated', callback);
};

export default socket;
