class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'quizverse_state_v2';
    this.state = this.loadState();
  }

  getDefaultState() {
    return {
      user: {
        name: 'Novice Voyager',
        avatar: 'U',
        xp: 0,
        level: 1,
        rankTitle: 'Novice Thinker',
        quizzesPlayed: 0,
        bestScore: 0,
        bestStreak: 0,
        unlockedBadges: ['first-blood']
      },
      settings: {
        soundEnabled: true,
        ambientEnabled: false,
        theme: 'obsidian'
      },
      daily: {
        lastCompletedDate: null,
        streakDays: 0
      },
      customQuizzes: []
    };
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...this.getDefaultState(), ...parsed };
      }
    } catch (e) {
      console.warn('Could not parse localStorage state:', e);
    }
    return this.getDefaultState();
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save state to localStorage:', e);
    }
  }

  getUser() {
    return this.state.user;
  }

  updateUserName(name, avatar) {
    if (name) this.state.user.name = name.trim();
    if (avatar) this.state.user.avatar = avatar;
    this.save();
    return this.state.user;
  }

  addXP(amount) {
    this.state.user.xp += Math.max(0, amount);
    this.updateLevel();
    this.save();
    return { xp: this.state.user.xp, level: this.state.user.level, rank: this.state.user.rankTitle };
  }

  updateLevel() {
    const thresholds = [
      { level: 1, title: 'Novice Thinker', xp: 0 },
      { level: 2, title: 'Curious Explorer', xp: 400 },
      { level: 3, title: 'Trivia Specialist', xp: 1000 },
      { level: 4, title: 'Knowledge Seeker', xp: 2000 },
      { level: 5, title: 'Elite Tactician', xp: 3500 },
      { level: 6, title: 'Mind Master', xp: 5500 },
      { level: 7, title: 'Cognitive Legend', xp: 8000 },
      { level: 8, title: 'Grandmaster of Quiz', xp: 12000 }
    ];

    let currentLvl = 1;
    let currentTitle = 'Novice Thinker';
    for (const t of thresholds) {
      if (this.state.user.xp >= t.xp) {
        currentLvl = t.level;
        currentTitle = t.title;
      }
    }
    const leveledUp = currentLvl > this.state.user.level;
    this.state.user.level = currentLvl;
    this.state.user.rankTitle = currentTitle;
    return { leveledUp, currentLvl, currentTitle };
  }

  recordGameCompletion(score, streak, accuracy) {
    this.state.user.quizzesPlayed += 1;
    if (score > this.state.user.bestScore) {
      this.state.user.bestScore = score;
    }
    if (streak > this.state.user.bestStreak) {
      this.state.user.bestStreak = streak;
    }
    this.save();
  }

  unlockBadge(badgeId) {
    if (!this.state.user.unlockedBadges.includes(badgeId)) {
      this.state.user.unlockedBadges.push(badgeId);
      this.save();
      return true;
    }
    return false;
  }

  hasBadge(badgeId) {
    return this.state.user.unlockedBadges.includes(badgeId);
  }

  getSettings() {
    return this.state.settings;
  }

  setTheme(themeName) {
    this.state.settings.theme = themeName;
    this.save();
  }

  setSoundEnabled(enabled) {
    this.state.settings.soundEnabled = enabled;
    this.save();
  }

  getDailyStreak() {
    return this.state.daily;
  }

  recordDailyCompleted(dateStr) {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const lastDate = this.state.daily.lastCompletedDate;

    if (lastDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        this.state.daily.streakDays += 1;
      } else if (lastDate !== today) {
        this.state.daily.streakDays = 1;
      }
    } else {
      this.state.daily.streakDays = 1;
    }

    this.state.daily.lastCompletedDate = today;
    this.save();
    return this.state.daily.streakDays;
  }
}

window.storageManager = new StorageManager();
