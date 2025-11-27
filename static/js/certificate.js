class CertificateGenerator {
  constructor(canvasId = 'certificateCanvas') {
    this.canvasId = canvasId;
  }

  generate({
    playerName = 'Novice Voyager',
    categoryName = 'Global Knowledge',
    score = 1200,
    accuracy = 95.0,
    rankTitle = 'Trivia Specialist',
    date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }) {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 1200;
    const height = 850;
    canvas.width = width;
    canvas.height = height;

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#090b14');
    bgGradient.addColorStop(0.5, '#12172b');
    bgGradient.addColorStop(1, '#070911');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 500);
    glow.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 14;
    const goldGrad = ctx.createLinearGradient(0, 0, width, height);
    goldGrad.addColorStop(0, '#f59e0b');
    goldGrad.addColorStop(0.3, '#fbbf24');
    goldGrad.addColorStop(0.7, '#d97706');
    goldGrad.addColorStop(1, '#f59e0b');
    ctx.strokeStyle = goldGrad;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.strokeRect(48, 48, width - 96, height - 96);

    const drawCorner = (x, y, dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(x, y + (dy * 30));
      ctx.lineTo(x, y);
      ctx.lineTo(x + (dx * 30), y);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();
    };
    drawCorner(55, 55, 1, 1);
    drawCorner(width - 55, 55, -1, 1);
    drawCorner(55, height - 55, 1, -1);
    drawCorner(width - 55, height - 55, -1, -1);

    ctx.font = '50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MERIT', width / 2, 130);

    ctx.font = '800 38px "Outfit", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.letterSpacing = '3px';
    ctx.fillText('CERTIFICATE OF COGNITIVE MASTERY', width / 2, 190);

    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.letterSpacing = '1px';
    ctx.fillText('THIS PRESTIGIOUS ACCREDITATION IS PROUDLY CONFERRED UPON', width / 2, 240);

    ctx.font = '800 52px "Outfit", sans-serif';
    const nameGrad = ctx.createLinearGradient(width / 2 - 200, 300, width / 2 + 200, 340);
    nameGrad.addColorStop(0, '#fbbf24');
    nameGrad.addColorStop(0.5, '#f59e0b');
    nameGrad.addColorStop(1, '#fbbf24');
    ctx.fillStyle = nameGrad;
    ctx.fillText(playerName.toUpperCase(), width / 2, 325);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 250, 345);
    ctx.lineTo(width / 2 + 250, 345);
    ctx.stroke();

    ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`For demonstrating exemplary intellect in the discipline of`, width / 2, 400);

    ctx.font = '700 24px "Outfit", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(categoryName, width / 2, 435);

    const statY = 510;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(200, statY - 40, width - 400, 80);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(200, statY - 40, width - 400, 80);

    ctx.font = '800 28px "Outfit", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${score.toLocaleString()}`, width / 2 - 220, statY + 2);
    ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('TOTAL SCORE', width / 2 - 220, statY + 24);

    ctx.font = '800 28px "Outfit", sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText(`${accuracy}%`, width / 2, statY + 2);
    ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ACCURACY', width / 2, statY + 24);

    ctx.font = '800 22px "Outfit", sans-serif';
    ctx.fillStyle = '#a855f7';
    ctx.fillText(rankTitle, width / 2 + 220, statY + 2);
    ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('RANK TIER', width / 2 + 220, statY + 24);

    const sealX = width / 2;
    const sealY = 670;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 46, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();

    ctx.font = '30px sans-serif';
    ctx.fillText('SEAL', sealX, sealY + 10);

    ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Conferred on ${date}`, width / 2, 750);

    const verificationHash = 'VERIFIED-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(99, 102, 241, 0.8)';
    ctx.fillText(`Certificate ID: ${verificationHash} • QuizVerse Academic Registry`, width / 2, 775);
  }

  download() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `QuizVerse_Certificate_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

window.certificateGenerator = new CertificateGenerator();
