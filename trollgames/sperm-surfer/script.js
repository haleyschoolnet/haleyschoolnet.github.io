/**
 * Sperm Surfer: Canal Run 🚩
 * A high-quality biological endless runner.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('score-val');
const finalScoreVal = document.getElementById('final-score-val');
const highScoreVal = document.getElementById('high-score');
const menuOverlay = document.getElementById('menu-overlay');
const gameOverOverlay = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Assets
const ASSETS = {
    condom: new Image(),
    pill: new Image()
};
ASSETS.condom.src = 'condom.png';
ASSETS.pill.src = 'pill.png';

// Game Config
const CONFIG = {
    laneWidth: 100,
    playerSpeed: 7,
    gravity: 0.6,
    jumpForce: -12,
    baseObstacleSpeed: 5,
    speedIncrease: 0.001
};

let gameState = 'MENU';
let score = 0;
let highScore = localStorage.getItem('spermSurferHighScore') || 0;
let gameData = {
    player: {
        lane: 1, // 0: Left, 1: Middle, 2: Right
        x: 0,
        y: 0,
        targetX: 0,
        isJumping: false,
        isSliding: false,
        dy: 0,
        width: 40,
        height: 40,
        slideTimer: 0
    },
    obstacles: [],
    coins: [],
    distance: 0,
    speed: CONFIG.baseObstacleSpeed,
    canalCurve: 0,
    particles: [],
    chaser: {
        y: 150, // Relative to player
        targetY: 150,
        lane: 1,
        x: 0
    }
};

highScoreVal.innerText = `Record: ${highScore}`;

function resize() {
    canvas.width = window.innerWidth > 500 ? 450 : window.innerWidth;
    canvas.height = window.innerHeight;
    gameData.player.targetX = getLaneX(gameData.player.lane);
    gameData.player.x = gameData.player.targetX;
    gameData.player.y = canvas.height - 150;
}

function getLaneX(lane) {
    const center = canvas.width / 2;
    return center + (lane - 1) * CONFIG.laneWidth;
}

window.addEventListener('resize', resize);
resize();

// Input Handling
window.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;

    if (e.key === 'ArrowLeft' || e.key === 'a') moveLane(-1);
    if (e.key === 'ArrowRight' || e.key === 'd') moveLane(1);
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') jump();
    if (e.key === 'ArrowDown' || e.key === 's') slide();
});

// Touch Handling
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    if (gameState !== 'PLAYING') return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) moveLane(1);
        else if (dx < -30) moveLane(-1);
    } else {
        if (dy < -30) jump();
        else if (dy > 30) slide();
    }
});

function moveLane(dir) {
    gameData.player.lane = Math.max(0, Math.min(2, gameData.player.lane + dir));
    gameData.player.targetX = getLaneX(gameData.player.lane);
}

function jump() {
    if (!gameData.player.isJumping && !gameData.player.isSliding) {
        gameData.player.isJumping = true;
        gameData.player.dy = CONFIG.jumpForce;
    }
}

function slide() {
    if (!gameData.player.isJumping) {
        gameData.player.isSliding = true;
        gameData.player.slideTimer = 40;
    } else {
        // Fast fall
        gameData.player.dy = 15;
    }
}

function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const type = Math.random() > 0.4 ? 'CONDOM' : 'PILL';
    gameData.obstacles.push({
        lane,
        y: -100,
        type,
        width: 80,
        height: type === 'CONDOM' ? 80 : 120,
        passed: false
    });
}

function spawnCoin() {
    const lane = Math.floor(Math.random() * 3);
    gameData.coins.push({
        lane,
        y: -100,
        collected: false
    });
}

function update() {
    if (gameState !== 'PLAYING') return;

    // Player Physics
    gameData.player.x += (gameData.player.targetX - gameData.player.x) * 0.2;
    
    if (gameData.player.isJumping) {
        gameData.player.y += gameData.player.dy;
        gameData.player.dy += CONFIG.gravity;
        
        const groundY = canvas.height - 150;
        if (gameData.player.y >= groundY) {
            gameData.player.y = groundY;
            gameData.player.isJumping = false;
            gameData.player.dy = 0;
        }
    }

    if (gameData.player.isSliding) {
        gameData.player.slideTimer--;
        if (gameData.player.slideTimer <= 0) gameData.player.isSliding = false;
    }

    // World Movement
    gameData.speed += CONFIG.speedIncrease;
    gameData.distance += gameData.speed;

    if (Math.floor(gameData.distance / 200) > Math.floor((gameData.distance - gameData.speed) / 200)) {
        spawnObstacle();
    }
    if (Math.floor(gameData.distance / 80) > Math.floor((gameData.distance - gameData.speed) / 80)) {
        spawnCoin();
    }

    // Update Obstacles
    gameData.obstacles.forEach((obs, index) => {
        obs.y += gameData.speed;
        
        // Circular collision check
        const px = gameData.player.x;
        const py = gameData.player.y;
        const ox = getLaneX(obs.lane);
        const oy = obs.y;

        if (Math.abs(oy - py) < 60 && obs.lane === gameData.player.lane) {
            let hit = false;
            if (obs.type === 'CONDOM') {
                if (!gameData.player.isJumping) hit = true;
            } else if (obs.type === 'PILL') {
                if (!gameData.player.isSliding) hit = true;
            }

            if (hit) {
                // Hit obstacle - Chaser gets closer
                gameData.chaser.targetY = Math.max(20, gameData.chaser.targetY - 50);
                obs.y += 200; // Bounce the obstacle away
                createExplosion(getLaneX(obs.lane), obs.y, '#ff5252');
                if (gameData.chaser.targetY <= 30) gameOver();
            }
        }

        if (obs.y > canvas.height + 100) gameData.obstacles.splice(index, 1);
    });

    // Update Coins
    gameData.coins.forEach((coin, index) => {
        coin.y += gameData.speed;
        
        if (coin.lane === gameData.player.lane && Math.abs(coin.y - gameData.player.y) < 50 && !coin.collected) {
            coin.collected = true;
            score++;
            scoreVal.innerText = score;
            createExplosion(getLaneX(coin.lane), coin.y, '#ffc400');
        }

        if (coin.y > canvas.height + 100) gameData.coins.splice(index, 1);
    });

    // Chaser Logic
    gameData.chaser.targetY = Math.min(150, gameData.chaser.targetY + 0.1);
    gameData.chaser.y += (gameData.chaser.targetY - gameData.chaser.y) * 0.1;
    gameData.chaser.lane = gameData.player.lane;
    gameData.chaser.x += (gameData.player.x - gameData.chaser.x) * 0.1;

    // canalCurve effect
    gameData.canalCurve = Math.sin(gameData.distance / 500) * 30;

    // Particles
    gameData.particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) gameData.particles.splice(i, 1);
    });
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 10; i++) {
        gameData.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            alpha: 1,
            color
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Biological Canal (Background-ish)
    drawCanal();

    // Draw Lanes
    ctx.strokeStyle = 'rgba(74, 110, 224, 0.2)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
        const x = (canvas.width / 2 - 1.5 * CONFIG.laneWidth) + i * CONFIG.laneWidth + gameData.canalCurve;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw Coins
    gameData.coins.forEach(coin => {
        if (coin.collected) return;
        const x = getLaneX(coin.lane) + gameData.canalCurve;
        ctx.fillStyle = '#ffc400';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffc400';
        ctx.beginPath();
        ctx.arc(x, coin.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // DNA spiral effect
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, coin.y, 15, Math.sin(Date.now() / 100) * 2, Math.sin(Date.now() / 100) * 2 + 1);
        ctx.stroke();
    });

    // Draw Obstacles (Condoms and Pills)
    gameData.obstacles.forEach(obs => {
        const x = getLaneX(obs.lane) + gameData.canalCurve;
        
        ctx.save();
        if (obs.type === 'CONDOM') {
            // Shadow
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(255, 82, 82, 0.4)';
            ctx.drawImage(ASSETS.condom, x - 40, obs.y - 40, 80, 80);
        } else {
            // Shadow
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(74, 110, 224, 0.4)';
            ctx.drawImage(ASSETS.pill, x - 40, obs.y - 60, 80, 120);
        }
        ctx.restore();
    });

    // Draw Chaser (The Angry Soap Bubble)
    drawChaser();

    // Draw Player (The Seed)
    const px = gameData.player.x + gameData.canalCurve;
    const py = gameData.player.y;
    
    ctx.save();
    ctx.translate(px, py);
    
    // Rotate to point head UP
    ctx.rotate(-Math.PI / 2);

    // Sliding squash
    if (gameData.player.isSliding) ctx.scale(0.5, 1.5);
    
    // Tail animation
    const tailOffset = Math.sin(Date.now() / 50) * 10;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-20, tailOffset, -50, tailOffset / 2);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    // Cool Glasses
    ctx.fillStyle = '#111';
    roundRect(ctx, 5, -12, 12, 8, 2);
    roundRect(ctx, 5, 2, 12, 8, 2);
    
    ctx.restore();

    // Particles
    gameData.particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawCanal() {
    const pulse = Math.sin(Date.now() / 1000) * 0.1 + 0.9;
    ctx.strokeStyle = `rgba(180, 50, 150, ${0.1 * pulse})`;
    ctx.lineWidth = 50;
    ctx.beginPath();
    ctx.moveTo(gameData.canalCurve, 0);
    ctx.bezierCurveTo(canvas.width / 2 + gameData.canalCurve, canvas.height / 2, canvas.width / 4 + gameData.canalCurve, canvas.height, gameData.canalCurve, canvas.height);
    ctx.stroke();
}

function drawChaser() {
    const cx = gameData.chaser.x + gameData.canalCurve;
    const cy = gameData.player.y + gameData.chaser.y;

    ctx.save();
    ctx.translate(cx, cy);
    
    // Angry Soap/Germ Body
    ctx.fillStyle = '#69f0ae';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#69f0ae';
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Angry Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(-15, -10, 10, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(15, -10, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'red';
    ctx.beginPath(); ctx.arc(-15 + Math.sin(Date.now()/100)*3, -10, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(15 + Math.sin(Date.now()/100)*3, -10, 4, 0, Math.PI*2); ctx.fill();

    // Mad eyebrows
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-25, -25); ctx.lineTo(-5, -15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(25, -25); ctx.lineTo(5, -15); ctx.stroke();

    ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

function gameLoop() {
    if (gameState === 'PLAYING') {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState = 'OVER';
    gameOverOverlay.style.display = 'flex';
    finalScoreVal.innerText = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spermSurferHighScore', highScore);
        highScoreVal.innerText = `New Record: ${highScore}`;
    }
}

function resetGame() {
    score = 0;
    scoreVal.innerText = '0';
    gameData = {
        player: { lane: 1, x: getLaneX(1), y: canvas.height - 150, targetX: getLaneX(1), isJumping: false, isSliding: false, dy: 0, width: 40, height: 40, slideTimer: 0 },
        obstacles: [],
        coins: [],
        distance: 0,
        speed: CONFIG.baseObstacleSpeed,
        canalCurve: 0,
        particles: [],
        chaser: { y: 150, targetY: 150, lane: 1, x: getLaneX(1) }
    };
    gameState = 'PLAYING';
    menuOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';
}

startBtn.addEventListener('click', resetGame);
restartBtn.addEventListener('click', resetGame);

// Kickstart the game engine
gameLoop();
