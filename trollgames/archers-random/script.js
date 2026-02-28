const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerHealthBar = document.getElementById('player-health');
const enemyHealthBar = document.getElementById('enemy-total-health');
const enemyCountDisplay = document.getElementById('enemy-count');
const messageToast = document.getElementById('message-toast');
const gameOverScreen = document.getElementById('game-over');
const winnerText = document.getElementById('winner-text');
const statsText = document.getElementById('stats-text');

// Load Assets
const bananaImg = new Image();
bananaImg.src = 'chuoi....png';
const durexImg = new Image();
durexImg.src = 'durex.png';

// Game Config
let width, height;
const gravity = 0.04;
const groundY = 20;

// Game State
let gameState = 'playing';
let playerHealth = 100;
let dragStart = { x: 0, y: 0 };
let currentDrag = { x: 0, y: 0 };
let isDragging = false;
let projectiles = [];
let particles = [];
let floatingTexts = [];
let score = 0;

function showFloatingText(x, y, text, color, isBig = false) {
    floatingTexts.push({ x, y, text, color, life: 1.0, vy: -1.5, isBig });
}

// Entities
const player = { x: 100, y: 0, color: 'cyan', size: 60 };
const enemies = [];
const ENEMY_COUNT = 3;

const trollObjects = [
    { name: 'Arrow', type: 'line', damage: 20, color: 'silver', size: 30 },
    { name: 'Dead Fish', type: 'arc', damage: 35, color: '#add8e6', size: 10 },
    { name: 'Budget Banana', type: 'curve', damage: 15, color: 'yellow', size: 15 },
    { name: 'Red Brick', type: 'rect', damage: 45, color: '#b22222', size: 12 },
    { name: 'Pizza Slice', type: 'delta', damage: 25, color: '#ffa500', size: 15 },
    { name: 'Toxic Bottle', type: 'bottle', damage: 50, color: '#32cd32', size: 12 },
    { name: 'Special Seed', type: 'sperm', damage: 69, color: 'white', size: 15 },
    { name: 'Safe Shield', type: 'condom', damage: 40, color: '#f0f0f0', size: 20 }
];

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    player.y = height - 100;
    
    if(enemies.length === 0) spawnEnemies();
    else enemies.forEach((e, idx) => {
        e.y = height - 100 - (idx * 20); // slight stagger
        e.x = width - 150 - (Math.random() * 200);
    });
}

function spawnEnemies() {
    for(let i=0; i<ENEMY_COUNT; i++) {
        enemies.push({
            id: i,
            x: width - 100 - (Math.random() * 300),
            y: height - 100,
            hp: 100,
            color: '#ff4d4d',
            alive: true,
            nextShot: Date.now() + 1000 + (Math.random() * 3000)
        });
    }
}

window.addEventListener('resize', resize);
resize();

// --- Stickman Drawing ---
function drawStickman(x, y, color, angle = 0, isMirror = false, hp = 100, isFemale = false) {
    if(hp <= 0) return;
    ctx.save();
    
    // Scale character based on pregnancy
    if(isFemale) {
        const scale = 1 + (1 - (hp / 100)) * 0.5; // Grow up to 1.5x
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.translate(-x, -y);
    }
    
    ctx.translate(x, y);
    if(isMirror) ctx.scale(-1, 1);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(0, -60, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Hair for female
    if(isFemale) {
        ctx.beginPath();
        ctx.moveTo(-10, -65);
        ctx.lineTo(-15, -40);
        ctx.moveTo(10, -65);
        ctx.lineTo(15, -40);
        ctx.stroke();
    }

    const legWobble = Math.sin(Date.now() / 200) * 5;

    if(isFemale) {
        // Dress
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(-15, -10);
        ctx.lineTo(15, -10);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();

        // Legs
        ctx.beginPath();
        ctx.moveTo(-5, -10); ctx.lineTo(-10 + legWobble, 0);
        ctx.moveTo(5, -10); ctx.lineTo(10 - legWobble, 0);
        ctx.stroke();

        // BELLY GROWTH (Pregnancy Effect)
        // If HP is low, belly is BIG
        const pregProgress = 1 - (hp / 100);
        if(pregProgress > 0) {
            ctx.fillStyle = "#ffb6c1"; // Healthy pink for baby bump
            ctx.beginPath();
            ctx.arc(0, -30, pregProgress * 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw a little baby face inside if it's really big? Just kidding, let's keep it clean
        }
    } else {
        // Body
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(0, -20);
        ctx.stroke();

        // Legs (janky walk style)
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-10 + legWobble, 0);
        ctx.moveTo(0, -20);
        ctx.lineTo(10 - legWobble, 0);
        ctx.stroke();
    }

    // Health Small Bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-20, -85, 40, 5);
    ctx.fillStyle = (hp > 30) ? 'green' : 'red';
    ctx.fillRect(-20, -85, 40 * (hp/100), 5);

    // Arms & Weapon
    ctx.translate(0, -40);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(25, 0);
    ctx.stroke();

    if(!isFemale) {
        // PLAYER BANANA GUN
        ctx.drawImage(bananaImg, 10, -25, 60, 50);
    } else {
        // FEMALE ENEMY BOW
        ctx.strokeStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(25, 0, 25, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
    }
    
    ctx.restore();
}

// --- Projectile Logic ---
class Projectile {
    constructor(x, y, vx, vy, owner, config) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.owner = owner; this.config = config;
        this.angle = Math.atan2(vy, vx);
        this.active = true;
    }

    update() {
        this.x += this.vx; this.vy += gravity; this.y += this.vy;
        this.angle = Math.atan2(this.vy, this.vx);

        if(this.owner === 'player') {
            enemies.filter(e => e.hp > 0).forEach(e => {
                const dist = Math.hypot(this.x - e.x, this.y - (e.y - 40));
                if(dist < 30) {
                    this.onHit(e); this.active = false;
                }
            });
        } else {
            const dist = Math.hypot(this.x - player.x, this.y - (player.y - 40));
            if(dist < 30) {
                this.onHit(player); this.active = false;
            }
        }

        if(this.y > height - groundY || this.x < -100 || this.x > width + 100) {
            this.active = false;
        }
    }

    onHit(target) {
        const dmg = this.config.damage + (Math.random() * 15);
        
        const playerHitMsgs = [
            "100% PREGNANT! 🤰",
            "YOU'RE PREGNANT! 🍼",
            "TWO LINES! ||",
            "CONGRATS MAMA! 🤱",
            "DIAPER DEBT +$999k",
            "O_O + 9 MONTHS",
            "BABY SHARK INBOUND! 🦈",
            "BUMPED! 🤰",
            "S.E.E.D DEPLOYED! 🌱",
            "FUTURE CHILD INBOUND!",
            "EMOTIONAL DAMAGE! 😭",
            "BONK! GO TO HORNY JAIL",
            "BULLSEYE! 🎯",
            "WHO'S THE DADDY? 🤔",
            "NO TEST NEEDED! ✅",
            "GAME OVER, MAMA!",
            "KNOCKED UP! 🚩",
            "BUN IN THE OVEN! 🍞"
        ];

        const enemyTaunts = [
            "SKILL ISSUE! 🤡",
            "L + RATIO + NOOB",
            "EASY CLAP! EZ",
            "MY GRANDMA SHOOTS BETTER!",
            "GO BACK TO MINECRAFT!",
            "STAY MAD, BRO!",
            "WHIFF! (NOT REALLY)",
            "HA! BUDGET ARMOR FAILED!",
            "DO YOU EVEN AIM?",
            "REPORT PLAYER: NOOB",
            "SAFE AND SECURE! 🛡️",
            "ANTIVIRUS ACTIVATED!",
            "PROTECTION DEPLOYED!"
        ];

        if(this.owner === 'player') {
            target.hp -= dmg;
            score += Math.floor(dmg);
            
            // Show big funny hit message on enemy
            const msg = playerHitMsgs[Math.floor(Math.random() * playerHitMsgs.length)];
            showFloatingText(target.x, target.y - 120, msg, "gold", true);
            messageToast.innerText = "YOU: " + msg;
            
            if(target.hp <= 0) {
                target.hp = 0;
                // Giving birth effect (Special Particles)
                createParticles(target.x, target.y - 40, '#fff', 50); // White flash
                createBabyParticles(target.x, target.y - 40); // Spawn lil babies
                
                const deathMsgs = ["IT'S A BOY!", "IT'S A GIRL!", "BABY DELIVERED!", "QUINTUPLETS?!", "CONGRATS DADDY!"];
                showFloatingText(target.x, target.y - 150, deathMsgs[Math.floor(Math.random() * deathMsgs.length)], "#ff00ff", true);
            }
        } else {
            playerHealth -= dmg;
            playerHealthBar.style.width = Math.max(0, playerHealth) + '%';
            createParticles(player.x, player.y - 40, '#0ff', 20);
            
            // AI Taunts player with BIG text
            const msg = enemyTaunts[Math.floor(Math.random() * enemyTaunts.length)];
            showFloatingText(player.x, player.y - 120, msg, "#ff4d4d", true);
            messageToast.innerText = "ENEMY: " + msg;
        }
        updateEnemyHUD();
        if(playerHealth <= 0) endGame(false);
        if(enemies.every(e => e.hp <= 0)) endGame(true);
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.config.color;
        
        switch(this.config.type) {
            case 'line': ctx.fillRect(-15, -1, 30, 2); break;
            case 'arc': ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI); ctx.fill(); break;
            case 'rect': ctx.fillRect(-6, -6, 12, 12); break;
            case 'delta': ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(-10,10); ctx.lineTo(-10,-10); ctx.closePath(); ctx.fill(); break;
            case 'bottle': ctx.fillRect(-5, -10, 10, 20); ctx.fillStyle='white'; ctx.fillRect(-3,-12,6,4); break;
            case 'sperm':
                // BIG Head
                ctx.beginPath();
                ctx.arc(15, 0, 12, 0, Math.PI * 2);
                ctx.fill();
                // SMOOTHER, less wavy tail
                ctx.beginPath();
                ctx.lineWidth = 5;
                ctx.strokeStyle = "white";
                ctx.lineCap = "round";
                ctx.moveTo(5, 0);
                for(let i=0; i<45; i++) {
                    // Lower frequency (0.1) makes it look much smoother and realistic
                    ctx.lineTo(-i, Math.sin(i * 0.12 + Date.now() * 0.015) * (i * 0.15));
                }
                ctx.stroke();
                break;
            case 'condom':
                // Draw the Durex Image (X-LARGE)
                ctx.save();
                // Rotate less or keep upright for easier reading while flying
                ctx.rotate(this.angle * 0.2); 
                ctx.drawImage(durexImg, -75, -45, 150, 90);
                ctx.restore();
                break;
        }
        ctx.restore();
    }
}

function updateEnemyHUD() {
    const aliveCount = enemies.filter(e => e.hp > 0).length;
    const totalHP = enemies.reduce((sum, e) => sum + e.hp, 0);
    const maxHP = ENEMY_COUNT * 100;
    enemyCountDisplay.innerText = `ENEMIES LEFT: ${aliveCount}`;
    enemyHealthBar.style.width = (totalHP / maxHP * 100) + '%';
}

function createBabyParticles(x, y) {
    for(let i=0; i<5; i++) {
        particles.push({
            x, y, 
            vx: (Math.random()-0.5)*15, 
            vy: -10 - Math.random() * 10,
            life: 1.5, color: 'white', isBaby: true
        });
    }
}

function createParticles(x, y, color, n=15) {
    for(let i=0; i<n; i++) {
        particles.push({
            x, y, 
            vx: (Math.random()-0.5)*12, 
            vy: (Math.random()-0.5)*12,
            life: 1.0, color
        });
    }
}

// --- Interaction ---
function onStart(x, y) {
    if(gameState !== 'playing') return;
    dragStart = { x, y };
    currentDrag = { ...dragStart };
    isDragging = true;
}

function onMove(x, y) {
    if(isDragging) currentDrag = { x, y };
}

function onEnd(x, y) {
    if(!isDragging) return;
    isDragging = false;
    const dx = dragStart.x - x;
    const dy = dragStart.y - y;
    
    const power = Math.min(Math.hypot(dx, dy) * 0.056, 14);
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * power;
    const vy = Math.sin(angle) * power;

    if(power > 2) {
        // Player ONLY shoots the Special Seed now
        const spermConfig = trollObjects.find(o => o.type === 'sperm');
        projectiles.push(new Projectile(player.x, player.y - 40, vx, vy, 'player', spermConfig));
    }
}

// Mouse Listeners
canvas.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
window.addEventListener('mouseup', (e) => onEnd(e.clientX, e.clientY));

// Touch Listeners
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    onStart(touch.clientX, touch.clientY);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    onMove(touch.clientX, touch.clientY);
}, { passive: false });

window.addEventListener('touchend', (e) => {
    // Note: touchend 'touches' list is empty, use 'changedTouches'
    const touch = e.changedTouches[0];
    onEnd(touch.clientX, touch.clientY);
});

function enemyBehavior() {
    enemies.filter(e => e.hp > 0).forEach(e => {
        if(Date.now() > e.nextShot) {
            // FIRE AT PLAYER (Varied Arcs Mode)
            const dx = player.x - e.x;
            
            // Randomize the height of the arc (vy)
            // Some are low and fast, some are high and slow
            const randVy = -2.5 - (Math.random() * 4.5); 
            
            // Calculate time to reach target altitude: t = 2 * (-vy) / g (approx)
            // Using gravity 0.04
            const predictedTime = 2 * (-randVy) / 0.04;
            
            // Horizontal speed needed: vx = dx / t (plus SIGNIFICANT random error)
            const vx = (dx / predictedTime) + (Math.random() * 5 - 2.5);
            const vy = randVy + (Math.random() * 1.5 - 0.75);
            
            const condomConfig = trollObjects.find(o => o.type === 'condom');
            projectiles.push(new Projectile(e.x, e.y - 40, vx, vy, 'enemy', condomConfig));
            
            e.nextShot = Date.now() + 1500 + (Math.random() * 2500);
        }
    });
}

function endGame(win) {
    gameState = 'gameOver';
    gameOverScreen.style.display = 'block';
    
    // Count how many "babies were delivered" (defeated enemies)
    const pregnancies = enemies.filter(e => e.hp <= 0).length;
    
    if(win) {
        winnerText.innerText = "CONGRATS DADDY! 🍼👑";
        winnerText.style.color = "gold";
        statsText.innerHTML = `You successfully impregnated <b>${pregnancies}</b> ladies!<br>Total children to support: <b>${pregnancies}</b>.`;
    } else {
        winnerText.innerText = "ALIMONY DEBTOR! 💸😭";
        winnerText.style.color = "#ff4d4d";
        statsText.innerHTML = `You made <b>${pregnancies}</b> mothers pregnant before losing.<br>Good luck with the child support!`;
    }
}

// --- Main Loop ---
function loop() {
    ctx.clearRect(0, 0, width, height);

    particles = particles.filter(p => (p.life -= 0.015) > 0);
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if(p.isBaby) {
            p.vy += gravity; // Babies fall
            ctx.font = "20px 'Segoe UI'";
            ctx.fillText("👶", p.x, p.y);
        } else {
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
            ctx.fillRect(p.x, p.y, 3, 3);
        }
    });
    ctx.globalAlpha = 1.0;

    // Floating Texts
    floatingTexts = floatingTexts.filter(t => (t.life -= 0.015) > 0);
    floatingTexts.forEach(t => {
        t.y += t.vy;
        const shake = t.isBig ? (Math.random() - 0.5) * 5 : 0;
        ctx.font = t.isBig ? "bold 68px 'Impact', sans-serif" : "bold 20px 'Segoe UI'";
        ctx.fillStyle = t.color;
        ctx.strokeStyle = "black";
        ctx.lineWidth = t.isBig ? 3.5 : 3;
        ctx.globalAlpha = t.life;
        ctx.textAlign = 'center';
        if(t.isBig) ctx.strokeText(t.text, t.x + shake, t.y);
        ctx.fillText(t.text, t.x + shake, t.y);
    });
    ctx.globalAlpha = 1.0;

    // Ground
    ctx.fillStyle = '#222'; ctx.fillRect(0, height - groundY, width, groundY);

    // Player
    let pAngle = 0;
    if(isDragging) pAngle = Math.atan2(currentDrag.y - dragStart.y, currentDrag.x - dragStart.x) + Math.PI;
    drawStickman(player.x, player.y, player.color, pAngle, false, playerHealth);

    // Enemies
    enemies.forEach(e => drawStickman(e.x, e.y, "#ff69b4", 0, true, e.hp, true));

    // Projectiles
    projectiles = projectiles.filter(p => p.active);
    projectiles.forEach(p => { p.update(); p.draw(); });

    // AI logic
    if(gameState === 'playing') enemyBehavior();

    // Trajectory
    if(isDragging) {
        ctx.setLineDash([5, 5]); ctx.strokeStyle='rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.moveTo(player.x, player.y - 40);
        const dx = dragStart.x - currentDrag.x, dy = dragStart.y - currentDrag.y;
        let tx = player.x, ty = player.y - 40;
        let pwr = Math.min(Math.hypot(dx, dy) * 0.056, 14);
        let ang = Math.atan2(dy, dx);
        let tvx = Math.cos(ang) * pwr, tvy = Math.sin(ang) * pwr;
        for(let i=0; i<150; i++) {
            tx += tvx; tvy += gravity; ty += tvy;
            ctx.lineTo(tx, ty);
            if(ty > height - groundY) break;
        }
        ctx.stroke(); ctx.setLineDash([]);
    }

    requestAnimationFrame(loop);
}

loop();
console.log("Budget Chaos 1vs5 Started.");
