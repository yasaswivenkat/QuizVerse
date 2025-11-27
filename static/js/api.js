const API = {
  baseUrl: window.location.origin,

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
      });

      if (!response.ok) {
        let errorMsg = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) errorMsg = errorData.detail;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error(`Request to ${endpoint} failed:`, err);
      throw err;
    }
  },

  getCategories() {
    return this.request('/api/categories');
  },

  createCategory(data) {
    return this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteCategory(catId) {
    return this.request(`/api/categories/${catId}`, {
      method: 'DELETE'
    });
  },

  getQuestions({ category = 'all', difficulty = 'all', mode = 'classic', limit = 10 } = {}) {
    const params = new URLSearchParams({ category, difficulty, mode, limit });
    return this.request(`/api/quiz/questions?${params.toString()}`);
  },

  browseQuestions({ search = '', category = 'all', difficulty = 'all', limit = 50, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (difficulty) params.append('difficulty', difficulty);
    params.append('limit', limit);
    params.append('offset', offset);
    return this.request(`/api/questions?${params.toString()}`);
  },

  createQuestion(questionData) {
    return this.request('/api/questions', {
      method: 'POST',
      body: JSON.stringify(questionData)
    });
  },

  updateQuestion(questionId, questionData) {
    return this.request(`/api/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(questionData)
    });
  },

  deleteQuestion(questionId) {
    return this.request(`/api/questions/${questionId}`, {
      method: 'DELETE'
    });
  },

  generateTopicQuiz(topic, count = 5, difficulty = 'medium') {
    return this.request('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ topic, count, difficulty })
    });
  },

  syncUserProfile(username, avatar = 'User') {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify({ username, avatar })
    });
  },

  recordGameSession(sessionData) {
    return this.request('/api/users/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  },

  getUserHistory(username) {
    return this.request(`/api/users/${username}/history`);
  },

  getAllSessions() {
    return this.request('/api/users/sessions/all');
  },

  evaluateAnswer({ question_id, selected_index, time_spent_seconds, streak = 0, lifelines_used = [] }) {
    return this.request('/api/quiz/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        question_id,
        selected_index,
        time_spent_seconds,
        streak,
        lifelines_used
      })
    });
  },

  useLifeline(type, question_id) {
    return this.request('/api/lifelines/use', {
      method: 'POST',
      body: JSON.stringify({ type, question_id })
    });
  },

  getDailyChallenge() {
    return this.request('/api/daily');
  },

  submitDailyChallenge({ player_name, score, accuracy_percentage, streak_days }) {
    return this.request('/api/daily/submit', {
      method: 'POST',
      body: JSON.stringify({
        player_name,
        score,
        accuracy_percentage,
        streak_days
      })
    });
  },

  getLeaderboard({ category = 'all', mode = 'all', limit = 20 } = {}) {
    const params = new URLSearchParams({ category, mode, limit });
    return this.request(`/api/leaderboard?${params.toString()}`);
  },

  submitLeaderboard(entry) {
    return this.request('/api/leaderboard', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  },

  createCustomQuiz(payload) {
    return this.request('/api/custom-quiz', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getCustomQuiz(quizId) {
    return this.request(`/api/custom-quiz/${quizId}`);
  },

  listCustomQuizzes() {
    return this.request('/api/custom-quiz');
  },

  getStats() {
    return this.request('/api/stats/overview');
  },

  getBadges() {
    return this.request('/api/stats/badges');
  }
};

window.API = API;
