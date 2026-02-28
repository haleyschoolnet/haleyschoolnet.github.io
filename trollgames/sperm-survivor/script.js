const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const healthBar = document.getElementById('health-bar');
const bossUI = document.getElementById('boss-ui');
const bossHealthBar = document.getElementById('boss-health-bar');
const powerupDisplay = document.getElementById('powerup-status');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');

let width, height;
let gameState = 'start';
let score = 0;
let health = 100;
let time = 0;
let scrollY = 0;
let shakeTime = 0;
let currentLevel = 1;
let levelKills = 0;
let killsToNextLevel = 15;
let isBossLevel = false;

// Assets
const bananaImg = new Image(); bananaImg.src = 'banana.png';
const durexImg = new Image(); durexImg.src = 'durex.png';

const player = {
    x: 0, y: 0,
    targetX: 0,
    angle: -Math.PI/2,
    speed: 10,
    size: 20,
    tail: [],
    powerup: null,
    powerupTime: 0,
    fireTimer: 0
};

let enemies = [];
let particles = [];
let pickups = [];
let bullets = [];
let trails = [];

function resize() {
    const parent = canvas.parentElement;
    width = parent.clientWidth;
    height = parent.clientHeight;
    canvas.width = width;
    canvas.height = height;
    player.x = width/2;
    player.y = height - 120;
    player.targetX = player.x;
}
window.addEventListener('resize', resize);
resize();

const handleInput = (clientX) => {
    if(gameState !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    player.targetX = clientX - rect.left;
};
window.addEventListener('mousemove', (e) => handleInput(e.clientX));
window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleInput(e.touches[0].clientX);
}, {passive:false});

startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameState = 'playing';
});

class Enemy {
    constructor(bossData = null) {
        this.x = Math.random() * (width - 60) + 30;
        this.y = -60;
        this.speed = 1.0 + Math.random() * (1.5 + currentLevel * 0.1);
        this.hp = 2 + Math.floor(currentLevel/3);
        this.pregnantScale = 1.0;
        this.isDead = false;
        this.isBoss = !!bossData;
        
        if (this.isBoss) {
            this.hp = bossData.hp;
            this.maxHp = bossData.hp;
            this.size = bossData.size;
            this.speed = bossData.speed;
        } else {
            this.size = 20;
            this.maxHp = this.hp;
        }
    }
    update() {
        this.y += this.speed;
        if(this.y > height + 80) this.isDead = true;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.pregnantScale, this.pregnantScale);
        ctx.strokeStyle = this.isBoss ? '#e74c3c' : '#2ecc71';
        ctx.lineWidth = this.isBoss ? 8 : 3;
        
        const hS = this.isBoss ? 25 : 8;
        ctx.beginPath();
        ctx.arc(0, -hS-2, hS, 0, Math.PI*2);
        ctx.moveTo(0, -2); ctx.lineTo(0, hS+5);
        ctx.moveTo(0, hS/2); ctx.lineTo(-15, hS+10);
        ctx.moveTo(15, hS+10); ctx.lineTo(0, hS/2);
        
        if(this.hp < this.maxHp) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
            const growth = this.isBoss ? (1 - this.hp/this.maxHp)*30 : (this.maxHp-this.hp)*6;
            ctx.beginPath(); ctx.arc(0, 0, growth, 0, Math.PI*2); ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
    }
}

class Pickup {
    constructor() {
        this.x = Math.random() * (width - 60) + 30;
        this.y = -50;
        const types = ['banana', 'durex', 'chili', 'diaper', 'coffee', 'life'];
        this.type = types[Math.floor(Math.random()*types.length)];
    }
    update() { this.y += 3; }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y);
        if(this.type === 'banana') ctx.drawImage(bananaImg, -18, -18, 36, 36);
        else if(this.type === 'durex') ctx.drawImage(durexImg, -18, -18, 36, 36);
        else {
            ctx.font = '28px Arial'; ctx.textAlign = 'center';
            let icon = '🍼';
            if(this.type==='chili') icon='🌶️';
            if(this.type==='diaper') icon='🧷';
            if(this.type==='coffee') icon='☕';
            ctx.fillText(icon, 0, 10);
        }
        ctx.restore();
    }
}

function spawnBullet(x, y, vx, vy) {
    if(bullets.length > 80) return; // Cap bullets to prevent lag
    bullets.push({x, y, vx, vy});
}

function createExplosion(x, y, isBoss = false) {
    shakeTime = isBoss ? 25 : 10;
    const count = isBoss ? 40 : 12;
    for(let i=0; i<count; i++) {
        particles.push({
            x, y,
            vx: (Math.random()-0.5)*12,
            vy: (Math.random()-0.5)*12,
            life: 1.0,
            emoji: isBoss ? '👶🍼' : '👶'
        });
    }
    if(particles.length > 120) particles.splice(0, particles.length - 120);
}

function nextLevel() {
    currentLevel++;
    levelKills = 0;
    killsToNextLevel = 15 + currentLevel * 8;
    levelDisplay.innerText = currentLevel;
    powerupDisplay.innerText = "LEVEL " + currentLevel;
    isBossLevel = false;
    bossUI.style.display = 'none';
    if(currentLevel % 5 === 0) {
        isBossLevel = true;
        enemies.push(new Enemy({ hp: 40 + currentLevel * 15, size: 80, speed: 0.6 }));
        bossUI.style.display = 'block';
    }
}

function update() {
    if(gameState !== 'playing') return;
    time++; scrollY += 3;
    if(shakeTime > 0) shakeTime--;

    player.x += (player.targetX - player.x) * 0.2;
    player.tail.unshift({x: player.x, y: player.y});
    if(player.tail.length > 15) player.tail.pop();

    // Shooting
    player.fireTimer++;
    let fInt = player.powerup === 'coffee' ? 4 : 15;
    if(player.fireTimer >= fInt) {
        player.fireTimer = 0;
        if(player.powerup === 'banana') {
            spawnBullet(player.x - 15, player.y, 0, -14);
            spawnBullet(player.x + 15, player.y, 0, -14);
            spawnBullet(player.x, player.y, -4, -13);
            spawnBullet(player.x, player.y, 4, -13);
        } else {
            spawnBullet(player.x, player.y, 0, -14);
        }
    }

    // Move Bullets (Safe removal)
    for(let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx; b.y += b.vy;
        if(b.y < -50 || b.y > height + 50 || b.x < -50 || b.x > width + 50) bullets.splice(i, 1);
    }

    // Chili
    if(player.powerup === 'chili' && time % 5 === 0) trails.push({x: player.x, y: player.y, life: 1.0});
    for(let i = trails.length - 1; i >= 0; i--) {
        trails[i].life -= 0.03;
        if(trails[i].life <= 0) trails.splice(i, 1);
    }

    // Spawning (Dồn dập hơn!)
    let spawnRate = Math.max(12, 35 - currentLevel);
    if(time % Math.floor(spawnRate) === 0 && !isBossLevel) {
        enemies.push(new Enemy());
        if(currentLevel > 3 && Math.random() > 0.6) enemies.push(new Enemy()); // Spawn thêm quái phụ
        if(currentLevel > 7 && Math.random() > 0.8) enemies.push(new Enemy()); // Spawn thêm quái phụ 2
    }
    if(time % 250 === 0) pickups.push(new Pickup());

    // Collisions (Backward loops for safe removal)
    for(let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.update();
        
        // vs Bullets
        for(let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if(Math.hypot(e.x-b.x, e.y-b.y) < (e.isBoss ? 60 : 35)) {
                bullets.splice(j, 1);
                e.hp--;
                e.pregnantScale += e.isBoss ? 0.01 : 0.25;
                if(e.isBoss) bossHealthBar.style.width = (e.hp/e.maxHp)*100 + '%';
            }
        }

        if(e.hp <= 0) {
            createExplosion(e.x, e.y, e.isBoss);
            enemies.splice(i, 1);
            score += e.isBoss ? 5000 : 100;
            scoreDisplay.innerText = score;
            if(!e.isBoss) {
               levelKills++;
               if(levelKills >= killsToNextLevel) nextLevel();
            } else nextLevel();
            continue;
        }

        const dP = Math.hypot(e.x - player.x, e.y - player.y);
        if(dP < (e.isBoss ? 50 : 35)) {
            if(player.powerup === 'durex') e.hp = 0;
            else { 
                health -= 1.5; shakeTime = 5;
                healthBar.style.width = health + '%';
                if(health <= 0) endGame();
            }
        }
        if(e.isDead) enemies.splice(i, 1);
    }

    // Pickups
    for(let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i]; p.update();
        if(Math.hypot(p.x - player.x, p.y - player.y) < 40) {
            if(p.type === 'life') health = Math.min(100, health + 25);
            else {
                player.powerup = p.type; player.powerupTime = 400;
                if(p.type === 'diaper') {
                    createExplosion(width/2, height/2, true);
                    enemies.forEach(en => en.hp = 0);
                }
            }
            pickups.splice(i, 1);
            powerupDisplay.innerText = p.type.toUpperCase() + "!";
        } else if(p.y > height + 80) pickups.splice(i, 1);
    }

    if(player.powerup) {
        player.powerupTime--;
        if(player.powerupTime <= 0) { player.powerup = null; powerupDisplay.innerText = ""; }
    }
    
    for(let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.03;
        if(p.life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.save(); if(shakeTime > 0) ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);
    ctx.fillStyle = '#0b0e14'; ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    const gS = 60; const off = scrollY % gS;
    for(let i=0; i<width; i+=gS) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
    for(let i=off; i<height; i+=gS) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width,i); ctx.stroke(); }

    trails.forEach(t => { ctx.globalAlpha = t.life; ctx.font = '22px Arial'; ctx.fillText('🔥', t.x-10, t.y+10); });
    ctx.globalAlpha = 1.0;

    pickups.forEach(p => p.draw());
    enemies.forEach(e => e.draw());
    
    // Bullets (Simplified draw)
    ctx.fillStyle = 'white';
    bullets.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI*2); ctx.fill();
    });

    // Tail
    ctx.strokeStyle = 'white'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(player.x, player.y);
    player.tail.forEach((t, i) => {
        const osc = Math.sin(time*0.2 + i*0.5) * 8;
        ctx.lineWidth = 12 * (1 - i/player.tail.length);
        ctx.lineTo(t.x + osc, t.y + i*6);
    });
    ctx.stroke();

    // Player
    ctx.save(); ctx.translate(player.x, player.y);
    if(player.powerup === 'durex') ctx.drawImage(durexImg, -45, -45, 90, 90);
    else {
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(-6, -4, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(6, -4, 3, 0, Math.PI*2); ctx.fill();
        if(player.powerup === 'banana') ctx.drawImage(bananaImg, -20, -50, 40, 35);
    }
    ctx.restore();

    // Particles (Simplified)
    ctx.font = '16px Arial';
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillText(p.emoji, p.x, p.y);
    });
    ctx.restore();
}

function endGame() { gameState = 'over'; gameOverScreen.style.display = 'flex'; }
function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();
