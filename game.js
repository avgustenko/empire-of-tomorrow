// ИМПЕРИЯ БУДУЩЕГО - УЛУЧШЕННАЯ ВЕРСИЯ
class EmpireGame {
    constructor() {
        this.loadGameState(); // Загружаем сохранённую игру
        
        // Если нет сохранения, создаём новую игру
        if (!this.players) {
            this.players = [
                { id: 1, name: "Магнат", money: 15000, position: 0, color: "#FF6B6B" },
                { id: 2, name: "Олигарх", money: 15000, position: 0, color: "#4ECDC4" }
            ];
            this.currentPlayerIndex = 0;
            
            this.cells = this.createGameBoard();
            this.gameLog = ["🎮 Игра началась! Первый ход у Магната."];
            this.totalTurns = 0;
        }
        
        this.initBoard();
        this.updateDisplay();
        this.renderGameLog();
    }

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

    // ========== СИСТЕМА СОХРАНЕНИЯ ==========
    saveGameState() {
        const gameState = {
            players: this.players,
            currentPlayerIndex: this.currentPlayerIndex,
            cells: this.cells,
            gameLog: this.gameLog,
            totalTurns: this.totalTurns,
            saveTime: new Date().toLocaleString()
        };
        localStorage.setItem('empireGameSave', JSON.stringify(gameState));
    }

    loadGameState() {
        const saved = localStorage.getItem('empireGameSave');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.players = state.players;
                this.currentPlayerIndex = state.currentPlayerIndex;
                this.cells = state.cells;
                this.gameLog = state.gameLog;
                this.totalTurns = state.totalTurns;
                console.log('✅ Игра загружена из сохранения:', state.saveTime);
            } catch (e) {
                console.log('❌ Ошибка загрузки сохранения');
            }
        }
    }

    resetGame() {
        if (confirm('Начать новую игру? Текущий прогресс будет потерян.')) {
            localStorage.removeItem('empireGameSave');
            location.reload();
        }
    }

    // ========== ОСНОВНЫЕ МЕТОДЫ ==========
    initBoard() {
        const board = document.getElementById('game-board');
        if (!board) return;
        
        board.innerHTML = '';
        this.cells.forEach(cell => {
            const div = document.createElement('div');
            div.className = `cell ${cell.type}`;
            div.id = `cell-${cell.id}`;
            
            // Цвет владельца
            let ownerColor = '';
            if (cell.owner) {
                const owner = this.players.find(p => p.id === cell.owner);
                ownerColor = owner ? owner.color : '';
            }
            
            div.innerHTML = `
                <div style="text-align: center; padding: 5px;">
                    <strong>${cell.name}</strong><br>
                    <small>${this.getCellTypeName(cell.type)}</small>
                    ${cell.price > 0 ? `<br>$${cell.price}` : ''}
                    ${cell.owner ? `<br><span style="color:${ownerColor}">✓ Владение</span>` : ''}
                </div>
            `;
            
            if (cell.owner) {
                div.style.borderLeft = `5px solid ${ownerColor}`;
            }
            
            board.appendChild(div);
        });
        
        // Показываем текущих игроков на поле
        this.updatePlayerPositions();
    }

    getCellTypeName(type) {
        const names = {
            'start': 'Старт',
            'digital': 'Цифра',
            'industry': 'Промышл.',
            'luxury': 'Роскошь',
            'special': 'Особое',
            'tax': 'Налог',
            'jail': 'Тюрьма',
            'parking': 'Парковка',
            'chance': 'Шанс'
        };
        return names[type] || type;
    }

    updatePlayerPositions() {
        // Очищаем предыдущие позиции
        document.querySelectorAll('.player-marker').forEach(el => el.remove());
        
        // Добавляем маркеры игроков
        this.players.forEach(player => {
            const cell = document.getElementById(`cell-${player.position}`);
            if (cell) {
                const marker = document.createElement('div');
                marker.className = 'player-marker';
                marker.style.cssText = `
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    background-color: ${player.color};
                    border-radius: 50%;
                    border: 2px solid white;
                    margin-top: -10px;
                    margin-left: -10px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                `;
                cell.style.position = 'relative';
                cell.appendChild(marker);
            }
        });
    }

    rollDice() {
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;
        
        this.gameLog.push(`🎲 ${this.getCurrentPlayer().name} бросает кубики: ${dice1} + ${dice2} = ${total}`);
        
        // Анимация кубиков (простая)
        const diceElement = document.getElementById('dice-result');
        if (diceElement) {
            diceElement.innerHTML = `
                <div style="display: inline-block; animation: roll 0.5s;">
                    🎲 ${dice1}
                </div>
                <div style="display: inline-block; animation: roll 0.5s 0.1s;">
                    🎲 ${dice2}
                </div>
                <div style="display: inline-block; font-weight: bold;">
                    = ${total}
                </div>
            `;
        }
        
        return { dice1, dice2, total };
    }

    movePlayer(steps) {
        const player = this.getCurrentPlayer();
        const oldPosition = player.position;
        player.position = (player.position + steps) % this.cells.length;
        
        this.gameLog.push(`➡️ ${player.name} перемещается с ${this.cells[oldPosition].name} на ${this.cells[player.position].name}`);
        
        this.updatePlayerPositions();
        this.handleCellAction(player.position);
        this.saveGameState(); // Сохраняем после хода
    }

    handleCellAction(cellIndex) {
        const cell = this.cells[cellIndex];
        const player = this.getCurrentPlayer();
        
        const actionButtons = document.getElementById('action-buttons');
        if (actionButtons) {
            actionButtons.style.display = 'block';
        }
        
        // Очищаем предыдущие кнопки действий
        const specialActions = document.getElementById('special-actions');
        if (specialActions) {
            specialActions.innerHTML = '';
        }
        
        switch(cell.type) {
            case 'start':
                const salary = 2000;
                player.money += salary;
                this.gameLog.push(`💰 ${player.name} получает зарплату: +$${salary}`);
                break;
                
            case 'tax':
                const tax = Math.floor(player.money * 0.1);
                player.money -= tax;
                this.gameLog.push(`🏛️ Налоговая: ${player.name} платит налог $${tax}`);
                break;
                
            case 'jail':
                this.gameLog.push(`🚨 ${player.name} посещает СИЗО. Следующий ход - пропуск.`);
                break;
                
            case 'chance':
                const chanceEvents = [
                    { text: "Вы выиграли в лотерею!", money: 1000 },
                    { text: "Налоговая проверка", money: -500 },
                    { text: "Инвестиции окупились", money: 1500 },
                    { text: "Кибер-атака на счет", money: -800 },
                    { text: "Нашли инвестора", money: 2000 },
                    { text: "Курс валют упал", money: -300 }
                ];
                const event = chanceEvents[Math.floor(Math.random() * chanceEvents.length)];
                player.money += event.money;
                this.gameLog.push(`🎭 Шанс: ${event.text} (${event.money > 0 ? '+' : ''}$${event.money})`);
                break;
                
            case 'parking':
                // Можно добавить банк на парковке
                this.gameLog.push(`🅿️ ${player.name} на бесплатной парковке`);
                break;
        }
        
        // Если клетку можно купить
        if (cell.price > 0 && !cell.owner) {
            const buyButton = document.querySelector('button[onclick="buyProperty()"]');
            if (buyButton) {
                buyButton.disabled = player.money < cell.price;
                buyButton.textContent = player.money < cell.price 
                    ? `Недостаточно денег ($${cell.price})`
                    : `Купить за $${cell.price}`;
            }
        }
        // Если клетка принадлежит другому игроку
        else if (cell.owner && cell.owner !== player.id) {
            const rent = cell.rent || Math.floor(cell.price * 0.2);
            const owner = this.players.find(p => p.id === cell.owner);
            
            if (owner) {
                player.money -= rent;
                owner.money += rent;
                this.gameLog.push(`🏠 ${player.name} платит аренду $${rent} владельцу ${owner.name} за ${cell.name}`);
            }
        }
        
        this.updateDisplay();
        this.renderGameLog();
    }

    buyProperty() {
        const player = this.getCurrentPlayer();
        const cell = this.cells[player.position];
        
        if (cell.price > 0 && !cell.owner && player.money >= cell.price) {
            cell.owner = player.id;
            player.money -= cell.price;
            
            this.gameLog.push(`✅ ${player.name} покупает ${cell.name} за $${cell.price}`);
            
            const actionButtons = document.getElementById('action-buttons');
            if (actionButtons) {
                actionButtons.style.display = 'none';
            }
            
            this.initBoard();
            this.updateDisplay();
            this.renderGameLog();
            this.saveGameState();
            
            // Проверяем, есть ли у игрока монополия в секторе
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
            this.gameLog.push(`🏆 МОНОПОЛИЯ! Игрок ${this.players.find(p => p.id === playerId).name} контролирует весь ${this.getCellTypeName(sectorType)} сектор!`);
            // Можно добавить бонусы за монополию
        }
    }

    endTurn() {
        const actionButtons = document.getElementById('action-buttons');
        if (actionButtons) {
            actionButtons.style.display = 'none';
        }
        
        this.totalTurns++;
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        this.gameLog.push(`🔄 Ход переходит к ${this.getCurrentPlayer().name}`);
        
        // Каждые 5 ходов - небольшое событие
        if (this.totalTurns % 5 === 0) {
            this.randomEvent();
        }
        
        this.updateDisplay();
        this.renderGameLog();
        this.saveGameState();
    }

    randomEvent() {
        const events = [
            { text: "📈 Экономический рост! Все получают +$500", effect: (p) => p.money += 500 },
            { text: "📉 Кризис на рынке! Все теряют -$300", effect: (p) => p.money -= 300 },
            { text: "🎯 Технологический прорыв в IT-секторе!", effect: (p) => {} },
            { text: "⚡ Отключение электричества на заводах", effect: (p) => {} }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        this.gameLog.push(`🌍 Событие мира: ${event.text}`);
        
        this.players.forEach(player => {
            event.effect(player);
        });
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    updateDisplay() {
        const player = this.getCurrentPlayer();
        
        const currentPlayerElement = document.getElementById('current-player');
        const moneyElement = document.getElementById('money');
        const turnCounter = document.getElementById('turn-counter');
        
        if (currentPlayerElement) {
            currentPlayerElement.textContent = player.name;
            currentPlayerElement.style.color = player.color;
        }
        
        if (moneyElement) {
            moneyElement.textContent = player.money;
            // Меняем цвет если мало денег
            moneyElement.style.color = player.money < 3000 ? 'red' : 'green';
        }
        
        if (turnCounter) {
            turnCounter.textContent = this.totalTurns + 1;
        }
        
        // Обновляем информацию о всех игроках
        this.players.forEach((p, index) => {
            const playerInfo = document.getElementById(`player-info-${index}`);
            if (playerInfo) {
                const propertyCount = this.cells.filter(cell => cell.owner === p.id).length;
                playerInfo.innerHTML = `
                    <div style="color:${p.color}; font-weight:${index === this.currentPlayerIndex ? 'bold' : 'normal'}">
                        👤 ${p.name}: $${p.money}
                        <small>(${propertyCount} владений)</small>
                    </div>
                `;
            }
        });
    }

    renderGameLog() {
        const logElement = document.getElementById('log');
        if (!logElement) return;
        
        logElement.innerHTML = this.gameLog
            .slice(-8) // Последние 8 записей
            .map(entry => `<div class="log-entry">${entry}</div>`)
            .join('');
        
        // Прокручиваем вниз
        logElement.scrollTop = logElement.scrollHeight;
    }

    exportGameState() {
        const gameState = {
            players: this.players,
            cells: this.cells,
            totalTurns: this.totalTurns,
            exportTime: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(gameState, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `empire-game-save-${Date.now()}.json`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
        
        this.gameLog.push('💾 Состояние игры экспортировано');
        this.renderGameLog();
    }
}

// ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ И ИНИЦИАЛИЗАЦИЯ ==========
let game;

function initGame() {
    game = new EmpireGame();
    
    // Добавляем дополнительные элементы UI
    const controls = document.getElementById('controls');
    if (controls) {
        controls.insertAdjacentHTML('beforeend', `
            <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="game.exportGameState()" style="background: #6c5ce7;">
                    💾 Экспорт игры
                </button>
                <button onclick="game.resetGame()" style="background: #e17055;">
                    🔄 Новая игра
                </button>
                <button onclick="showHelp()" style="background: #00b894;">
                    ❓ Помощь
                </button>
            </div>
            <div id="player-panel" style="margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div id="player-info-0"></div>
                <div id="player-info-1"></div>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
                Ход: <span id="turn-counter">1</span> | 
                Автосохранение: <span id="save-status">✅</span>
            </div>
        `);
    }
    
    // Добавляем стили для лога
    const style = document.createElement('style');
    style.textContent = `
        .log-entry {
            padding: 8px 12px;
            margin: 4px 0;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 3px solid #4ECDC4;
            font-size: 14px;
            animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes roll {
            0% { transform: rotate(0deg) scale(0.8); }
            50% { transform: rotate(180deg) scale(1.2); }
            100% { transform: rotate(360deg) scale(1); }
        }
        .cell { transition: all 0.3s ease; }
        .cell:hover { transform: scale(1.03); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    `;
    document.head.appendChild(style);
}

function showHelp() {
    alert(`
🎮 КАК ИГРАТЬ:
1. Нажмите "Бросить кубики" для хода
2. Если клетка свободна - можно купить
3. Если клетка занята - платите аренду
4. Завершите ход, когда закончите действия

💡 СОВЕТЫ:
- Собирайте клетки одного типа для монополии
- Следите за деньгами
- Игра автоматически сохраняется

🔄 УПРАВЛЕНИЕ:
- Новая игра: сбросит весь прогресс
- Экспорт: сохранит игру в файл
    `);
}

// Запускаем игру когда страница загрузится
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Глобальные функции для кнопок
function rollDice() {
    if (!game) return;
    const result = game.rollDice();
    game.movePlayer(result.total);
}

function buyProperty() {
    if (!game) return;
    game.buyProperty();
}

function endTurn() {
    if (!game) return;
    game.endTurn();
}