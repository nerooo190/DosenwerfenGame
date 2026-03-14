// storage.js – LocalStorage persistence for Dosenwerfen

const STORAGE_KEY = 'dosenwerfen_save';

const DefaultSave = {
  coins: 0,
  totalScore: 0,
  highestLevel: 1,
  unlockedCans: ['default'],
  selectedCan: 'default',
  unlockedThemes: ['carnival'],
  selectedTheme: 'carnival',
  sfxEnabled: true,
  musicEnabled: true,
  lastPlayed: null,
};

const Storage = {
  _data: null,

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this._data = raw ? { ...DefaultSave, ...JSON.parse(raw) } : { ...DefaultSave };
    } catch (e) {
      this._data = { ...DefaultSave };
    }
    return this._data;
  },

  save() {
    try {
      this._data.lastPlayed = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  },

  get(key) {
    return this._data ? this._data[key] : DefaultSave[key];
  },

  set(key, value) {
    if (!this._data) this.load();
    this._data[key] = value;
    this.save();
  },

  addCoins(amount) {
    this._data.coins = (this._data.coins || 0) + amount;
    this._data.totalScore = (this._data.totalScore || 0) + amount;
    this.save();
  },

  spendCoins(amount) {
    if (this._data.coins < amount) return false;
    this._data.coins -= amount;
    this.save();
    return true;
  },

  unlockCan(id) {
    if (!this._data.unlockedCans.includes(id)) {
      this._data.unlockedCans.push(id);
      this.save();
    }
  },

  unlockTheme(id) {
    if (!this._data.unlockedThemes.includes(id)) {
      this._data.unlockedThemes.push(id);
      this.save();
    }
  },

  reset() {
    this._data = { ...DefaultSave };
    this.save();
  },
};

export default Storage;
