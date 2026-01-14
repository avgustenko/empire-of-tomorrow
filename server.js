// server.js - Мультиплеерный сервер для Империи Будущего
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Раздаем статические файлы если они есть
app.use(express.static('.'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// ========== ХРАНИЛИЩЕ ДАННЫХ ==========
const rooms = new Map(); // roomId -> { players: Map(), gameState: ... }
const players = new Map(); // socketId -> playerData

// ========== ОБРАБОТЧИКИ SOCKET.IO ==========
io.on('connection', (socket) => {
  console.log('🔗 Новое подключение:', socket.id);
  
  // Присоединение к комнате
  socket.on('join_room', (data) => {
    try {
      const { roomId, playerName, playerId, color } = data;
      
      console.log(`🎮 ${playerName} присоединяется к комнате ${roomId}`);
      
      // Создаем комнату если её нет
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          players: new Map(),
          gameState: null,
          createdAt: Date.now(),
          lastActivity: Date.now()
        });
        console.log(`🆕 Создана новая комната: ${roomId}`);
      }
      
      const room = rooms.get(roomId);
      
      // Проверяем лимит игроков (максимум 6)
      if (room.players.size >= 6) {
        socket.emit('error', { message: 'Комната заполнена' });
        return;
      }
      
      // Создаем данные игрока
      const playerData = {
        id: playerId || socket.id,
        name: playerName,
        color: color || getRandomColor(),
        socketId: socket.id,
        roomId: roomId,
        isHost: room.players.size === 0,
        joinedAt: Date.now(),
        lastSeen: Date.now()
      };
      
      // Добавляем игрока в комнату
      room.players.set(playerData.id, playerData);
      players.set(socket.id, playerData);
      
      // Присоединяем сокет к комнате
      socket.join(roomId);
      
      // Обновляем время активности
      room.lastActivity = Date.now();
      
      // Отправляем подтверждение игроку
      socket.emit('room_joined', {
        success: true,
        player: {
          id: playerData.id,
          name: playerData.name,
          color: playerData.color,
          isHost: playerData.isHost
        },
        players: Array.from(room.players.values()).map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
          isHost: p.isHost
        }))
      });
      
      // Уведомляем других игроков
      socket.to(roomId).emit('player_joined', {
        player: {
          id: playerData.id,
          name: playerData.name,
          color: playerData.color,
          isHost: playerData.isHost
        }
      });
      
      console.log(`✅ ${playerData.name} присоединился к комнате ${roomId}`);
      
    } catch (error) {
      console.error('Ошибка при присоединении:', error);
      socket.emit('error', { message: 'Ошибка сервера' });
    }
  });
  
  // Обновление состояния игры
  socket.on('game_update', (data) => {
    try {
      const player = players.get(socket.id);
      if (!player) return;
      
      const { roomId, state, action } = data;
      const room = rooms.get(roomId);
      if (!room) return;
      
      room.gameState = state;
      room.lastActivity = Date.now();
      
      // Отправляем обновление другим игрокам
      socket.to(roomId).emit('game_update', {
        playerId: player.id,
        playerName: player.name,
        state: state,
        action: action,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Ошибка обновления игры:', error);
    }
  });
  
  // Сообщения чата
  socket.on('chat_message', (data) => {
    try {
      const player = players.get(socket.id);
      if (!player) return;
      
      const { roomId, message } = data;
      
      // Отправляем сообщение всем в комнате
      io.to(roomId).emit('chat_message', {
        playerId: player.id,
        playerName: player.name,
        message: message,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Ошибка чата:', error);
    }
  });
  
  // Пинг для поддержания соединения
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
  
  // Отключение игрока
  socket.on('disconnect', () => {
    try {
      const player = players.get(socket.id);
      if (player) {
        const room = rooms.get(player.roomId);
        if (room) {
          room.players.delete(player.id);
          
          // Уведомляем других игроков
          socket.to(player.roomId).emit('player_left', {
            playerId: player.id,
            playerName: player.name
          });
          
          // Если комната пуста, удаляем её через 5 минут
          if (room.players.size === 0) {
            setTimeout(() => {
              if (room.players.size === 0) {
                rooms.delete(room.id);
                console.log(`🗑️ Комната ${room.id} удалена (пустая)`);
              }
            }, 5 * 60 * 1000);
          }
        }
        
        players.delete(socket.id);
        console.log(`❌ ${player.name} отключился`);
      }
    } catch (error) {
      console.error('Ошибка при отключении:', error);
    }
  });
});

// ========== HTTP МАРШРУТЫ ==========

// Статус сервера
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    server: 'Empire of Tomorrow Game Server',
    version: '1.0.0',
    uptime: process.uptime(),
    rooms: rooms.size,
    players: players.size,
    timestamp: Date.now()
  });
});

// Информация о комнате
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (room) {
    res.json({
      exists: true,
      id: room.id,
      playerCount: room.players.size,
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost
      })),
      createdAt: room.createdAt
    });
  } else {
    res.json({
      exists: false,
      message: 'Комната не найдена'
    });
  }
});

// Создание комнаты
app.post('/api/room', (req, res) => {
  try {
    const { playerName } = req.body;
    const roomId = generateRoomId();
    
    res.json({
      success: true,
      roomId: roomId,
      message: 'Комната создана',
      link: `?room=${roomId}`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания комнаты'
    });
  }
});

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({
    message: 'Empire of Tomorrow Game Server',
    endpoints: {
      status: '/api/status',
      roomInfo: '/api/room/:roomId',
      createRoom: 'POST /api/room'
    },
    github: 'https://github.com/avgustenko/empire-of-tomorrow'
  });
});

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function getRandomColor() {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#EF476F'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Очистка неактивных комнат
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  rooms.forEach((room, roomId) => {
    // Удаляем комнаты без активности более 2 часов
    if (now - room.lastActivity > 2 * 60 * 60 * 1000) {
      rooms.delete(roomId);
      cleaned++;
      console.log(`🧹 Удалена неактивная комната: ${roomId}`);
    }
  });
  
  if (cleaned > 0) {
    console.log(`🧹 Очистка: удалено ${cleaned} неактивных комнат`);
  }
}, 10 * 60 * 1000);

// ========== ЗАПУСК СЕРВЕРА ==========
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  🚀 СЕРВЕР ЗАПУЩЕН!
  =================
  📡 Порт: ${PORT}
  🌐 HTTP: http://localhost:${PORT}
  🔗 WebSocket: ws://localhost:${PORT}
  🕐 Время запуска: ${new Date().toLocaleString()}
  =================
  `);
});