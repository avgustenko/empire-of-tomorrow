// server.js - WebSocket сервер для мультиплеера
const WebSocket = require('ws');
const http = require('http');
const uuid = require('uuid'); // Нужно установить: npm install uuid

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Empire of Tomorrow Game Server\n');
});

// Создаем WebSocket сервер
const wss = new WebSocket.Server({ server });

// Хранилище игровых комнат
const rooms = new Map();

class GameRoom {
    constructor(roomId) {
        this.id = roomId;
        this.players = new Map(); // WebSocket -> player data
        this.gameState = null;
        this.maxPlayers = 4;
        this.status = 'waiting'; // waiting, playing, finished
    }
    
    addPlayer(ws, playerName) {
        if (this.players.size >= this.maxPlayers) {
            return { error: 'Комната заполнена' };
        }
        
        const playerId = uuid.v4();
        const player = {
            id: playerId,
            name: playerName || `Игрок ${this.players.size + 1}`,
            ws: ws,
            isHost: this.players.size === 0,
            color: this.getPlayerColor(this.players.size)
        };
        
        this.players.set(ws, player);
        
        // Отправляем обновление всем игрокам
        this.broadcast({
            type: 'player_joined',
            player: { id: playerId, name: player.name, color: player.color },
            players: this.getPlayersList()
        });
        
        return player;
    }
    
    removePlayer(ws) {
        const player = this.players.get(ws);
        if (player) {
            this.players.delete(ws);
            
            this.broadcast({
                type: 'player_left',
                playerId: player.id,
                players: this.getPlayersList()
            });
            
            // Если комната пуста, удаляем её
            if (this.players.size === 0) {
                rooms.delete(this.id);
            }
        }
    }
    
    getPlayerColor(index) {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#EF476F'];
        return colors[index % colors.length];
    }
    
    getPlayersList() {
        return Array.from(this.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            color: p.color,
            isHost: p.isHost
        }));
    }
    
    handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            const player = this.players.get(ws);
            
            if (!player) return;
            
            switch(data.type) {
                case 'game_state_update':
                    this.gameState = data.state;
                    this.broadcastToOthers(ws, {
                        type: 'game_state_sync',
                        state: data.state,
                        playerId: player.id
                    });
                    break;
                    
                case 'chat_message':
                    this.broadcast({
                        type: 'chat_message',
                        player: player.name,
                        message: data.message,
                        timestamp: new Date().toISOString()
                    });
                    break;
                    
                case 'start_game':
                    if (player.isHost) {
                        this.status = 'playing';
                        this.broadcast({
                            type: 'game_started',
                            players: this.getPlayersList()
                        });
                    }
                    break;
                    
                case 'roll_dice':
                    this.broadcast({
                        type: 'dice_rolled',
                        playerId: player.id,
                        dice1: data.dice1,
                        dice2: data.dice2,
                        total: data.total
                    });
                    break;
                    
                case 'buy_property':
                    this.broadcast({
                        type: 'property_bought',
                        playerId: player.id,
                        cellId: data.cellId,
                        price: data.price
                    });
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }
    
    broadcast(message) {
        const messageStr = JSON.stringify(message);
        this.players.forEach(player => {
            if (player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(messageStr);
            }
        });
    }
    
    broadcastToOthers(ws, message) {
        const messageStr = JSON.stringify(message);
        this.players.forEach(player => {
            if (player.ws !== ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(messageStr);
            }
        });
    }
}

// Обработка WebSocket подключений
wss.on('connection', (ws, req) => {
    console.log('Новое подключение');
    
    // Получаем параметры комнаты из URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomId = url.searchParams.get('room') || 'default';
    const playerName = url.searchParams.get('name') || 'Игрок';
    
    // Находим или создаем комнату
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new GameRoom(roomId));
        console.log(`Создана новая комната: ${roomId}`);
    }
    
    const room = rooms.get(roomId);
    
    // Добавляем игрока в комнату
    const player = room.addPlayer(ws, playerName);
    
    // Отправляем игроку информацию о комнате
    ws.send(JSON.stringify({
        type: 'welcome',
        playerId: player.id,
        roomId: room.id,
        players: room.getPlayersList(),
        isHost: player.isHost
    }));
    
    // Обработка сообщений от клиента
    ws.on('message', (message) => {
        room.handleMessage(ws, message);
    });
    
    // Обработка отключения
    ws.on('close', () => {
        console.log(`Игрок отключился: ${player.name}`);
        room.removePlayer(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎮 Сервер игры запущен на порту ${PORT}`);
    console.log(`📡 WebSocket доступен по адресу: ws://localhost:${PORT}`);
});

// Экспорт для тестирования
module.exports = { server, wss, rooms };