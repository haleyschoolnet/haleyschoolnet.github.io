const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const finalHighScoreElement = document.getElementById('final-high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const bgLayer = document.getElementById('background-layer');
const deathMsgElement = document.getElementById('death-msg');

// Game constants
const GRAVITY = 0.7;
const JUMP_FORCE = -15;
const GROUND_Y_OFFSET = 50;
const INITIAL_SPEED = 7;
const SPEED_INCREMENT = 0.0012;
const HITBOX_PADDING = 20;

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('spermDinoHighScore') || 0;
let speed = INITIAL_SPEED;
let groundY = 0;
let lastObstacleTime = 0;
let bgOffset = 0;
let tailPhase = 0;

let sperm = {
    x: 50,
    y: 0,
    width: 60,
    height: 40,
    vy: 0,
    isJumping: false,
    isDucking: false
};

let obstacles = [];
let particles = [];

// Assets
const condomImg = new Image();
condomImg.src = 'assets/condom.png';

highScoreElement.textContent = String(highScore).padStart(5, '0');

function resize() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    groundY = canvas.height - GROUND_Y_OFFSET;
    if (!gameRunning) sperm.y = groundY - sperm.height;
}

window.addEventListener('resize', resize);
resize();

// Input
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'ArrowUp') jump();
    if (e.code === 'ArrowDown' || e.code === 'KeyS') sperm.isDucking = true;
});
window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') sperm.isDucking = false;
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    jump();
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function jump() {
    if (!gameRunning) return;
    if (!sperm.isJumping && !sperm.isDucking) {
        sperm.vy = JUMP_FORCE;
        sperm.isJumping = true;
        // Particles
        createParticles(sperm.x + 20, groundY, 10);
    }
}

function startGame() {
    gameRunning = true;
    score = 0;
    speed = INITIAL_SPEED;
    obstacles = [];
    particles = [];
    sperm.y = groundY - sperm.height;
    sperm.vy = 0;
    sperm.isJumping = false;
    sperm.isDucking = false;
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    lastObstacleTime = performance.now();
    requestAnimationFrame(update);
}

const deathMessages = [
    "Blocked by Durex! MISSION FAILED.",
    "Latex wall detected!",
    "Safe sex prevents high scores!",
    "Access denied!",
    "Terminated by protection!",
    "You hit the barrier!"
];

function gameOver() {
    gameRunning = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spermDinoHighScore', highScore);
    }
    deathMsgElement.textContent = deathMessages[Math.floor(Math.random() * deathMessages.length)];
    scoreElement.textContent = String(Math.floor(score)).padStart(5, '0');
    highScoreElement.textContent = String(Math.floor(highScore)).padStart(5, '0');
    finalScoreElement.textContent = Math.floor(score);
    finalHighScoreElement.textContent = Math.floor(highScore);
    gameOverScreen.style.display = 'flex';
}

function spawnObstacle() {
    const type = Math.random();
    let obs = {
        x: canvas.width,
        width: 80,
        height: 110,
        y: groundY - 110,
        type: 'ground'
    };

    if (type > 0.8 && score > 500) {
        // Flying condom
        obs.type = 'air';
        obs.y = groundY - 120 - Math.random() * 50;
        obs.height = 60;
        obs.width = 100;
    } else {
        // Ground condom
        const size = Math.random();
        if (size > 0.6) {
            obs.width = 150; // Large 
            obs.height = 105;
            obs.y = groundY - 105;
        }
    }
    obstacles.push(obs);
}

function createParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1.0,
            size: Math.random() * 4 + 2
        });
    }
}

function update(timestamp) {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Speed and score
    speed += SPEED_INCREMENT;
    score += speed * 0.1;
    scoreElement.textContent = String(Math.floor(score)).padStart(5, '0');

    // Parallax
    bgOffset -= speed * 0.2;
    bgLayer.style.backgroundPosition = `${bgOffset}px 0`;

    // Sperm Physics
    if (sperm.isJumping) {
        sperm.vy += GRAVITY;
        sperm.y += sperm.vy;
        if (sperm.y >= groundY - (sperm.isDucking ? 20 : sperm.height)) {
            sperm.y = groundY - (sperm.isDucking ? 20 : sperm.height);
            sperm.vy = 0;
            sperm.isJumping = false;
        }
    }

    // Draw Ground
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();

    // Spawn Obstacles
    if (timestamp - lastObstacleTime > 1500 - (speed * 50)) {
        if (Math.random() > 0.5) {
            spawnObstacle();
            lastObstacleTime = timestamp;
        }
    }

    // Update Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= speed;

        // Draw Obstacle (Condom)
        ctx.save();
        if (o.type === 'air') {
            ctx.translate(o.x + o.width/2, o.y + o.height/2);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(condomImg, -o.height/2, -o.width/2, o.height, o.width);
        } else {
            ctx.drawImage(condomImg, o.x, o.y, o.width, o.height);
        }
        ctx.restore();

        // Collision Logic
        const pPaddingX = 15;
        const pPaddingY = 10;
        const oPadding = 15;

        // Sperm hitbox
        const px = sperm.x + pPaddingX;
        const py = sperm.y + (sperm.isDucking ? 25 : pPaddingY);
        const pw = sperm.width - pPaddingX * 2;
        const ph = (sperm.isDucking ? 15 : sperm.height - pPaddingY * 2);

        // Obstacle hitbox
        const ox = o.x + oPadding;
        const oy = o.y + oPadding;
        const ow = o.width - oPadding * 2;
        const oh = o.height - oPadding * 2;

        if (
            px < ox + ow &&
            px + pw > ox &&
            py < oy + oh &&
            py + ph > oy
        ) {
            gameOver();
            return;
        }

        if (o.x + o.width < 0) obstacles.splice(i, 1);
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Draw Sperm (Coded)
    ctx.save();
    ctx.translate(sperm.x, sperm.y + (sperm.isDucking ? 10 : 0));
    
    tailPhase += 0.2 + (speed * 0.05);

    // Tail
    ctx.beginPath();
    ctx.moveTo(sperm.width/2, sperm.height/2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = sperm.isDucking ? 2 : 4;
    ctx.lineCap = 'round';
    for(let j=0; j<20; j++) {
        const tx = -j * 2;
        const ty = Math.sin(tailPhase + j * 0.3) * (j * 0.4);
        ctx.lineTo(tx, sperm.height/2 + ty);
        if (j%5===0) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(tx, sperm.height/2 + ty);
        }
    }
    ctx.stroke();

    // Head
    const headGrad = ctx.createRadialGradient(25, 15, 2, 20, 20, 20);
    headGrad.addColorStop(0, '#ffffff');
    headGrad.addColorStop(1, '#cccccc');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(30, 20, sperm.isDucking ? 25 : 20, sperm.isDucking ? 10 : 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mischievous Face
    ctx.fillStyle = 'black';
    // Eyes
    ctx.beginPath();
    ctx.moveTo(35, 15); ctx.lineTo(42, 12); ctx.lineTo(40, 18); ctx.fill();
    // Smile
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(35, 22, 5, 0, Math.PI * 0.8);
    ctx.stroke();

    ctx.restore();

    requestAnimationFrame(update);
}
