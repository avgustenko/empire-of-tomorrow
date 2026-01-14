// ИМПЕРИЯ БУДУЩЕГО - РАСШИРЕННАЯ ВЕРСИЯ С МУЛЬТИПЛЕЕРОМ
class EmpireGame {
    constructor() {
        console.log('🎮 Инициализация расширенной версии...');
        
        // Мультиплеер система
        this.roomId = this.getRoomIdFromURL();
        this.playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.playerName = localStorage.getItem('empire_player_name') || `Игрок_${Math.floor(Math.random() * 1000)}`;
        this.isMultiplayer = false;
        this.connectedPlayers = [];
        
        // Экономическая система
        this.inflationRate = 1.0; // 100% базовая цена
        this.economicState = 'stable'; // stable, boom, recession
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
                color: "#FF6B6B",
                stocks: { digital: 0, industry: 0, luxury: 0 },
                items: []
            }
        ];
        this.currentPlayerIndex = 0;
        this.cells = this.createGameBoard();
        this.gameLog = ["🎮 Добро пожаловать в Империю Будущего v2.0!"];
        this.totalTurns = 0;
        this.properties = [0];
        this.auctionItems = [];
        this.luxuryItems = this.createLuxuryItems();
        
        this.initUI();
        this.initBoard();
        this.updateDisplay();
        this.renderGameLog();
        this.setupMultiplayer();
        
        console.log('✅ Расширенная версия готова!');
    }

    // ========== МУЛЬТИПЛЕЕР СИСТЕМА ==========
    setupMultiplayer() {
        this.multiplayerPanel = this.createMultiplayerPanel();
        
        // Симуляция мультиплеера (в реальной версии здесь был бы WebSocket)
        this.simulateMultiplayer();
    }

    createMultiplayerPanel() {
        const panelHTML = `
            <div id="multiplayer-panel" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 8px 25px rgba(0,0,0,0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; font-size: 22px;">🌐 Империя Онлайн</h3>
                        <div id="connection-status" style="font-size: 14px; opacity: 0.9; margin-top: 5px;">
                            <span style="background: #4CAF50; padding: 3px 10px; border-radius: 12px; font-size: 12px;">✅ Локальный режим</span>
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
                                <div style="width: 12px; height: 12px; border-radius: 50%; background: #FF6B6B; margin-right: 10px;"></div>
                                <span>${this.playerName} (Вы) 👑</span>
                            </div>
                            <span style="font-size: 12px; opacity: 0.8;">$20,000</span>
                        </div>
                    </div>
                </div>
                
                <!-- Чат -->
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
        
        return panelHTML;
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
        localStorage.setItem('empire_player_name', name);
        this.isMultiplayer = true;
        
        // Обновляем UI
        document.getElementById('multiplayer-btn').innerHTML = '🌐 Онлайн режим';
        document.getElementById('multiplayer-btn').style.background = 'rgba(76, 175, 80, 0.3)';
        document.getElementById('multiplayer-btn').style.borderColor = '#4CAF50';
        
        document.getElementById('connection-status').innerHTML = `
            <span style="background: #4CAF50; padding: 3px 10px; border-radius: 12px; font-size: 12px;">✅ Онлайн режим</span>
            <span style="margin-left: 10px; font-size: 12px;">ID комнаты: ${this.roomId}</span>
        `;
        
        document.getElementById('chat-input').disabled = false;
        document.querySelector('#chat-container button').disabled = false;
        
        // Симулируем подключение других игроков
        this.simulateOtherPlayers();
        
        this.gameLog.push('🌐 Включен онлайн-режим! Теперь можно играть с друзьями.');
        this.renderGameLog();
    }

    disableMultiplayer() {
        this.isMultiplayer = false;
        this.connectedPlayers = [];
        
        document.getElementById('multiplayer-btn').innerHTML = '🌐 Включить онлайн';
        document.getElementById('multiplayer-btn').style.background = 'rgba(255,255,255,0.2)';
        document.getElementById('multiplayer-btn').style.borderColor = 'rgba(255,255,255,0.3)';
        
        document.getElementById('connection-status').innerHTML = `
            <span style="background: #f44336; padding: 3px 10px; border-radius: 12px; font-size: 12px;">❌ Локальный режим</span>
        `;
        
        document.getElementById('chat-input').disabled = true;
        document.querySelector('#chat-container button').disabled = true;
        
        this.gameLog.push('🔌 Онлайн-режим отключен. Вы играете в одиночку.');
        this.renderGameLog();
        this.updatePlayersList();
    }

    simulateMultiplayer() {
        // В реальной игре здесь было бы подключение к WebSocket серверу
        // Сейчас просто симулируем для демонстрации
        
        // Симуляция других игроков каждые 30 секунд
        setInterval(() => {
            if (this.isMultiplayer && Math.random() > 0.7) {
                this.simulateOtherPlayers();
            }
        }, 30000);
    }

    simulateOtherPlayers() {
        if (!this.isMultiplayer) return;
        
        const botNames = ['Алексей_Инвестор', 'Мария_Бизнес', 'Дмитрий_Трейдер', 'Ольга_Магнат', 'Сергей_Олигарх'];
        const randomName = botNames[Math.floor(Math.random() * botNames.length)];
        
        if (!this.connectedPlayers.some(p => p.name === randomName)) {
            const botPlayer = {
                id: 'bot_' + Date.now(),
                name: randomName,
                money: 18000 + Math.floor(Math.random() * 10000),
                position: Math.floor(Math.random() * 16),
                color: this.getRandomColor(),
                isBot: true
            };
            
            this.connectedPlayers.push(botPlayer);
            this.gameLog.push(`👋 ${randomName} присоединился к игре`);
            this.updatePlayersList();
            this.renderGameLog();
        }
    }

    updatePlayersList() {
        const playersList = document.getElementById('players-list');
        const playersCount = document.getElementById('players-count');
        
        if (!playersList) return;
        
        // Все игроки: вы + подключенные
        const allPlayers = [this.players[0], ...this.connectedPlayers];
        
        playersList.innerHTML = allPlayers.map(player => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; align-items: center;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${player.color}; margin-right: 10px;"></div>
                    <span>${player.name} ${player.id === this.playerId ? '(Вы) 👑' : ''}</span>
                </div>
                <span style="font-size: 12px; opacity: 0.8;">$${player.money.toLocaleString()}</span>
            </div>
        `).join('');
        
        if (playersCount) {
            playersCount.textContent = allPlayers.length;
        }
    }

    copyRoomLink() {
        const link = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(() => {
                this.showNotification('✅ Ссылка скопирована! Отправьте друзьям.');
            }).catch(() => {
                this.showNotification(`🔗 Ссылка на комнату:\n\n${link}`);
            });
        } else {
            this.showNotification(`🔗 Ссылка на комнату:\n\n${link}`);
        }
    }

    sendChat() {
        const input = document.getElementById('chat-input');
        if (!input || !input.value.trim()) return;
        
        const message = input.value;
        
        // В реальной игре здесь отправка на сервер
        this.addChatMessage(this.playerName, message);
        
        // Симулируем ответ ботов
        if (this.isMultiplayer && this.connectedPlayers.length > 0 && Math.random() > 0.5) {
            setTimeout(() => {
                const bot = this.connectedPlayers[Math.floor(Math.random() * this.connectedPlayers.length)];
                const responses = [
                    'Интересная стратегия!',
                    'Кто следующий ходит?',
                    'Куплю-продам акции!',
                    'Удачи в игре!',
                    'Монополия близко...'
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                this.addChatMessage(bot.name, response);
            }, 1000 + Math.random() * 2000);
        }
        
        input.value = '';
    }

    addChatMessage(sender, message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        // Убираем placeholder при первом сообщении
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

    getRoomIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('room') || 'room_' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    getRandomColor() {
        const colors = ['#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#9D4EDD'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // ========== ЭКОНОМИЧЕСКАЯ СИСТЕМА ==========
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

    updateEconomicSystem() {
        // Каждые 5 ходов обновляем экономику
        if (this.totalTurns % 5 === 0 && this.totalTurns > 0) {
            const events = [
                { type: 'inflation', chance: 0.3, effect: () => { 
                    this.inflationRate *= 1.1; 
                    this.gameLog.push(`📈 Инфляция 10%! Цены выросли.`); 
                }},
                { type: 'crisis', chance: 0.2, effect: () => { 
                    this.economicState = 'recession';
                    this.gameLog.push(`📉 Экономический кризис! Аренда -20%`); 
                }},
                { type: 'boom', chance: 0.2, effect: () => { 
                    this.economicState = 'boom';
                    this.gameLog.push(`🚀 Экономический бум! Аренда +30%`); 
                }},
                { type: 'stable', chance: 0.3, effect: () => { 
                    this.economicState = 'stable';
                    this.gameLog.push(`⚖️ Экономика стабилизировалась`); 
                }}
            ];
            
            // Случайное экономическое событие
            const randomEvent = events.find(event => Math.random() < event.chance) || events[0];
            randomEvent.effect();
            
            // Обновляем цены акций
            this.updateStockPrices();
            
            this.renderGameLog();
        }
    }

    updateStockPrices() {
        const changes = {
            digital: (Math.random() - 0.5) * 20,
            industry: (Math.random() - 0.5) * 15,
            luxury: (Math.random() - 0.5) * 25
        };
        
        Object.keys(this.stockPrices).forEach(sector => {
            this.stockPrices[sector] = Math.max(50, Math.min(200, 
                this.stockPrices[sector] + changes[sector]
            ));
        });
    }

    getAdjustedPrice(basePrice) {
        return Math.round(basePrice * this.inflationRate);
    }

    getAdjustedRent(baseRent) {
        let multiplier = 1.0;
        if (this.economicState === 'boom') multiplier = 1.3;
        if (this.economicState === 'recession') multiplier = 0.8;
        
        return Math.round(baseRent * multiplier * this.inflationRate);
    }

    // ========== ИГРОВАЯ МЕХАНИКА ==========
    initUI() {
        this.createEconomicPanel();
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

    updateEconomicPanel() {
        const inflationElement = document.getElementById('inflation-rate');
        const economyElement = document.getElementById('economy-status');
        const stockElement = document.getElementById('stock-indicator');
        
        if (inflationElement) {
            inflationElement.textContent = Math.round((this.inflationRate - 1) * 100) + '%';
            inflationElement.style.color = this.inflationRate > 1 ? '#e17055' : '#00b894';
        }
        
        if (economyElement) {
            economyElement.textContent = 
                this.economicState === 'stable' ? '⚖️ Стабильна' : 
                this.economicState === 'boom' ? '🚀 Бум' : '📉 Кризис';
        }
        
        if (stockElement) {
            const avgStock = Object.values(this.stockPrices).reduce((a, b) => a + b) / 3;
            stockElement.textContent = avgStock > 100 ? '📈' : '📉';
        }
    }

    rollDice() {
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;
        
        this.gameLog.push(`🎲 ${this.getCurrentPlayer().name} бросает кубики: ${dice1}+${dice2}=${total}`);
        
        // Анимация
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
    }

    movePlayer(steps) {
        const player = this.getCurrentPlayer();
        const oldPosition = player.position;
        player.position = (player.position + steps) % this.cells.length;
        
        this.gameLog.push(`➡️ ${player.name} перемещается на ${this.cells[player.position].name}`);
        
        this.updatePlayerMarkers();
        this.handleCellAction(player.position);
        this.updateDisplay();
        this.renderGameLog();
    }

    handleCellAction(cellIndex) {
        const cell = this.cells[cellIndex];
        const player = this.getCurrentPlayer();
        
        // Показываем кнопки действий
        const actionButtons = document.getElementById('action-buttons');
        if (actionButtons) {
            actionButtons.classList.add('show');
        }
        
        // Обновляем кнопку покупки
        const buyButton = document.getElementById('buy-button');
        if (buyButton) {
            const adjustedPrice = this.getAdjustedPrice(cell.price);
            const canBuy = cell.price > 0 && !cell.owner && player.money >= adjustedPrice;
            buyButton.disabled = !canBuy;
            buyButton.innerHTML = canBuy ? 
                `Купить за <strong>$${adjustedPrice}</strong>` : 
                'Недостаточно средств';
        }
        
        // Обрабатываем специальные клетки
        switch(cell.type) {
            case 'start':
                const salary = 2000;
                player.money += salary;
                this.gameLog.push(`💰 ${player.name} получает зарплату: +$${salary}`);
                break;
                
            case 'tax':
                const tax = Math.floor(player.money * 0.15);
                player.money -= tax;
                this.gameLog.push(`🏛️ Налоговая: ${player.name} платит налог $${tax}`);
                break;
                
            case 'jail':
                this.gameLog.push(`🚨 ${player.name} посещает СИЗО. Пропускает ход.`);
                // В реальной игре здесь была бы логика пропуска хода
                break;
                
            case 'casino':
                this.handleCasino();
                break;
                
            case 'stock':
                this.showStockMarket();
                break;
                
            case 'auction':
                this.startAuction();
                break;
                
            case 'shop':
                this.showLuxuryShop();
                break;
                
            case 'chance':
                this.drawChanceCard();
                break;
        }
        
        // Если клетка принадлежит другому игроку
        if (cell.owner !== null && cell.owner !== player.id) {
            const adjustedRent = this.getAdjustedRent(cell.rent);
            player.money -= adjustedRent;
            
            // В мультиплеере деньги переходили бы другому игроку
            this.gameLog.push(`🏠 ${player.name} платит аренду $${adjustedRent}`);
            
            // Если это бот, получаем деньги
            const botOwner = this.connectedPlayers.find(p => p.id === cell.owner);
            if (botOwner) {
                botOwner.money += adjustedRent;
                this.updatePlayersList();
            }
        }
    }

    handleCasino() {
        const player = this.getCurrentPlayer();
        const bet = Math.min(1000, Math.floor(player.money * 0.2));
        
        if (confirm(`🎰 Казино! Сыграть в рулетку? Ставка: $${bet}\n\nВыигрыш: x2 при удаче, проигрыш ставки при неудаче.`)) {
            const win = Math.random() > 0.6;
            
            if (win) {
                player.money += bet;
                this.gameLog.push(`🎰 ${player.name} выигрывает в казино: +$${bet}`);
            } else {
                player.money -= bet;
                this.gameLog.push(`🎰 ${player.name} проигрывает в казино: -$${bet}`);
            }
        }
    }

    showStockMarket() {
        const player = this.getCurrentPlayer();
        const stockInfo = `
            📊 ФОНДОВАЯ БИРЖА
            
            Цены акций:
            • Цифровой сектор: $${this.stockPrices.digital} ${this.stockPrices.digital > 100 ? '📈' : '📉'}
            • Промышленность: $${this.stockPrices.industry} ${this.stockPrices.industry > 100 ? '📈' : '📉'}
            • Роскошь: $${this.stockPrices.luxury} ${this.stockPrices.luxury > 100 ? '📈' : '📉'}
            
            Ваши акции:
            • Цифровой: ${player.stocks.digital} акций
            • Промышленность: ${player.stocks.industry} акций
            • Роскошь: ${player.stocks.luxury} акций
        `;
        
        alert(stockInfo);
    }

    startAuction() {
        if (this.auctionItems.length === 0) {
            // Создаем предметы для аукциона
            const items = [
                { name: "Старый завод", basePrice: 3000, type: "property" },
                { name: "Пакет акций", basePrice: 2000, type: "stocks" },
                { name: "Драгоценности", basePrice: 5000, type: "item" }
            ];
            
            this.auctionItems = items.map(item => ({
                ...item,
                currentBid: Math.floor(item.basePrice * 0.7),
                currentBidder: null
            }));
        }
        
        const currentItem = this.auctionItems[0];
        const bid = prompt(
            `🎭 АУКЦИОН!\n\nТекущий лот: ${currentItem.name}\nСтартовая цена: $${currentItem.basePrice}\nТекущая ставка: $${currentItem.currentBid}\n\nВведите вашу ставку (минимум $${currentItem.currentBid + 100}):`,
            currentItem.currentBid + 100
        );
        
        if (bid) {
            const bidAmount = parseInt(bid);
            const player = this.getCurrentPlayer();
            
            if (bidAmount >= currentItem.currentBid + 100 && bidAmount <= player.money) {
                currentItem.currentBid = bidAmount;
                currentItem.currentBidder = player.id;
                
                player.money -= bidAmount;
                this.gameLog.push(`🎭 ${player.name} делает ставку $${bidAmount} на ${currentItem.name}`);
                this.updateDisplay();
            } else {
                alert('❌ Некорректная ставка!');
            }
        }
    }

    showLuxuryShop() {
        const player = this.getCurrentPlayer();
        const itemsList = this.luxuryItems.map(item => 
            `• ${item.name} - $${item.price}\n  ${item.effect}`
        ).join('\n\n');
        
        const choice = prompt(
            `🛍️ МАГАЗИН ПРЕДМЕТОВ РОСКОШИ\n\n${itemsList}\n\nВведите номер предмета для покупки (1-${this.luxuryItems.length}) или 0 для выхода:`
        );
        
        if (choice && choice !== '0') {
            const itemIndex = parseInt(choice) - 1;
            if (itemIndex >= 0 && itemIndex < this.luxuryItems.length) {
                const item = this.luxuryItems[itemIndex];
                
                if (player.money >= item.price) {
                    player.money -= item.price;
                    player.items.push({...item});
                    this.gameLog.push(`🛍️ ${player.name} покупает ${item.name} за $${item.price}`);
                    this.updateDisplay();
                } else {
                    alert('❌ Недостаточно денег!');
                }
            }
        }
    }

    drawChanceCard() {
        const cards = [
            { text: "Вы выиграли в лотерею!", effect: (p) => p.money += 3000 },
            { text: "Налоговая проверка", effect: (p) => p.money -= 1500 },
            { text: "Инвестиции окупились", effect: (p) => p.money += 4000 },
            { text: "Кибер-атака на счет", effect: (p) => p.money -= 2000 },
            { text: "Нашли инвестора", effect: (p) => p.money += 5000 },
            { text: "Курс валют упал", effect: (p) => p.money -= 1000 },
            { text: "Технологический прорыв", effect: (p) => { 
                p.stocks.digital += 10;
                this.gameLog.push(`${p.name} получает 10 акций цифрового сектора!`);
            }},
            { text: "Экологический штраф", effect: (p) => {
                p.money -= 2500;
                this.gameLog.push(`${p.name} платит экологический штраф!`);
            }}
        ];
        
        const card = cards[Math.floor(Math.random() * cards.length)];
        const player = this.getCurrentPlayer();
        
        card.effect(player);
        this.gameLog.push(`🎭 Шанс: ${card.text}`);
    }

    buyProperty() {
        const player = this.getCurrentPlayer();
        const cell = this.cells[player.position];
        const adjustedPrice = this.getAdjustedPrice(cell.price);
        
        if (cell.price > 0 && !cell.owner && player.money >= adjustedPrice) {
            cell.owner = player.id;
            player.money -= adjustedPrice;
            
            this.gameLog.push(`✅ ${player.name} покупает ${cell.name} за $${adjustedPrice}`);
            
            // Скрываем кнопки действий
            const actionButtons = document.getElementById('action-buttons');
            if (actionButtons) {
                actionButtons.classList.remove('show');
            }
            
            // Обновляем отображение
            this.initBoard();
            this.updateDisplay();
            this.renderGameLog();
            
            // Проверяем монополию
            this.checkMonopoly(player.id, cell.type);
        }
    }

    checkMonopoly(playerId, sectorType) {
        const playerCells = this.cells.filter(cell => 
            cell.owner === playerId && cell.type === sectorType && cell.price > 0
        );
        
        const totalCellsInSector = this.cells.filter(cell => 
            cell.type === sectorType && cell.price > 0
        ).length;
        
        if (playerCells.length === totalCellsInSector && totalCellsInSector > 0) {
            this.gameLog.push(`🏆 МОНОПОЛИЯ! Игрок ${this.players[0].name} контролирует весь ${sectorType} сектор! Бонус к аренде: +50%`);
        }
    }

    endTurn() {
        const actionButtons = document.getElementById('action-buttons');
        if (actionButtons) {
            actionButtons.classList.remove('show');
        }
        
        this.totalTurns++;
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        this.gameLog.push(`🔄 Ход переходит к ${this.getCurrentPlayer().name}`);
        
        // Обновляем экономику
        this.updateEconomicSystem();
        this.updateEconomicPanel();
        
        // Обновляем прогресс
        this.updateProgress();
        
        // Симулируем ход ботов в мультиплеере
        if (this.isMultiplayer) {
            this.simulateBotTurns();
        }
        
        this.updateDisplay();
        this.renderGameLog();
    }

    simulateBotTurns() {
        this.connectedPlayers.forEach(bot => {
            if (Math.random() > 0.3) {
                // Бот иногда делает ход
                const dice = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
                bot.position = (bot.position + dice) % this.cells.length;
                
                // Бот иногда покупает клетки
                const cell = this.cells[bot.position];
                if (cell.price > 0 && !cell.owner && bot.money >= cell.price * 1.5) {
                    cell.owner = bot.id;
                    bot.money -= cell.price;
                    this.gameLog.push(`🤖 ${bot.name} покупает ${cell.name}`);
                }
            }
        });
        
        this.updatePlayersList();
        this.updatePlayerMarkers();
    }

    // ========== ОСНОВНЫЕ МЕТОДЫ (как в предыдущей версии) ==========
    initBoard() {
        const board = document.getElementById('game-board');
        if (!board) {
            console.error('❌ Не найден элемент #game-board');
            return;
        }
        
        board.innerHTML = '';
        
        this.cells.forEach(cell => {
            const cellDiv = document.createElement('div');
            cellDiv.className = `cell ${cell.type}`;
            cellDiv.id = `cell-${cell.id}`;
            
            let ownerBadge = '';
            if (cell.owner !== null) {
                const owner = this.players.find(p => p.id === cell.owner) || 
                             this.connectedPlayers.find(p => p.id === cell.owner);
                if (owner) {
                    ownerBadge = `<div style="position: absolute; top: 5px; right: 5px; width: 10px; height: 10px; border-radius: 50%; background: ${owner.color};"></div>`;
                }
            }
            
            const adjustedPrice = this.getAdjustedPrice(cell.price);
            
            cellDiv.innerHTML = `
                <div class="cell-content">
                    <div class="cell-name">${cell.name}</div>
                    <div class="cell-type">${this.getCellTypeName(cell.type)}</div>
                    ${cell.price > 0 ? `<div class="cell-price">$${adjustedPrice}</div>` : ''}
                    ${ownerBadge}
                </div>
            `;
            
            board.appendChild(cellDiv);
        });
        
        this.updatePlayerMarkers();
    }

    updatePlayerMarkers() {
        document.querySelectorAll('.player-marker').forEach(marker => marker.remove());
        
        // Ваш маркер
        this.players.forEach(player => {
            const cell = document.getElementById(`cell-${player.position}`);
            if (cell) {
                const marker = document.createElement('div');
                marker.className = 'player-marker';
                marker.style.cssText = `
                    position: absolute;
                    bottom: 5px;
                    left: 5px;
                    width: 20px;
                    height: 20px;
                    background: ${player.color};
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    z-index: 10;
                `;
                cell.style.position = 'relative';
                cell.appendChild(marker);
            }
        });
        
        // Маркеры ботов в мультиплеере
        if (this.isMultiplayer) {
            this.connectedPlayers.forEach(bot => {
                const cell = document.getElementById(`cell-${bot.position}`);
                if (cell) {
                    const marker = document.createElement('div');
                    marker.className = 'player-marker bot-marker';
                    marker.style.cssText = `
                        position: absolute;
                        bottom: 5px;
                        right: 5px;
                        width: 15px;
                        height: 15px;
                        background: ${bot.color};
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        z-index: 9;
                    `;
                    cell.style.position = 'relative';
                    cell.appendChild(marker);
                }
            });
        }
    }

    getCellTypeName(type) {
        const names = {
            'start': 'Старт',
            'digital': 'Цифровой',
            'industry': 'Промышленность',
            'luxury': 'Роскошь',
            'special': 'Особое',
            'tax': 'Налог',
            'jail': 'Тюрьма',
            'parking': 'Парковка',
            'casino': 'Казино',
            'stock': 'Биржа',
            'auction': 'Аукцион',
            'shop': 'Магазин'
        };
        return names[type] || type;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    updateDisplay() {
        const player = this.getCurrentPlayer();
        
        const playerNameElement = document.getElementById('current-player-name');
        const moneyElement = document.getElementById('money');
        const turnCounter = document.getElementById('turn-counter');
        const propertiesCount = document.getElementById('properties-count');
        
        if (playerNameElement) {
            playerNameElement.textContent = player.name;
            playerNameElement.style.color = player.color;
        }
        
        if (moneyElement) {
            moneyElement.textContent = player.money.toLocaleString();
            moneyElement.style.color = player.money < 5000 ? '#FF6B6B' : '#00C851';
        }
        
        if (turnCounter) {
            turnCounter.textContent = this.totalTurns + 1;
        }
        
        if (propertiesCount) {
            const ownedProperties = this.cells.filter(cell => cell.owner === player.id).length;
            propertiesCount.textContent = ownedProperties;
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');
        
        if (progressFill && progressPercent) {
            const percent = Math.min((this.totalTurns / 50) * 100, 100);
            progressFill.style.width = `${percent}%`;
            progressPercent.textContent = `${Math.round(percent)}%`;
        }
    }

    renderGameLog() {
        const logElement = document.getElementById('log');
        if (!logElement) return;
        
        const recentLogs = this.gameLog.slice(-8);
        logElement.innerHTML = recentLogs
            .map(entry => `<div class="log-entry">${entry}</div>`)
            .join('');
        
        logElement.scrollTop = logElement.scrollHeight;
    }

    showNotification(message) {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Дополнительные методы (сохранение и т.д.)
    saveGame() {
        const gameState = {
            players: this.players,
            cells: this.cells,
            currentPlayerIndex: this.currentPlayerIndex,
            gameLog: this.gameLog.slice(-20),
            totalTurns: this.totalTurns,
            properties: this.properties,
            inflationRate: this.inflationRate,
            economicState: this.economicState,
            stockPrices: this.stockPrices,
            playerName: this.playerName,
            isMultiplayer: this.isMultiplayer,
            saveTime: new Date().toLocaleString()
        };
        
        localStorage.setItem('empire_save_v2', JSON.stringify(gameState));
        this.gameLog.push('💾 Игра сохранена (v2.0)');
        this.renderGameLog();
        this.showNotification('✅ Игра успешно сохранена!');
    }

    loadGame() {
        const saved = localStorage.getItem('empire_save_v2');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                
                this.players = state.players;
                this.cells = state.cells;
                this.currentPlayerIndex = state.currentPlayerIndex;
                this.gameLog = state.gameLog;
                this.totalTurns = state.totalTurns;
                this.properties = state.properties;
                this.inflationRate = state.inflationRate || 1.0;
                this.economicState = state.economicState || 'stable';
                this.stockPrices = state.stockPrices || { digital: 100, industry: 100, luxury: 100 };
                this.playerName = state.playerName || this.playerName;
                this.isMultiplayer = state.isMultiplayer || false;
                
                if (state.playerName) {
                    this.players[0].name = state.playerName;
                }
                
                this.initBoard();
                this.updateDisplay();
                this.updateEconomicPanel();
                this.updateProgress();
                this.renderGameLog();
                
                if (this.isMultiplayer) {
                    this.enableMultiplayer();
                }
                
                this.gameLog.push(`🔄 Игра загружена (v2.0, сохранение от ${state.saveTime})`);
                this.showNotification('✅ Игра загружена!');
            } catch (e) {
                console.error('Ошибка загрузки:', e);
                this.showNotification('❌ Ошибка загрузки сохранения');
            }
        } else {
            this.showNotification('⚠️ Сохранение не найдено');
        }
    }

    resetGame() {
        if (confirm('Начать новую игру? Текущий прогресс будет потерян.')) {
            localStorage.removeItem('empire_save_v2');
            location.reload();
        }
    }

    showInstructions() {
        const instructions = `
🎮 ИМПЕРИЯ БУДУЩЕГО v2.0

НОВЫЕ ВОЗМОЖНОСТИ:
✅ Мультиплеер с ботами
✅ Динамическая экономика
✅ Фондовая биржа
✅ Казино и аукцион
✅ Магазин предметов роскоши

ЭКОНОМИЧЕСКАЯ СИСТЕМА:
• Инфляция - цены растут
• Кризисы и бумы - меняется аренда
• Акции - покупайте и продавайте

МУЛЬТИПЛЕЕР:
• Включите онлайн-режим
• Приглашайте друзей по ссылке
• Играйте с ботами

ГОРЯЧИЕ КЛАВИШИ:
• ПРОБЕЛ - бросить кубики
• Ctrl+S - сохранить игру
• Ctrl+L - загрузить игру

УДАЧИ В ПОСТРОЕНИИ ИМПЕРИИ! 🚀
        `;
        alert(instructions);
    }

    shareGame() {
        const link = window.location.href;
        this.showNotification('✅ Ссылка скопирована! Отправьте друзьям.');
        
        // В реальной игре здесь была бы отправка в соцсети
        if (navigator.clipboard) {
            navigator.clipboard.writeText(link);
        }
    }

    reportBug() {
        const bug = prompt('Опишите ошибку или предложение:');
        if (bug) {
            this.gameLog.push(`🐛 Отчёт: ${bug.substring(0, 50)}...`);
            this.renderGameLog();
            this.showNotification('📝 Спасибо за обратную связь!');
        }
    }
}

// ========== ЗАПУСК ИГРЫ ==========
let game;

function initGame() {
    console.log('🚀 Запуск расширенной версии...');
    game = new EmpireGame();
    
    window.game = game;
    window.rollDice = () => game.rollDice();
    window.buyProperty = () => game.buyProperty();
    window.endTurn = () => game.endTurn();
    
    console.log('🎉 Расширенная версия запущена!');
    
    // Добавляем глобальные горячие клавиши
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

// Запускаем игру
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Добавляем CSS анимации
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