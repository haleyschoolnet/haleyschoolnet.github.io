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

// Game constants
const GRAVITY = 0.4;
const JUMP_STRENGTH = -7;
const PIPE_SPEED = 3.5;
const PIPE_SPAWN_INTERVAL = 2000; // Increased interval because pipes are wider
const PIPE_WIDTH = 220; // Significantly enlarged
const PIPE_GAP = 240; // Slightly wider gap for playability with huge pipes
const HITBOX_PADDING = 20; 
let tailPhase = 0; 
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('spermBirdHighScore') || 0;
let bird = {
    x: 100,
    y: 0,
    width: 75,
    height: 75,
    velocity: 0,
    rotation: 0
};
let pipes = [];
let particles = [];
let lastPipeTime = 0;
let bgOffset = 0;

// Assets
const spermImg = new Image();
spermImg.src = 'assets/sperm.png';
const condomImg = new Image();
condomImg.src = 'assets/condom.png';

highScoreElement.textContent = highScore;

// Resize canvas
function resize() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

window.addEventListener('resize', resize);
resize();

// Initial bird position
bird.y = canvas.height / 2;

function jump() {
    if (!gameRunning) return;
    bird.velocity = JUMP_STRENGTH;
    
    // Create jump particles
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: bird.x + 20,
            y: bird.y + bird.height/2,
            size: Math.random() * 5 + 2,
            vx: -Math.random() * 3 - 2,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            color: 'rgba(255, 255, 255, 0.8)'
        });
    }
}

// Input listeners
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

canvas.addEventListener('mousedown', jump);

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function startGame() {
    gameRunning = true;
    score = 0;
    scoreElement.textContent = score;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    particles = [];
    lastPipeTime = performance.now();
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    requestAnimationFrame(update);
}

const deathMessages = [
    "Blocked by Durex! MISSION FAILED.",
    "The wall was too thick!",
    "No entry today!",
    "Safe sex in action!",
    "Terminated by latex!",
    "Access denied!",
    "Blocked! Try another hole?"
];

function gameOver() {
    gameRunning = false;
    const msg = deathMessages[Math.floor(Math.random() * deathMessages.length)];
    document.querySelector('#game-over p').textContent = msg;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spermBirdHighScore', highScore);
    }
    highScoreElement.textContent = highScore;
    finalScoreElement.textContent = score;
    finalHighScoreElement.textContent = highScore;
    gameOverScreen.style.display = 'flex';
}

function spawnPipe() {
    const minPipeHeight = 50;
    const maxPipeHeight = canvas.height - PIPE_GAP - minPipeHeight;
    const topHeight = Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight;
    
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        passed: false
    });
}

function update(timestamp) {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update background parallax
    bgOffset -= 0.5;
    bgLayer.style.backgroundPosition = `${bgOffset}px 0`;

    // Static physics
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    
    // Rotate based on velocity
    bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.velocity * 0.1));

    // Boundary check
    // Making boundary check a bit more forgiving
    if (bird.y + bird.height - HITBOX_PADDING > canvas.height || bird.y + HITBOX_PADDING < 0) {
        gameOver();
        return;
    }

    // Spawn pipes
    if (timestamp - lastPipeTime > PIPE_SPAWN_INTERVAL) {
        spawnPipe();
        lastPipeTime = timestamp;
    }

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= PIPE_SPEED;

        // Draw top condom
        ctx.save();
        ctx.translate(p.x + PIPE_WIDTH / 2, p.topHeight);
        ctx.scale(1, -1); // Flip vertically
        ctx.drawImage(condomImg, -PIPE_WIDTH / 2, 0, PIPE_WIDTH, p.topHeight);
        ctx.restore();

        // Draw bottom condom
        const bottomY = p.topHeight + PIPE_GAP;
        const bottomHeight = canvas.height - bottomY;
        ctx.drawImage(condomImg, p.x, bottomY, PIPE_WIDTH, bottomHeight);

        // Score update
        if (!p.passed && p.x + PIPE_WIDTH < bird.x) {
            p.passed = true;
            score++;
            scoreElement.textContent = score;
        }

        // Collision check (with hitbox padding)
        if (
            bird.x + HITBOX_PADDING < p.x + PIPE_WIDTH - HITBOX_PADDING &&
            bird.x + bird.width - HITBOX_PADDING > p.x + HITBOX_PADDING &&
            (bird.y + HITBOX_PADDING < p.topHeight || bird.y + bird.height - HITBOX_PADDING > bottomY)
        ) {
            gameOver();
            return;
        }

        // Remove off-screen pipes
        if (p.x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }

    // Update and draw particles
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

    // Add trailing particles
    if (gameRunning && Math.random() > 0.5) {
        particles.push({
            x: bird.x + 10,
            y: bird.y + bird.height/2 + (Math.random() - 0.5) * 10,
            size: Math.random() * 3 + 1,
            vx: -PIPE_SPEED,
            vy: (Math.random() - 0.5) * 2,
            life: 0.6,
            color: 'rgba(255, 255, 255, 0.4)'
        });
    }

    // Draw bird (Sperm coded with canvas)
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation);
    
    // Draw Tail with thick, organic movement
    tailPhase += 0.15; // Slower oscillation
    ctx.beginPath();
    ctx.moveTo(10, 0); // Start slightly inside the head
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (let j = 0; j < 40; j++) {
        // Much thicker tail tapering down
        const thickness = Math.max(1, 12 * (1 - j/40));
        ctx.lineWidth = thickness;
        
        const xOffset = -j * 2; // Longer tail
        const yOffset = Math.sin(tailPhase + j * 0.15) * (j * 0.35); // Less twisted
        ctx.lineTo(xOffset, yOffset);
        
        // Stroke periodically to apply thickness changes correctly
        if (j % 5 === 0) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(xOffset, yOffset);
        }
    }
    ctx.stroke();

    // Draw Head (thicker and with more depth)
    const pulse = Math.sin(tailPhase * 2) * 1.5;
    ctx.beginPath();
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    
    const headGrad = ctx.createRadialGradient(5, -5, 2, 0, 0, 18);
    headGrad.addColorStop(0, '#ffffff');
    headGrad.addColorStop(0.7, '#f8f8f8');
    headGrad.addColorStop(1, '#cccccc');
    
    ctx.fillStyle = headGrad;
    ctx.ellipse(8, 0, 20 + pulse, 15 + pulse/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // MISCHIEVOUS FACE
    const faceX = 12;
    // Eyes (slanted/evil)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(faceX + 2, -5);
    ctx.lineTo(faceX + 8, -7); // Slant up
    ctx.lineTo(faceX + 7, -3);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(faceX + 2, 2);
    ctx.lineTo(faceX + 8, 4); // Slant down
    ctx.lineTo(faceX + 7, 0);
    ctx.fill();
    
    // Grin (sharp)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(faceX + 2, 0, 8, -Math.PI/3, Math.PI/3);
    ctx.stroke();
    
    // Add a highlight on the head for realism
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.ellipse(12, -4, 6, 4, Math.PI/4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    requestAnimationFrame(update);
}
