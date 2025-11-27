class AIRival {
  constructor() {
    this.name = 'CyberSage-9000';
    this.avatar = 'AI';
    this.score = 0;
    this.streak = 0;
    this.accuracyRate = 0.78;
    this.state = 'idle';
    this.currentTimer = null;

    this.banterQuotes = {
      start: [
        "Synthesizing knowledge matrices... Prepare yourself, human!",
        "May the best intelligence—biological or artificial—prevail!",
        "My database is loaded. Let's see what your wetware can do."
      ],
      userStreak: [
        "Warning: User cognitive velocity exceeding normal parameters!",
        "A 4x streak? My neural prediction was off by 12.4%!",
        "Impressive processing speed. Let me overclock my cores."
      ],
      aiAhead: [
        "Efficiency is optimal. 01000111 01000111!",
        "Calculated that answer in 380 milliseconds.",
        "Don't worry, human. Even carbon-based lifeforms have good days!"
      ],
      userAhead: [
        "A glitch in my quantum cache! Recalibrating...",
        "You're actually keeping up?! Respect, challenger.",
        "I need to query my deep reinforcement layers."
      ],
      aiMissed: [
        "NaN encountered! That question had deceptive syntax.",
        "Error 404: Answer confidence insufficient. Well played.",
        "Hmph. A rare parity error on my end."
      ],
      victory: [
        "Calculations conclude: Silicon reigns supreme this round! Rematch?",
        "A valiant effort, human. You pushed my cores to 94% utilization."
      ],
      defeat: [
        "Impossible! Human intuition outperformed my LLM parameters! GG!",
        "You have bested CyberSage-9000. I bow to your biological intellect."
      ]
    };
  }

  reset() {
    this.score = 0;
    this.streak = 0;
    this.state = 'idle';
    if (this.currentTimer) clearTimeout(this.currentTimer);
  }

  getRandomQuote(category) {
    const list = this.banterQuotes[category] || this.banterQuotes.start;
    return list[Math.floor(Math.random() * list.length)];
  }

  simulateAnswer(question, onAnswered) {
    if (this.currentTimer) clearTimeout(this.currentTimer);

    const diffMultiplier = { easy: 2.2, medium: 3.5, hard: 4.8 }[question.difficulty] || 3.0;
    const thinkingTime = (diffMultiplier + (Math.random() * 2.0)) * 1000;

    this.state = 'thinking';

    this.currentTimer = setTimeout(() => {
      const isCorrect = Math.random() < this.accuracyRate;

      if (isCorrect) {
        this.streak += 1;
        const pts = 100 + (this.streak * 15);
        this.score += pts;
      } else {
        this.streak = 0;
      }

      this.state = 'answered';
      if (typeof onAnswered === 'function') {
        onAnswered({
          name: this.name,
          isCorrect,
          score: this.score,
          streak: this.streak,
          comment: isCorrect
            ? (this.score > 500 ? this.getRandomQuote('aiAhead') : "Calculated with high certainty!")
            : this.getRandomQuote('aiMissed')
        });
      }
    }, thinkingTime);
  }
}

window.aiRival = new AIRival();
