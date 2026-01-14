// ЯДРО ИГРЫ - МИНИМАЛЬНАЯ РЕАЛИЗАЦИЯ
class EmpireGame {
    constructor() {
        this.players = [
            { id: 1, name: "Магнат", money: 15000, position: 0 },
            { id: 2, name: "Олигарх", money: 15000, position: 0 }
        ];
        this.currentPlayerIndex = 0;
        this.cells = [
            { id: 0, name: "Старт", type: "start", price: 0, owner: null },
            { id: 1, name: "IT-Стартап", type: "digital", price: 2000, owner: null },
            { id: 2, name: "Нефтяная вышка", type: "industry", price: 3000, owner: null },
            { id: 3, name: "Казино", type: "special", price: 0, owner: null },
            { id: 4, name: "Завод", type: "industry", price: 2500, owner: null },
            { id: 5, name: "Биржа", type: "special", price: 0, owner: null },
            { id: 6, name: "Металлургия", type: "industry", price: 3500, owner: null },
            { id: 7, name: "Криптоферма", type: "digital", price: 4000, owner: null },
            { id: 8, name: "Налоговая", type: "tax", price: 0, owner: null },
            { id: 9, name: "Футбольный клуб", type: "luxury", price: 5000, owner: null },
            { id: 10, name: "Шанс", type: "chance", price: 0, owner: null },
            { id: 11, name: "Курорт", type: "luxury", price: 4500, owner: null },
            { id: 12, name: "СИЗО", type: "jail", price: 0, owner: null },
            { id: 13, name: "Телеканал", type: "luxury", price: 6000, owner: null },
            { id: 14, name: "AI-Лаборатория", type: "digital", price: 5500, owner: null },
            { id: 15, name: "Парковка", type: "parking", price: 0, owner: null }
        ];
        this.initBoard();
        this.updateDisplay();
    }

    initBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        this.cells.forEach(cell => {
            const div = document.createElement('div');
            div.className = 'cell';
            div.id = `cell-${cell.id}`;
            div.innerHTML = `
                <div style="text-align: center">
                    <strong>${cell.name}</strong><br>
                    ${cell.price ? '$' + cell.price : ''}
                    ${cell.owner ? `<br>Владелец: ${cell.owner}` : ''}
                </div>
            `;
            if (cell.owner) div.classList.add('owned');
            board.appendChild(div);
        });
    }

    rollDice() {
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        return { dice1, dice2, total: dice1 + dice2 };
    }

    movePlayer(steps) {
        const player = this.players[this.currentPlayerIndex];
        player.position = (player.position + steps) % this.cells.length;
        
        this.updateDisplay();
        this.log(`Игрок ${player.name} переместился на ${this.cells[player.position].name}`);
        
        // Проверяем, что делать на клетке
        this.handleCellAction(player.position);
    }

    handleCellAction(cellIndex) {
        const cell = this.cells[cellIndex];
        const player = this.players[this.currentPlayerIndex];
        
        document.getElementById('action-buttons').style.display = 'block';
        
        switch(cell.type) {
            case 'start':
                player.money += 2000;
                this.log(`Получена зарплата: +$2000`);
                break;
            case 'tax':
                const tax = Math.floor(player.money * 0.1);
                player.money -= tax;
                this.log(`Налог: -$${tax}`);
                break;
            case 'jail':
                this.log(`Посещение СИЗО. Пропускаете ход.`);
                break;
            case 'chance':
                const chance = Math.random() > 0.5 ? 1000 : -500;
                player.money += chance;
                this.log(`Шанс: ${chance > 0 ? '+' : ''}$${chance}`);
                break;
        }
        
        // Если клетка можно купить и она свободна
        if (cell.price > 0 && !cell.owner) {
            document.getElementById('action-buttons').style.display = 'block';
        } else if (cell.owner && cell.owner !== player.id) {
            // Плата ренты
            const rent = Math.floor(cell.price * 0.2);
            player.money -= rent;
            const owner = this.players.find(p => p.id === cell.owner);
            if (owner) owner.money += rent;
            this.log(`Аренда ${cell.name}: -$${rent} (владелец: ${owner.name})`);
        }
        
        this.updateDisplay();
    }

    buyProperty() {
        const player = this.players[this.currentPlayerIndex];
        const cell = this.cells[player.position];
        
        if (cell.price > 0 && !cell.owner && player.money >= cell.price) {
            cell.owner = player.id;
            player.money -= cell.price;
            this.log(`${player.name} купил ${cell.name} за $${cell.price}`);
            document.getElementById('action-buttons').style.display = 'none';
            this.initBoard(); // Обновляем цвет клетки
            this.updateDisplay();
        }
    }

    endTurn() {
        document.getElementById('action-buttons').style.display = 'none';
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.updateDisplay();
        this.log(`--- Ход переходит к ${this.players[this.currentPlayerIndex].name} ---`);
    }

    updateDisplay() {
        const player = this.players[this.currentPlayerIndex];
        document.getElementById('current-player').textContent = player.name;
        document.getElementById('money').textContent = player.money;
        
        // Подсветка текущей позиции
        document.querySelectorAll('.cell').forEach((el, idx) => {
            el.style.borderColor = idx === player.position ? 'red' : '#333';
        });
    }

    log(message) {
        const logDiv = document.getElementById('log');
        const entry = document.createElement('div');
        entry.textContent = `[Ход ${this.currentPlayerIndex + 1}] ${message}`;
        logDiv.prepend(entry);
    }
}

// Инициализация игры
const game = new EmpireGame();

// Глобальные функции для кнопок
function rollDice() {
    const result = game.rollDice();
    document.getElementById('dice-result').innerHTML = 
        `Выпало: ${result.dice1} и ${result.dice2} = ${result.total}`;
    game.movePlayer(result.total);
}

function buyProperty() {
    game.buyProperty();
}

function endTurn() {
    game.endTurn();
}