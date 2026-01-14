// ИМПЕРИЯ БУДУЩЕГО - ИСПРАВЛЕННАЯ ВЕРСИЯ С МУЛЬТИПЛЕЕРОМ
class EmpireGame {
    constructor() {
        console.log('🎮 Инициализация игры...');
        
        // ========== ФИКС: УНИКАЛЬНЫЙ ID ДЛЯ КАЖДОЙ ВКЛАДКИ ==========
        const urlParams = new URLSearchParams(window.location.search);
        const roomIdFromUrl = urlParams.get('room');
        
        // Генерируем уникальный ID игрока
        this.playerId = 'player_' + Date.now() + '_' + 
                       Math.random().toString(36).substr(2, 9) + '_' +
                       Math.random().toString(36).substr(2, 9);
        
        // Получаем имя игрока для этой комнаты
        this.roomId = roomIdFromUrl || this.generateRoomId();
        const roomKey = `empire_player_name_${this.roomId}`;
        this.playerName = localStorage.getItem(roomKey) || `Игрок_${Math.floor(Math.random() * 1000)}`;
        
        this.isMultiplayer = false;
        this.isHost = false;
        this.connectedPlayers = [];
        
        // Socket.io подключение
        this.socket = null;
        this.serverUrl = this.detectServerUrl();
        
        // Экономическая система
        this.inflationRate = 1.0;
        this.economicState = 'stable';
        this.stockPrices = {
            digital: 100,
            industry: 100,
            luxury: 100
        };
        
        // Игровые данные
        this.players = [
            { 
                id: this.playerId, 
                name: this.playerName, 
                money: 20000, 
                position: 0, 
                color: this.getRandomColor(),
                stocks: { digital: 0, industry: 0, luxury: 0 },
                items: [],
                isHost: false
            }
        ];
        this.currentPlayerIndex = 0;
        this.cells = this.createGameBoard();
        this.gameLog = ["🎮 Добро пожаловать в Империю Будущего!"];
        this.totalTurns = 0;
        this.properties = [0];
        this.auctionItems = [];
        this.luxuryItems = this.createLuxuryItems();
        
        this.initUI();
        this.initBoard();
        this.updateDisplay();
        this.renderGameLog();
        
        console.log('✅ Игра готова! Игрок:', this.playerId);
    }

    // ========== МУЛЬТИПЛЕЕР СИСТЕМА ==========
    detectServerUrl() {
        // Используем публичный тестовый сервер
        return 'https://empire-test-server.onrender.com';
        // Или ваш локальный сервер: 'http://localhost:3001'
    }

    generateRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#EF476F'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    initUI() {
        this.createMultiplayerPanel();
        this.createEconomicPanel();
    }

    createMultiplayerPanel() {
        const panelHTML = `
            <div id="multiplayer-panel" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 8px 25px rgba(0,0,0,0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; font-size: 22px;">🌐 Империя Онлайн</h3>
                        <div id="connection-status" style="font-size: 14px; opacity: 0.9; margin-top: 5px;">
                            <span style="background: #f44336; padding: 3px 10px; border-radius: 12px; font-size: 12px;">❌ Локальный режим</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="game.toggleMultiplayer()" id="multiplayer-btn" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px 20px; border-radius: 25px; cursor: pointer; backdrop-filter: blur(10px); transition: all 0.3s;">
                            🌐 Включить онлайн
                        </button>
                        <button onclick="game.copyRoomLink()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px 20px; border-radius: 25px; cursor: pointer; backdrop-filter: blur(10px);">
                            🔗 Пригласить
                        </button>
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-weight: 500;">👥 Игроки в комнате:</span>
                        <span id="players-count">1</span>
                    </div>
                    <div id="players-list" style="font-size: 14px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <div style="display: flex; align-items: center;">
                                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${this.players[0].color}; margin-right: 10px;"></div>
                                <span>${this.playerName} (Вы)</span>
                            </div>
                            <span style="font-size: 12px; opacity: 0.8;">$20,000</span>
                        </div>
                    </div>
                </div>
                
                <div id="chat-container">
                    <div id="chat-messages" style="height: 120px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; margin-bottom: 10px; font-size: 13px;">
                        <div style="color: #aaa; text-align: center; padding: 10px;">Чат включится в онлайн-режиме</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="chat-input" placeholder="Написать сообщение..." style="flex: 1; padding: 10px; border: none; border-radius: 20px; background: rgba(255,255,255,0.9);" disabled>
                        <button onclick="game.sendChat()" style="background: #00C851; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: 500;" disabled>
                            Отпр.
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const gameBoard = document.querySelector('.game-board-container');
        if (gameBoard) {
            gameBoard.insertAdjacentHTML('beforebegin', panelHTML);
        }
    }

    toggleMultiplayer() {
        if (!this.isMultiplayer) {
            this.enableMultiplayer();
        } else {
            this.disableMultiplayer();
        }
    }

    enableMultiplayer() {
        const name = prompt('Введите ваше имя для онлайн-игры:', this.playerName);
        if (!name) return;
        
        this.playerName = name;
        this.players[0].name = name;
        
        // Сохраняем имя для этой комнаты
        const roomKey = `empire_player_name_${this.roomId}`;
        localStorage.setItem(roomKey, name);
        
        this.connectToServer();
    }

    connectToServer() {
        console.log('🔗 Подключение к серверу:', this.serverUrl);
        
        // Подключаем Socket.io
        this.socket = io(this.serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        
        // Обработчики событий
        this.socket.on('connect', () => {
            console.log('✅ Подключено к серверу');
            this.isMultiplayer = true;
            this.updateConnectionStatus('✅ Онлайн режим');
            this.joinRoom();
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('❌ Ошибка подключения:', error);
            this.updateConnectionStatus('⚠️ Сервер недоступен');
            
            // Включаем локальный режим с ботами
            this.enableLocalMultiplayer();
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ Отключено от сервера');
            this.updateConnectionStatus('❌ Оффлайн');
        });
        
        this.socket.on('room_joined', (data) => {
            console.log('🎮 Присоединились к комнате:', data);
            this.handleRoomJoined(data);
        });
        
        this.socket.on('player_joined', (data) => {
            console.log('👋 Новый игрок:', data);
            this.handlePlayerJoined(data);
        });
        
        this.socket.on('player_left', (data) => {
            console.log('🚪 Игрок вышел:', data);
            this.handlePlayerLeft(data);
        });
        
        this.socket.on('game_update', (data) => {
            this.handleGameUpdate(data);
        });
        
        this.socket.on('chat_message', (data) => {
            this.handleChatMessage(data);
        });
    }

    enableLocalMultiplayer() {
        this.isMultiplayer = true;
        
        // Обновляем UI
        document.getElementById('multiplayer-btn').innerHTML = '🌐 Локальный режим';
        document.getElementById('multiplayer-btn').style.background = 'rgba(255, 152, 0, 0.3)';
        document.getElementById('multiplayer-btn').style.borderColor = '#FF9800';
        
        this.updateConnectionStatus('✅ Локальный мультиплеер');
        
        document.getElementById('chat-input').disabled = false;
        document.querySelector('#chat-container button').disabled = false;
        
        // Добавляем ботов
        this.addBotPlayers();
        
        this.gameLog.push('🤖 Включен локальный мультиплеер с ботами');
        this.renderGameLog();
    }

    joinRoom() {
        if (!this.socket || !this.socket.connected) return;
        
        this.socket.emit('join_room', {
            roomId: this.roomId,
            playerName: this.playerName,
            playerId: this.playerId,
            color: this.players[0].color
        });
    }

    handleRoomJoined(data) {
        this.isHost = data.isHost;
        this.connectedPlayers = data.players.filter(p => p.id !== this.playerId);
        this.updatePlayersList();
        
        this.gameLog.push(`🏠 ${this.isHost ? 'Создана новая комната' : 'Присоединились к комнате'}`);
        this.renderGameLog();
    }

    handlePlayerJoined(data) {
        // Игнорируем себя
        if (data.player.id === this.playerId) return;
        
        this.connectedPlayers.push(data.player);
        this.updatePlayersList();
        this.gameLog.push(`👋 ${data.player.name} присоединился`);
        this.renderGameLog();
    }

    handlePlayerLeft(data) {
        this.connectedPlayers = this.connectedPlayers.filter(p => p.id !== data.playerId);
        this.updatePlayersList();
        this.gameLog.push(`🚪 Игрок покинул игру`);
        this.renderGameLog();
    }

    handleGameUpdate(data) {
        // Игнорируем свои собственные обновления
        if (data.playerId === this.playerId) return;
        
        // Просто логируем действия других игроков
        if (data.action === 'dice_roll') {
            this.gameLog.push(`🎲 ${data.playerName} бросает кубики`);
        } else if (data.action === 'buy_property') {
            this.gameLog.push(`🏠 ${data.playerName} покупает недвижимость`);
        } else if (data.action === 'end_turn') {
            this.gameLog.push(`🔄 ${data.playerName} завершает ход`);
        }
        
        this.renderGameLog();
    }

    handleChatMessage(data) {
        this.addChatMessage(data.playerName, data.message);
    }

    addBotPlayers() {
        const bots = [
            { id: 'bot_1', name: 'Алексей_Инвестор', color: '#4ECDC4', money: 18000, isBot: true },
            { id: 'bot_2', name: 'Мария_Бизнес', color: '#FFD166', money: 22000, isBot: true }
        ];
        
        this.connectedPlayers = bots;
        this.updatePlayersList();
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            if (status.includes('✅')) {
                const color = status.includes('Локальный') ? '#FF9800' : '#4CAF50';
                statusElement.innerHTML = `
                    <span style="background: ${color}; padding: 3px 10px; border-radius: 12px; font-size: 12px;">${status}</span>
                    <span style="margin-left: 10px; font-size: 12px;">ID комнаты: ${this.roomId}</span>
                `;
            } else {
                statusElement.innerHTML = `
                    <span style="background: #f44336; padding: 3px 10px; border-radius: 12px; font-size: 12px;">${status}</span>
                `;
            }
        }
    }

    updatePlayersList() {
        const playersList = document.getElementById('players-list');
        const playersCount = document.getElementById('players-count');
        
        if (!playersList) return;
        
        const allPlayers = [this.players[0], ...this.connectedPlayers];
        
        playersList.innerHTML = allPlayers.map(player => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; align-items: center;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${player.color}; margin-right: 10px;"></div>
                    <span>${player.name} ${player.id === this.playerId ? '(Вы)' : ''} ${player.isBot ? '🤖' : ''}</span>
                </div>
                <span style="font-size: 12px; opacity: 0.8;">$${(player.money || 20000).toLocaleString()}</span>
            </div>
        `).join('');
        
        if (playersCount) {
            playersCount.textContent = allPlayers.length;
        }
    }

    disableMultiplayer() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.isMultiplayer = false;
        this.connectedPlayers = [];
        
        document.getElementById('multiplayer-btn').innerHTML = '🌐 Включить онлайн';
        document.getElementById('multiplayer-btn').style.background = 'rgba(255,255,255,0.2)';
        document.getElementById('multiplayer-btn').style.borderColor = 'rgba(255,255,255,0.3)';
        
        this.updateConnectionStatus('❌ Локальный режим');
        
        document.getElementById('chat-input').disabled = true;
        document.querySelector('#chat-container button').disabled = true;
        
        this.gameLog.push('🔌 Мультиплеер отключен');
        this.renderGameLog();
        this.updatePlayersList();
    }

    copyRoomLink() {
        const link = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(() => {
                this.showNotification('✅ Ссылка скопирована! Отправьте друзьям.');
            }).catch(() => {
                prompt('Скопируйте ссылку вручную:', link);
            });
        } else {
            prompt('Скопируйте ссылку вручную:', link);
        }
    }

    sendChat() {
        const input = document.getElementById('chat-input');
        if (!input || !input.value.trim()) return;
        
        const message = input.value;
        
        if (this.isMultiplayer && this.socket && this.socket.connected) {
            this.socket.emit('chat_message', {
                roomId: this.roomId,
                message: message
            });
        }
        
        this.addChatMessage(this.playerName, message);
        input.value = '';
    }

    addChatMessage(sender, message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        if (chatMessages.querySelector('div[style*="color: #aaa"]')) {
            chatMessages.innerHTML = '';
        }
        
        const messageElement = document.createElement('div');
        messageElement.style.marginBottom = '5px';
        messageElement.innerHTML = `
            <strong style="color: ${sender === this.playerName ? '#FFD166' : '#4ECDC4'}">${sender}:</strong> 
            <span style="color: white">${message}</span>
            <span style="color: #aaa; font-size: 11px; margin-left: 5px;">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    syncGameState(action) {
        if (!this.isMultiplayer || !this.socket || !this.socket.connected) return;
        
        const gameState = {
            players: this.players,
            cells: this.cells,
            currentPlayerIndex: this.currentPlayerIndex,
            totalTurns: this.totalTurns
        };
        
        this.socket.emit('game_update', {
            roomId: this.roomId,
            state: gameState,
            action: action
        });
    }

    // ========== ОСТАЛЬНЫЕ МЕТОДЫ (оставить как были) ==========
    createGameBoard() {
        return [
            { id: 0, name: "Старт", type: "start", price: 0, owner: null, rent: 0, level: 0 },
            { id: 1, name: "IT-Стартап", type: "digital", price: 2000, owner: null, rent: 400, level: 0 },
            { id: 2, name: "Нефтяная вышка", type: "industry", price: 3000, owner: null, rent: 600, level: 0 },
            { id: 3, name: "Казино", type: "casino", price: 5000, owner: null, rent: 1000, level: 0 },
            { id: 4, name: "Завод", type: "industry", price: 2500, owner: null, rent: 500, level: 0 },
            { id: 5, name: "Фондовая биржа", type: "stock", price: 0, owner: null, rent: 0, level: 0 },
            { id: 6, name: "Металлургия", type: "industry", price: 3500, owner: null, rent: 700, level: 0 },
            { id: 7, name: "Криптоферма", type: "digital", price: 4000, owner: null, rent: 800, level: 0 },
            { id: 8, name: "Налоговая", type: "tax", price: 0, owner: null, rent: 0, level: 0 },
            { id: 9, name: "Футбольный клуб", type: "luxury", price: 6000, owner: null, rent: 1200, level: 0 },
            { id: 10, name: "Аукцион", type: "auction", price: 0, owner: null, rent: 0, level: 0 },
            { id: 11, name: "Курорт", type: "luxury", price: 4500, owner: null, rent: 900, level: 0 },
            { id: 12, name: "СИЗО", type: "jail", price: 0, owner: null, rent: 0, level: 0 },
            { id: 13, name: "Телеканал", type: "luxury", price: 7000, owner: null, rent: 1400, level: 0 },
            { id: 14, name: "AI-Лаборатория", type: "digital", price: 5500, owner: null, rent: 1100, level: 0 },
            { id: 15, name: "Магазин предметов", type: "shop", price: 0, owner: null, rent: 0, level: 0 }
        ];
    }

    createLuxuryItems() {
        return [
            { id: 1, name: "Частный самолёт", price: 11500, effect: "Перелет на любую клетку 1 раз в 3 хода", uses: 0, cooldown: 0 },
            { id: 2, name: "Лоббист", price: 8000, effect: "Отмена одного налога или штрафа", uses: 1 },
            { id: 3, name: "Киберзащита", price: 4500, effect: "Защита от хакерских атак на 5 ходов", duration: 5 },
            { id: 4, name: "Золотая виза", price: 6000, effect: "Пропуск одной тюрьмы", uses: 1 },
            { id: 5, name: "Хакеры", price: 7500, effect: "Кража 10% денег у случайного игрока", uses: 1 }
        ];
    }

    createEconomicPanel() {
        const panelHTML = `
            <div id="economic-panel" style="background: white; border-radius: 12px; padding: 15px; margin: 15px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 4px solid #4ECDC4;">
                <h4 style="margin: 0 0 10px 0; color: #2d3436; display: flex; align-items: center; gap: 8px;">
                    📊 Экономическая ситуация
                </h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 13px;">
                    <div style="text-align: center;">
                        <div style="color: #666;">Инфляция</div>
                        <div style="font-weight: bold; color: ${this.inflationRate > 1 ? '#e17055' : '#00b894'};" id="inflation-rate">
                            ${Math.round((this.inflationRate - 1) * 100)}%
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #666;">Статус экономики</div>
                        <div style="font-weight: bold;" id="economy-status">
                            ${this.economicState === 'stable' ? '⚖️ Стабильна' : 
                              this.economicState === 'boom' ? '🚀 Бум' : '📉 Кризис'}
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #666;">Биржа</div>
                        <div style="font-weight: bold; color: #0984e3;" id="stock-indicator">
                            ${Object.values(this.stockPrices).some(p => p > 100) ? '📈' : '📉'}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const controlsPanel = document.querySelector('.controls-panel');
        if (controlsPanel) {
            controlsPanel.insertAdjacentHTML('afterbegin', panelHTML);
        }
    }

    // ... остальные методы без изменений (rollDice, buyProperty, etc.)

    rollDice() {
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;
        
        this.gameLog.push(`🎲 ${this.getCurrentPlayer().name} бросает кубики: ${dice1}+${dice2}=${total}`);
        
        const diceResult = document.getElementById('dice-result');
        if (diceResult) {
            diceResult.innerHTML = `
                <div style="display: inline-block; animation: roll 0.5s; font-size: 1.8rem;">🎲 ${dice1}</div>
                <div style="display: inline-block; animation: roll 0.5s 0.1s; font-size: 1.8rem;">🎲 ${dice2}</div>
                <div style="display: inline-block; font-weight: bold; margin-left: 15px; font-size: 1.5rem; color: #2d3436;">= ${total}</div>
            `;
        }
        
        this.movePlayer(total);
        this.renderGameLog();
        this.syncGameState('dice_roll');
    }

    // ... остальной код игры (оставить как есть)
}

// ========== ЗАПУСК ИГРЫ ==========
let game;

function initGame() {
    console.log('🚀 Запуск игры...');
    game = new EmpireGame();
    
    window.game = game;
    window.rollDice = () => game.rollDice();
    window.buyProperty = () => game.buyProperty();
    window.endTurn = () => game.endTurn();
    
    console.log('🎉 Игра запущена!');
    
    // Горячие клавиши
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            game.saveGame();
        }
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            game.loadGame();
        }
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            const rollButton = document.getElementById('roll-button');
            if (rollButton && !rollButton.disabled) {
                rollDice();
            }
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);