// ИМПЕРИЯ БУДУЩЕГО - БАЗОВАЯ ВЕРСИЯ
class EmpireGame {
    constructor() {
        console.log('🎮 Инициализация игры...');
        
        // Игровые данные
        this.players = [
            { id: 1, name: "Магнат", money: 15000, position: 0, color: "#FF6B6B" },
            { id: 2, name: "Олигарх", money: 15000, position: 0, color: "#4ECDC4" }
        ];
        this.currentPlayerIndex = 0;
        this.cells = this.createGameBoard();
        this.gameLog = ["🎮 Добро пожаловать в Империю Будущего!"];
        this.totalTurns = 0;
        this.properties = [0, 0]; // Собственность игроков
        
        this.initBoard();
        this.updateDisplay();
        this.renderGameLog();
        
        console.log('✅ Игра готова!');
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
            
            // Определяем цвет владельца
            let ownerBadge = '';
            if (cell.owner !== null) {
                const owner = this.players[cell.owner - 1];
                ownerBadge = `<div style="position: absolute; top: 5px; right: 5px; width: 10px; height: 10px; border-radius: 50%; background: ${owner.color};"></div>`;
            }
            
            cellDiv.innerHTML = `
                <div class="cell-content">
                    <div class="cell-name">${cell.name}</div>
                    <div class="cell-type">${this.getCellTypeName(cell.type)}</div>
                    ${cell.price > 0 ? `<div class="cell-price">$${cell.price}</div>` : ''}
                    ${ownerBadge}
                </div>
            `;
            
            board.appendChild(cellDiv);
        });
        
        // Добавляем маркеры игроков
        this.updatePlayerMarkers();
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
            'chance': 'Шанс'
        };
        return names[type] || type;
    }

    updatePlayerMarkers() {
        // Очищаем старые маркеры
        document.querySelectorAll('.player-marker').forEach(marker => marker.remove());
        
        // Добавляем новые маркеры
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
    }

    rollDice() {
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;
        
        this.gameLog.push(`🎲 ${this.getCurrentPlayer().name} бросает кубики: ${dice1}+${dice2}=${total}`);
        
        // Анимация кубиков
        const diceResult = document.getElementById('dice-result');
        if (diceResult) {
            diceResult.innerHTML = `
                <div style="display: inline-block; animation: roll 0.5s;">🎲 ${dice1}</div>
                <div style="display: inline-block; animation: roll 0.5s 0.1s;">🎲 ${dice2}</div>
                <div style="display: inline-block; font-weight: bold; margin-left: 10px;">= ${total}</div>
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
            const canBuy = cell.price > 0 && !cell.owner && player.money >= cell.price;
            buyButton.disabled = !canBuy;
            buyButton.textContent = canBuy ? `Купить за $${cell.price}` : 'Недостаточно средств';
        }
        
        // Обрабатываем специальные клетки
        switch(cell.type) {
            case 'start':
                player.money += 2000;
                this.gameLog.push(`💰 ${player.name} получает зарплату: +$2000`);
                break;
                
            case 'tax':
                const tax = Math.floor(player.money * 0.1);
                player.money -= tax;
                this.gameLog.push(`🏛️ Налоговая: ${player.name} платит налог $${tax}`);
                break;
                
            case 'jail':
                this.gameLog.push(`🚨 ${player.name} посещает СИЗО. Пропускает ход.`);
                break;
                
            case 'chance':
                const events = [
                    { text: "Выиграли в лотерею!", money: 1000 },
                    { text: "Нашли инвестора", money: 1500 },
                    { text: "Кибер-атака", money: -500 },
                    { text: "Налоговый вычет", money: 800 }
                ];
                const event = events[Math.floor(Math.random() * events.length)];
                player.money += event.money;
                this.gameLog.push(`🎭 Шанс: ${event.text} (${event.money > 0 ? '+' : ''}$${event.money})`);
                break;
                
            case 'parking':
                this.gameLog.push(`🅿️ ${player.name} на парковке`);
                break;
        }
        
        // Если клетка принадлежит другому игроку
        if (cell.owner !== null && cell.owner !== player.id) {
            const rent = cell.rent || Math.floor(cell.price * 0.2);
            const owner = this.players[cell.owner - 1];
            
            player.money -= rent;
            owner.money += rent;
            
            this.gameLog.push(`🏠 ${player.name} платит аренду $${rent} владельцу ${owner.name}`);
        }
    }

    buyProperty() {
        const player = this.getCurrentPlayer();
        const cell = this.cells[player.position];
        
        if (cell.price > 0 && !cell.owner && player.money >= cell.price) {
            cell.owner = player.id;
            player.money -= cell.price;
            this.properties[player.id - 1]++;
            
            this.gameLog.push(`✅ ${player.name} покупает ${cell.name} за $${cell.price}`);
            
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
            cell.owner === playerId && cell.type === sectorType
        );
        
        const totalCellsInSector = this.cells.filter(cell => 
            cell.type === sectorType && cell.price > 0
        ).length;
        
        if (playerCells.length === totalCellsInSector && totalCellsInSector > 0) {
            this.gameLog.push(`🏆 МОНОПОЛИЯ! Игрок ${this.players[playerId-1].name} контролирует весь ${this.getCellTypeName(sectorType)} сектор!`);
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
        
        // Обновляем прогресс
        this.updateProgress();
        
        this.updateDisplay();
        this.renderGameLog();
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    updateDisplay() {
        const player = this.getCurrentPlayer();
        
        // Обновляем имя игрока и деньги
        const playerNameElement = document.getElementById('current-player-name');
        const moneyElement = document.getElementById('money');
        const turnCounter = document.getElementById('turn-counter');
        const propertiesCount = document.getElementById('properties-count');
        
        if (playerNameElement) {
            playerNameElement.textContent = player.name;
            playerNameElement.style.color = player.color;
        }
        
        if (moneyElement) {
            moneyElement.textContent = player.money;
            moneyElement.style.color = player.money < 3000 ? '#FF6B6B' : '#00C851';
        }
        
        if (turnCounter) {
            turnCounter.textContent = this.totalTurns + 1;
        }
        
        if (propertiesCount) {
            propertiesCount.textContent = this.properties[player.id - 1];
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');
        
        if (progressFill && progressPercent) {
            const percent = Math.min((this.totalTurns / 30) * 100, 100);
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

    // Дополнительные методы
    saveGame() {
        const gameState = {
            players: this.players,
            cells: this.cells,
            currentPlayerIndex: this.currentPlayerIndex,
            gameLog: this.gameLog,
            totalTurns: this.totalTurns,
            properties: this.properties,
            saveTime: new Date().toLocaleString()
        };
        
        localStorage.setItem('empire_save', JSON.stringify(gameState));
        this.gameLog.push('💾 Игра сохранена');
        this.renderGameLog();
        alert('✅ Игра успешно сохранена!');
    }

    loadGame() {
        const saved = localStorage.getItem('empire_save');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.players = state.players;
                this.cells = state.cells;
                this.currentPlayerIndex = state.currentPlayerIndex;
                this.gameLog = state.gameLog;
                this.totalTurns = state.totalTurns;
                this.properties = state.properties;
                
                this.initBoard();
                this.updateDisplay();
                this.updateProgress();
                this.renderGameLog();
                
                this.gameLog.push(`🔄 Игра загружена (сохранение от ${state.saveTime})`);
                alert('✅ Игра загружена!');
            } catch (e) {
                alert('❌ Ошибка загрузки сохранения');
            }
        } else {
            alert('⚠️ Сохранение не найдено');
        }
    }

    resetGame() {
        if (confirm('Начать новую игру? Текущий прогресс будет потерян.')) {
            localStorage.removeItem('empire_save');
            location.reload();
        }
    }

    showInstructions() {
        alert(`
🎮 ИМПЕРИЯ БУДУЩЕГО - ИНСТРУКЦИЯ

ЦЕЛЬ ИГРЫ:
Стать самым богатым магнатом, скупив все активы и разорив соперников.

ОСНОВНЫЕ ПРАВИЛА:
1. Бросайте кубики для движения по полю
2. Покупайте свободные клетки
3. Собирайте аренду с других игроков
4. Собирайте целые сектора для монополии
5. Избегайте банкротства

УПРАВЛЕНИЕ:
• ПРОБЕЛ - бросить кубики
• Кнопки на экране - все действия
• Игра автоматически сохраняется

УДАЧИ! 🚀
        `);
    }

    shareGame() {
        const link = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: 'Империя Будущего',
                text: 'Сыграй со мной в крутую экономическую стратегию!',
                url: link
            });
        } else {
            navigator.clipboard.writeText(link).then(() => {
                alert('✅ Ссылка на игру скопирована!\n\nОтправьте её друзьям!');
            });
        }
    }

    reportBug() {
        const bugReport = prompt('Опишите ошибку или предложение по улучшению:');
        if (bugReport) {
            alert('📝 Спасибо за обратную связь! Ошибка записана.\n(В реальной игре здесь бы отправлялось на сервер)');
            this.gameLog.push(`🐛 Сообщение об ошибке: ${bugReport.substring(0, 50)}...`);
            this.renderGameLog();
        }
    }
}

// ========== ЗАПУСК ИГРЫ ==========
let game;

function initGame() {
    console.log('🚀 Запуск игры...');
    game = new EmpireGame();
    
    // Делаем глобально доступным
    window.game = game;
    window.rollDice = () => game.rollDice();
    window.buyProperty = () => game.buyProperty();
    window.endTurn = () => game.endTurn();
    
    console.log('🎉 Игра запущена успешно!');
    
    // Показываем приветствие
    setTimeout(() => {
        game.gameLog.push('🎯 Используйте ПРОБЕЛ для быстрого броска кубиков!');
        game.renderGameLog();
    }, 1000);
}

// Запускаем когда страница загрузится
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Горячие клавиши
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        const rollButton = document.getElementById('roll-button');
        if (rollButton && !rollButton.disabled) {
            rollDice();
        }
    }
});