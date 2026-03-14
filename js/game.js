// game.js – Core physics engine and rendering for Dosenwerfen

import CanDefs from './cans.js';
import { getTheme } from './themes.js';
import Audio from './audio.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const GRAVITY = 0.38;
const BALL_RADIUS = 18;
const CAN_W = 36;
const CAN_H = 54;
const FLOOR_Y_RATIO = 0.78;
const THROW_ZONE_X = 0.12;
const THROW_ZONE_Y = 0.72;
const MAX_THROWS_BASE = 5;
const BOUNCE_DAMPENING = 0.38;
const ROLL_FRICTION = 0.975;
const TOPPLE_THRESHOLD = 3.5;

// ─── Pyramid layouts (column offsets, rows) ───────────────────────────────────
const PYRAMID_LAYOUTS = [
  { rows: 2, cols: [1, 2] },   // Level 1: 3 cans
  { rows: 3, cols: [1, 2, 3] }, // Level 2: 6 cans
  { rows: 3, cols: [1, 2, 3] }, // Level 3: 6 cans + wind
  { rows: 4, cols: [1, 2, 3, 4] }, // Level 4: 10 cans
  { rows: 4, cols: [1, 2, 3, 4] }, // Level 5+: 10 cans + strong wind
];

// ─── Particle System ──────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, vx, vy, color, life, size = 4, type = 'circle') {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.life = this.maxLife = life;
    this.size = size;
    this.type = type;
    this.alpha = 1;
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += GRAVITY * 0.4;
    this.vx *= 0.97;
    this.life--;
    this.alpha = this.life / this.maxLife;
    this.angle += this.spin;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    if (this.type === 'rect') {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.5);
    } else if (this.type === 'star') {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      drawStar(ctx, 0, 0, this.size, this.size * 0.4);
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(1, this.size * this.alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawStar(ctx, x, y, outerR, innerR) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    i === 0 ? ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a)) : ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
}

// ─── Can Object ───────────────────────────────────────────────────────────────
class Can {
  constructor(x, y, skinId = 'default') {
    this.x = x;
    this.y = y;
    this.originX = x;
    this.originY = y;
    this.angle = 0;
    this.vx = 0;
    this.vy = 0;
    this.angularV = 0;
    this.skinId = skinId;
    this.state = 'standing'; // standing | toppling | fallen | bouncing
    this.knockedDown = false;
    this.width = CAN_W;
    this.height = CAN_H;
    this.onFloor = false;
    this.hitTimestamp = 0;
    this.flashAlpha = 0;
  }

  get cx() { return this.x + this.width / 2; }
  get cy() { return this.y + this.height / 2; }
  get left() { return this.x; }
  get right() { return this.x + this.width; }
  get top() { return this.y; }
  get bottom() { return this.y + this.height; }

  draw(ctx, floorY) {
    if (this.state === 'fallen' && this.knockedDown) {
      this._drawFallen(ctx);
      return;
    }
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.rotate(this.angle);
    // flash on hit
    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();
      this.flashAlpha = Math.max(0, this.flashAlpha - 0.08);
    }
    const skin = CanDefs[this.skinId] || CanDefs.default;
    skin.draw(ctx, -this.width / 2, -this.height / 2, this.width, this.height, this.state);
    ctx.restore();
  }

  _drawFallen(ctx) {
    ctx.save();
    ctx.translate(this.cx, this.bottom);
    ctx.rotate(this.angle);
    const skin = CanDefs[this.skinId] || CanDefs.default;
    skin.draw(ctx, -this.height / 2, -this.width / 2, this.height, this.width, 'fallen');
    ctx.restore();
  }

  update(floorY, cans, wind) {
    if (this.state === 'standing') return;

    // Physics for toppling/falling cans
    if (this.state === 'toppling' || this.state === 'bouncing') {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += GRAVITY;
      this.vx *= 0.99;
      this.angle += this.angularV;

      // Floor collision
      if (this.bottom >= floorY) {
        this.y = floorY - this.height;
        if (Math.abs(this.vy) > 2) {
          this.vy *= -BOUNCE_DAMPENING;
          Audio.bounce();
        } else {
          this.vy = 0;
          this.vx *= ROLL_FRICTION;
          this.angularV *= 0.85;
        }
        this.onFloor = true;
        if (Math.abs(this.vy) < 0.5 && Math.abs(this.vx) < 0.3) {
          this.state = 'fallen';
          this.knockedDown = true;
        }
      } else {
        this.onFloor = false;
      }

      // Apply wind
      this.vx += wind * 0.01;

      // Can-on-can collision
      for (const other of cans) {
        if (other === this || other.state === 'standing') continue;
        const dx = other.cx - this.cx;
        const dy = other.cy - this.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (this.width + other.width) * 0.45;
        if (dist < minDist && dist > 0) {
          const nx = dx / dist, ny = dy / dist;
          const overlap = minDist - dist;
          this.x -= nx * overlap * 0.5;
          this.y -= ny * overlap * 0.5;
          other.x += nx * overlap * 0.5;
          other.y += ny * overlap * 0.5;
          const relVx = this.vx - other.vx;
          const relVy = this.vy - other.vy;
          const velAlong = relVx * nx + relVy * ny;
          if (velAlong < 0) {
            const impulse = velAlong * 0.6;
            this.vx -= impulse * nx;
            this.vy -= impulse * ny;
            other.vx += impulse * nx;
            other.vy += impulse * ny;
          }
        }
      }
    }
  }

  applyHit(ballVx, ballVy, hitX, hitY) {
    this.state = 'toppling';
    this.onFloor = false;
    this.flashAlpha = 0.7;
    this.hitTimestamp = Date.now();
    const force = Math.sqrt(ballVx * ballVx + ballVy * ballVy);
    this.vx = ballVx * 0.6 + (hitX > this.cx ? 1 : -1) * 0.5;
    this.vy = -Math.abs(ballVy) * 0.4 - 2;
    this.angularV = (hitX > this.cx ? 1 : -1) * (0.05 + force * 0.008);
    Audio.hit();
  }
}

// ─── Ball Object ──────────────────────────────────────────────────────────────
class Ball {
  constructor(x, y, vx, vy, color, highlightColor) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.radius = BALL_RADIUS;
    this.color = color;
    this.highlightColor = highlightColor;
    this.active = true;
    this.trail = [];
  }

  update(floorY, wind) {
    if (!this.active) return;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 12) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;
    this.vy += GRAVITY;
    this.vx += wind * 0.005;

    if (this.y + this.radius >= floorY) {
      this.y = floorY - this.radius;
      if (Math.abs(this.vy) > 3) {
        this.vy *= -BOUNCE_DAMPENING;
        Audio.bounce();
      } else {
        this.active = false;
      }
      this.vx *= ROLL_FRICTION;
    }

    if (this.x - this.radius > window.innerWidth || this.x + this.radius < -50) {
      this.active = false;
    }
  }

  draw(ctx, theme) {
    if (!this.active) return;

    // Trail
    ctx.save();
    this.trail.forEach((t, i) => {
      const alpha = (i / this.trail.length) * 0.3;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.radius * 0.6 * (i / this.trail.length), 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    });
    ctx.restore();

    // Ball shadow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius * 0.85, this.radius * 0.8, this.radius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ball body
    const grad = ctx.createRadialGradient(
      this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.05,
      this.x, this.y, this.radius
    );
    grad.addColorStop(0, this.highlightColor);
    grad.addColorStop(0.4, this.color);
    grad.addColorStop(1, shadeColor(this.color, -60));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Shine
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    ctx.restore();
  }
}

// ─── Helper: shade a hex color ────────────────────────────────────────────────
function shadeColor(hex, amount) {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch (e) { return hex; }
}

// ─── Star background for certain themes ──────────────────────────────────────
function generateStars(count) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + 0.3, twinkle: Math.random() * Math.PI * 2 });
  }
  return stars;
}

// ─── Main Game Class ──────────────────────────────────────────────────────────
export class Game {
  constructor(canvas, storage) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.storage = storage;

    this.theme = getTheme(storage.get('selectedTheme'));
    this.selectedCan = storage.get('selectedCan') || 'default';

    this.state = 'menu'; // menu | playing | paused | levelComplete | gameOver | shop
    this.level = 1;
    this.score = 0;
    this.sessionCoins = 0;
    this.throwsLeft = MAX_THROWS_BASE;
    this.cans = [];
    this.balls = [];
    this.particles = [];
    this.stars = generateStars(120);
    this.wind = 0;
    this.windTarget = 0;
    this.windIndicator = 0;
    this.combo = 0;
    this.lastKnockDownTime = 0;

    this.aiming = false;
    this.aimStart = null;
    this.aimCurrent = null;
    this.aimPower = 0;
    this.aimAngle = 0;
    this.maxPower = 22;

    this.bgParticles = this._createBgParticles();
    this.lights = [];
    this._createCarouselLights();

    this.throwZoneX = 0;
    this.throwZoneY = 0;
    this.floorY = 0;
    this.pyramidBaseX = 0;

    this._resize();
    this._bindEvents();
    this._loop();
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.floorY = this.canvas.height * FLOOR_Y_RATIO;
    this.throwZoneX = this.canvas.width * THROW_ZONE_X;
    this.throwZoneY = this.floorY;
    this.pyramidBaseX = this.canvas.width * 0.58;
  }

  _createBgParticles() {
    const p = [];
    for (let i = 0; i < 25; i++) {
      p.push({
        x: Math.random() * 1, y: Math.random() * 1,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.002 + 0.001,
        colorIdx: Math.floor(Math.random() * 4),
        phase: Math.random() * Math.PI * 2,
      });
    }
    return p;
  }

  _createCarouselLights() {
    this.lights = [];
    for (let i = 0; i < 12; i++) {
      this.lights.push({
        x: (i / 12),
        y: 0.03 + Math.sin(i * 0.5) * 0.02,
        phase: (i / 12) * Math.PI * 2,
        colorIdx: i % 4,
      });
    }
  }

  _buildLevel(level) {
    this.cans = [];
    this.balls = [];
    this.particles = [];
    this.throwsLeft = MAX_THROWS_BASE + Math.floor(level / 2);

    const layoutIdx = Math.min(level - 1, PYRAMID_LAYOUTS.length - 1);
    const layout = PYRAMID_LAYOUTS[layoutIdx];
    const baseX = this.pyramidBaseX;
    const floorY = this.floorY;
    const totalRows = layout.rows;
    const spacing = CAN_W + 6;

    for (let row = 0; row < totalRows; row++) {
      const cansInRow = totalRows - row;
      const rowWidth = cansInRow * spacing;
      const startX = baseX - rowWidth / 2;
      const y = floorY - CAN_H * (row + 1) - row * 2;
      for (let col = 0; col < cansInRow; col++) {
        this.cans.push(new Can(
          startX + col * spacing,
          y,
          this.selectedCan
        ));
      }
    }

    this.combo = 0;
    this.score = 0;
    this.sessionCoins = 0;
    this.wind = 0;
    this.windTarget = level >= 3 ? (Math.random() - 0.5) * (level >= 5 ? 4 : 2) : 0;
  }

  _bindEvents() {
    const c = this.canvas;
    const getPos = (e) => {
      const rect = c.getBoundingClientRect();
      if (e.touches) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onDown = (e) => {
      if (this.state !== 'playing' || this.throwsLeft <= 0) return;
      const p = getPos(e);
      // Only allow aiming from throw zone region (left 30% of screen at floor level)
      if (p.x > this.canvas.width * 0.35) return;
      this.aiming = true;
      this.aimStart = p;
      this.aimCurrent = p;
      e.preventDefault();
    };

    const onMove = (e) => {
      if (!this.aiming) return;
      this.aimCurrent = getPos(e);
      e.preventDefault();
    };

    const onUp = (e) => {
      if (!this.aiming) return;
      this.aiming = false;
      this._doThrow();
    };

    c.addEventListener('mousedown', onDown);
    c.addEventListener('mousemove', onMove);
    c.addEventListener('mouseup', onUp);
    c.addEventListener('touchstart', onDown, { passive: false });
    c.addEventListener('touchmove', onMove, { passive: false });
    c.addEventListener('touchend', onUp);

    window.addEventListener('resize', () => this._resize());
  }

  _doThrow() {
    if (this.throwsLeft <= 0 || !this.aimStart || !this.aimCurrent) return;
    const dx = this.aimStart.x - this.aimCurrent.x;
    const dy = this.aimStart.y - this.aimCurrent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) return;

    const power = Math.min(dist / 8, this.maxPower);
    const nx = dx / dist, ny = dy / dist;
    const vx = nx * power;
    const vy = ny * power;

    const ball = new Ball(
      this.throwZoneX,
      this.throwZoneY - 20,
      vx, vy,
      this.theme.ballColor,
      this.theme.ballHighlight
    );
    this.balls.push(ball);
    this.throwsLeft--;
    Audio.throw();

    // Throw particles
    for (let i = 0; i < 8; i++) {
      this.particles.push(new Particle(
        this.throwZoneX, this.throwZoneY - 20,
        (Math.random() - 0.5) * 4, -Math.random() * 3,
        this.theme.particleColors[Math.floor(Math.random() * this.theme.particleColors.length)],
        25, 3
      ));
    }
  }

  _checkCollisions() {
    for (const ball of this.balls) {
      if (!ball.active) continue;
      for (const can of this.cans) {
        if (can.knockedDown) continue;
        const cx = can.cx, cy = can.cy;
        const dx = ball.x - cx;
        const dy = ball.y - cy;
        const halfW = can.width / 2 + ball.radius;
        const halfH = can.height / 2 + ball.radius;
        if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
          can.applyHit(ball.vx, ball.vy, ball.x, ball.y);
          // Emit particles
          const colors = this.theme.particleColors;
          for (let i = 0; i < 16; i++) {
            this.particles.push(new Particle(
              cx, cy,
              (Math.random() - 0.5) * 6, -(Math.random() * 5 + 1),
              colors[Math.floor(Math.random() * colors.length)],
              35, Math.random() * 5 + 2,
              Math.random() > 0.5 ? 'rect' : 'circle'
            ));
          }
          // Slight ball deflection
          ball.vx *= 0.5;
          ball.vy = Math.min(ball.vy * 0.3, -2);
        }
      }
    }
  }

  _checkKnockdowns() {
    for (const can of this.cans) {
      if (!can.knockedDown && can.state === 'fallen') {
        // Just transitioned to knocked down
      }
      if (can.state === 'toppling' || can.state === 'bouncing') {
        // Check if it has toppled enough to knock adjacent standing cans  
        for (const other of this.cans) {
          if (other === can || !can.knockedDown && other.state === 'standing') {
            if (other.state === 'standing') {
              // Check physical overlap
              const dx = Math.abs(can.cx - other.cx);
              const dy = Math.abs(can.cy - other.cy);
              if (dx < CAN_W * 1.2 && dy < CAN_H * 1.2 && (Math.abs(can.vx) > 1 || Math.abs(can.vy) > 1)) {
                other.applyHit(can.vx * 0.5, can.vy * 0.3, can.cx, can.cy);
                // Chain reaction particles
                const colors = this.theme.particleColors;
                for (let i = 0; i < 8; i++) {
                  this.particles.push(new Particle(
                    other.cx, other.cy - CAN_H * 0.3,
                    (Math.random() - 0.5) * 5, -(Math.random() * 4 + 1),
                    colors[Math.floor(Math.random() * colors.length)],
                    30, 3
                  ));
                }
              }
            }
          }
        }
      }
    }
  }

  _countKnockedCans() {
    return this.cans.filter(c => c.knockedDown).length;
  }

  _allCansDown() {
    return this.cans.every(c => c.knockedDown);
  }

  _awardCoins(newlyKnocked) {
    if (newlyKnocked <= 0) return;

    const now = Date.now();
    const isCombo = now - this.lastKnockDownTime < 1500;
    if (isCombo) this.combo++;
    else this.combo = 1;
    this.lastKnockDownTime = now;

    const baseCoins = newlyKnocked * 10 * this.level;
    const comboBonus = this.combo > 1 ? Math.floor(baseCoins * (this.combo - 1) * 0.5) : 0;
    const total = baseCoins + comboBonus;

    this.score += total;
    this.sessionCoins += total;
    this.storage.addCoins(total);

    Audio.coin();

    // Coin burst particles
    for (let i = 0; i < 12; i++) {
      this.particles.push(new Particle(
        this.pyramidBaseX + (Math.random() - 0.5) * 80,
        this.floorY - 80 - Math.random() * 80,
        (Math.random() - 0.5) * 5, -(Math.random() * 4 + 2),
        '#ffd700',
        45, 5, 'star'
      ));
    }
  }

  _emitConfetti() {
    const colors = ['#ff0080', '#ff6b35', '#ffd700', '#00e5ff', '#a855f7', '#22c55e'];
    for (let i = 0; i < 80; i++) {
      this.particles.push(new Particle(
        Math.random() * this.canvas.width,
        -10,
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        colors[Math.floor(Math.random() * colors.length)],
        120, Math.random() * 8 + 3,
        Math.random() > 0.5 ? 'rect' : 'circle'
      ));
    }
  }

  update() {
    if (this.state !== 'playing') return;

    // Wind drift
    this.wind += (this.windTarget - this.wind) * 0.01;

    // Update balls
    const prevKnockedCount = this._countKnockedCans();
    for (const ball of this.balls) ball.update(this.floorY, this.wind);
    this.balls = this.balls.filter(b => b.active || b.trail.length > 0);

    // Collisions
    this._checkCollisions();

    // Update cans
    for (const can of this.cans) can.update(this.floorY, this.cans, this.wind);

    // Check chain knockdowns
    this._checkKnockdowns();

    // Award coins for newly knocked cans
    const nowKnockedCount = this._countKnockedCans();
    const newlyKnocked = nowKnockedCount - prevKnockedCount;
    if (newlyKnocked > 0) this._awardCoins(newlyKnocked);

    // Update particles
    for (const p of this.particles) p.update();
    this.particles = this.particles.filter(p => p.life > 0);

    // Check win/lose condition
    if (this._allCansDown()) {
      setTimeout(() => {
        this._emitConfetti();
        Audio.levelComplete();
        this.storage.set('highestLevel', Math.max(this.storage.get('highestLevel') || 1, this.level + 1));
        window.dispatchEvent(new CustomEvent('levelComplete', { detail: { level: this.level, score: this.score, coins: this.sessionCoins } }));
      }, 600);
      this.state = 'levelComplete';
    } else if (this.throwsLeft <= 0 && this.balls.every(b => !b.active)) {
      setTimeout(() => {
        Audio.gameOver();
        window.dispatchEvent(new CustomEvent('gameOver', { detail: { level: this.level, score: this.score, coins: this.sessionCoins } }));
      }, 800);
      this.state = 'gameOver';
    }
  }

  draw() {
    const { ctx, canvas, theme } = this;
    const W = canvas.width, H = canvas.height;
    const t = Date.now() / 1000;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    theme.bgGradient.forEach((c, i) => {
      bgGrad.addColorStop(i / (theme.bgGradient.length - 1), c);
    });
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    if (theme.skyStars) {
      this.stars.forEach(s => {
        const twinkle = 0.5 + 0.5 * Math.sin(t * 2 + s.twinkle);
        ctx.save();
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H * 0.75, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // Carnival lights
    if (theme.lights) {
      this.lights.forEach((l, i) => {
        const glow = 0.6 + 0.4 * Math.sin(t * 3 + l.phase);
        const color = theme.lightColors[l.colorIdx % theme.lightColors.length];
        const lx = l.x * W, ly = l.y * H;
        ctx.save();
        ctx.beginPath();
        ctx.shadowColor = color;
        ctx.shadowBlur = 15 * glow;
        ctx.fillStyle = color;
        ctx.globalAlpha = glow;
        ctx.arc(lx, ly, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      // strings between lights
      ctx.save();
      ctx.strokeStyle = 'rgba(255,220,100,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, this.lights[0].y * H);
      for (const l of this.lights) ctx.lineTo(l.x * W, l.y * H);
      ctx.lineTo(W, this.lights[0].y * H);
      ctx.stroke();
      ctx.restore();
    }

    // Floor
    const floorGrad = ctx.createLinearGradient(0, this.floorY, 0, H);
    floorGrad.addColorStop(0, theme.floorAccent + '44');
    floorGrad.addColorStop(0.3, theme.floorColor);
    floorGrad.addColorStop(1, theme.floorColor);
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, this.floorY, W, H - this.floorY);

    // Floor line
    ctx.save();
    ctx.shadowColor = theme.floorAccent;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = theme.floorAccent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.floorY);
    ctx.lineTo(W, this.floorY);
    ctx.stroke();
    ctx.restore();

    // Throw zone
    if (this.state === 'playing') {
      this._drawThrowZone(ctx, t);
    }

    // Wind indicator
    if (this.state === 'playing' && Math.abs(this.wind) > 0.3) {
      this._drawWindIndicator(ctx);
    }

    // Cans
    for (const can of this.cans) can.draw(ctx, this.floorY);

    // Balls
    for (const ball of this.balls) ball.draw(ctx, theme);

    // Particles
    for (const p of this.particles) p.draw(ctx);

    // Aiming
    if (this.aiming && this.aimStart && this.aimCurrent) {
      this._drawAimingArc(ctx);
    }
  }

  _drawThrowZone(ctx, t) {
    const glow = 0.4 + 0.3 * Math.sin(t * 2);
    ctx.save();
    ctx.strokeStyle = this.theme.uiAccent;
    ctx.shadowColor = this.theme.uiAccent;
    ctx.shadowBlur = 10 * glow;
    ctx.globalAlpha = 0.7 * glow;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(this.throwZoneX, this.throwZoneY, 30, Math.PI, 0, false);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow hint
    if (this.throwsLeft > 0 && this.balls.every(b => !b.active)) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3);
      ctx.fillStyle = this.theme.uiAccent;
      ctx.font = 'bold 14px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DRAG →', this.throwZoneX + 45, this.throwZoneY - 40);
    }
    ctx.restore();
  }

  _drawWindIndicator(ctx) {
    const W = this.canvas.width;
    const cx = W / 2, cy = this.floorY - 30;
    const dir = this.wind > 0 ? '→' : '←';
    const strength = Math.min(Math.abs(this.wind), 5);
    ctx.save();
    ctx.font = 'bold 13px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffffcc';
    ctx.fillText(`Wind ${dir} ${strength.toFixed(1)}`, cx, cy);
    ctx.restore();
  }

  _drawAimingArc(ctx) {
    const dx = this.aimStart.x - this.aimCurrent.x;
    const dy = this.aimStart.y - this.aimCurrent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(dist / 8, this.maxPower);
    const nx = dx / dist || 0, ny = dy / dist || 0;
    let vx = nx * power, vy = ny * power;
    const sx = this.throwZoneX, sy = this.throwZoneY - 20;

    ctx.save();
    ctx.setLineDash([]);
    ctx.lineWidth = 2;

    // Draw trajectory
    let px = sx, py = sy;
    let pvx = vx, pvy = vy;
    const stops = 28;

    for (let i = 0; i < stops; i++) {
      pvy += GRAVITY;
      pvx *= 0.999;
      px += pvx;
      py += pvy;
      if (py > this.floorY) break;
      const alpha = (1 - i / stops) * 0.7;
      ctx.beginPath();
      ctx.arc(px, py, 3 - i * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = this.theme.trajectoryColor;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }

    // Power bar
    const barX = this.aimStart.x, barY = this.aimStart.y;
    const barW = 60, barH = 8;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX - barW / 2, barY - 30, barW, barH);
    const ratio = power / this.maxPower;
    const barColor = ratio < 0.4 ? '#44ff88' : ratio < 0.75 ? '#ffcc00' : '#ff4444';
    ctx.fillStyle = barColor;
    ctx.fillRect(barX - barW / 2, barY - 30, barW * ratio, barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - barW / 2, barY - 30, barW, barH);

    // Aim line
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = this.theme.uiAccent;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(this.aimStart.x, this.aimStart.y);
    ctx.lineTo(this.aimCurrent.x, this.aimCurrent.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  _loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this._loop());
  }

  // Public API
  startLevel(level) {
    this.level = level || 1;
    this.state = 'playing';
    this._buildLevel(this.level);
  }

  nextLevel() {
    this.level++;
    this.state = 'playing';
    this._buildLevel(this.level);
  }

  retry() {
    this.state = 'playing';
    this._buildLevel(this.level);
  }

  setTheme(themeId) {
    this.theme = getTheme(themeId);
    this.storage.set('selectedTheme', themeId);
  }

  setCanSkin(canId) {
    this.selectedCan = canId;
    this.storage.set('selectedCan', canId);
  }

  getState() { return this.state; }
  getScore() { return this.score; }
  getThrowsLeft() { return this.throwsLeft; }
  getLevel() { return this.level; }
  getStoredCoins() { return this.storage.get('coins'); }
}

export default Game;
