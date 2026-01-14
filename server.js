// server.js - Мультиплеерный сервер для Империи Будущего
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Статическая раздача файлов игры
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
const gameRooms = new Map(); // roomId -> roomData
const connectedPlayers = new Map(); // socketId -> playerData

class GameRoom {
  constructor(roomId, creatorId) {
    this.id = roomId;
    this.creatorId = creatorId;
    this.players = new Map(); // playerId -> playerData
    this.gameState = null;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.settings = {
      maxPlayers: 6,
      startingMoney: 20000,
      enableBots: true
    };
  }
  
  addPlayer(playerData) {
    this.players.set(playerData.id, playerData);
    this.lastActivity = Date.now();
    return playerData;
  }
  
  removePlayer(playerId) {
    this.players.delete(playerId);
    this.lastActivity = Date.now();
  }
  
  getPlayerCount() {
    return this.players.size;
  }
  
  getPlayerList() {
    return Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      isOnline: p.isOnline,
      isHost: p.id === this.creatorId,
      money: p.money || 20000
    }));
  }
  
  broadcastToRoom(event, data, excludeSocketId = null) {
    this.players.forEach(player => {
      if (player.socketId && player.socketId !== excludeSocketId) {
        const socket = io.sockets.sockets.get(player.socketId);
        if (socket) {
          socket.emit(event, data);
        }
      }
    });
  }
}

// ========== SOCKET.IO ОБРАБОТЧИКИ ==========
io.on('connection', (socket) => {
  console.log('🔗 Новое подключение:', socket.id);
  
  // Присоединение к комнате
  socket.on('join-room', (data) => {
    try {
      const { roomId, playerName, playerId, color } = data;
      
      console.log(`🎮 ${playerName} пытается присоединиться к комнате ${roomId}`);
      
      // Проверяем или создаем комнату
      if (!gameRooms.has(roomId)) {
        const newRoom = new GameRoom(roomId, playerId);
        gameRooms.set(roomId, newRoom);
        console.log(`🆕 Создана новая комната: ${roomId}`);
      }
      
      const room = gameRooms.get(roomId);
      
      // Проверяем лимит игроков
      if (room.getPlayerCount() >= room.settings.maxPlayers) {
        socket.emit('join-error', {
          message: 'Комната заполнена'
        });
        return;
      }
      
      // Создаем данные игрока
      const playerData = {
        id: playerId || `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: playerName || `Игрок_${room.getPlayerCount() + 1}`,
        color: color || getRandomColor(),
        socketId: socket.id,
        roomId: roomId,
        isOnline: true,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        money: room.settings.startingMoney
      };
      
      // Добавляем игрока в комнату
      room.addPlayer(playerData);
      connectedPlayers.set(socket.id, playerData);
      
      // Присоединяем сокет к комнате
      socket.join(roomId);
      
      // Отправляем подтверждение игроку
      socket.emit('room-joined', {
        success: true,
        player: {
          id: playerData.id,
          name: playerData.name,
          color: playerData.color,
          isHost: playerData.id === room.creatorId
        },
        room: {
          id: roomId,
          players: room.getPlayerList(),
          settings: room.settings,
          createdAt: room.createdAt
        }
      });
      
      // Уведомляем других игроков
      room.broadcastToRoom('player-joined', {
        player: {
          id: playerData.id,
          name: playerData.name,
          color: playerData.color,
          isHost: playerData.id === room.creatorId
        },
        timestamp: Date.now()
      });
      
      console.log(`✅ ${playerData.name} присоединился к комнате ${roomId}`);
      
    } catch (error) {
      console.error('Ошибка при присоединении:', error);
      socket.emit('join-error', {
        message: 'Ошибка сервера'
      });
    }
  });
  
  // Обновление состояния игры
  socket.on('game-update', (data) => {
    try {
      const player = connectedPlayers.get(socket.id);
      if (!player) return;
      
      const { state, action } = data;
      const room = gameRooms.get(player.roomId);
      if (!room) return;
      
      room.gameState = state;
      room.lastActivity = Date.now();
      
      // Отправляем обновление другим игрокам
      room.broadcastToRoom('game-state-update', {
        playerId: player.id,
        playerName: player.name,
        state: state,
        action: action,
        timestamp: Date.now()
      }, socket.id);
      
    } catch (error) {
      console.error('Ошибка обновления игры:', error);
    }
  });
  
  // Сообщения чата
  socket.on('chat-message', (data) => {
    try {
      const player = connectedPlayers.get(socket.id);
      if (!player) return;
      
      const { message } = data;
      const room = gameRooms.get(player.roomId);
      if (!room) return;
      
      // Отправляем сообщение всем в комнате
      io.to(player.roomId).emit('chat-message', {
        playerId: player.id,
        playerName: player.name,
        playerColor: player.color,
        message: message,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Ошибка чата:', error);
    }
  });
  
  // Запрос информации о комнате
  socket.on('get-room-info', (data) => {
    try {
      const { roomId } = data;
      const room = gameRooms.get(roomId);
      
      if (room) {
        socket.emit('room-info', {
          exists: true,
          players: room.getPlayerList(),
          playerCount: room.getPlayerCount(),
          createdAt: room.createdAt
        });
      } else {
        socket.emit('room-info', {
          exists: false,
          players: [],
          playerCount: 0
        });
      }
    } catch (error) {
      console.error('Ошибка получения информации:', error);
    }
  });
  
  // Пинг для поддержания соединения
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
  
  // Отключение игрока
  socket.on('disconnect', () => {
    try {
      const player = connectedPlayers.get(socket.id);
      if (player) {
        const room = gameRooms.get(player.roomId);
        if (room) {
          room.removePlayer(player.id);
          
          // Обновляем статус игрока
          player.isOnline = false;
          player.lastSeen = Date.now();
          
          // Уведомляем других игроков
          room.broadcastToRoom('player-left', {
            playerId: player.id,
            playerName: player.name,
            reason: 'disconnect',
            timestamp: Date.now()
          });
          
          // Если комната пуста, удаляем её через 5 минут
          if (room.getPlayerCount() === 0) {
            setTimeout(() => {
              if (room.getPlayerCount() === 0) {
                gameRooms.delete(room.id);
                console.log(`🗑️ Комната ${room.id} удалена (пустая)`);
              }
            }, 5 * 60 * 1000); // 5 минут
          }
        }
        
        connectedPlayers.delete(socket.id);
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
    serverTime: Date.now(),
    rooms: gameRooms.size,
    totalPlayers: connectedPlayers.size,
    uptime: process.uptime()
  });
});

// Список активных комнат
app.get('/api/rooms', (req, res) => {
  const roomsList = Array.from(gameRooms.values()).map(room => ({
    id: room.id,
    playerCount: room.getPlayerCount(),
    createdAt: room.createdAt,
    lastActivity: room.lastActivity,
    hasPassword: false
  }));
  
  res.json({
    rooms: roomsList,
    total: roomsList.length
  });
});

// Информация о конкретной комнате
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = gameRooms.get(roomId);
  
  if (room) {
    res.json({
      exists: true,
      id: room.id,
      players: room.getPlayerList(),
      playerCount: room.getPlayerCount(),
      createdAt: room.createdAt,
      settings: room.settings
    });
  } else {
    res.status(404).json({
      exists: false,
      message: 'Комната не найдена'
    });
  }
});

// Создание новой комнаты
app.post('/api/create-room', (req, res) => {
  try {
    const { playerName, settings } = req.body;
    const roomId = generateRoomId();
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newRoom = new GameRoom(roomId, playerId);
    
    if (settings) {
      newRoom.settings = { ...newRoom.settings, ...settings };
    }
    
    gameRooms.set(roomId, newRoom);
    
    res.json({
      success: true,
      roomId: roomId,
      playerId: playerId,
      message: 'Комната создана'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания комнаты'
    });
  }
});

// Корневой маршрут - отдаем игру
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function getRandomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', 
    '#118AB2', '#EF476F', '#9D4EDD', '#FF9E6D'
  ];
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

// Очистка неактивных комнат каждые 10 минут
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  gameRooms.forEach((room, roomId) => {
    // Удаляем комнаты без активности более 2 часов
    if (now - room.lastActivity > 2 * 60 * 60 * 1000) {
      gameRooms.delete(roomId);
      cleaned++;
      console.log(`🧹 Удалена неактивная комната: ${roomId}`);
    }
  });
  
  if (cleaned > 0) {
    console.log(`🧹 Очистка: удалено ${cleaned} неактивных комнат`);
  }
}, 10 * 60 * 1000); // Каждые 10 минут

// ========== ЗАПУСК СЕРВЕРА ==========
const PORT = process.env.PORT || 3000;
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

// Экспорт для тестирования
module.exports = { app, server, io, gameRooms, connectedPlayers };