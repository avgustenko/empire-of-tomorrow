// simple-server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('🔗 Новое подключение:', socket.id);
    
    socket.on('join_room', (data) => {
        const { roomId, playerName } = data;
        console.log(`🎮 ${playerName} присоединяется к ${roomId}`);
        
        socket.join(roomId);
        
        socket.emit('room_joined', {
            success: true,
            player: { id: socket.id, name: playerName, isHost: true },
            players: [{ id: socket.id, name: playerName, isHost: true }]
        });
    });
    
    socket.on('chat_message', (data) => {
        socket.broadcast.emit('chat_message', {
            playerId: socket.id,
            playerName: 'Игрок',
            message: data.message
        });
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Отключение:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});