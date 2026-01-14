// test-server.js - Простейший тестовый сервер
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);
    
    socket.on('join_room', (data) => {
        console.log('Присоединение:', data);
        socket.join(data.roomId);
        
        socket.emit('room_joined', {
            success: true,
            player: { id: socket.id, name: data.playerName, isHost: true },
            players: [{ id: socket.id, name: data.playerName, isHost: true }]
        });
    });
    
    socket.on('chat_message', (data) => {
        socket.broadcast.emit('chat_message', {
            playerId: socket.id,
            playerName: 'Тест',
            message: data.message
        });
    });
    
    socket.on('disconnect', () => {
        console.log('Отключение:', socket.id);
    });
});

server.listen(3001, () => {
    console.log('✅ Тестовый сервер запущен на порту 3001');
});