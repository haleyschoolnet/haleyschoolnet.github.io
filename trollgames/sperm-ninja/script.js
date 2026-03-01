const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const comboText = document.getElementById('combo-text');

let width, height;
let gameState = 'start';
let score = 0;
let lives = 3;
let time = 0;

// Assets
const bananaImg = new Image(); bananaImg.src = 'banana.png';
const durexImg = new Image(); durexImg.src = 'durex_bomb.png';

let entities = [];
let particles = [];
let slicePath = [];
let isSlicing = false;
let comboCount = 0;
let comboTimer = 0;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// --- Controls ---
const startSlice = (x, y) => { isSlicing = true; slicePath = [{x, y}]; };
const moveSlice = (x, y) => { if(isSlicing) slicePath.push({x, y}); if(slicePath.length > 8) slicePath.shift(); };
const endSlice = () => { isSlicing = false; slicePath = []; comboCount = 0; };

window.addEventListener('mousedown', (e) => startSlice(e.clientX, e.clientY));
window.addEventListener('mousemove', (e) => moveSlice(e.clientX, e.clientY));
window.addEventListener('mouseup', endSlice);

window.addEventListener('touchstart', (e) => { e.preventDefault(); startSlice(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
window.addEventListener('touchmove', (e) => { e.preventDefault(); moveSlice(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
window.addEventListener('touchend', endSlice);

startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameState = 'playing';
});

// --- Drawing Helper for NEW "REAL" Procedural Sperm ---
function drawSperm(ctx, size, timeOffset, color, isHalf = false, side = 1) {
    ctx.save();
    if(isHalf) {
        ctx.beginPath();
        if(side === 1) ctx.rect(-size, -size, size, size*2);
        else ctx.rect(0, -size, size, size*2);
        ctx.clip();
    }

    // 3D Shaded Head (Radial Gradient)
    const headGrad = ctx.createRadialGradient(-size/10, -size/10, 2, 0, 0, size/2);
    headGrad.addColorStop(0, '#ffffff'); // Highlight
    headGrad.addColorStop(0.3, '#f0f0f0');   // Base Color (Trắng)
    headGrad.addColorStop(1, '#999999'); // Darker bottom

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, size/2.2, size/1.8, 0, 0, Math.PI*2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(-size/7, -size/4, size/9, 0, Math.PI*2); ctx.fill(); 
    ctx.beginPath(); ctx.arc(size/5, -size/5, size/6, 0, Math.PI*2); ctx.fill();  
    
    // Pupils
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(-size/7, -size/4, size/25, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(size/5, -size/5, size/18, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, size/6, size/8, 0.4, Math.PI-0.4); ctx.stroke();

    // Tapered Wiggling Tail
    if(!isHalf) {
        ctx.lineCap = 'round';
        const segments = 15;
        for(let i=0; i<segments; i++) {
            const wag = Math.sin(time*0.25 + i * 0.5 + timeOffset) * (size/4 * (i/segments));
            const y = size/3 + i * (size/5);
            const nextWag = Math.sin(time*0.25 + (i+1) * 0.5 + timeOffset) * (size/4 * ((i+1)/segments));
            const nextY = size/3 + (i+1) * (size/5);

            ctx.strokeStyle = 'white';
            ctx.lineWidth = (size/4) * (1 - i/segments); 
            ctx.beginPath();
            ctx.moveTo(wag, y);
            ctx.lineTo(nextWag, nextY);
            ctx.stroke();
        }
    }
    ctx.restore();
}

// --- Entities ---
class Entity {
    constructor() {
        this.x = width * (0.15 + Math.random() * 0.7);
        this.y = height + 100;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = -(height * 0.012 + Math.random() * 5);
        this.gravity = 0.12;
        
        // Luôn hướng đầu lên trên theo hướng bay
        this.rotation = Math.atan2(this.vy, this.vx) + Math.PI/2;
        this.rotSpeed = 0; // Để nó bay thẳng
        this.size = 55;
        
        const rand = Math.random();
        if(rand < 0.65) this.type = 'durex';
        else if(rand < 0.72) this.type = 'banana';
        else {
            this.type = 'sperm';
            this.color = 'white'; // Trở về màu trắng nguyên bản
        }

        this.isSliced = false;
        this.sliceAngle = 0;
        this.timeOffset = Math.random() * 100;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        
        // Cập nhật góc quay để luôn hướng đầu về phía trước (trừ khi là bom/chuối thì quay tròn)
        if (!this.isSliced) {
            if (this.type === 'sperm') {
                this.rotation = Math.atan2(this.vy, this.vx) + Math.PI/2;
            } else {
                this.rotation += 0.05; // Bom và chuối quay tròn
            }
        }

        if(this.type === 'durex' && !this.isSliced && time % 2 === 0) {
           createFireParticle(this.x, this.y);
        }

        if(this.y > height + 200) return true;
        return false;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if(!this.isSliced) {
            if(this.type === 'durex') ctx.drawImage(durexImg, -45, -45, 90, 90);
            else if(this.type === 'banana') ctx.drawImage(bananaImg, -40, -40, 80, 80);
            else drawSperm(ctx, this.size, this.timeOffset, 'white');
        } else {
            ctx.rotate(this.sliceAngle);
            ctx.globalAlpha = Math.max(0, 1.0 - (time % 40)/40);
            if(this.type === 'sperm') {
                ctx.save(); ctx.translate(-12, 0); drawSperm(ctx, this.size, this.timeOffset, 'white', true, 1); ctx.restore();
                ctx.save(); ctx.translate(12, 0); drawSperm(ctx, this.size, this.timeOffset, 'white', true, 2); ctx.restore();
            } else {
                let img = this.type === 'banana' ? bananaImg : durexImg;
                ctx.save(); ctx.translate(-15, 0); ctx.drawImage(img, -45, -45, 45, 90, -22, -45, 22, 90); ctx.restore();
                ctx.save(); ctx.translate(15, 0); ctx.drawImage(img, 0, -45, 45, 90, 0, -45, 22, 90); ctx.restore();
            }
        }
        ctx.restore();
    }

    checkSlice(p1, p2) {
        if(this.isSliced) return false;
        const distHead = Math.hypot(this.x - p2.x, this.y - p2.y);
        if(distHead < this.size/1.3) {
            this.setSlice(p1, p2);
            return true;
        }
        if(this.type === 'sperm') {
            for(let i=1; i<15; i++) {
                const wag = Math.sin(time*0.25 + i * 0.5 + this.timeOffset) * (this.size/4 * (i/15));
                const ty = this.size/3 + i * (this.size/5);
                const cosR = Math.cos(this.rotation);
                const sinR = Math.sin(this.rotation);
                const tx = wag * cosR - ty * sinR;
                const tyRot = wag * sinR + ty * cosR;
                const worldX = this.x + tx;
                const worldY = this.y + tyRot;
                if(Math.hypot(worldX - p2.x, worldY - p2.y) < (this.size/4)) {
                    this.setSlice(p1, p2);
                    return true;
                }
            }
        }
        return false;
    }

    setSlice(p1, p2) {
        this.isSliced = true;
        this.sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        this.vx *= 0.5;
        this.vy *= 0.2;
    }
}

function spawnEntities() {
    if(time % 55 === 0) {
        const count = 1 + Math.floor(score/15000);
        for(let i=0; i<count; i++) entities.push(new Entity());
    }
}

function createSplatter(x, y, color = 'white', text = "") {
    for(let i=0; i<30; i++) {
        particles.push({
            x, y,
            vx: (Math.random()-0.5)*18,
            vy: (Math.random()-0.5)*18,
            life: 1.0, color, size: 5 + Math.random()*8
        });
    }
    if(text) {
        particles.push({
            x, y: y-20, vx: 0, vy: -2, life: 1.5, color: '#ffd700', size: 22, label: text
        });
    }
}

function createFireParticle(x, y) {
    particles.push({
        x, y,
        vx: (Math.random()-0.5)*3,
        vy: -Math.random()*4,
        life: 1.0, color: Math.random()>0.5 ? '#ff4d4d' : '#ffd700', size: 3 + Math.random()*5, isFire: true
    });
}

function update() {
    if(gameState !== 'playing') return;
    time++;

    spawnEntities();

    for(let i = entities.length - 1; i >= 0; i--) {
        if(entities[i].update()) { entities.splice(i, 1); continue; }

        if(isSlicing && slicePath.length > 1) {
            const p1 = slicePath[slicePath.length-2];
            const p2 = slicePath[slicePath.length-1];
            if(entities[i].checkSlice(p1, p2)) {
                if(entities[i].type === 'durex') {
                    lives--;
                    livesDisplay.innerText = "❤️".repeat(lives);
                    createSplatter(entities[i].x, entities[i].y, '#ff4d4d', "OUCH! -$500");
                    score = Math.max(0, score - 500);
                    scoreDisplay.innerText = "$" + score;
                    if(lives <= 0) endGame();
                } else {
                    const reward = entities[i].type === 'banana' ? 1000 : 200;
                    score += reward;
                    scoreDisplay.innerText = "$" + score;
                    createSplatter(entities[i].x, entities[i].y, 'white', "+$" + reward);
                }
            }
        }
    }

    for(let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if(!p.isFire && !p.label) p.vy += 0.35;
        p.life -= 0.02;
        if(p.life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    entities.forEach(e => e.draw());

    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        if(p.label) {
            ctx.fillStyle = p.color; ctx.font = `bold ${p.size}px Outfit`;
            ctx.fillText(p.label, p.x - 40, p.y);
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2); ctx.fill();
        }
    });
    ctx.globalAlpha = 1.0;

    if(isSlicing && slicePath.length > 1) {
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 12; ctx.lineCap = 'round';
        ctx.shadowBlur = 15; ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(slicePath[0].x, slicePath[0].y);
        slicePath.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

function endGame() {
    gameState = 'over';
    gameOverScreen.style.display = 'flex';
    document.getElementById('final-score').innerText = "TOTAL PROFIT: $" + score;
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();
