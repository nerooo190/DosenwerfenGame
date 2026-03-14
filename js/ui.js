// ui.js – HUD, menus, shop overlays for Dosenwerfen

import { Themes } from './themes.js';
import CanDefs from './cans.js';
import Audio from './audio.js';

export class UI {
  constructor(storage, game) {
    this.storage = storage;
    this.game = game;

    this.currentScreen = 'menu'; // menu | hud | shop | levelComplete | gameOver | settings
    this._buildDOM();
    this._bindUIEvents();
    this._listenGameEvents();
  }

  _buildDOM() {
    // ── HUD ──────────────────────────────────────────────────────────────────
    this.hud = this._el('div', 'hud hidden', `
      <div class="hud-top">
        <div class="hud-stat">
          <span class="hud-icon">🪙</span>
          <span id="hud-coins">0</span>
        </div>
        <div class="hud-center">
          <div class="hud-level" id="hud-level">LEVEL 1</div>
          <div class="hud-score" id="hud-score">0 pts</div>
        </div>
        <div class="hud-stat">
          <span class="hud-icon">⚾</span>
          <span id="hud-throws">5</span>
        </div>
      </div>
      <button class="hud-btn-shop" id="btn-open-shop" title="Shop">🛍️</button>
      <button class="hud-btn-settings" id="btn-open-settings" title="Settings">⚙️</button>
    `);

    // ── MAIN MENU ─────────────────────────────────────────────────────────────
    this.menuScreen = this._el('div', 'screen menu-screen', `
      <div class="menu-bg-overlay"></div>
      <div class="menu-content glass-panel">
        <div class="menu-logo">🎯</div>
        <h1 class="menu-title">DOSENWERFEN</h1>
        <p class="menu-tagline">Can you knock 'em all?</p>
        <div class="menu-buttons">
          <button class="btn btn-primary" id="btn-play">▶ PLAY</button>
          <button class="btn btn-secondary" id="btn-shop-menu">🛍️ SHOP</button>
          <button class="btn btn-secondary" id="btn-settings-menu">⚙️ SETTINGS</button>
        </div>
        <div class="menu-coins glass-small">
          <span>🪙</span> <span id="menu-coins-display">0</span>
        </div>
        <div class="menu-footer-links">
          <button class="footer-link" id="btn-about">Über das Spiel</button>
          <span class="footer-sep">·</span>
          <button class="footer-link" id="btn-impressum">Impressum</button>
          <span class="footer-sep">·</span>
          <button class="footer-link" id="btn-datenschutz">Datenschutz</button>
        </div>
      </div>
    `);

    // ── LEVEL SELECT ──────────────────────────────────────────────────────────
    this.levelScreen = this._el('div', 'screen level-screen hidden', `
      <div class="panel glass-panel level-panel">
        <h2>Select Level</h2>
        <div class="level-grid" id="level-grid"></div>
        <button class="btn btn-secondary" id="btn-level-back">← Back</button>
      </div>
    `);

    // ── SHOP ──────────────────────────────────────────────────────────────────
    this.shopScreen = this._el('div', 'screen shop-screen hidden', `
      <div class="panel glass-panel shop-panel">
        <div class="shop-header">
          <h2>🛍️ SHOP</h2>
          <div class="shop-coins-badge glass-small">🪙 <span id="shop-coins">0</span></div>
          <button class="btn-close" id="btn-shop-close">✕</button>
        </div>
        <div class="shop-tabs">
          <button class="shop-tab active" data-tab="cans">Can Skins</button>
          <button class="shop-tab" data-tab="themes">Themes</button>
        </div>
        <div class="shop-grid" id="shop-grid"></div>
      </div>
    `);

    // ── LEVEL COMPLETE ────────────────────────────────────────────────────────
    this.levelComplete = this._el('div', 'screen overlay-screen hidden', `
      <div class="panel glass-panel overlay-panel result-panel">
        <div class="result-emoji">🎉</div>
        <h2>Level Complete!</h2>
        <div class="result-stats" id="lc-stats"></div>
        <div class="result-buttons">
          <button class="btn btn-primary" id="btn-next-level">Next Level ▶</button>
          <button class="btn btn-secondary" id="btn-lc-menu">Menu</button>
        </div>
      </div>
    `);

    // ── GAME OVER ─────────────────────────────────────────────────────────────
    this.gameOver = this._el('div', 'screen overlay-screen hidden', `
      <div class="panel glass-panel overlay-panel result-panel">
        <div class="result-emoji">💥</div>
        <h2>Game Over!</h2>
        <div class="result-stats" id="go-stats"></div>
        <div class="result-buttons">
          <button class="btn btn-primary" id="btn-retry">↺ Try Again</button>
          <button class="btn btn-secondary" id="btn-go-menu">Menu</button>
        </div>
      </div>
    `);

    // ── SETTINGS ─────────────────────────────────────────────────────────────
    this.settingsScreen = this._el('div', 'screen overlay-screen hidden', `
      <div class="panel glass-panel settings-panel">
        <div class="settings-header">
          <h2>⚙️ Settings</h2>
          <button class="btn-close" id="btn-settings-close">✕</button>
        </div>
        <div class="settings-list">
          <div class="settings-row">
            <span>🔊 Sound Effects</span>
            <button class="toggle-btn" id="toggle-sfx" data-on="${this.storage.get('sfxEnabled') ? 'true' : 'false'}">
              ${this.storage.get('sfxEnabled') ? 'ON' : 'OFF'}
            </button>
          </div>
          <div class="settings-row">
            <span>💾 Reset Progress</span>
            <button class="btn btn-danger" id="btn-reset">Reset</button>
          </div>
        </div>
      </div>
    `);

    // ── ABOUT ─────────────────────────────────────────────────────────────────
    this.aboutScreen = this._el('div', 'screen overlay-screen hidden', `
      <div class="panel glass-panel info-panel">
        <div class="info-header">
          <h2>🎯 Über das Spiel</h2>
          <button class="btn-close" id="btn-about-close">✕</button>
        </div>
        <div class="info-body">
          <div class="about-logo">🎪</div>
          <p><strong>Dosenwerfen</strong> ist ein modernes Browser-Wurfspiel, inspiriert vom klassischen Jahrmarkt-Dosenwerfen.</p>
          <div class="about-features">
            <div class="about-feature"><span>🎯</span><span>Physikbasiertes Wurfgefühl mit Bogenbahn-Vorschau</span></div>
            <div class="about-feature"><span>🥫</span><span>12 freischaltbare Dosen-Skins – von Classic bis Legendary</span></div>
            <div class="about-feature"><span>🎨</span><span>6 visuelle Themes – Karneval, Neon, Ozean, Wald, Weltraum, Wüste</span></div>
            <div class="about-feature"><span>💥</span><span>Kettenreaktionen &amp; Combo-System für Bonus-Coins</span></div>
            <div class="about-feature"><span>🔊</span><span>Prozedural generierte Sounds – kein Download nötig</span></div>
            <div class="about-feature"><span>💾</span><span>Fortschritt wird automatisch gespeichert</span></div>
          </div>
          <p class="about-tip">💡 <em>Tipp: Zieh von der linken Seite nach rechts, um zu zielen. Die Stärke zeigt der Balken oben an.</em></p>
          <p class="about-version">Version 1.0 · Entwickelt 2026</p>
        </div>
      </div>
    `);

    // ── IMPRESSUM ─────────────────────────────────────────────────────────────
    this.impressumScreen = this._el('div', 'screen overlay-screen hidden', `
      <div class="panel glass-panel info-panel">
        <div class="info-header">
          <h2>📋 Impressum</h2>
          <button class="btn-close" id="btn-impressum-close">✕</button>
        </div>
        <div class="info-body legal-body">
          <p class="legal-note">Angaben gemäß § 5 TMG</p>
          <div class="legal-block">
            <h3>Verantwortlicher</h3>
            <p>Andre Wellmann<br>
               An der Tiergartenbreite 10</p>
          </div>
          <div class="legal-block">
            <h3>Kontakt</h3>
            <p>📧 <a href="mailto:lpandreu97@gmail.com">lpandreu97@gmail.com</a></p>
            <p>📞 <a href="tel:+4901701225427">0170 1225427</a></p>
          </div>
          <div class="legal-block">
            <h3>Haftungsausschluss</h3>
            <p>Dieses Spiel wird als Freizeitprojekt ohne kommerzielle Absicht betrieben. Alle Inhalte dienen der Unterhaltung.</p>
          </div>
          <div class="legal-block">
            <h3>Streitschlichtung</h3>
            <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit. Eine Verpflichtung zur Teilnahme an einem Streitbeilegungsverfahren besteht nicht.</p>
          </div>
        </div>
      </div>
    `);

    // ── DATENSCHUTZ ───────────────────────────────────────────────────────────
    this.datenschutzScreen = this._el('div', 'screen overlay-screen hidden', `
      <div class="panel glass-panel info-panel">
        <div class="info-header">
          <h2>🔒 Datenschutzerklärung</h2>
          <button class="btn-close" id="btn-datenschutz-close">✕</button>
        </div>
        <div class="info-body legal-body">
          <p class="legal-note">Stand: März 2026</p>
          <div class="legal-block">
            <h3>1. Verantwortlicher</h3>
            <p>Andre Wellmann, An der Tiergartenbreite 10<br>
               📧 <a href="mailto:lpandreu97@gmail.com">lpandreu97@gmail.com</a><br>
               📞 <a href="tel:+4901701225427">0170 1225427</a></p>
          </div>
          <div class="legal-block">
            <h3>2. Lokale Datenspeicherung</h3>
            <p>Dieses Spiel speichert Spielstände (Coins, freigeschaltete Inhalte, Einstellungen) ausschließlich im <strong>localStorage</strong> Ihres Browsers. Diese Daten verbleiben lokal auf Ihrem Gerät und werden <strong>nicht</strong> an Server übertragen.</p>
          </div>
          <div class="legal-block">
            <h3>3. Keine Tracking-Technologien</h3>
            <p>Es werden keine Cookies, Tracker, Analytics-Dienste oder externe Skripte von Drittanbietern eingesetzt.</p>
          </div>
          <div class="legal-block">
            <h3>4. Externe Ressourcen</h3>
            <p>Das Spiel lädt Google Fonts (Inter, Orbitron) von <code>fonts.googleapis.com</code>. Dabei kann Ihre IP-Adresse an Google übertragen werden. Weitere Informationen finden Sie in der <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Datenschutzerklärung von Google</a>.</p>
          </div>
          <div class="legal-block">
            <h3>5. Ihre Rechte</h3>
            <p>Sie haben das Recht auf Auskunft, Berichtigung und Löschung Ihrer Daten. Gespeicherte Spieldaten können jederzeit über <em>Einstellungen → Fortschritt zurücksetzen</em> gelöscht werden.</p>
          </div>
          <div class="legal-block">
            <h3>6. Änderungen</h3>
            <p>Diese Datenschutzerklärung kann bei Bedarf aktualisiert werden. Der aktuelle Stand ist im Spiel einsehbar.</p>
          </div>
        </div>
      </div>
    `);

    document.body.appendChild(this.hud);
    document.body.appendChild(this.menuScreen);
    document.body.appendChild(this.levelScreen);
    document.body.appendChild(this.shopScreen);
    document.body.appendChild(this.levelComplete);
    document.body.appendChild(this.gameOver);
    document.body.appendChild(this.settingsScreen);
    document.body.appendChild(this.aboutScreen);
    document.body.appendChild(this.impressumScreen);
    document.body.appendChild(this.datenschutzScreen);
  }

  _el(tag, className, html = '') {
    const el = document.createElement(tag);
    el.className = className;
    el.innerHTML = html;
    return el;
  }

  _bindUIEvents() {
    // Menu
    document.getElementById('btn-play').onclick = () => this._showLevelSelect();
    document.getElementById('btn-shop-menu').onclick = () => this._showShop();
    document.getElementById('btn-settings-menu').onclick = () => this._showSettings();

    // Footer links
    document.getElementById('btn-about').onclick = () => this._show(this.aboutScreen);
    document.getElementById('btn-impressum').onclick = () => this._show(this.impressumScreen);
    document.getElementById('btn-datenschutz').onclick = () => this._show(this.datenschutzScreen);

    // Info/Legal close buttons
    document.getElementById('btn-about-close').onclick = () => this._hide(this.aboutScreen);
    document.getElementById('btn-impressum-close').onclick = () => this._hide(this.impressumScreen);
    document.getElementById('btn-datenschutz-close').onclick = () => this._hide(this.datenschutzScreen);

    // Level select
    document.getElementById('btn-level-back').onclick = () => {
      this._show(this.menuScreen);
      this._hide(this.levelScreen);
    };

    // Shop
    document.getElementById('btn-open-shop').onclick = () => this._showShop();
    document.getElementById('btn-shop-close').onclick = () => this._hideShop();

    // Shop tabs
    this.shopScreen.querySelectorAll('.shop-tab').forEach(tab => {
      tab.onclick = () => {
        this.shopScreen.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._renderShopGrid(tab.dataset.tab);
      };
    });

    // Level complete
    document.getElementById('btn-next-level').onclick = () => {
      this._hide(this.levelComplete);
      this.game.nextLevel();
      this._showHUD();
    };
    document.getElementById('btn-lc-menu').onclick = () => {
      this._hide(this.levelComplete);
      this._showMenu();
    };

    // Game over
    document.getElementById('btn-retry').onclick = () => {
      this._hide(this.gameOver);
      this.game.retry();
      this._showHUD();
    };
    document.getElementById('btn-go-menu').onclick = () => {
      this._hide(this.gameOver);
      this._showMenu();
    };

    // HUD shop & settings
    document.getElementById('btn-open-settings').onclick = () => this._showSettings();

    // Settings
    document.getElementById('btn-settings-close').onclick = () => {
      this._hide(this.settingsScreen);
    };
    document.getElementById('toggle-sfx').onclick = (e) => {
      const btn = e.currentTarget;
      const isOn = btn.dataset.on === 'true';
      const newState = !isOn;
      btn.dataset.on = newState;
      btn.textContent = newState ? 'ON' : 'OFF';
      btn.classList.toggle('off', !newState);
      Audio.enabled = newState;
      this.storage.set('sfxEnabled', newState);
    };
    document.getElementById('btn-reset').onclick = () => {
      if (confirm('Reset all progress?')) {
        this.storage.reset();
        location.reload();
      }
    };
  }

  _listenGameEvents() {
    window.addEventListener('levelComplete', (e) => {
      const { level, score, coins } = e.detail;
      document.getElementById('lc-stats').innerHTML = `
        <div class="stat-row">Level <strong>${level}</strong> cleared!</div>
        <div class="stat-row">Score: <strong>${score} pts</strong></div>
        <div class="stat-row">Coins earned: <strong>🪙 ${coins}</strong></div>
        <div class="stat-row">Total coins: <strong>🪙 ${this.storage.get('coins')}</strong></div>
      `;
      this._hide(this.hud);
      this._show(this.levelComplete);
    });

    window.addEventListener('gameOver', (e) => {
      const { level, score, coins } = e.detail;
      const knocked = this.game.cans ? this.game.cans.filter(c => c.knockedDown).length : 0;
      const total = this.game.cans ? this.game.cans.length : 0;
      document.getElementById('go-stats').innerHTML = `
        <div class="stat-row">Level <strong>${level}</strong></div>
        <div class="stat-row">Cans knocked: <strong>${knocked}/${total}</strong></div>
        <div class="stat-row">Score: <strong>${score} pts</strong></div>
        <div class="stat-row">Coins earned: <strong>🪙 ${coins}</strong></div>
      `;
      this._hide(this.hud);
      this._show(this.gameOver);
    });
  }

  _show(el) { el.classList.remove('hidden'); }
  _hide(el) { el.classList.add('hidden'); }

  _showMenu() {
    this._show(this.menuScreen);
    this._hide(this.levelScreen);
    this._hide(this.hud);
    this._hide(this.levelComplete);
    this._hide(this.gameOver);
    document.getElementById('menu-coins-display').textContent = this.storage.get('coins');
  }

  _showHUD() {
    this._hide(this.menuScreen);
    this._hide(this.levelScreen);
    this._show(this.hud);
    this.updateHUD();
  }

  _showLevelSelect() {
    this._hide(this.menuScreen);
    this._show(this.levelScreen);
    this._buildLevelGrid();
  }

  _buildLevelGrid() {
    const grid = document.getElementById('level-grid');
    const maxLevel = Math.min((this.storage.get('highestLevel') || 1), 10);
    grid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const btn = document.createElement('button');
      btn.className = `level-btn ${i <= maxLevel ? 'unlocked' : 'locked'}`;
      const stars = i < maxLevel ? '⭐⭐⭐' : i === maxLevel ? '⭐' : '';
      btn.innerHTML = `<span class="lvl-num">${i}</span><span class="lvl-stars">${stars}</span>`;
      if (i <= maxLevel) {
        btn.onclick = () => {
          this._hide(this.levelScreen);
          this.game.startLevel(i);
          this._showHUD();
        };
      }
      grid.appendChild(btn);
    }
  }

  _showShop() {
    this._show(this.shopScreen);
    document.getElementById('shop-coins').textContent = this.storage.get('coins');
    this._renderShopGrid('cans');
  }

  _hideShop() {
    this._hide(this.shopScreen);
    document.getElementById('menu-coins-display').textContent = this.storage.get('coins');
  }

  _renderShopGrid(tab) {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';

    if (tab === 'cans') {
      const unlocked = this.storage.get('unlockedCans') || ['default'];
      const selected = this.storage.get('selectedCan') || 'default';

      Object.values(CanDefs).forEach(can => {
        const isUnlocked = unlocked.includes(can.id);
        const isSelected = can.id === selected;
        const card = document.createElement('div');
        card.className = `shop-card ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''} rarity-${can.rarity}`;

        // Mini canvas preview
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 48;
        previewCanvas.height = 72;
        previewCanvas.className = 'can-preview';
        const pCtx = previewCanvas.getContext('2d');
        // Regenerate for pixel can (random – need stable seed)
        try { can.draw(pCtx, 4, 4, 40, 64); } catch (e) {}

        card.innerHTML = `
          <div class="card-preview-wrap"></div>
          <div class="card-info">
            <div class="card-emoji">${can.emoji}</div>
            <div class="card-name">${can.name}</div>
            <div class="card-rarity">${can.rarity}</div>
            <div class="card-desc">${can.description}</div>
          </div>
        `;
        card.querySelector('.card-preview-wrap').appendChild(previewCanvas);

        if (!isUnlocked) {
          const costEl = document.createElement('div');
          costEl.className = 'card-cost';
          costEl.innerHTML = `🪙 ${can.cost}`;
          const buyBtn = document.createElement('button');
          buyBtn.className = 'btn btn-buy';
          buyBtn.textContent = 'Buy';
          buyBtn.onclick = () => this._buyCan(can.id, can.cost, card, buyBtn);
          card.appendChild(costEl);
          card.appendChild(buyBtn);
        } else if (!isSelected) {
          const selectBtn = document.createElement('button');
          selectBtn.className = 'btn btn-select';
          selectBtn.textContent = 'Equip';
          selectBtn.onclick = () => {
            this.storage.set('selectedCan', can.id);
            this.game.setCanSkin(can.id);
            this._renderShopGrid('cans');
          };
          card.appendChild(selectBtn);
        } else {
          const badge = document.createElement('div');
          badge.className = 'card-equipped';
          badge.textContent = '✓ Equipped';
          card.appendChild(badge);
        }

        grid.appendChild(card);
      });

    } else {
      // Themes tab
      const unlockedThemes = this.storage.get('unlockedThemes') || ['carnival'];
      const selectedTheme = this.storage.get('selectedTheme') || 'carnival';
      const coins = this.storage.get('coins');

      Object.values(Themes).forEach(theme => {
        const isUnlocked = unlockedThemes.includes(theme.id);
        const isSelected = theme.id === selectedTheme;
        const card = document.createElement('div');
        card.className = `shop-card theme-card ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`;

        const previewDiv = document.createElement('div');
        previewDiv.className = 'theme-preview';
        const grad = `linear-gradient(${theme.bgGradient.join(', ')})`;
        previewDiv.style.background = grad;
        previewDiv.innerHTML = `<span class="theme-emoji-preview">${theme.emoji}</span>`;

        card.innerHTML = `
          <div class="card-info">
            <div class="card-emoji">${theme.emoji}</div>
            <div class="card-name">${theme.name}</div>
            <div class="card-desc">${theme.description}</div>
          </div>
        `;
        card.prepend(previewDiv);

        if (!isUnlocked) {
          const costEl = document.createElement('div');
          costEl.className = 'card-cost';
          costEl.innerHTML = `🪙 ${theme.cost}`;
          const buyBtn = document.createElement('button');
          buyBtn.className = 'btn btn-buy';
          buyBtn.textContent = 'Unlock';
          buyBtn.onclick = () => this._buyTheme(theme.id, theme.cost, card, buyBtn);
          card.appendChild(costEl);
          card.appendChild(buyBtn);
        } else if (!isSelected) {
          const selectBtn = document.createElement('button');
          selectBtn.className = 'btn btn-select';
          selectBtn.textContent = 'Apply';
          selectBtn.onclick = () => {
            this.storage.set('selectedTheme', theme.id);
            this.game.setTheme(theme.id);
            this._renderShopGrid('themes');
          };
          card.appendChild(selectBtn);
        } else {
          const badge = document.createElement('div');
          badge.className = 'card-equipped';
          badge.textContent = '✓ Active';
          card.appendChild(badge);
        }

        grid.appendChild(card);
      });
    }
  }

  _buyCan(id, cost, card, btn) {
    const coins = this.storage.get('coins');
    if (coins < cost) {
      btn.textContent = '💸 Too pricey!';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = 'Buy'; btn.disabled = false; }, 1500);
      return;
    }
    this.storage.spendCoins(cost);
    this.storage.unlockCan(id);
    Audio.unlock();
    document.getElementById('shop-coins').textContent = this.storage.get('coins');
    this._renderShopGrid('cans');

    // Flash the card
    card.classList.add('unlock-flash');
    setTimeout(() => card.classList.remove('unlock-flash'), 600);
  }

  _buyTheme(id, cost, card, btn) {
    const coins = this.storage.get('coins');
    if (coins < cost) {
      btn.textContent = '💸 Too pricey!';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = 'Unlock'; btn.disabled = false; }, 1500);
      return;
    }
    this.storage.spendCoins(cost);
    this.storage.unlockTheme(id);
    Audio.unlock();
    document.getElementById('shop-coins').textContent = this.storage.get('coins');
    this._renderShopGrid('themes');

    card.classList.add('unlock-flash');
    setTimeout(() => card.classList.remove('unlock-flash'), 600);
  }

  _showSettings() {
    this._show(this.settingsScreen);
    const sfxBtn = document.getElementById('toggle-sfx');
    const isOn = this.storage.get('sfxEnabled') !== false;
    sfxBtn.dataset.on = isOn;
    sfxBtn.textContent = isOn ? 'ON' : 'OFF';
    sfxBtn.classList.toggle('off', !isOn);
  }

  updateHUD() {
    const coinsEl = document.getElementById('hud-coins');
    const throwsEl = document.getElementById('hud-throws');
    const levelEl = document.getElementById('hud-level');
    const scoreEl = document.getElementById('hud-score');
    if (coinsEl) coinsEl.textContent = this.storage.get('coins');
    if (throwsEl) throwsEl.textContent = this.game.getThrowsLeft();
    if (levelEl) levelEl.textContent = `LEVEL ${this.game.getLevel()}`;
    if (scoreEl) scoreEl.textContent = `${this.game.getScore()} pts`;
  }

  tick() {
    if (this.game.getState() === 'playing') {
      this.updateHUD();
    }
  }
}

export default UI;
