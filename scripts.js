// Initialize particle background
particlesJS('particles-js', {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: "#ffffff" },
        shape: { type: "circle", stroke: { width: 0, color: "#000000" } },
        opacity: { value: 0.1, random: true },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.05, width: 1 },
        move: { enable: true, speed: 1, direction: "none", random: true, straight: false }
    },
    interactivity: {
        detect_on: "canvas",
        events: { onhover: { enable: true, mode: "repulse" } }
    },
    retina_detect: true
});

// Game elements
const gameContainer = document.getElementById('game-container');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const winScreen = document.getElementById('win-screen');
const gameArena = document.getElementById('game-arena');
const player1 = document.getElementById('player1');
const player2 = document.getElementById('player2');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');
const resultMessage = document.getElementById('result-message');
const finalTimeElement = document.getElementById('final-time');
const finalLevelElement = document.getElementById('final-level');
const finalScoreElement = document.getElementById('final-score-value');
const gameModeTitle = document.getElementById('game-mode-title');
const player2Controls = document.getElementById('player2-controls');
const levelIndicator = document.getElementById('current-level');
const requiredTimeElement = document.getElementById('required-time');
const progressBar = document.getElementById('progress-bar');
const levelTransition = document.getElementById('level-transition');
const nextLevelBtn = document.getElementById('next-level-btn');
const levelReachedElement = document.getElementById('level-reached');
const winMessage = document.getElementById('win-message');
const winLevelElement = document.getElementById('win-level');
const winScoreElement = document.getElementById('win-final-score');
const winPlayAgainBtn = document.getElementById('win-play-again-btn');
const winMenuBtn = document.getElementById('win-menu-btn');
const totalTimeElement = document.getElementById('total-time');

// Buttons
const pvcBtn = document.getElementById('pvc-btn');
const pvpBtn = document.getElementById('pvp-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const menuBtn = document.getElementById('menu-btn');

// Game state
let gameMode = 'pvc'; // 'pvc' or 'pvp'
let gameActive = false;
let gameTime = 0;
let gameScore = 0;
let timerInterval;
let currentLevel = 1;
const levelTimes = [15, 25, 35, 50]; // Level time requirements
let levelStartTime = 0;
let totalPlayTime = 0;

// Player states
const player1State = {
    x: 100,
    y: 100,
    radius: 15,
    speed: 5,
    dx: 0,
    dy: 0,
    color: '#ff416c',
    speedBoost: 0,
    boostTime: 0
};

const player2State = {
    x: 700,
    y: 400,
    radius: 15,
    speed: gameMode === 'pvc' ? 4 : 5,
    dx: 0,
    dy: 0,
    color: '#4dabf7',
    speedBoost: 0,
    boostTime: 0
};

// Obstacles and power-ups
let obstacles = [];
let powerups = [];

// Key states
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false
};

// Initialize the game
function initGame() {
    // Reset game state
    gameTime = 0;
    levelStartTime = 0;
    gameScore = 0;
    currentLevel = 1;
    totalPlayTime = 0;
    
    timerElement.textContent = '0';
    scoreElement.textContent = '0';
    levelIndicator.textContent = currentLevel;
    requiredTimeElement.textContent = levelTimes[currentLevel-1] + 's';
    progressBar.style.width = '0%';
    
    // Reset player positions
    const arenaWidth = gameArena.offsetWidth;
    const arenaHeight = gameArena.offsetHeight;
    
    player1State.x = arenaWidth * 0.2;
    player1State.y = arenaHeight * 0.3;
    player1State.speed = 5;
    player1State.speedBoost = 0;
    
    player2State.x = arenaWidth * 0.8;
    player2State.y = arenaHeight * 0.7;
    player2State.speed = gameMode === 'pvc' ? 4 : 5;
    player2State.speedBoost = 0;
    
    // Clear obstacles and powerups
    obstacles = [];
    powerups = [];
    
    // Clear arena elements
    const arenaElements = gameArena.querySelectorAll('.obstacle, .powerup');
    arenaElements.forEach(el => el.remove());
    
    // Create obstacles
    createObstacles(arenaWidth, arenaHeight);
    
    // Create initial powerups
    createPowerups(3, arenaWidth, arenaHeight);
    
    // Position players
    updatePlayerPosition(player1, player1State);
    updatePlayerPosition(player2, player2State);
    
    // Start game loop
    gameActive = true;
    timerInterval = setInterval(updateTimer, 1000);
    requestAnimationFrame(gameLoop);
}

// Create obstacles
function createObstacles(arenaWidth, arenaHeight) {
    const obstacleCount = 8;
    
    for (let i = 0; i < obstacleCount; i++) {
        const width = Math.random() * 80 + 40;
        const height = Math.random() * 80 + 40;
        
        const obstacle = {
            x: Math.random() * (arenaWidth - width - 40) + 20,
            y: Math.random() * (arenaHeight - height - 40) + 20,
            width: width,
            height: height
        };
        
        // Make sure obstacles don't spawn on players
        if (!isCollidingWithPlayer(obstacle, player1State) && 
            !isCollidingWithPlayer(obstacle, player2State)) {
            obstacles.push(obstacle);
            
            // Create obstacle element
            const obstacleEl = document.createElement('div');
            obstacleEl.className = 'obstacle';
            obstacleEl.style.width = `${width}px`;
            obstacleEl.style.height = `${height}px`;
            obstacleEl.style.left = `${obstacle.x}px`;
            obstacleEl.style.top = `${obstacle.y}px`;
            gameArena.appendChild(obstacleEl);
        }
    }
}

// Create power-ups
function createPowerups(count, arenaWidth, arenaHeight) {
    for (let i = 0; i < count; i++) {
        const powerup = {
            x: Math.random() * (arenaWidth - 40) + 20,
            y: Math.random() * (arenaHeight - 40) + 20,
            active: true
        };
        
        // Make sure powerups don't spawn on obstacles or players
        let validPosition = true;
        
        // Check obstacles
        for (const obstacle of obstacles) {
            if (isColliding(powerup.x, powerup.y, 10, 
                           obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
                validPosition = false;
                break;
            }
        }
        
        // Check players
        if (validPosition && 
           (isCollidingWithPlayer(powerup, player1State) || 
            isCollidingWithPlayer(powerup, player2State))) {
            validPosition = false;
        }
        
        if (validPosition) {
            powerups.push(powerup);
            
            // Create powerup element
            const powerupEl = document.createElement('div');
            powerupEl.className = 'powerup';
            powerupEl.style.left = `${powerup.x}px`;
            powerupEl.style.top = `${powerup.y}px`;
            gameArena.appendChild(powerupEl);
        }
    }
}

// Update player position on screen
function updatePlayerPosition(playerElement, playerState) {
    playerElement.style.left = `${playerState.x}px`;
    playerElement.style.top = `${playerState.y}px`;
}

// Update timer
function updateTimer() {
    if (gameActive) {
        gameTime++;
        totalPlayTime++;
        timerElement.textContent = gameTime;
        
        // Update level progress
        const progress = (gameTime / levelTimes[currentLevel-1]) * 100;
        progressBar.style.width = `${Math.min(100, progress)}%`;
        
        // Increase score over time
        gameScore += 10;
        scoreElement.textContent = gameScore;
        
        // Check if level completed
        if (gameTime >= levelTimes[currentLevel-1]) {
            levelComplete();
        }
    }
}

// Level complete handler
function levelComplete() {
    // Check if it's the final level
    if (currentLevel >= levelTimes.length) {
        winGame();
        return;
    }
    
    // Pause the game
    gameActive = false;
    clearInterval(timerInterval);
    
    // Update level transition screen
    levelTransition.querySelector('h2').textContent = `Level ${currentLevel} Complete!`;
    levelTransition.querySelector('p').textContent = `Get ready for Level ${currentLevel+1}...`;
    
    // Show level transition screen
    levelTransition.classList.add('active');
}

// Move to next level
function nextLevel() {
    // Hide transition screen
    levelTransition.classList.remove('active');
    
    // Increment level
    currentLevel++;
    levelIndicator.textContent = currentLevel;
    requiredTimeElement.textContent = levelTimes[currentLevel-1] + 's';
    
    // Reset level timer
    gameTime = 0;
    timerElement.textContent = '0';
    progressBar.style.width = '0%';
    
    // Reset player positions
    const arenaWidth = gameArena.offsetWidth;
    const arenaHeight = gameArena.offsetHeight;
    
    player1State.x = arenaWidth * 0.2;
    player1State.y = arenaHeight * 0.3;
    player1State.speed = 5;
    player1State.speedBoost = 0;
    
    player2State.x = arenaWidth * 0.8;
    player2State.y = arenaHeight * 0.7;
    player2State.speed = gameMode === 'pvc' ? 4 : 5;
    player2State.speedBoost = 0;
    
    // Clear obstacles and powerups
    obstacles = [];
    powerups = [];
    
    // Clear arena elements
    const arenaElements = gameArena.querySelectorAll('.obstacle, .powerup');
    arenaElements.forEach(el => el.remove());
    
    // Create obstacles
    createObstacles(arenaWidth, arenaHeight);
    
    // Create initial powerups
    createPowerups(3, arenaWidth, arenaHeight);
    
    // Position players
    updatePlayerPosition(player1, player1State);
    updatePlayerPosition(player2, player2State);
    
    // Resume game
    gameActive = true;
    timerInterval = setInterval(updateTimer, 1000);
    requestAnimationFrame(gameLoop);
}

// Win game handler
function winGame() {
    gameActive = false;
    clearInterval(timerInterval);
    
    // Update win screen
    winLevelElement.textContent = `Level ${levelTimes.length} completed!`;
    winScoreElement.textContent = gameScore;
    winFinalScoreElement.textContent = gameScore;
    totalTimeElement.textContent = `${totalPlayTime}s`;
    
    // Show win screen
    gameScreen.classList.remove('active');
    winScreen.classList.add('active');
}

// Game loop
function gameLoop() {
    if (!gameActive) return;
    
    // Move players
    movePlayer(player1State);
    movePlayer(player2State);
    
    // AI movement for computer in PVC mode
    if (gameMode === 'pvc') {
        moveAI();
    }
    
    // Update player positions on screen
    updatePlayerPosition(player1, player1State);
    updatePlayerPosition(player2, player2State);
    
    // Check collisions
    checkCollisions();
    
    // Check powerup collection
    checkPowerups();
    
    // Update speed boosts
    updateBoosts();
    
    requestAnimationFrame(gameLoop);
}

// Move player based on key states
function movePlayer(player) {
    // Reset movement
    player.dx = 0;
    player.dy = 0;
    
    // Calculate speed with boost
    const currentSpeed = player.speed + player.speedBoost;
    
    // Player 1 (Arrow keys)
    if (player === player1State) {
        if (keys.ArrowUp) player.dy = -currentSpeed;
        if (keys.ArrowDown) player.dy = currentSpeed;
        if (keys.ArrowLeft) player.dx = -currentSpeed;
        if (keys.ArrowRight) player.dx = currentSpeed;
    }
    
    // Player 2 (WASD keys)
    if (player === player2State && gameMode === 'pvp') {
        if (keys.KeyW) player.dy = -currentSpeed;
        if (keys.KeyS) player.dy = currentSpeed;
        if (keys.KeyA) player.dx = -currentSpeed;
        if (keys.KeyD) player.dx = currentSpeed;
    }
    
    // Normalize diagonal movement
    if (player.dx !== 0 && player.dy !== 0) {
        player.dx *= 0.707;
        player.dy *= 0.707;
    }
    
    // Update position
    player.x += player.dx;
    player.y += player.dy;
    
    // Boundary check
    const arenaWidth = gameArena.offsetWidth;
    const arenaHeight = gameArena.offsetHeight;
    
    player.x = Math.max(player.radius, Math.min(arenaWidth - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(arenaHeight - player.radius, player.y));
}

// AI movement for computer in PVC mode
function moveAI() {
    // Simple chasing algorithm - move toward player1
    const dx = player1State.x - player2State.x;
    const dy = player1State.y - player2State.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        player2State.dx = (dx / distance) * player2State.speed;
        player2State.dy = (dy / distance) * player2State.speed;
        
        player2State.x += player2State.dx;
        player2State.y += player2State.dy;
    }
}

// Check collisions between players
function checkCollisions() {
    const dx = player1State.x - player2State.x;
    const dy = player1State.y - player2State.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Collision detection
    if (distance < player1State.radius + player2State.radius) {
        endGame();
    }
}

// Check if player collected powerup
function checkPowerups() {
    const arenaWidth = gameArena.offsetWidth;
    const arenaHeight = gameArena.offsetHeight;
    
    for (let i = 0; i < powerups.length; i++) {
        const powerup = powerups[i];
        
        if (powerup.active) {
            // Check collision with player 1
            const dx1 = player1State.x - powerup.x;
            const dy1 = player1State.y - powerup.y;
            const distance1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            
            // Check collision with player 2
            const dx2 = player2State.x - powerup.x;
            const dy2 = player2State.y - powerup.y;
            const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            
            if (distance1 < player1State.radius + 10 || distance2 < player2State.radius + 10) {
                // Apply speed boost to the player who collected it
                if (distance1 < player1State.radius + 10) {
                    player1State.speedBoost = 3;
                    player1State.boostTime = 300; // 5 seconds at 60fps
                } else {
                    player2State.speedBoost = 3;
                    player2State.boostTime = 300;
                }
                
                // Remove powerup
                powerup.active = false;
                const powerupEl = gameArena.querySelector('.powerup:nth-child(' + (i + 3) + ')');
                if (powerupEl) {
                    powerupEl.style.opacity = '0';
                    setTimeout(() => {
                        if (powerupEl.parentNode) {
                            powerupEl.parentNode.removeChild(powerupEl);
                        }
                    }, 300);
                }
                
                // Add score
                gameScore += 50;
                scoreElement.textContent = gameScore;
                
                // Create new powerup after some time
                setTimeout(() => {
                    if (gameActive) {
                        createPowerups(1, arenaWidth, arenaHeight);
                    }
                }, 5000);
            }
        }
    }
}

// Update speed boost timers
function updateBoosts() {
    if (player1State.boostTime > 0) {
        player1State.boostTime--;
        if (player1State.boostTime === 0) {
            player1State.speedBoost = 0;
        }
    }
    
    if (player2State.boostTime > 0) {
        player2State.boostTime--;
        if (player2State.boostTime === 0) {
            player2State.speedBoost = 0;
        }
    }
}

// Collision detection helper
function isColliding(x1, y1, r1, x2, y2, w2, h2) {
    const closestX = Math.max(x2, Math.min(x1, x2 + w2));
    const closestY = Math.max(y2, Math.min(y1, y2 + h2));
    
    const dx = x1 - closestX;
    const dy = y1 - closestY;
    
    return (dx * dx + dy * dy) < (r1 * r1);
}

// Collision detection with player
function isCollidingWithPlayer(object, player) {
    return isColliding(object.x, object.y, 10, 
                     player.x - player.radius, player.y - player.radius, 
                     player.radius * 2, player.radius * 2);
}

// End the game
function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    
    // Update result message based on game mode
    if (gameMode === 'pvc') {
        resultMessage.textContent = `You survived for ${gameTime} seconds!`;
    } else {
        // Determine winner in PvP mode
        const player1Speed = Math.sqrt(player1State.dx * player1State.dx + player1State.dy * player1State.dy);
        const player2Speed = Math.sqrt(player2State.dx * player2State.dx + player2State.dy * player2State.dy);
        
        if (player1Speed > player2Speed) {
            resultMessage.textContent = 'Player 1 caught Player 2!';
        } else {
            resultMessage.textContent = 'Player 2 caught Player 1!';
        }
    }
    
    finalTimeElement.textContent = `${gameTime}s`;
    finalLevelElement.textContent = currentLevel;
    levelReachedElement.textContent = `Level reached: ${currentLevel}`;
    finalScoreElement.textContent = gameScore;
    
    // Play sound effect
    playCaptureSound();
    
    // Show game over screen
    gameScreen.classList.remove('active');
    gameOverScreen.classList.add('active');
}

// Play capture sound
function playCaptureSound() {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        
        setTimeout(() => {
            oscillator.stop();
        }, 300);
    } catch (e) {
        console.log("Audio context not supported");
    }
}

// Event listeners
pvcBtn.addEventListener('click', () => {
    gameMode = 'pvc';
    player2Controls.textContent = 'AI Controlled';
    gameModeTitle.textContent = 'Player vs Computer';
    startGame();
});

pvpBtn.addEventListener('click', () => {
    gameMode = 'pvp';
    player2Controls.textContent = 'Move: WASD Keys';
    gameModeTitle.textContent = 'Player vs Player';
    startGame();
});

playAgainBtn.addEventListener('click', () => {
    // Clear arena
    const obstacles = gameArena.querySelectorAll('.obstacle, .powerup');
    obstacles.forEach(el => el.remove());
    
    // Switch to game screen and start
    gameOverScreen.classList.remove('active');
    gameScreen.classList.add('active');
    initGame();
});

menuBtn.addEventListener('click', () => {
    gameOverScreen.classList.remove('active');
    startScreen.classList.add('active');
});

winPlayAgainBtn.addEventListener('click', () => {
    winScreen.classList.remove('active');
    gameScreen.classList.add('active');
    initGame();
});

winMenuBtn.addEventListener('click', () => {
    winScreen.classList.remove('active');
    startScreen.classList.add('active');
});

nextLevelBtn.addEventListener('click', nextLevel);

// Keyboard event listeners
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

// Start the game
function startGame() {
    startScreen.classList.remove('active');
    gameScreen.classList.add('active');
    initGame();
}

// Initialize the game when page loads
window.addEventListener('load', () => {
    // Set initial player positions
    const arenaWidth = gameArena.offsetWidth;
    const arenaHeight = gameArena.offsetHeight;
    
    player1State.x = arenaWidth * 0.2;
    player1State.y = arenaHeight * 0.3;
    
    player2State.x = arenaWidth * 0.8;
    player2State.y = arenaHeight * 0.7;
    
    updatePlayerPosition(player1, player1State);
    updatePlayerPosition(player2, player2State);
});