// ИМПЕРИЯ БУДУЩЕГО - ПРОСТАЯ МУЛЬТИПЛЕЕР ВЕРСИЯ
class EmpireGame {
    constructor() {
        console.log('🎮 Инициализация игры...');
        
        // Идентификатор комнаты из URL или случайный
        const urlParams = new URLSearchParams(window.location.search);
        this.roomId = urlParams.get('room') || this.generateRoomId();
        this.playerId = 'player_' + Math.random().toString(36).substr(2, 9);
        this.playerName = 'Игрок_' + Math.floor(Math.random() * 1000);
        
        // Игровые данные
        this.players = [];
        this.currentPlayerIndex = 0;
        this.cells = this.createGameBoard();
        this.gameLog = [];
        this.totalTurns = 0;
        this.isMyTurn = false;
        
        // WebSocket
        this.ws = null;
        this.isConnected = false;
        
        this.initUI();
        this.initGame();
        this.connectToWebSocket();
    }

    // ========== WEB SOCKET (публичный тестовый сервер) ==========
    connectToWebSocket() {
        console.log('🔗 Подключение к WebSocket...');
        
        // Используем публичный тестовый WebSocket сервер (работает без установки)
        const wsUrl = 'wss://free.blr2.piesocket.com/v3/1?api_key=VCXFEuv2GB2lw6MtfRcFq8O3wC1ZyeNq1yogbVUu&notify_self=1';
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket подключен');
                this.isConnected = true;
                this.updateConnectionStatus('✅ Онлайн');
                
                // Запрашиваем имя игрока
                setTimeout(() => {
                    const name = prompt('Введите ваше имя для игры:', this.playerName);
                    if (name) this.playerName = name;
                    
                    // Отправляем информацию о подключении
                    this.sendToServer({
                        type: 'join',
                        roomId: this.roomId,
                        playerId: this.playerId,
                        playerName: this.playerName,
                        color: this.getRandomColor()
                    });
                }, 500);
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (e) {
                    console.log('Сообщение от сервера:', event.data);
                }
            };
            
            this.ws.onclose = () => {
                console.log('❌ WebSocket отключен');
                this.isConnected = false;
                this.updateConnectionStatus('❌ Оффлайн');
                setTimeout(() => this.connectToWebSocket(), 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket ошибка:', error);
                this.updateConnectionStatus('⚠️ Ошибка');
            };
            
        } catch (error) {
            console.error('Не удалось подключиться к WebSocket:', error);
            this.showFallbackMessage();
        }
    }

    sendToServer(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Добавляем комнату и ID игрока к каждому сообщению
            const message = {
                ...data,
                roomId: this.roomId,
                playerId: this.playerId,
                timestamp: Date.now()
            };
            this.ws.send(JSON.stringify(message));
        }
    }

    handleWebSocketMessage(data) {
        // Фильтруем сообщения только для нашей комнаты
        if (data.roomId !== this.roomId) return;
        
        console.log('Получено сообщение:', data);
        
        switch(data.type) {
            case 'player_joined':
                this.addPlayer(data.player);
                this.addToLog(`👋 ${data.player.name} присоединился`);
                break;
                
            case 'player_left':
                this.removePlayer(data.playerId);
                this.addToLog(`🚪 Игрок покинул игру`);
                break;
                
            case 'chat':
                this.addToLog(`💬 ${data.playerName}: ${data.message}`);
                break;
                
            case 'game_state':
                if (data.playerId !== this.playerId) {
                    this.applyGameState(data.state);
                }
                break;
                
            case 'dice_roll':
                if (data.playerId !== this.playerId) {
                    this.showOpponentRoll(data);
                }
                break;
                
            case 'property_buy':
                this.handleRemotePropertyBuy(data);
                break;
                
            case 'player_list':
                this.updatePlayersList(data.players);
                break;
        }
    }

    // ========== ИГРОВАЯ ЛОГИКА ==========
    createGameBoard() {
        return [
            { id: 0, name: "Старт", type: "start", price: 0, owner: null, rent: 0 },
            { id: 1, name: "IT-Стартап", type: "digital", price: 2000, owner: null, rent: 400 },
            { id: 2, name: "Нефтяная вышка", type: "industry", price: 3000, owner: null, rent: 600 },
            { id: 3, name: "Казино", type: "special", price: 0, owner: null, rent: 0 },
            { id: 4, name: "Завод", type: "industry", price: 2500, owner: null, rent: 500 },
            { id: 5, name: "Биржа", type: "special", price: 0, owner: null, rent: 0 },
            { id: 6, name: "Металлургия", type: "industry", price: 3500, owner: null, rent: 700 },
            { id: 7, name: "Криптоферма", type: "digital", price: 4000, owner: null, rent: 800 },
            { id: 8, name: "Налоговая", type: "tax", price: 0, owner: null, rent: 0 },
            { id: 9, name: "Футбольный клуб", type: "luxury", price: 5000, owner: null, rent: 1000 },
            { id: 10, name: "Шанс", type: "chance", price: 0, owner: null, rent: 0 },
            { id: 11, name: "Курорт", type: "luxury", price: 4500, owner: null, rent: 900 },
            { id: 12, name: "СИЗО", type: "jail", price: 0, owner: null, rent: 0 },
            { id: 13, name: "Телеканал", type: "luxury", price: 6000, owner: null, rent: 1200 },
            { id: 14, name: "AI-Лаборатория", type: "digital", price: 5500, owner: null, rent: 1100 },
            { id: 15, name: "Парковка", type: "parking", price: 0, owner: null, rent: 0 }
        ];
    }

    // ========== UI МЕТОДЫ ==========
    initUI() {
        this.addMultiplayerUI();
    }

    addMultiplayerUI() {
        const html = `
            <div id="multiplayer-ui" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; font-size: 20px;">🌐 Империя Онлайн</h3>
                        <div id="connection-status" style="font-size: 14px; opacity: 0.9;">
                            🔄 Подключение...
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="game.copyRoomLink()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 20px; cursor: pointer; backdrop-filter: blur(10px);">
                            🔗 Пригласить
                        </button>
                        <button onclick="game.toggleChat()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 20px; cursor: pointer; backdrop-filter: blur(10px);">
                            💬 Чат
                        </button>
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>👥 Игроки в комнате:</span>
                        <span id="players-count">1</span>
                    </div>
                    <div id="players-list" style="font-size: 14px;">
                        <div style="display: flex; align-items: center; padding: 4px 0;">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: #FF6B6B; margin-right: 8px;"></div>
                            <span>Вы (${this.playerName})</span>
                        </div>
                    </div>
                </div>
                
                <div id="chat-container" style="display: none; margin-top: 10px;">
                    <div id="chat-messages" style="height: 100px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; margin-bottom: 8px; font-size: 13px;"></div>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="chat-input" placeholder="Написать сообщение..." style="flex: 1; padding: 8px; border: none; border-radius: 20px; background: rgba(255,255,255,0.9);">
                        <button onclick="game.sendChat()" style="background: #00C851; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">
                            Отпр.
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            gameBoard.insertAdjacentHTML('beforebegin', html);
        }
    }

    // ========== ИГРОВЫЕ ДЕЙСТВИЯ ==========
    rollDice() {
        if (!this.isConnected) {
            alert('❌ Нет подключения к серверу. Работает одиночный режим.');
            this.rollDiceOffline();
            return;
        }
        
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;
        
        // Отправляем на сервер
        this.sendToServer({
            type: 'dice_roll',
            dice1: dice1,
            dice2: dice2,
            total: total
        });
        
        this.processDiceRoll(dice1, dice2, total);
    }

    rollDiceOffline() {
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;
        this.processDiceRoll(dice1, dice2, total);
    }

    processDiceRoll(dice1, dice2, total) {
        // Анимация кубиков
        const diceElement = document.getElementById('dice-result');
        if (diceElement) {
            diceElement.innerHTML = `
                <div style="display: inline-block; animation: roll 0.5s;">
                    🎲 ${dice1}
                </div>
                <div style="display: inline-block; animation: roll 0.5s 0.1s;">
                    🎲 ${dice2}
                </div>
                <div style="display: inline-block; font-weight: bold; margin-left: 10px;">
                    = ${total}
                </div>
            `;
        }
        
        this.addToLog(`🎲 ${this.playerName} бросает кубики: ${dice1} + ${dice2} = ${total}`);
        this.movePlayer(total);
    }

    movePlayer(steps) {
        // Находим себя в списке игроков
        const player = this.players.find(p => p.id === this.playerId) || 
                      { id: this.playerId, name: this.playerName, position: 0, money: 15000 };
        
        const oldPosition = player.position;
        player.position = (player.position + steps) % this.cells.length;
        
        this.addToLog(`➡️ ${player.name} перемещается на ${this.cells[player.position].name}`);
        
        this.updatePlayerDisplay();
        this.handleCellAction(player.position);
        
        // Синхронизируем состояние
        this.syncGameState();
    }

    buyProperty() {
        const player = this.players.find(p => p.id === this.playerId);
        if (!player) return;
        
        const cell = this.cells[player.position];
        
        if (cell.price > 0 && !cell.owner && player.money >= cell.price) {
            cell.owner = this.playerId;
            player.money -= cell.price;
            
            // Отправляем на сервер
            this.sendToServer({
                type: 'property_buy',
                cellId: cell.id,
                price: cell.price,
                cellName: cell.name
            });
            
            this.addToLog(`✅ ${player.name} покупает ${cell.name} за $${cell.price}`);
            
            // Скрываем кнопки действий
            const actionButtons = document.getElementById('action-buttons');
            if (actionButtons) {
                actionButtons.style.display = 'none';
            }
            
            this.updateBoard();
            this.syncGameState();
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========
    addPlayer(playerData) {
        if (!this.players.some(p => p.id === playerData.id)) {
            this.players.push(playerData);
            this.updatePlayersDisplay();
        }
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        this.updatePlayersDisplay();
    }

    updatePlayersDisplay() {
        const playersList = document.getElementById('players-list');
        const playersCount = document.getElementById('players-count');
        
        if (!playersList) return;
        
        // Всегда показываем себя первым
        const allPlayers = [
            { id: this.playerId, name: this.playerName + ' (Вы)', color: '#FF6B6B' },
            ...this.players.filter(p => p.id !== this.playerId)
        ];
        
        playersList.innerHTML = allPlayers.map(player => `
            <div style="display: flex; align-items: center; padding: 4px 0;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${player.color}; margin-right: 8px;"></div>
                <span>${player.name}</span>
            </div>
        `).join('');
        
        if (playersCount) {
            playersCount.textContent = allPlayers.length;
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    addToLog(message) {
        this.gameLog.push(message);
        this.renderGameLog();
        
        // Также добавляем в чат
        this.addChatMessage('📢', message);
    }

    renderGameLog() {
        const logElement = document.getElementById('log');
        if (!logElement) return;
        
        const recentLogs = this.gameLog.slice(-6);
        logElement.innerHTML = recentLogs
            .map(entry => `<div class="log-entry">${entry}</div>`)
            .join('');
        
        logElement.scrollTop = logElement.scrollHeight;
    }

    addChatMessage(sender, message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.style.marginBottom = '4px';
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendChat() {
        const input = document.getElementById('chat-input');
        if (!input || !input.value.trim()) return;
        
        const message = input.value;
        
        // Отправляем на сервер
        this.sendToServer({
            type: 'chat',
            message: message
        });
        
        // Локально
        this.addChatMessage(this.playerName, message);
        input.value = '';
    }

    copyRoomLink() {
        const link = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('✅ Ссылка скопирована!\n\nОтправьте друзьям:\n' + link);
        }).catch(() => {
            prompt('Скопируйте ссылку вручную:', link);
        });
    }

    toggleChat() {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            chatContainer.style.display = chatContainer.style.display === 'none' ? 'block' : 'none';
        }
    }

    syncGameState() {
        if (!this.isConnected) return;
        
        this.sendToServer({
            type: 'game_state',
            state: {
                players: this.players,
                cells: this.cells,
                currentPlayerIndex: this.currentPlayerIndex
            }
        });
    }

    generateRoomId() {
        return 'room_' + Math.random().toString(36).substr(2, 6);
    }

    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#EF476F'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    showFallbackMessage() {
        const multiplayerUI = document.getElementById('multiplayer-ui');
        if (multiplayerUI) {
            multiplayerUI.innerHTML += `
                <div style="background: rgba(255,107,107,0.2); padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 14px;">
                    ⚠️ <strong>Одиночный режим</strong><br>
                    Не удалось подключиться к серверу. Вы играете в одиночку.
                    Функции сохранения и мультиплеера недоступны.
                </div>
            `;
        }
    }

    // ... остальные методы из предыдущей версии
    // (initBoard, updatePlayerDisplay, handleCellAction, endTurn и т.д.)
    // они остаются примерно такими же
}

// ========== ЗАПУСК ИГРЫ ==========
let game;

function initGame() {
    game = new EmpireGame();
    
    // Делаем глобально доступным
    window.game = game;
    window.rollDice = () => game.rollDice();
    window.buyProperty = () => game.buyProperty();
    window.endTurn = () => game.endTurn();
    
    console.log('🎮 Игра готова!');
}

// Запускаем когда страница загрузится
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}