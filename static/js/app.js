class QuizVerseApp {
  constructor() {
    this.currentView = 'home';
    this.categories = [];
    this.modes = [];

    this.game = {
      active: false,
      mode: 'classic',
      category: 'all',
      categoryName: 'Global Trivia',
      difficulty: 'all',
      questions: [],
      currentIndex: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      lives: 3,
      timerSeconds: 20,
      initialQuestionTime: 20,
      speedrunTotalTime: 60,
      timerInterval: null,
      questionStartTime: 0,
      isAnswered: false,
      userAnswers: [],
      lifelines: {
        '50-50': true,
        'oracle-hint': true,
        'audience-poll': true,
        'time-freeze': true
      },
      lifelinesUsedInCurrentQ: []
    };

    this.init();
  }

  async init() {
    this.applySavedTheme();
    this.updateUserUI();
    this.bindEvents();
    this.setupSpotlightEffect();
    await this.loadInitialData();
    this.renderDailyStreakWidget();
  }

  setupSpotlightEffect() {
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.glass-panel, .option-btn, .mode-card');
      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
    });
  }

  applySavedTheme() {
    const settings = window.storageManager.getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme || 'obsidian');
    const themeSelect = document.getElementById('themeSelector');
    if (themeSelect) themeSelect.value = settings.theme || 'obsidian';

    const soundToggle = document.getElementById('soundToggleBtn');
    if (soundToggle) {
      soundToggle.classList.toggle('active', settings.soundEnabled);
      soundToggle.textContent = settings.soundEnabled ? 'SFX' : 'MUTE';
    }
  }

  updateUserUI() {
    const user = window.storageManager.getUser();
    const avatarEl = document.getElementById('navUserAvatar');
    const nameEl = document.getElementById('navUserName');
    const xpEl = document.getElementById('navUserXP');

    if (avatarEl) avatarEl.textContent = user.avatar || 'U';
    if (nameEl) nameEl.textContent = user.name || 'Novice Thinker';
    if (xpEl) xpEl.textContent = `Lvl ${user.level} • ${user.xp.toLocaleString()} XP`;
  }

  async loadInitialData() {
    try {
      const data = await window.API.getCategories();
      this.categories = data.categories;
      this.modes = data.modes;
      this.renderCategories();
      this.renderModes();

      const stats = await window.API.getStats();
      this.renderStats(stats);
    } catch (e) {
      console.error('Error loading initial data:', e);
    }
  }

  renderStats(stats) {
    const qCount = document.getElementById('statTotalQuestions');
    const catCount = document.getElementById('statTotalCategories');
    const playsCount = document.getElementById('statTotalPlays');
    const topScore = document.getElementById('statTopScore');

    if (qCount) qCount.textContent = stats.total_questions || '80+';
    if (catCount) catCount.textContent = stats.total_categories || '8';
    if (playsCount) playsCount.textContent = stats.total_quizzes_played || '1,420';
    if (topScore) topScore.textContent = (stats.highest_score || 3420).toLocaleString();
  }

  renderModes() {
    const container = document.getElementById('modesContainer');
    if (!container) return;

    container.innerHTML = this.modes.map(mode => `
      <div class="glass-panel mode-card ${mode.id === this.game.mode ? 'active' : ''}" data-mode="${mode.id}">
        <div class="mode-card-top">
          <div class="mode-icon-box">${mode.icon}</div>
          <span class="mode-pill">${mode.badge}</span>
        </div>
        <h3>${mode.name}</h3>
        <p>${mode.description}</p>
        <button class="btn btn-secondary btn-sm" onclick="app.selectMode('${mode.id}')">Select Mode</button>
      </div>
    `).join('');
  }

  renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;

    const allCards = [
      {
        id: 'all',
        name: 'All Categories (Grand Mix)',
        icon: 'Q',
        color: '#6366f1',
        description: 'Random questions across all knowledge spectrums. Maximum variety and challenge!',
        question_count: this.categories.reduce((acc, c) => acc + (c.question_count || 10), 0),
        tags: ['multi-topic', 'all-stars', 'infinite']
      },
      ...this.categories
    ];

    container.innerHTML = allCards.map(cat => `
      <div class="glass-panel category-card ${cat.id === this.game.category ? 'selected' : ''}" 
           data-category="${cat.id}"
           style="--cat-color: ${cat.color};"
           onclick="app.selectCategory('${cat.id}', '${cat.name}')">
        <div class="category-card-header">
          <span class="category-icon">${cat.icon}</span>
          <span class="category-q-count">${cat.question_count || 10} Qs</span>
        </div>
        <h3>${cat.name}</h3>
        <p>${cat.description}</p>
        <div class="category-tags">
          ${(cat.tags || []).map(t => `<span class="tag-pill">#${t}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  selectMode(modeId) {
    this.game.mode = modeId;
    window.soundEngine.playClick();
    this.renderModes();

    const modeLabels = {
      classic: 'Classic Quest',
      survival: 'Survival 3 Hearts',
      speedrun: 'Time Blitz 60s',
      'ai-rival': 'AI Rival Duel'
    };
    const pill = document.getElementById('selectedModePill');
    if (pill) pill.textContent = modeLabels[modeId] || modeId;
  }

  selectCategory(catId, catName) {
    this.game.category = catId;
    this.game.categoryName = catName;
    window.soundEngine.playClick();
    this.renderCategories();

    const pill = document.getElementById('selectedCategoryPill');
    if (pill) pill.textContent = catName;
  }

  switchView(viewName) {
    window.soundEngine.playClick();
    this.currentView = viewName;

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === viewName);
    });

    document.querySelectorAll('.view-container').forEach(el => {
      el.style.display = 'none';
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.style.display = 'block';
      target.classList.add('animate-fade-in-up');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewName === 'leaderboard') this.loadLeaderboard();
    if (viewName === 'badges') this.loadBadges();
    if (viewName === 'studio') this.loadStudioCustomQuizzes();
    if (viewName === 'daily') this.loadDailyView();
    if (viewName === 'dbhub') this.loadDatabaseHub();
  }

  switchDbTab(tabName) {
    window.soundEngine.playClick();
    ['synthesizer', 'questions', 'categories', 'history'].forEach(t => {
      const el = document.getElementById(`db-tab-${t}`);
      const btn = document.getElementById(`tabBtn-${t === 'synthesizer' ? 'synth' : t}`);
      if (el) el.style.display = (t === tabName) ? 'block' : 'none';
      if (btn) btn.classList.toggle('active', t === tabName);
    });

    if (tabName === 'questions') this.loadDbQuestions();
    if (tabName === 'categories') this.loadDbCategories();
    if (tabName === 'history') this.loadDbSessions();
  }

  async loadDatabaseHub() {
    this.switchDbTab('synthesizer');
    const catSelect = document.getElementById('dbCategoryFilter');
    const modalCatSelect = document.getElementById('dbModalCategorySelect');
    if (catSelect && this.categories.length > 0) {
      catSelect.innerHTML = '<option value="all">All Categories</option>' + 
        this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    if (modalCatSelect && this.categories.length > 0) {
      modalCatSelect.innerHTML = this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  }

  async synthesizeTopicQuiz() {
    const topic = document.getElementById('synthTopicInput').value.trim();
    if (!topic) {
      alert('Please enter a subject or topic prompt.');
      return;
    }
    const difficulty = document.getElementById('synthDifficultySelect').value;
    const count = parseInt(document.getElementById('synthCountSelect').value) || 5;

    window.soundEngine.playLifeline();
    try {
      const res = await window.API.generateTopicQuiz(topic, count, difficulty);
      alert(`Generated ${res.questions_generated} dynamic questions for "${res.topic}" and inserted into SQLite!`);

      await this.loadInitialData();

      this.game.categoryName = res.topic;
      this.startQuiz({
        customQuestions: res.questions,
        category: res.topic,
        mode: 'classic'
      });
    } catch (e) {
      alert('Failed to synthesize quiz: ' + e.message);
    }
  }

  async loadDbQuestions() {
    const search = document.getElementById('dbSearchInput')?.value.trim() || '';
    const category = document.getElementById('dbCategoryFilter')?.value || 'all';

    try {
      const res = await window.API.browseQuestions({ search, category, limit: 50 });
      const tbody = document.getElementById('dbQuestionsTableBody');
      if (!tbody) return;

      if (!res.items || res.items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No questions found matching query.</td></tr>';
        return;
      }

      tbody.innerHTML = res.items.map(q => `
        <tr>
          <td><code style="font-size: 0.75rem; color: var(--accent-cyan);">${q.id}</code></td>
          <td>
            <strong>${q.question}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">Answer: ${q.options[q.answer_index] || 'N/A'}</div>
          </td>
          <td><span class="tag-pill">${q.category}</span></td>
          <td><span class="q-difficulty-badge ${q.difficulty}">${q.difficulty}</span></td>
          <td>${q.times_answered}</td>
          <td>
            <div class="action-btn-group">
              <button class="btn btn-secondary btn-sm" onclick="app.openEditQuestionModal('${q.id}')">Edit</button>
              <button class="btn btn-secondary btn-sm" style="color: #f43f5e;" onclick="app.deleteQuestionFromDb('${q.id}')">Del</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.warn('Could not load DB questions:', e);
    }
  }

  openAddQuestionModal() {
    window.soundEngine.playClick();
    document.getElementById('dbQuestionModalTitle').textContent = 'Add Question to SQLite';
    document.getElementById('dbModalQuestionId').value = '';
    document.getElementById('dbModalQuestionText').value = '';
    document.getElementById('dbModalExplanation').value = '';
    document.getElementById('dbModalCodeSnippet').value = '';
    document.getElementById('dbModalOpt0').value = '';
    document.getElementById('dbModalOpt1').value = '';
    document.getElementById('dbModalOpt2').value = '';
    document.getElementById('dbModalOpt3').value = '';

    const modalCatSelect = document.getElementById('dbModalCategorySelect');
    if (modalCatSelect) {
      modalCatSelect.innerHTML = this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    const modal = document.getElementById('dbQuestionModal');
    if (modal) modal.classList.add('open');
  }

  async openEditQuestionModal(qId) {
    try {
      const q = await window.API.request(`/api/questions?search=${qId}`);
      const item = q.items?.find(x => x.id === qId);
      if (!item) return;

      document.getElementById('dbQuestionModalTitle').textContent = 'Edit Question in SQLite';
      document.getElementById('dbModalQuestionId').value = item.id;
      document.getElementById('dbModalQuestionText').value = item.question;
      document.getElementById('dbModalExplanation').value = item.explanation;
      document.getElementById('dbModalCodeSnippet').value = item.code_snippet || '';
      document.getElementById('dbModalDifficultySelect').value = item.difficulty;

      const modalCatSelect = document.getElementById('dbModalCategorySelect');
      if (modalCatSelect) {
        modalCatSelect.innerHTML = this.categories.map(c => 
          `<option value="${c.id}" ${c.id === item.category ? 'selected' : ''}>${c.name}</option>`
        ).join('');
      }

      item.options.forEach((opt, idx) => {
        const input = document.getElementById(`dbModalOpt${idx}`);
        if (input) input.value = opt;
      });

      const radios = document.getElementsByName('dbModalCorrectRadio');
      radios.forEach(r => {
        r.checked = (parseInt(r.value) === item.answer_index);
      });

      const modal = document.getElementById('dbQuestionModal');
      if (modal) modal.classList.add('open');
    } catch (e) {
      alert('Error fetching question: ' + e.message);
    }
  }

  closeDbQuestionModal() {
    const modal = document.getElementById('dbQuestionModal');
    if (modal) modal.classList.remove('open');
  }

  async saveQuestionToDb() {
    const qId = document.getElementById('dbModalQuestionId').value;
    const question = document.getElementById('dbModalQuestionText').value.trim();
    const category = document.getElementById('dbModalCategorySelect').value;
    const difficulty = document.getElementById('dbModalDifficultySelect').value;
    const explanation = document.getElementById('dbModalExplanation').value.trim();
    const codeSnippet = document.getElementById('dbModalCodeSnippet').value.trim() || null;

    const opt0 = document.getElementById('dbModalOpt0').value.trim();
    const opt1 = document.getElementById('dbModalOpt1').value.trim();
    const opt2 = document.getElementById('dbModalOpt2').value.trim();
    const opt3 = document.getElementById('dbModalOpt3').value.trim();

    if (!question || !opt0 || !opt1 || !explanation) {
      alert('Please fill out the question, at least 2 options, and explanation.');
      return;
    }

    const options = [opt0, opt1];
    if (opt2) options.push(opt2);
    if (opt3) options.push(opt3);

    let answerIndex = 0;
    const radios = document.getElementsByName('dbModalCorrectRadio');
    radios.forEach(r => {
      if (r.checked) answerIndex = parseInt(r.value);
    });

    const payload = {
      category,
      difficulty,
      type: codeSnippet ? 'code' : 'single',
      question,
      options,
      answer_index: answerIndex,
      explanation,
      code_snippet: codeSnippet,
      tags: [category, difficulty],
      time_limit_sec: 20
    };

    try {
      if (qId) {
        await window.API.updateQuestion(qId, payload);
      } else {
        await window.API.createQuestion(payload);
      }
      this.closeDbQuestionModal();
      this.loadDbQuestions();
      window.soundEngine.playCorrect();
    } catch (e) {
      alert('Error saving question: ' + e.message);
    }
  }

  async deleteQuestionFromDb(qId) {
    if (!confirm(`Are you sure you want to delete question ${qId} from SQLite?`)) return;
    try {
      await window.API.deleteQuestion(qId);
      this.loadDbQuestions();
      window.soundEngine.playWrong();
    } catch (e) {
      alert('Could not delete question: ' + e.message);
    }
  }

  async loadDbCategories() {
    try {
      const data = await window.API.getCategories();
      const tbody = document.getElementById('dbCategoriesTableBody');
      if (!tbody) return;

      tbody.innerHTML = data.categories.map(c => `
        <tr>
          <td style="font-size: 1.5rem;">${c.icon}</td>
          <td><code style="color: var(--accent-cyan); font-size: 0.8rem;">${c.id}</code></td>
          <td><strong>${c.name}</strong></td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${c.description}</td>
          <td><span class="brand-pill">${c.question_count || 0} Qs</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" style="color: #f43f5e;" onclick="app.deleteCategoryFromDb('${c.id}')">Delete</button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.warn('Error loading categories:', e);
    }
  }

  openAddCategoryModal() {
    window.soundEngine.playClick();
    document.getElementById('dbCatModalSlug').value = '';
    document.getElementById('dbCatModalName').value = '';
    document.getElementById('dbCatModalDesc').value = '';
    const modal = document.getElementById('dbCategoryModal');
    if (modal) modal.classList.add('open');
  }

  closeDbCategoryModal() {
    const modal = document.getElementById('dbCategoryModal');
    if (modal) modal.classList.remove('open');
  }

  async saveCategoryToDb() {
    const slug = document.getElementById('dbCatModalSlug').value.trim();
    const name = document.getElementById('dbCatModalName').value.trim();
    const icon = document.getElementById('dbCatModalIcon').value.trim() || 'CAT';
    const color = document.getElementById('dbCatModalColor').value;
    const desc = document.getElementById('dbCatModalDesc').value.trim();

    if (!slug || !name) {
      alert('Please provide a Slug ID and Display Name.');
      return;
    }

    try {
      await window.API.createCategory({
        id: slug,
        name,
        icon,
        color,
        description: desc || `Questions covering ${name}.`,
        tags: [slug]
      });
      this.closeDbCategoryModal();
      this.loadDbCategories();
      await this.loadInitialData();
      window.soundEngine.playCorrect();
    } catch (e) {
      alert('Error creating category: ' + e.message);
    }
  }

  async deleteCategoryFromDb(catId) {
    if (!confirm(`Delete category "${catId}"? All questions under this category will be removed.`)) return;
    try {
      await window.API.deleteCategory(catId);
      this.loadDbCategories();
      await this.loadInitialData();
      window.soundEngine.playWrong();
    } catch (e) {
      alert('Error deleting category: ' + e.message);
    }
  }

  async loadDbSessions() {
    try {
      const sessions = await window.API.getAllSessions();
      const tbody = document.getElementById('dbSessionsTableBody');
      if (!tbody) return;

      if (sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No recorded game sessions yet in SQLite.</td></tr>';
        return;
      }

      tbody.innerHTML = sessions.map(s => `
        <tr>
          <td><code style="font-size: 0.75rem; color: var(--accent-cyan);">${s.id}</code></td>
          <td><strong>${s.username}</strong></td>
          <td><span class="tag-pill">${s.category}</span></td>
          <td>${s.mode}</td>
          <td><strong style="color: var(--accent-amber);">${s.score.toLocaleString()}</strong></td>
          <td>${s.accuracy_percentage}%</td>
          <td>+${s.xp_earned}</td>
          <td style="font-size: 0.75rem; color: var(--text-muted);">${new Date(s.created_at).toLocaleString()}</td>
        </tr>
      `).join('');
    } catch (e) {
      console.warn('Error loading sessions:', e);
    }
  }

  async startQuiz({ category = null, mode = null, limit = 10, customQuestions = null } = {}) {
    window.soundEngine.playClick();

    if (category) this.game.category = category;
    if (mode) this.game.mode = mode;

    this.game.active = true;
    this.game.currentIndex = 0;
    this.game.score = 0;
    this.game.streak = 0;
    this.game.maxStreak = 0;
    this.game.lives = 3;
    this.game.speedrunTotalTime = 60;
    this.game.userAnswers = [];
    this.game.lifelines = {
      '50-50': true,
      'oracle-hint': true,
      'audience-poll': true,
      'time-freeze': true
    };

    if (customQuestions && customQuestions.length > 0) {
      this.game.questions = customQuestions;
    } else {
      try {
        const diffSelect = document.getElementById('difficultySelector');
        const diff = diffSelect ? diffSelect.value : 'all';
        this.game.difficulty = diff;

        const countSelect = document.getElementById('countSelector');
        const count = countSelect ? parseInt(countSelect.value) : limit;

        this.game.questions = await window.API.getQuestions({
          category: this.game.category,
          difficulty: this.game.difficulty,
          mode: this.game.mode,
          limit: count
        });
      } catch (err) {
        alert('Could not load questions: ' + err.message);
        return;
      }
    }

    if (!this.game.questions || this.game.questions.length === 0) {
      alert('No questions found for this selection. Please pick another category.');
      return;
    }

    if (this.game.mode === 'ai-rival') {
      window.aiRival.reset();
      const aiBar = document.getElementById('aiRivalBar');
      if (aiBar) aiBar.style.display = 'flex';
      this.updateAIRivalUI('Preparing computational circuits...');
    } else {
      const aiBar = document.getElementById('aiRivalBar');
      if (aiBar) aiBar.style.display = 'none';
    }

    this.switchView('arena');
    this.renderCurrentQuestion();
  }

  renderCurrentQuestion() {
    if (this.game.currentIndex >= this.game.questions.length) {
      this.finishQuiz();
      return;
    }

    const q = this.game.questions[this.game.currentIndex];
    this.game.isAnswered = false;
    this.game.lifelinesUsedInCurrentQ = [];

    document.getElementById('hudCategoryName').textContent = this.game.categoryName;
    document.getElementById('hudQuestionProgress').textContent = `Q ${this.game.currentIndex + 1}/${this.game.questions.length}`;

    const progressBar = document.getElementById('arenaProgressBar');
    if (progressBar) {
      const pct = Math.round(((this.game.currentIndex + 1) / this.game.questions.length) * 100);
      progressBar.style.width = `${pct}%`;
    }

    const streakEl = document.getElementById('hudStreakCounter');
    streakEl.textContent = `${this.game.streak}x STREAK`;
    streakEl.classList.toggle('flame-active', this.game.streak >= 3);

    const heartsContainer = document.getElementById('hudHeartsContainer');
    if (this.game.mode === 'survival') {
      heartsContainer.style.display = 'flex';
      heartsContainer.innerHTML = Array(3).fill(0).map((_, i) => 
        `<span class="heart-icon ${i < this.game.lives ? '' : 'lost'}">HP</span>`
      ).join('');
    } else {
      heartsContainer.style.display = 'none';
    }

    const catTag = document.getElementById('qCategoryTag');
    if (catTag) catTag.textContent = q.category;

    const diffBadge = document.getElementById('qDifficultyBadge');
    if (diffBadge) {
      diffBadge.textContent = q.difficulty;
      diffBadge.className = `q-difficulty-badge ${q.difficulty}`;
    }

    document.getElementById('questionText').textContent = q.question;

    const codeBox = document.getElementById('codeSnippetBox');
    const codeContent = document.getElementById('codeSnippetContent');
    if (q.has_code && q.code_snippet) {
      codeBox.style.display = 'block';
      codeContent.textContent = q.code_snippet;
    } else {
      codeBox.style.display = 'none';
    }

    const optionsGrid = document.getElementById('optionsGrid');
    const letters = ['A', 'B', 'C', 'D'];
    optionsGrid.innerHTML = q.options.map((opt, idx) => `
      <button class="option-btn" data-index="${idx}" onclick="app.submitAnswer(${idx})">
        <span class="option-key">${letters[idx] || idx + 1}</span>
        <span class="option-text">${opt}</span>
      </button>
    `).join('');

    document.getElementById('feedbackDrawer').style.display = 'none';
    const pollBox = document.getElementById('audiencePollBox');
    if (pollBox) pollBox.style.display = 'none';

    this.updateLifelinesUI();

    this.startQuestionTimer(q.time_limit_sec || 20);

    if (this.game.mode === 'ai-rival') {
      window.aiRival.simulateAnswer(q, (result) => {
        this.updateAIRivalUI(result.comment, result.score);
      });
    }
  }

  startQuestionTimer(durationSeconds) {
    if (this.game.timerInterval) clearInterval(this.game.timerInterval);

    this.game.timerSeconds = durationSeconds;
    this.game.initialQuestionTime = durationSeconds;
    this.game.questionStartTime = Date.now();

    this.updateTimerDisplay();

    this.game.timerInterval = setInterval(() => {
      this.game.timerSeconds -= 1;

      if (this.game.mode === 'speedrun') {
        this.game.speedrunTotalTime -= 1;
        if (this.game.speedrunTotalTime <= 0) {
          clearInterval(this.game.timerInterval);
          this.finishQuiz();
          return;
        }
      }

      this.updateTimerDisplay();

      if (this.game.timerSeconds <= 5 && this.game.timerSeconds > 0) {
        window.soundEngine.playTick(true);
      } else if (this.game.timerSeconds > 0) {
        window.soundEngine.playTick(false);
      }

      if (this.game.timerSeconds <= 0) {
        clearInterval(this.game.timerInterval);
        this.handleTimeOut();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const timeVal = this.game.mode === 'speedrun' ? this.game.speedrunTotalTime : this.game.timerSeconds;
    const maxVal = this.game.mode === 'speedrun' ? 60 : this.game.initialQuestionTime;

    const timerText = document.getElementById('timerSecondsText');
    if (timerText) timerText.textContent = timeVal;

    const circle = document.getElementById('timerCircleProgress');
    if (circle) {
      const circumference = 157;
      const offset = circumference - ((timeVal / maxVal) * circumference);
      circle.style.strokeDashoffset = Math.max(0, offset);

      circle.classList.toggle('warning', timeVal <= 8 && timeVal > 4);
      circle.classList.toggle('danger', timeVal <= 4);
    }
  }

  freezeTimer(seconds = 10) {
    if (this.game.timerInterval) {
      clearInterval(this.game.timerInterval);
      window.soundEngine.playLifeline();

      const timerText = document.getElementById('timerSecondsText');
      if (timerText) timerText.textContent = 'PAUSED';

      setTimeout(() => {
        this.startQuestionTimer(this.game.timerSeconds);
      }, seconds * 1000);
    }
  }

  async submitAnswer(selectedIndex) {
    if (this.game.isAnswered) return;
    this.game.isAnswered = true;
    clearInterval(this.game.timerInterval);

    const q = this.game.questions[this.game.currentIndex];
    const timeSpent = Math.max(0.5, (Date.now() - this.game.questionStartTime) / 1000);

    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => btn.disabled = true);

    try {
      const evalResult = await window.API.evaluateAnswer({
        question_id: q.id,
        selected_index: selectedIndex,
        time_spent_seconds: timeSpent,
        streak: this.game.streak,
        lifelines_used: this.game.lifelinesUsedInCurrentQ
      });

      this.processEvaluationResult(evalResult, selectedIndex, q, timeSpent);
    } catch (e) {
      console.error('Answer evaluation failed:', e);
    }
  }

  handleTimeOut() {
    if (this.game.isAnswered) return;
    this.game.isAnswered = true;

    const q = this.game.questions[this.game.currentIndex];
    window.soundEngine.playWrong();

    this.submitAnswer(-1);
  }

  processEvaluationResult(result, selectedIndex, question, timeSpent) {
    const isCorrect = result.is_correct;
    const optionBtns = document.querySelectorAll('.option-btn');

    optionBtns.forEach(btn => {
      const idx = parseInt(btn.dataset.index);
      if (idx === result.correct_index) {
        btn.classList.add('correct');
      } else if (idx === selectedIndex && !isCorrect) {
        btn.classList.add('wrong');
      }
    });

    if (isCorrect) {
      window.soundEngine.playCorrect();
      this.showFloatingXP(`+${result.score_delta} pts (+${result.xp_earned} XP)`);
      this.game.streak = result.streak;
      if (this.game.streak > this.game.maxStreak) {
        this.game.maxStreak = this.game.streak;
      }
      this.game.score += result.score_delta;

      if (this.game.streak % 3 === 0) {
        window.soundEngine.playStreak();
      }

      if (this.game.mode === 'speedrun') {
        this.game.speedrunTotalTime = Math.min(90, this.game.speedrunTotalTime + 3);
      }
    } else {
      window.soundEngine.playWrong();
      this.game.streak = 0;

      if (this.game.mode === 'survival') {
        this.game.lives -= 1;
        const heartsContainer = document.getElementById('hudHeartsContainer');
        if (heartsContainer) {
          heartsContainer.innerHTML = Array(3).fill(0).map((_, i) => 
            `<span class="heart-icon ${i < this.game.lives ? '' : 'lost'}">HP</span>`
          ).join('');
        }
      }

      if (this.game.mode === 'speedrun') {
        this.game.speedrunTotalTime = Math.max(1, this.game.speedrunTotalTime - 2);
      }
    }

    this.game.userAnswers.push({
      question: question.question,
      options: question.options,
      selectedIndex,
      correctIndex: result.correct_index,
      isCorrect,
      explanation: result.explanation,
      timeSpent: Math.round(timeSpent * 10) / 10
    });

    window.storageManager.addXP(result.xp_earned);
    this.updateUserUI();

    this.showFeedbackDrawer(result);

    if (this.game.mode === 'survival' && this.game.lives <= 0) {
      setTimeout(() => {
        alert('Out of Lives! Survival run ended.');
        this.finishQuiz();
      }, 1400);
    }
  }

  showFloatingXP(text) {
    const container = document.getElementById('floatingXpContainer');
    if (!container) return;
    const pill = document.createElement('div');
    pill.className = 'floating-xp-pill animate-scale-in';
    pill.textContent = text;
    container.appendChild(pill);
    setTimeout(() => {
      if (pill.parentNode) pill.parentNode.removeChild(pill);
    }, 1200);
  }

  showFeedbackDrawer(result) {
    const drawer = document.getElementById('feedbackDrawer');
    const statusText = document.getElementById('feedbackStatusText');
    const explanationText = document.getElementById('feedbackExplanationText');
    const funFactText = document.getElementById('feedbackFunFact');
    const nextBtn = document.getElementById('feedbackNextBtn');

    drawer.style.display = 'block';
    drawer.className = `feedback-drawer ${result.is_correct ? 'correct' : 'wrong'} animate-fade-in-up`;

    statusText.className = `feedback-status ${result.is_correct ? 'correct' : 'wrong'}`;
    statusText.innerHTML = result.is_correct 
      ? `Correct! +${result.score_delta} pts (+${result.xp_earned} XP)`
      : `Incorrect • Correct Answer: ${result.correct_answer}`;

    explanationText.textContent = result.explanation;
    if (funFactText) funFactText.textContent = result.fun_fact || '';

    const isLast = (this.game.currentIndex >= this.game.questions.length - 1);
    nextBtn.textContent = isLast ? 'Finish & See Results' : 'Next Question';
  }

  nextQuestion() {
    window.soundEngine.playClick();
    this.game.currentIndex += 1;
    this.renderCurrentQuestion();
  }

  updateLifelinesUI() {
    ['50-50', 'oracle-hint', 'audience-poll', 'time-freeze'].forEach(type => {
      const btn = document.querySelector(`.lifeline-btn[data-lifeline="${type}"]`);
      if (btn) {
        btn.disabled = !this.game.lifelines[type] || this.game.isAnswered;
      }
    });
  }

  async useLifeline(type) {
    if (!this.game.lifelines[type] || this.game.isAnswered) return;

    window.soundEngine.playLifeline();
    this.game.lifelines[type] = false;
    this.game.lifelinesUsedInCurrentQ.push(type);
    this.updateLifelinesUI();

    const currentQ = this.game.questions[this.game.currentIndex];

    try {
      const response = await window.API.useLifeline(type, currentQ.id);

      if (type === '50-50' && response.eliminated_indices) {
        const optionBtns = document.querySelectorAll('.option-btn');
        response.eliminated_indices.forEach(idx => {
          if (optionBtns[idx]) {
            optionBtns[idx].classList.add('eliminated');
          }
        });
      } else if (type === 'oracle-hint' && response.oracle_hint) {
        alert(response.oracle_hint);
      } else if (type === 'audience-poll' && response.audience_votes) {
        this.renderAudiencePoll(response.audience_votes);
      } else if (type === 'time-freeze') {
        this.freezeTimer(response.freeze_seconds || 10);
      }
    } catch (e) {
      console.error('Lifeline failed:', e);
    }
  }

  renderAudiencePoll(votes) {
    const pollBox = document.getElementById('audiencePollBox');
    if (!pollBox) return;

    pollBox.style.display = 'block';
    pollBox.classList.add('animate-fade-in-up');

    const barsHtml = Object.entries(votes).map(([opt, pct]) => `
      <div class="poll-bar-item">
        <span class="poll-bar-label">${opt}</span>
        <div class="poll-bar-track">
          <div class="poll-bar-fill" style="width: ${pct}%;"></div>
        </div>
        <span class="poll-bar-pct">${pct}%</span>
      </div>
    `).join('');

    pollBox.innerHTML = `
      <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 0.5rem;">
        Live Audience Opinion Poll:
      </div>
      ${barsHtml}
    `;
  }

  updateAIRivalUI(comment = '', score = null) {
    const aiBubble = document.getElementById('aiSpeechBubble');
    const aiScoreEl = document.getElementById('aiLiveScore');

    if (aiBubble && comment) aiBubble.textContent = `"${comment}"`;
    if (aiScoreEl && score !== null) aiScoreEl.textContent = `${window.aiRival.score} pts`;
  }

  async finishQuiz() {
    clearInterval(this.game.timerInterval);
    this.game.active = false;
    window.soundEngine.playFanfare();
    window.confettiEngine.fire(150);

    const totalQuestions = this.game.userAnswers.length;
    const correctCount = this.game.userAnswers.filter(a => a.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    window.storageManager.recordGameCompletion(this.game.score, this.game.maxStreak, accuracy);

    this.checkBadgesUnlock(correctCount, totalQuestions, accuracy);

    const user = window.storageManager.getUser();
    try {
      await window.API.recordGameSession({
        username: user.name,
        category: this.game.categoryName || this.game.category,
        mode: this.game.mode,
        difficulty: this.game.difficulty || 'medium',
        score: this.game.score,
        accuracy_percentage: accuracy,
        max_streak: this.game.maxStreak,
        time_taken_seconds: 0.0,
        xp_earned: this.game.score > 0 ? Math.round(this.game.score * 0.8) : 50,
        user_answers: this.game.userAnswers
      });
    } catch (e) {
      console.warn('Could not record game session to SQLite:', e);
    }

    try {
      await window.API.submitLeaderboard({
        player_name: user.name,
        score: this.game.score,
        xp: user.xp,
        accuracy_percentage: accuracy,
        category: this.game.category,
        mode: this.game.mode,
        streak_max: this.game.maxStreak,
        avatar: user.avatar
      });
    } catch (e) {
      console.warn('Could not submit to leaderboard:', e);
    }

    this.switchView('results');
    this.renderResultsScreen(correctCount, totalQuestions, accuracy);
  }

  checkBadgesUnlock(correctCount, totalQuestions, accuracy) {
    if (totalQuestions >= 1) window.storageManager.unlockBadge('first-blood');
    if (accuracy === 100 && totalQuestions >= 5) window.storageManager.unlockBadge('perfectionist');
    if (this.game.maxStreak >= 10) window.storageManager.unlockBadge('streak-master');
    if (this.game.score >= 1500 && this.game.mode === 'speedrun') window.storageManager.unlockBadge('blitz-champion');
    if (this.game.mode === 'ai-rival' && this.game.score > window.aiRival.score) window.storageManager.unlockBadge('ai-slayer');
  }

  renderResultsScreen(correctCount, totalQuestions, accuracy) {
    document.getElementById('resultsTotalScore').textContent = this.game.score.toLocaleString();
    document.getElementById('resultsAccuracy').textContent = `${accuracy}%`;
    document.getElementById('resultsCorrectRatio').textContent = `${correctCount}/${totalQuestions}`;
    document.getElementById('resultsMaxStreak').textContent = `${this.game.maxStreak}x`;

    const user = window.storageManager.getUser();
    document.getElementById('resultsRankTitle').textContent = user.rankTitle;

    const reviewList = document.getElementById('resultsReviewList');
    if (reviewList) {
      reviewList.innerHTML = this.game.userAnswers.map((item, idx) => `
        <div class="review-item ${item.isCorrect ? 'correct' : 'wrong'}">
          <div class="review-q-header">
            <strong>Q${idx + 1}: ${item.question}</strong>
            <span>${item.isCorrect ? 'Correct (+points)' : 'Incorrect'}</span>
          </div>
          <div style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
            Your Answer: <span style="color: ${item.isCorrect ? '#10b981' : '#f43f5e'}; font-weight: 600;">
              ${item.options[item.selectedIndex] || 'Timed Out / None'}
            </span>
            ${!item.isCorrect ? ` • Correct: <span style="color: #10b981; font-weight: 600;">${item.options[item.correctIndex]}</span>` : ''}
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted);">${item.explanation}</p>
        </div>
      `).join('');
    }
  }

  retakeMissedQuestions() {
    const missed = this.game.userAnswers.filter(a => !a.isCorrect);
    if (missed.length === 0) {
      alert('Flawless! You have no missed questions to review.');
      return;
    }

    const missedQuestions = missed.map((m, idx) => ({
      id: `review-${idx}`,
      category: this.game.category,
      difficulty: 'medium',
      type: 'single',
      question: m.question,
      options: m.options,
      time_limit_sec: 25
    }));

    this.startQuiz({
      customQuestions: missedQuestions,
      category: this.game.category,
      mode: 'classic'
    });
  }

  openCertificateModal() {
    window.soundEngine.playClick();
    const modal = document.getElementById('certificateModal');
    if (!modal) return;

    modal.classList.add('open');

    const user = window.storageManager.getUser();
    const nameInput = document.getElementById('certNameInput');
    if (nameInput) nameInput.value = user.name;

    const correctCount = this.game.userAnswers.filter(a => a.isCorrect).length;
    const totalCount = this.game.userAnswers.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100;

    window.certificateGenerator.generate({
      playerName: user.name,
      categoryName: this.game.categoryName,
      score: this.game.score || 1200,
      accuracy,
      rankTitle: user.rankTitle
    });
  }

  updateCertificateName(name) {
    if (!name) return;
    window.storageManager.updateUserName(name);
    this.updateUserUI();

    const correctCount = this.game.userAnswers.filter(a => a.isCorrect).length;
    const totalCount = this.game.userAnswers.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100;
    const user = window.storageManager.getUser();

    window.certificateGenerator.generate({
      playerName: name,
      categoryName: this.game.categoryName,
      score: this.game.score || 1200,
      accuracy,
      rankTitle: user.rankTitle
    });
  }

  closeCertificateModal() {
    const modal = document.getElementById('certificateModal');
    if (modal) modal.classList.remove('open');
  }

  async loadDailyView() {
    try {
      const data = await window.API.getDailyChallenge();
      document.getElementById('dailyTitle').textContent = data.title;
      document.getElementById('dailyBonusXP').textContent = `+${data.bonus_xp} XP`;
    } catch (e) {
      console.error('Error loading daily challenge:', e);
    }
    this.renderDailyStreakWidget();
  }

  renderDailyStreakWidget() {
    const daily = window.storageManager.getDailyStreak();
    const streakDaysEl = document.getElementById('dailyStreakCount');
    if (streakDaysEl) streakDaysEl.textContent = `${daily.streakDays} Days`;

    const calendarContainer = document.getElementById('dailyCalendarWeek');
    if (calendarContainer) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      calendarContainer.innerHTML = days.map((day, idx) => {
        const isDone = idx < (daily.streakDays % 7);
        return `
          <div style="text-align: center;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: ${isDone ? 'var(--gradient-gold)' : 'var(--bg-glass)'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.3rem; font-weight: 700; color: ${isDone ? '#000' : 'var(--text-muted)'}; border: 1px solid var(--border-subtle);">
              ${isDone ? 'DONE' : day.charAt(0)}
            </div>
            <span style="font-size: 0.72rem; color: var(--text-muted);">${day}</span>
          </div>
        `;
      }).join('');
    }
  }

  async startDailyChallenge() {
    try {
      const data = await window.API.getDailyChallenge();
      this.startQuiz({
        customQuestions: data.questions,
        category: 'Daily Special',
        mode: 'classic'
      });
      window.storageManager.recordDailyCompleted(data.date);
    } catch (e) {
      alert('Could not start daily challenge: ' + e.message);
    }
  }

  loadStudioCustomQuizzes() {
    this.customQuestionsDraft = [
      {
        question: '',
        options: ['', '', '', ''],
        answerIndex: 0,
        explanation: '',
        difficulty: 'medium',
        code_snippet: ''
      }
    ];
    this.renderCustomQuestionsDraft();
    this.fetchCommunityQuizzes();
  }

  renderCustomQuestionsDraft() {
    const container = document.getElementById('customQuestionsList');
    if (!container) return;

    container.innerHTML = this.customQuestionsDraft.map((q, qIdx) => `
      <div class="glass-panel" style="padding: 1.4rem; margin-bottom: 1.2rem; border-radius: var(--radius-md);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
          <h4 style="color: var(--accent-cyan);">Question #${qIdx + 1}</h4>
          ${this.customQuestionsDraft.length > 1 ? `<button class="btn btn-secondary btn-sm" onclick="app.removeCustomQuestion(${qIdx})">Remove</button>` : ''}
        </div>
        <div class="form-group">
          <input type="text" class="form-input" placeholder="Type question statement..." 
                 value="${q.question}" oninput="app.updateDraftQ(${qIdx}, 'question', this.value)" required>
        </div>
        <div class="form-group">
          <textarea class="form-textarea" placeholder="Optional code snippet or formula..." 
                    rows="2" oninput="app.updateDraftQ(${qIdx}, 'code_snippet', this.value)">${q.code_snippet || ''}</textarea>
        </div>
        <label class="form-label">Options (Select radio for Correct Answer):</label>
        <div class="options-builder-grid">
          ${q.options.map((opt, optIdx) => `
            <div class="option-builder-row">
              <input type="radio" name="correct_${qIdx}" ${q.answerIndex === optIdx ? 'checked' : ''} 
                     onchange="app.updateDraftQ(${qIdx}, 'answerIndex', ${optIdx})">
              <input type="text" class="form-input" placeholder="Option ${optIdx + 1}" 
                     value="${opt}" oninput="app.updateDraftOpt(${qIdx}, ${optIdx}, this.value)" required>
            </div>
          `).join('')}
        </div>
        <div class="form-group" style="margin-top: 0.8rem;">
          <input type="text" class="form-input" placeholder="Educational explanation..." 
                 value="${q.explanation}" oninput="app.updateDraftQ(${qIdx}, 'explanation', this.value)" required>
        </div>
      </div>
    `).join('');
  }

  addCustomQuestionRow() {
    this.customQuestionsDraft.push({
      question: '',
      options: ['', '', '', ''],
      answerIndex: 0,
      explanation: '',
      difficulty: 'medium',
      code_snippet: ''
    });
    this.renderCustomQuestionsDraft();
  }

  removeCustomQuestion(idx) {
    if (this.customQuestionsDraft.length > 1) {
      this.customQuestionsDraft.splice(idx, 1);
      this.renderCustomQuestionsDraft();
    }
  }

  updateDraftQ(qIdx, field, val) {
    if (this.customQuestionsDraft[qIdx]) {
      this.customQuestionsDraft[qIdx][field] = val;
    }
  }

  updateDraftOpt(qIdx, optIdx, val) {
    if (this.customQuestionsDraft[qIdx]) {
      this.customQuestionsDraft[qIdx].options[optIdx] = val;
    }
  }

  async publishCustomQuiz() {
    const title = document.getElementById('studioQuizTitle').value.trim();
    const desc = document.getElementById('studioQuizDesc').value.trim();
    const category = document.getElementById('studioQuizCategory').value;
    const timeLimit = parseInt(document.getElementById('studioQuizTime').value) || 25;
    const user = window.storageManager.getUser();

    if (!title) {
      alert('Please enter a Quiz Title.');
      return;
    }

    for (let i = 0; i < this.customQuestionsDraft.length; i++) {
      const q = this.customQuestionsDraft[i];
      if (!q.question.trim()) {
        alert(`Question #${i + 1} statement is empty.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          alert(`Option #${j + 1} of Question #${i + 1} is empty.`);
          return;
        }
      }
    }

    const payload = {
      title,
      description: desc || 'Custom Quiz created on QuizVerse',
      category,
      creator_name: user.name,
      time_per_question: timeLimit,
      questions: this.customQuestionsDraft.map(q => ({
        question: q.question.trim(),
        options: q.options.map(o => o.trim()),
        answer_index: q.answerIndex,
        explanation: q.explanation.trim() || 'No explanation provided.',
        difficulty: q.difficulty || 'medium',
        code_snippet: q.code_snippet ? q.code_snippet.trim() : null
      }))
    };

    try {
      const res = await window.API.createCustomQuiz(payload);
      window.storageManager.unlockBadge('architect');
      alert(`${res.message}\nYou can now share this code with anyone!`);
      this.fetchCommunityQuizzes();
    } catch (e) {
      alert('Error publishing quiz: ' + e.message);
    }
  }

  exportCustomQuizJSON() {
    const title = document.getElementById('studioQuizTitle').value.trim() || 'Custom_Quiz';
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.customQuestionsDraft, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${title.replace(/\s+/g, '_')}.json`);
    dlAnchor.click();
  }

  importCustomQuizJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.customQuestionsDraft = parsed.map(item => ({
            question: item.question || '',
            options: item.options || ['', '', '', ''],
            answerIndex: item.answer_index || item.answerIndex || 0,
            explanation: item.explanation || '',
            difficulty: item.difficulty || 'medium',
            code_snippet: item.code_snippet || ''
          }));
          this.renderCustomQuestionsDraft();
          alert(`Successfully imported ${parsed.length} questions!`);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  }

  async playCustomQuizByCode() {
    const code = document.getElementById('joinCustomQuizCode').value.trim();
    if (!code) {
      alert('Please enter a share code (e.g. QZ-A1B2C3).');
      return;
    }

    try {
      const quizData = await window.API.getCustomQuiz(code);
      this.game.categoryName = quizData.title;
      this.startQuiz({
        customQuestions: quizData.questions,
        category: quizData.title,
        mode: 'classic'
      });
    } catch (e) {
      alert('Could not find quiz: ' + e.message);
    }
  }

  async fetchCommunityQuizzes() {
    try {
      const quizzes = await window.API.listCustomQuizzes();
      const container = document.getElementById('communityQuizzesList');
      if (!container) return;

      if (quizzes.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">No custom community quizzes yet. Be the first to build one!</p>';
        return;
      }

      container.innerHTML = quizzes.map(q => `
        <div class="glass-panel" style="padding: 1.2rem; margin-bottom: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="margin-bottom: 0.2rem;">${q.title}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              Code: <strong style="color: var(--accent-cyan);">${q.id}</strong> • By ${q.creator_name} • ${q.question_count} Qs
            </span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="app.playDirectCustomQuiz('${q.id}')">Play Quiz</button>
        </div>
      `).join('');
    } catch (e) {
      console.warn('Could not fetch community quizzes:', e);
    }
  }

  async playDirectCustomQuiz(quizId) {
    try {
      const quizData = await window.API.getCustomQuiz(quizId);
      this.game.categoryName = quizData.title;
      this.startQuiz({
        customQuestions: quizData.questions,
        category: quizData.title,
        mode: 'classic'
      });
    } catch (e) {
      alert('Error loading quiz: ' + e.message);
    }
  }

  async loadLeaderboard() {
    const catSelect = document.getElementById('lbCategoryFilter');
    const modeSelect = document.getElementById('lbModeFilter');
    const category = catSelect ? catSelect.value : 'all';
    const mode = modeSelect ? modeSelect.value : 'all';

    try {
      const entries = await window.API.getLeaderboard({ category, mode, limit: 25 });
      this.renderLeaderboard(entries);
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    }
  }

  renderLeaderboard(entries) {
    const podium = document.getElementById('leaderboardPodium');
    const tableBody = document.getElementById('leaderboardTableBody');

    if (entries.length === 0) {
      if (podium) podium.style.display = 'none';
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No records found.</td></tr>';
      return;
    }

    if (podium && entries.length >= 3) {
      podium.style.display = 'grid';
      const [first, second, third] = entries;

      podium.innerHTML = `
        <div class="glass-panel podium-card second">
          <div class="podium-medal">2nd</div>
          <h4>${second.player_name}</h4>
          <p style="color: var(--accent-cyan); font-weight: 700;">${second.score.toLocaleString()} pts</p>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${second.accuracy_percentage}% acc</span>
        </div>
        <div class="glass-panel podium-card first">
          <div class="podium-medal">1st</div>
          <h4>${first.player_name}</h4>
          <p style="color: var(--accent-amber); font-size: 1.25rem; font-weight: 800;">${first.score.toLocaleString()} pts</p>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">${first.rank_title}</span>
        </div>
        <div class="glass-panel podium-card third">
          <div class="podium-medal">3rd</div>
          <h4>${third.player_name}</h4>
          <p style="color: #d97706; font-weight: 700;">${third.score.toLocaleString()} pts</p>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${third.accuracy_percentage}% acc</span>
        </div>
      `;
    }

    if (tableBody) {
      tableBody.innerHTML = entries.map((e, idx) => `
        <tr>
          <td><span style="font-weight: 700; color: ${idx < 3 ? 'var(--accent-amber)' : 'inherit'};">#${idx + 1}</span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <span>${e.avatar || 'U'}</span>
              <strong>${e.player_name}</strong>
            </div>
          </td>
          <td><span style="font-family: var(--font-display); font-weight: 700; color: var(--accent-primary);">${e.score.toLocaleString()}</span></td>
          <td>${e.accuracy_percentage}%</td>
          <td>${e.streak_max}x</td>
          <td><span style="font-size: 0.8rem; color: var(--text-muted);">${e.rank_title}</span></td>
        </tr>
      `).join('');
    }
  }

  async loadBadges() {
    try {
      const badges = await window.API.getBadges();
      const container = document.getElementById('badgesGridContainer');
      if (!container) return;

      container.innerHTML = badges.map(b => {
        const isUnlocked = window.storageManager.hasBadge(b.id);
        return `
          <div class="glass-panel badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="badge-icon-box">${b.icon}</div>
            <h4>${b.name}</h4>
            <p style="font-size: 0.85rem; margin-top: 0.4rem;">${b.description}</p>
            <span style="display: inline-block; margin-top: 0.8rem; font-size: 0.75rem; font-weight: 700; color: ${isUnlocked ? '#10b981' : 'var(--text-muted)'};">
              ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}
            </span>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.error('Error fetching badges:', e);
    }
  }

  openProfileModal() {
    window.soundEngine.playClick();
    const modal = document.getElementById('profileModal');
    if (!modal) return;

    modal.classList.add('open');
    const user = window.storageManager.getUser();

    document.getElementById('profileNameInput').value = user.name;
    document.getElementById('profileAvatarSelect').value = user.avatar;
    document.getElementById('profileLifetimeXP').textContent = `${user.xp.toLocaleString()} XP`;
    document.getElementById('profileLevelVal').textContent = `Level ${user.level} (${user.rankTitle})`;
    document.getElementById('profileQuizzesPlayed').textContent = user.quizzesPlayed;
    document.getElementById('profileBestScore').textContent = user.bestScore.toLocaleString();
  }

  saveProfile() {
    const name = document.getElementById('profileNameInput').value.trim();
    const avatar = document.getElementById('profileAvatarSelect').value;

    window.storageManager.updateUserName(name, avatar);
    this.updateUserUI();
    this.closeProfileModal();
  }

  closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.remove('open');
  }

  bindEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        if (view) this.switchView(view);
      });
    });

    const themeSelect = document.getElementById('themeSelector');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        document.documentElement.setAttribute('data-theme', val);
        window.storageManager.setTheme(val);
        window.soundEngine.playClick();
      });
    }

    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isEnabled = window.soundEngine.toggleSound(!window.soundEngine.enabled);
        window.storageManager.setSoundEnabled(isEnabled);
        soundBtn.classList.toggle('active', isEnabled);
        soundBtn.textContent = isEnabled ? 'SFX' : 'MUTE';
      });
    }

    const ambientBtn = document.getElementById('ambientToggleBtn');
    if (ambientBtn) {
      ambientBtn.addEventListener('click', () => {
        const playing = window.soundEngine.toggleAmbient();
        ambientBtn.classList.toggle('active', playing);
        ambientBtn.title = playing ? 'Ambient Zen Music: ON' : 'Ambient Zen Music: OFF';
      });
    }

    window.addEventListener('keydown', (e) => {
      if (this.currentView !== 'arena' || !this.game.active) return;

      const key = e.key;
      if (['1', '2', '3', '4'].includes(key) && !this.game.isAnswered) {
        const idx = parseInt(key) - 1;
        this.submitAnswer(idx);
      } else if (['a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].includes(key) && !this.game.isAnswered) {
        const map = { a: 0, b: 1, c: 2, d: 3, A: 0, B: 1, C: 2, D: 3 };
        this.submitAnswer(map[key]);
      } else if (e.code === 'Space' || e.key === 'Enter') {
        if (this.game.isAnswered) {
          e.preventDefault();
          this.nextQuestion();
        }
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new QuizVerseApp();
});
