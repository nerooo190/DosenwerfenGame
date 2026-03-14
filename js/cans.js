// cans.js – Can definitions and drawing functions

export const CanDefs = {
  default: {
    id: 'default',
    name: 'Classic Tin',
    emoji: '🥫',
    cost: 0,
    rarity: 'common',
    description: 'The timeless classic',
    draw(ctx, x, y, w, h, state = 'normal') {
      drawBaseGradient(ctx, x, y, w, h, '#b0b8c0', '#d8dfe5', '#8a9099', state);
      // label band
      const bandY = y + h * 0.2, bandH = h * 0.6;
      ctx.fillStyle = '#e8e0d0';
      ctx.fillRect(x + w * 0.08, bandY, w * 0.84, bandH);
      // label lines
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + w * 0.15, bandY + bandH * (0.25 + i * 0.25));
        ctx.lineTo(x + w * 0.85, bandY + bandH * (0.25 + i * 0.25));
        ctx.stroke();
      }
      drawCanEnds(ctx, x, y, w, h, '#9aa3ac');
    },
  },

  cola: {
    id: 'cola',
    name: 'Cola Can',
    emoji: '🥤',
    cost: 50,
    rarity: 'common',
    description: 'Fizzy cola energy',
    draw(ctx, x, y, w, h, state = 'normal') {
      drawBaseGradient(ctx, x, y, w, h, '#cc0000', '#ff3333', '#880000', state);
      const bandY = y + h * 0.18, bandH = h * 0.64;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + w * 0.05, bandY + bandH * 0.35, w * 0.9, bandH * 0.3);
      ctx.fillStyle = '#cc0000';
      ctx.font = `bold ${h * 0.18}px Arial Black`;
      ctx.textAlign = 'center';
      ctx.fillText('COLA', x + w / 2, bandY + bandH * 0.56);
      drawCanEnds(ctx, x, y, w, h, '#aa0000');
    },
  },

  gold: {
    id: 'gold',
    name: 'Gold Can',
    emoji: '🏆',
    cost: 150,
    rarity: 'rare',
    description: 'Worth its weight in gold',
    draw(ctx, x, y, w, h, state = 'normal') {
      drawBaseGradient(ctx, x, y, w, h, '#b8860b', '#ffd700', '#996600', state);
      // shine streaks
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#fffacd';
      ctx.fillRect(x + w * 0.2, y + h * 0.1, w * 0.15, h * 0.8);
      ctx.fillRect(x + w * 0.55, y + h * 0.15, w * 0.08, h * 0.7);
      ctx.restore();
      // stars
      drawStars(ctx, x + w / 2, y + h / 2, 3, '#fff8dc', h * 0.06);
      drawCanEnds(ctx, x, y, w, h, '#b8860b');
    },
  },

  neon: {
    id: 'neon',
    name: 'Neon Can',
    emoji: '✨',
    cost: 200,
    rarity: 'rare',
    description: 'Electrifying glow effect',
    draw(ctx, x, y, w, h, state = 'normal') {
      drawBaseGradient(ctx, x, y, w, h, '#001133', '#002266', '#000a22', state);
      // neon stripes
      const colors = ['#ff00ff', '#00ffff', '#ff6600', '#00ff88'];
      for (let i = 0; i < 4; i++) {
        const sy = y + h * (0.2 + i * 0.15);
        ctx.save();
        ctx.shadowColor = colors[i];
        ctx.shadowBlur = 8;
        ctx.fillStyle = colors[i];
        ctx.fillRect(x + w * 0.05, sy, w * 0.9, h * 0.06);
        ctx.restore();
      }
      drawCanEnds(ctx, x, y, w, h, '#001133');
    },
  },

  rainbow: {
    id: 'rainbow',
    name: 'Rainbow Can',
    emoji: '🌈',
    cost: 300,
    rarity: 'epic',
    description: 'All colors united',
    draw(ctx, x, y, w, h, state = 'normal') {
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, '#ff0000');
      grad.addColorStop(0.17, '#ff8800');
      grad.addColorStop(0.33, '#ffff00');
      grad.addColorStop(0.5, '#00ff00');
      grad.addColorStop(0.67, '#0088ff');
      grad.addColorStop(0.83, '#8800ff');
      grad.addColorStop(1, '#ff0088');
      drawBodyWithGrad(ctx, x, y, w, h, grad, state);
      // shine
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + w * 0.1, y + h * 0.05, w * 0.2, h * 0.9);
      ctx.restore();
      drawCanEnds(ctx, x, y, w, h, '#888');
    },
  },

  space: {
    id: 'space',
    name: 'Space Can',
    emoji: '🌌',
    cost: 400,
    rarity: 'epic',
    description: 'Galaxy within a can',
    draw(ctx, x, y, w, h, state = 'normal') {
      drawBaseGradient(ctx, x, y, w, h, '#050020', '#1a006b', '#050040', state);
      // galaxy dots
      ctx.save();
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`;
        const sx = x + w * 0.1 + Math.random() * w * 0.8;
        const sy = y + h * 0.1 + Math.random() * h * 0.8;
        const sr = Math.random() * 1.5 + 0.3;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      // nebula swirl
      ctx.globalAlpha = 0.3;
      const nb = ctx.createRadialGradient(x + w * 0.5, y + h * 0.5, 0, x + w * 0.5, y + h * 0.5, w * 0.5);
      nb.addColorStop(0, '#aa44ff');
      nb.addColorStop(0.5, '#2200aa');
      nb.addColorStop(1, 'transparent');
      ctx.fillStyle = nb;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
      drawCanEnds(ctx, x, y, w, h, '#1a006b');
    },
  },

  fire: {
    id: 'fire',
    name: 'Fire Can',
    emoji: '🔥',
    cost: 500,
    rarity: 'epic',
    description: 'Red hot intensity',
    draw(ctx, x, y, w, h, state = 'normal') {
      drawBaseGradient(ctx, x, y, w, h, '#330000', '#cc2200', '#880000', state);
      // flame pattern
      const flameGrad = ctx.createLinearGradient(x, y + h, x, y);
      flameGrad.addColorStop(0, '#ff0000');
      flameGrad.addColorStop(0.4, '#ff6600');
      flameGrad.addColorStop(0.7, '#ffaa00');
      flameGrad.addColorStop(1, '#ffff00');
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = flameGrad;
      for (let i = 0; i < 5; i++) {
        const fx = x + w * (0.1 + i * 0.18);
        const fw = w * 0.12;
        ctx.beginPath();
        ctx.moveTo(fx, y + h * 0.9);
        ctx.quadraticCurveTo(fx - fw, y + h * 0.5, fx + fw * 0.5, y + h * 0.1);
        ctx.quadraticCurveTo(fx + fw * 1.5, y + h * 0.5, fx + fw * 2, y + h * 0.9);
        ctx.fill();
      }
      ctx.restore();
      drawCanEnds(ctx, x, y, w, h, '#440000');
    },
  },

  ice: {
    id: 'ice',
    name: 'Ice Can',
    emoji: '❄️',
    cost: 500,
    rarity: 'epic',
    description: 'Frozen in time',
    draw(ctx, x, y, w, h, state = 'normal') {
      drawBaseGradient(ctx, x, y, w, h, '#aaddff', '#ddeeff', '#88ccff', state);
      // ice crystal lines
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.5;
      const cx2 = x + w / 2, cy2 = y + h / 2;
      for (let a = 0; a < 6; a++) {
        const angle = (a * Math.PI) / 3;
        const ex = cx2 + Math.cos(angle) * w * 0.4;
        const ey = cy2 + Math.sin(angle) * h * 0.35;
        ctx.beginPath();
        ctx.moveTo(cx2, cy2);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // branches
        for (let b = 1; b <= 2; b++) {
          const br = b / 3;
          const bx = cx2 + Math.cos(angle) * w * 0.4 * br;
          const by = cy2 + Math.sin(angle) * h * 0.35 * br;
          const bLen = w * 0.12;
          ctx.beginPath();
          ctx.moveTo(bx + Math.cos(angle + Math.PI / 2) * bLen, by + Math.sin(angle + Math.PI / 2) * bLen * 0.8);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx + Math.cos(angle - Math.PI / 2) * bLen, by + Math.sin(angle - Math.PI / 2) * bLen * 0.8);
          ctx.stroke();
        }
      }
      ctx.restore();
      drawCanEnds(ctx, x, y, w, h, '#88aacc');
    },
  },

  camo: {
    id: 'camo',
    name: 'Camo Can',
    emoji: '🌿',
    cost: 350,
    rarity: 'rare',
    description: 'Hidden in plain sight',
    draw(ctx, x, y, w, h, state = 'normal') {
      drawBaseGradient(ctx, x, y, w, h, '#3d5c2a', '#4a6e34', '#2d4a1f', state);
      // camo blobs
      const blobs = [
        { x: 0.2, y: 0.2, r: 0.18, c: '#2a3d15' },
        { x: 0.7, y: 0.15, r: 0.15, c: '#4a5c2a' },
        { x: 0.5, y: 0.5, r: 0.22, c: '#1f2e0f' },
        { x: 0.15, y: 0.65, r: 0.16, c: '#3d5020' },
        { x: 0.75, y: 0.6, r: 0.18, c: '#2a3d15' },
        { x: 0.4, y: 0.8, r: 0.14, c: '#4a5c2a' },
      ];
      blobs.forEach(b => {
        ctx.fillStyle = b.c;
        ctx.beginPath();
        ctx.ellipse(x + w * b.x, y + h * b.y, w * b.r, h * b.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      drawCanEnds(ctx, x, y, w, h, '#2d4a1f');
    },
  },

  pixel: {
    id: 'pixel',
    name: 'Pixel Can',
    emoji: '👾',
    cost: 250,
    rarity: 'rare',
    description: '8-bit retro style',
    draw(ctx, x, y, w, h, state = 'normal') {
      const grid = 6;
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ffffff', '#000000'];
      // base
      ctx.fillStyle = '#111';
      ctx.fillRect(x, y, w, h);
      // pixel grid
      const pw = w / grid, ph = h / grid;
      for (let gy = 0; gy < grid; gy++) {
        for (let gx = 0; gx < grid; gx++) {
          if (Math.random() > 0.35) {
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.fillRect(x + gx * pw, y + gy * ph, pw - 1, ph - 1);
          }
        }
      }
      drawCanEnds(ctx, x, y, w, h, '#333');
    },
  },

  diamond: {
    id: 'diamond',
    name: 'Diamond Can',
    emoji: '💎',
    cost: 800,
    rarity: 'legendary',
    description: 'Dazzling gemstone beauty',
    draw(ctx, x, y, w, h, state = 'normal') {
      drawBaseGradient(ctx, x, y, w, h, '#b0e0ff', '#ffffff', '#88bbff', state);
      // facets
      const facetColors = ['rgba(0,200,255,0.3)', 'rgba(255,255,255,0.5)', 'rgba(100,180,255,0.4)', 'rgba(200,240,255,0.3)'];
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        ctx.fillStyle = facetColors[i % facetColors.length];
        ctx.beginPath();
        ctx.moveTo(x + w * (0.1 + i * 0.13), y + h * 0.05);
        ctx.lineTo(x + w * (0.1 + i * 0.13 + 0.12), y + h * 0.05);
        ctx.lineTo(x + w * (0.05 + i * 0.14), y + h * 0.95);
        ctx.closePath();
        ctx.fill();
      }
      // sparkles
      drawStars(ctx, x + w * 0.25, y + h * 0.3, 4, '#ffffff', h * 0.05);
      drawStars(ctx, x + w * 0.75, y + h * 0.6, 4, '#aaddff', h * 0.04);
      drawCanEnds(ctx, x, y, w, h, '#88aacc');
    },
  },

  crown: {
    id: 'crown',
    name: 'Crown Can',
    emoji: '👑',
    cost: 1000,
    rarity: 'legendary',
    description: 'The ultimate prestige',
    draw(ctx, x, y, w, h, state = 'normal') {
      drawBaseGradient(ctx, x, y, w, h, '#996600', '#ffcc00', '#cc9900', state);
      // crown shape
      ctx.save();
      ctx.fillStyle = '#ffee00';
      ctx.strokeStyle = '#cc8800';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 6;
      const cy3 = y + h * 0.35;
      const cw = w * 0.8, cx3 = x + w * 0.1;
      ctx.beginPath();
      ctx.moveTo(cx3, cy3 + h * 0.3);
      ctx.lineTo(cx3, cy3 + h * 0.05);
      ctx.lineTo(cx3 + cw * 0.2, cy3 + h * 0.15);
      ctx.lineTo(cx3 + cw * 0.4, cy3 - h * 0.05);
      ctx.lineTo(cx3 + cw * 0.6, cy3 + h * 0.15);
      ctx.lineTo(cx3 + cw * 0.8, cy3 + h * 0.05);
      ctx.lineTo(cx3 + cw, cy3 + h * 0.05);
      ctx.lineTo(cx3 + cw, cy3 + h * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // gems on crown
      [0.2, 0.5, 0.8].forEach(gx => {
        ctx.fillStyle = '#ff2244';
        ctx.beginPath();
        ctx.arc(x + w * gx, y + h * 0.35, h * 0.04, 0, Math.PI * 2);
        ctx.fill();
      });
      drawStars(ctx, x + w / 2, y + h * 0.7, 5, '#ffe066', h * 0.04);
      drawCanEnds(ctx, x, y, w, h, '#cc9900');
    },
  },
};

// ─── Helper drawing functions ─────────────────────────────────────────────────

export function drawBaseGradient(ctx, x, y, w, h, top, mid, bot, state) {
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, bot);
  grad.addColorStop(0.3, mid);
  grad.addColorStop(0.65, top);
  grad.addColorStop(1, bot);
  drawBodyWithGrad(ctx, x, y, w, h, grad, state);
}

export function drawBodyWithGrad(ctx, x, y, w, h, grad, state) {
  ctx.save();
  if (state === 'toppling') {
    ctx.globalAlpha = 0.95;
  }
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  // edge shadow for 3D effect
  const shadow = ctx.createLinearGradient(x, y, x + w, y);
  shadow.addColorStop(0, 'rgba(0,0,0,0.4)');
  shadow.addColorStop(0.15, 'rgba(0,0,0,0)');
  shadow.addColorStop(0.85, 'rgba(0,0,0,0)');
  shadow.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = shadow;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

export function drawCanEnds(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  // top rim
  ctx.fillRect(x + w * 0.05, y, w * 0.9, h * 0.08);
  ctx.fillRect(x + w * 0.1, y + h * 0.08, w * 0.8, h * 0.07);
  // bottom rim
  ctx.fillRect(x + w * 0.1, y + h * 0.85, w * 0.8, h * 0.07);
  ctx.fillRect(x + w * 0.05, y + h * 0.92, w * 0.9, h * 0.08);
  // pull tab
  ctx.fillStyle = color;
  ctx.fillRect(x + w * 0.35, y + h * 0.02, w * 0.3, h * 0.03);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + w * 0.38, y + h * 0.025, w * 0.09, h * 0.02);
}

export function drawStars(ctx, cx, cy, count, color, size) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 2;
  for (let i = 0; i < count; i++) {
    const a = (i * Math.PI * 2) / count;
    const sx = cx + Math.cos(a) * size * 3;
    const sy = cy + Math.sin(a) * size * 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy - size);
    ctx.lineTo(sx + size * 0.4, sy - size * 0.4);
    ctx.lineTo(sx + size, sy);
    ctx.lineTo(sx + size * 0.4, sy + size * 0.4);
    ctx.lineTo(sx, sy + size);
    ctx.lineTo(sx - size * 0.4, sy + size * 0.4);
    ctx.lineTo(sx - size, sy);
    ctx.lineTo(sx - size * 0.4, sy - size * 0.4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export default CanDefs;
