class ChessCoordinateTrainer {
    constructor() {
        this.gameState = {
            mode: 'learning', // 'learning' or 'testing'
            isPlaying: false,
            currentSquare: null,
            targetSquare: null,
            startTime: null,
            timer: null,
            difficulty: 'full'
        };

        this.statistics = {
            totalQuestions: 0,
            correctAnswers: 0,
            currentStreak: 0,
            bestStreak: 0,
            responseTimes: [],
            bestTime: null
        };

        this.difficultyLevels = {
            corners: ['a1', 'a8', 'h1', 'h8'],
            edges: [
                'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8',
                'b1', 'c1', 'd1', 'e1', 'f1', 'g1',
                'b8', 'c8', 'd8', 'e8', 'f8', 'g8'
            ],
            center: [
                'c3', 'c4', 'c5', 'c6',
                'd3', 'd4', 'd5', 'd6',
                'e3', 'e4', 'e5', 'e6',
                'f3', 'f4', 'f5', 'f6'
            ],
            full: []
        };

        this.files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        this.ranks = [1, 2, 3, 4, 5, 6, 7, 8];
        this.lastSquare = null; // Prevent immediate repetition

        // Generate all squares for full difficulty
        this.difficultyLevels.full = this.generateAllSquares();

        this.initializeDOM();
        this.createChessboard();
        this.bindEvents();
        this.updateStatistics();
        this.updateUI();
    }

    generateAllSquares() {
        const squares = [];
        for (const file of this.files) {
            for (const rank of this.ranks) {
                squares.push(file + rank);
            }
        }
        return squares;
    }

    initializeDOM() {
        this.elements = {
            learningModeBtn: document.getElementById('learning-mode'),
            testingModeBtn: document.getElementById('testing-mode'),
            startBtn: document.getElementById('start-btn'),
            stopBtn: document.getElementById('stop-btn'),
            nextBtn: document.getElementById('next-btn'),
            resetStatsBtn: document.getElementById('reset-stats'),
            coordinateText: document.getElementById('coordinate-text'),
            timer: document.getElementById('timer'),
            boardGrid: document.querySelector('.board-grid'),
            feedback: document.getElementById('feedback'),
            difficultySelect: document.getElementById('difficulty'),
            // Statistics elements
            accuracy: document.getElementById('accuracy'),
            totalQuestions: document.getElementById('total-questions'),
            currentStreak: document.getElementById('current-streak'),
            bestStreak: document.getElementById('best-streak'),
            averageTime: document.getElementById('average-time'),
            bestTime: document.getElementById('best-time')
        };
    }

    createChessboard() {
        this.elements.boardGrid.innerHTML = '';
        
        // Create squares from rank 8 to 1 (top to bottom)
        for (let rank = 8; rank >= 1; rank--) {
            for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
                const file = this.files[fileIndex];
                const square = document.createElement('div');
                const coordinate = file + rank;
                
                // Calculate if square should be light or dark
                const isLight = (fileIndex + (8 - rank)) % 2 === 0;
                square.className = `square ${isLight ? 'light' : 'dark'}`;
                square.dataset.coordinate = coordinate;
                square.setAttribute('role', 'button');
                square.setAttribute('tabindex', '0');
                square.setAttribute('aria-label', `Square ${coordinate}`);
                
                this.elements.boardGrid.appendChild(square);
            }
        }

        console.log('Chessboard created with', this.elements.boardGrid.children.length, 'squares');
    }

    bindEvents() {
        // Mode selection
        this.elements.learningModeBtn.addEventListener('click', () => this.setMode('learning'));
        this.elements.testingModeBtn.addEventListener('click', () => this.setMode('testing'));

        // Game controls
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.stopBtn.addEventListener('click', () => this.stopGame());
        this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.elements.resetStatsBtn.addEventListener('click', () => this.resetStatistics());

        // Difficulty selection
        this.elements.difficultySelect.addEventListener('change', (e) => {
            this.gameState.difficulty = e.target.value;
            console.log('Difficulty changed to:', this.gameState.difficulty);
        });

        // Board clicks
        this.elements.boardGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('square')) {
                console.log('Square clicked:', e.target.dataset.coordinate);
                this.handleSquareClick(e.target);
            }
        });

        // Keyboard support
        this.elements.boardGrid.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('square') && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                this.handleSquareClick(e.target);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' && this.gameState.mode === 'learning' && this.gameState.isPlaying) {
                e.preventDefault();
                this.nextQuestion();
            }
        });

        console.log('Event listeners bound successfully');
    }

    setMode(mode) {
        console.log('Setting mode to:', mode);
        this.gameState.mode = mode;
        
        // Stop current game if playing
        if (this.gameState.isPlaying) {
            this.stopGame();
        }
        
        this.updateUI();
    }

    startGame() {
        console.log('Starting game in', this.gameState.mode, 'mode');
        this.gameState.isPlaying = true;
        this.updateUI();
        this.nextQuestion();
    }

    stopGame() {
        console.log('Stopping game');
        this.gameState.isPlaying = false;
        this.clearHighlights();
        this.clearTimer();
        this.updateUI();
        this.elements.coordinateText.textContent = 'Game stopped - Click Start to begin';
    }

    nextQuestion() {
        if (!this.gameState.isPlaying) {
            console.log('Game not playing, ignoring nextQuestion');
            return;
        }

        console.log('Next question - Mode:', this.gameState.mode);
        this.clearHighlights();
        
        // Get available squares based on difficulty
        const availableSquares = this.difficultyLevels[this.gameState.difficulty];
        let randomSquare;
        
        // Prevent immediate repetition
        do {
            randomSquare = availableSquares[Math.floor(Math.random() * availableSquares.length)];
        } while (randomSquare === this.lastSquare && availableSquares.length > 1);
        
        this.lastSquare = randomSquare;
        console.log('Selected square:', randomSquare);

        if (this.gameState.mode === 'learning') {
            this.showLearningMode(randomSquare);
        } else {
            this.showTestingMode(randomSquare);
        }
    }

    showLearningMode(coordinate) {
        console.log('Showing learning mode for:', coordinate);
        this.elements.coordinateText.textContent = coordinate.toUpperCase();
        this.gameState.currentSquare = coordinate;
        
        // Highlight the square
        const square = document.querySelector(`[data-coordinate="${coordinate}"]`);
        console.log('Found square element:', square);
        if (square) {
            square.classList.add('highlighted-learning');
            console.log('Added highlight to square:', coordinate);
        } else {
            console.error('Could not find square element for:', coordinate);
        }
        
        this.clearTimer();
        this.updateUI(); // Make sure Next button is visible
    }

    showTestingMode(coordinate) {
        console.log('Showing testing mode for:', coordinate);
        this.elements.coordinateText.textContent = `Find: ${coordinate.toUpperCase()}`;
        this.gameState.targetSquare = coordinate;
        this.gameState.startTime = Date.now();
        
        // Start timer
        this.startTimer();
        
        // Make squares clickable
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => square.classList.add('clickable'));
        
        console.log('Testing mode setup complete, target:', coordinate);
    }

    handleSquareClick(squareElement) {
        if (!this.gameState.isPlaying) {
            console.log('Game not playing, ignoring click');
            return;
        }
        
        const clickedCoordinate = squareElement.dataset.coordinate;
        console.log('Handling square click:', clickedCoordinate, 'Mode:', this.gameState.mode);

        if (this.gameState.mode === 'learning') {
            // In learning mode, any click goes to next question
            this.nextQuestion();
        } else if (this.gameState.mode === 'testing') {
            this.handleTestingAnswer(clickedCoordinate, squareElement);
        }
    }

    handleTestingAnswer(clickedCoordinate, squareElement) {
        const isCorrect = clickedCoordinate === this.gameState.targetSquare;
        const responseTime = Date.now() - this.gameState.startTime;
        
        console.log('Testing answer:', clickedCoordinate, 'vs', this.gameState.targetSquare, 'Correct:', isCorrect);
        
        this.clearTimer();
        this.statistics.totalQuestions++;
        
        // Remove clickable class from all squares
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => square.classList.remove('clickable'));

        if (isCorrect) {
            this.statistics.correctAnswers++;
            this.statistics.currentStreak++;
            this.statistics.bestStreak = Math.max(this.statistics.bestStreak, this.statistics.currentStreak);
            this.statistics.responseTimes.push(responseTime);
            
            if (!this.statistics.bestTime || responseTime < this.statistics.bestTime) {
                this.statistics.bestTime = responseTime;
            }
            
            squareElement.classList.add('highlighted-correct');
            this.showFeedback('Correct! 🎉', 'correct');
        } else {
            this.statistics.currentStreak = 0;
            squareElement.classList.add('highlighted-incorrect');
            
            // Also highlight the correct square
            const correctSquare = document.querySelector(`[data-coordinate="${this.gameState.targetSquare}"]`);
            if (correctSquare) {
                correctSquare.classList.add('highlighted-correct');
            }
            
            this.showFeedback(`Incorrect! 😞\nIt was ${this.gameState.targetSquare.toUpperCase()}`, 'incorrect');
        }

        this.updateStatistics();
        
        // Auto-advance after a delay
        setTimeout(() => {
            if (this.gameState.isPlaying) {
                this.nextQuestion();
            }
        }, 2000);
    }

    showFeedback(message, type) {
        console.log('Showing feedback:', message, type);
        this.elements.feedback.innerHTML = message.replace(/\n/g, '<br>');
        this.elements.feedback.className = `feedback ${type} show`;
        
        setTimeout(() => {
            this.elements.feedback.classList.remove('show');
        }, 1500);
    }

    startTimer() {
        let startTime = Date.now();
        this.elements.timer.classList.remove('hidden');
        
        this.gameState.timer = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            this.elements.timer.textContent = elapsed.toFixed(1) + 's';
        }, 100);
    }

    clearTimer() {
        if (this.gameState.timer) {
            clearInterval(this.gameState.timer);
            this.gameState.timer = null;
        }
        this.elements.timer.classList.add('hidden');
    }

    clearHighlights() {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            square.classList.remove('highlighted-learning', 'highlighted-correct', 'highlighted-incorrect', 'clickable');
        });
    }

    updateStatistics() {
        const accuracy = this.statistics.totalQuestions > 0 
            ? Math.round((this.statistics.correctAnswers / this.statistics.totalQuestions) * 100)
            : 0;
        
        const averageTime = this.statistics.responseTimes.length > 0
            ? this.statistics.responseTimes.reduce((a, b) => a + b, 0) / this.statistics.responseTimes.length / 1000
            : 0;

        this.elements.accuracy.textContent = accuracy + '%';
        this.elements.totalQuestions.textContent = this.statistics.totalQuestions;
        this.elements.currentStreak.textContent = this.statistics.currentStreak;
        this.elements.bestStreak.textContent = this.statistics.bestStreak;
        this.elements.averageTime.textContent = averageTime > 0 ? averageTime.toFixed(1) + 's' : '0.0s';
        this.elements.bestTime.textContent = this.statistics.bestTime 
            ? (this.statistics.bestTime / 1000).toFixed(1) + 's'
            : '-';
    }

    resetStatistics() {
        if (confirm('Are you sure you want to reset all statistics?')) {
            this.statistics = {
                totalQuestions: 0,
                correctAnswers: 0,
                currentStreak: 0,
                bestStreak: 0,
                responseTimes: [],
                bestTime: null
            };
            this.updateStatistics();
            this.showFeedback('Statistics reset! 📊', 'correct');
        }
    }

    updateUI() {
        const isPlaying = this.gameState.isPlaying;
        const isLearning = this.gameState.mode === 'learning';
        
        console.log('Updating UI - Playing:', isPlaying, 'Learning:', isLearning);
        
        // Update button visibility
        this.elements.startBtn.classList.toggle('hidden', isPlaying);
        this.elements.stopBtn.classList.toggle('hidden', !isPlaying);
        this.elements.nextBtn.classList.toggle('hidden', !isPlaying || !isLearning);
        
        // Update coordinate display when not playing
        if (!isPlaying) {
            this.elements.coordinateText.textContent = 'Click Start to begin';
            this.clearHighlights();
            this.clearTimer();
        }
        
        // Update mode button styles
        this.elements.learningModeBtn.className = this.gameState.mode === 'learning' 
            ? 'btn btn--primary mode-btn active' 
            : 'btn btn--outline mode-btn';
            
        this.elements.testingModeBtn.className = this.gameState.mode === 'testing' 
            ? 'btn btn--primary mode-btn active' 
            : 'btn btn--outline mode-btn';
            
        console.log('UI update complete');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Chess Coordinate Trainer...');
    const game = new ChessCoordinateTrainer();
    
    // Make game accessible globally for debugging
    window.chessTrainer = game;
    
    console.log('Chess Coordinate Trainer initialized successfully!');
});